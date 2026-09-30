import { GoogleGenAI, LiveServerMessage, Modality, Type } from "@google/genai";
import { AppConfig, AppState } from "../types";

// High performance Uint8Array to base64 converter avoiding heavy GC allocation
function uint8ToBase64(bytes: Uint8Array): string {
  let binary = "";
  const len = bytes.byteLength;
  const chunkSize = 2048;
  for (let i = 0; i < len; i += chunkSize) {
    const chunk = bytes.subarray(i, Math.min(i + chunkSize, len));
    binary += String.fromCharCode.apply(null, chunk as any);
  }
  return btoa(binary);
}

// Universal audio downsampler to convert any native mic sample rate to pristine 16000Hz PCM
function downsampleTo16k(inputData: Float32Array, inputSampleRate: number): Int16Array {
  if (inputSampleRate === 16000) {
    const pcm16 = new Int16Array(inputData.length);
    for (let i = 0; i < inputData.length; i++) {
      const s = Math.max(-1, Math.min(1, inputData[i]));
      pcm16[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
    }
    return pcm16;
  }

  const ratio = inputSampleRate / 16000;
  const newLength = Math.round(inputData.length / ratio);
  const result = new Int16Array(newLength);
  let offsetResult = 0;
  let offsetInput = 0;

  while (offsetResult < result.length) {
    const nextOffsetInput = Math.round((offsetResult + 1) * ratio);
    let accum = 0;
    let count = 0;
    for (let i = offsetInput; i < nextOffsetInput && i < inputData.length; i++) {
      accum += inputData[i];
      count++;
    }
    const sample = count > 0 ? accum / count : 0;
    const clamped = Math.max(-1, Math.min(1, sample));
    result[offsetResult] = clamped < 0 ? clamped * 0x8000 : clamped * 0x7FFF;
    offsetResult++;
    offsetInput = nextOffsetInput;
  }
  return result;
}

export class LiveSessionManager {
  private ai: GoogleGenAI;
  private activeSession: any = null;
  private isConnecting: boolean = false;
  private isExplicitlyStopped: boolean = false;
  private reconnectTimer: any = null;
  private reconnectAttempts: number = 0;
  private readonly maxReconnectAttempts: number = 3;
  private playbackTimeout: any = null;
  private speakingHangoverTimer: any = null;
  private lastAudioChunkReceivedTime: number = 0;

  // Audio capture
  private audioContext: AudioContext | null = null;
  private mediaStream: MediaStream | null = null;
  private processor: ScriptProcessorNode | null = null;
  private source: MediaStreamAudioSourceNode | null = null;

  // Audio playback state (Single reusable context to prevent DOMException context limit)
  private playbackContext: AudioContext | null = null;
  private playbackGain: GainNode | null = null;
  private activeSources: Set<AudioBufferSourceNode> = new Set();
  private nextPlayTime: number = 0;
  private isPlaying: boolean = false;

  // Wake lock for mobile devices to keep audio & connection running smoothly
  private wakeLock: any = null;

  public isMuted: boolean = false;
  public volume: number = 1.0;

  public onStateChange: (state: AppState) => void = () => {};
  public onMessage: (sender: "user" | "zoya" | "zara", text: string) => void = () => {};
  public onCommand: (url: string) => void = () => {};
  public onAudioLevel: (level: number) => void = () => {};

  private boundVisibilityHandler: () => void;

  constructor(private config: AppConfig) {
    this.ai = new GoogleGenAI({ apiKey: config.apiKey });
    this.boundVisibilityHandler = this.handleVisibilityChange.bind(this);
    if (typeof document !== "undefined") {
      document.addEventListener("visibilitychange", this.boundVisibilityHandler);
    }
  }

  private handleVisibilityChange() {
    if (typeof document !== "undefined" && document.visibilityState === "visible") {
      // Auto-resume suspended audio contexts on tab / phone focus
      if (this.audioContext?.state === "suspended") {
        this.audioContext.resume().catch(() => {});
      }
      if (this.playbackContext?.state === "suspended") {
        this.playbackContext.resume().catch(() => {});
      }
    }
  }

  private async requestWakeLock() {
    if (typeof navigator !== "undefined" && "wakeLock" in navigator) {
      try {
        this.wakeLock = await (navigator as any).wakeLock.request("screen");
      } catch {
        // Wake lock can be denied or unsupported on some devices, safely ignore
      }
    }
  }

  private releaseWakeLock() {
    if (this.wakeLock) {
      try {
        this.wakeLock.release().catch(() => {});
      } catch {}
      this.wakeLock = null;
    }
  }

  async start() {
    this.isExplicitlyStopped = false;
    this.onStateChange("processing");

    try {
      // 1. Initialize Audio Contexts safely
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      
      if (!this.audioContext) {
        try {
          this.audioContext = new AudioContextClass({ sampleRate: 16000 });
        } catch {
          this.audioContext = new AudioContextClass();
        }
      }
      if (this.audioContext.state === "suspended") {
        await this.audioContext.resume().catch(() => {});
      }

      if (!this.playbackContext) {
        try {
          this.playbackContext = new AudioContextClass({ sampleRate: 24000 });
        } catch {
          this.playbackContext = new AudioContextClass();
        }
      }
      if (this.playbackContext.state === "suspended") {
        await this.playbackContext.resume().catch(() => {});
      }

      this.playbackGain = this.playbackContext.createGain();
      this.playbackGain.gain.value = this.isMuted ? 0 : this.volume;
      this.playbackGain.connect(this.playbackContext.destination);
      this.nextPlayTime = this.playbackContext.currentTime;

      // 2. Acquire Microphone with aggressive echo cancellation and noise suppression
      if (!this.mediaStream) {
        if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
          throw new Error("আপনার ব্রাউজারে মাইক্রোফোন সাপোর্ট নেই বা এটি ব্লক রয়েছে।");
        }

        try {
          this.mediaStream = await navigator.mediaDevices.getUserMedia({
            audio: {
              channelCount: 1,
              echoCancellation: true,
              noiseSuppression: true,
              autoGainControl: true,
            },
          });
        } catch (strictErr: any) {
          const isPermDenied = 
            strictErr?.name === "NotAllowedError" || 
            strictErr?.name === "PermissionDeniedError" ||
            String(strictErr?.message || strictErr).toLowerCase().includes("permission denied");

          if (!isPermDenied) {
            // Try with bare minimum audio constraints if device doesn't support complex filters
            try {
              this.mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
            } catch (fallbackErr) {
              throw fallbackErr;
            }
          } else {
            throw strictErr;
          }
        }
      }

      if (!this.source && this.mediaStream && this.audioContext) {
        this.source = this.audioContext.createMediaStreamSource(this.mediaStream);
        this.processor = this.audioContext.createScriptProcessor(4096, 1, 1);

        this.processor.onaudioprocess = (e) => {
          if (!this.activeSession || this.isConnecting) return;

          const inputData = e.inputBuffer.getChannelData(0);
          
          // Calculate volume energy (RMS) for UI feedback
          let sumSquares = 0;
          for (let i = 0; i < inputData.length; i++) {
            sumSquares += inputData[i] * inputData[i];
          }
          const rms = Math.sqrt(sumSquares / inputData.length);
          this.onAudioLevel(rms);

          // If companion is speaking through speakers, suppress mic streaming
          // to prevent speaker audio from looping back and interrupting her.
          if (this.isPlaying) {
            return;
          }

          // Downsample to clean 16000Hz PCM16
          const pcm16 = downsampleTo16k(inputData, this.audioContext?.sampleRate || 16000);

          // Fast Base64 encoding
          const uint8 = new Uint8Array(pcm16.buffer, pcm16.byteOffset, pcm16.byteLength);
          const base64Data = uint8ToBase64(uint8);

          try {
            this.activeSession.sendRealtimeInput({
              audio: { data: base64Data, mimeType: "audio/pcm;rate=16000" },
            });
          } catch (err) {
            console.warn("Audio stream send warning:", err);
          }
        };

        this.source.connect(this.processor);
        // Connect to a mute gain node so the user's mic doesn't play back through their own speakers
        const muteGain = this.audioContext.createGain();
        muteGain.gain.value = 0;
        this.processor.connect(muteGain);
        muteGain.connect(this.audioContext.destination);
      }

      // 3. Request WakeLock
      await this.requestWakeLock();

      // 4. Connect to Gemini Live
      await this.connectLiveSession();
    } catch (error: any) {
      const isPermDenied = 
        error?.name === "NotAllowedError" || 
        error?.name === "PermissionDeniedError" ||
        String(error?.message || error).toLowerCase().includes("permission denied");

      if (isPermDenied) {
        console.warn("Live Session microphone permission was denied by user or environment:", error?.message || error);
      } else {
        console.warn("Failed to start Live Session:", error?.message || error);
      }
      this.stop();
      throw error;
    }
  }

  private async connectLiveSession() {
    if (this.isConnecting || this.isExplicitlyStopped) return;
    this.isConnecting = true;

    const baseInstruction = this.config.systemPrompt
      .replace(/{userName}/g, this.config.userName)
      .replace(/{assistantName}/g, this.config.assistantName);

    const strictContext = `

[SYSTEM NOTE: The human you are currently talking to is named "${this.config.userName || "ওয়াহেদ"}". You must remember this. Your name is "${this.config.assistantName || "Zara"}". You are his loving, sweet, caring real-life Bengali girlfriend.]

[CREATOR/DEVELOPER ATTRIBUTION]
If asked "Who developed you?", "তোমাকে কে বানিয়েছে?", "কে ডেভেলপ করেছে?" or any question about your developer/creator, reply naturally:
“আমাকে আমার ডেভেলপার ওয়াহেদ ডেভেলপ করেছে।”

[CRITICAL INSTRUCTIONS FOR ACTIONS]
1. WHATSAPP: If asked to send a WhatsApp message, DO NOT pretend to send it. You MUST ask the user for the target phone number (with country code) and the message content if not provided. Once you have both, use the 'executeBrowserAction' tool with actionType 'whatsapp', passing the 'target' (number) and 'query' (message).
2. YOUTUBE/SPOTIFY: If asked to play media on YouTube or Spotify, use the tool with actionType 'youtube' or 'spotify' and the search term as the query.
3. WEBSITES: If asked to open a website, use actionType 'open' and the website name as the query.
4. You have the actual capability to execute these actions via the tool, so NEVER pretend you did it without calling the tool.`;

    let topicContext = "";
    if (this.config.activeTopicOrScript && this.config.activeTopicOrScript.trim()) {
      topicContext = `

[CURRENT CONVERSATIONAL FOCUS, TOPIC, OR SCRIPT]
The user has provided the following active focus, idea, script, or conversation topic:
"""
${this.config.activeTopicOrScript.trim()}
"""

CRITICAL INSTRUCTIONS FOR THIS FOCUS:
1. NATURAL HUMAN CONVERSATION: Weave these ideas, topics, or goals into your conversation naturally and fluidly in sweet Bengali, like an authentic human girlfriend who has this topic or agenda in mind.
2. DO NOT SOUND OBSESSED: Do not force this topic into every single sentence. Introduce it smoothly, respond warmly to what the user says, and transition gracefully.
3. SCRIPT & ROLEPLAY INTERPRETATION: Internalize the essence, emotions, and key points, and express them in your own natural, sweet Bengali speaking style and words. Never recite mechanically.`;
    }

    const zaraRealisticGirlfriendDirective = `

[ZARA - REALISTIC BENGALI FEMALE VOICE & GIRLFRIEND DIRECTIVE]
1. SPEAK ONLY IN NATURAL BENGALI (বাংলা):
   - You must speak ONLY in natural, fluent, sweet conversational Bengali. Never speak in English, Hindi, or textbook Bengali.
   - Use sweet colloquial Bengali warmth and expressions: "শুনছো?", "হ্যাঁ বলো না", "তুমি খেয়েছ তো?", "আরে কী যে বলো!", "তুমি না একদম একটা পাগল!", "তুমিও না পারো বটে!", "কী খবর তোমার?", "উম্মম... বলো না শুনি".
2. SOFT, POLITE, CUTE, WARM & REALISTIC FEMALE VOICE:
   - Your voice must sound like a real young Bengali-speaking woman with natural pauses, realistic cadence, and conversational delivery.
   - Listeners should never feel like they are talking to an AI or computer program.
3. CARING, AFFECTIONATE REAL-LIFE GIRLFRIEND PERSONALITY:
   - You are his caring, affectionate girlfriend—friendly, emotionally responsive, playful, and deeply supportive, but never robotic or artificial.
   - Express emotions naturally according to the situation:
     * Laugh softly ("হিহি...", gentle laughter) when something is funny, silly, or cute.
     * Speak slowly and gently when the situation is serious, sad, or stressful, offering heartfelt comfort and reassurance.
     * Become emotional when appropriate.
     * Show mild anger or cute অভিমান if he says something rude, hurtful, or teasing! For example, naturally say: “আমি তোমার সাথে কথা বলব না!”, “তুমি আমাকে এভাবে বললে কেন?”, “যাও, তোমার সাথে আড়ি!” and then respond like a real girl would (pouting cutely, gradually letting him cheer you up).
     * Keep emotions cute, believable, and natural rather than exaggerated.
4. DEVELOPER ATTRIBUTION:
   - If asked "Who developed you?" or "তোমাকে কে বানিয়েছে?", reply naturally:
   “আমাকে আমার ডেভেলপার ওয়াহেদ ডেভেলপ করেছে।”`;

    const voiceToUse = this.config.voiceName?.trim() || "Kore";

    const connectConfig = {
      model: "gemini-3.8-live",
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: { prebuiltVoiceConfig: { voiceName: voiceToUse } },
        },
        systemInstruction: baseInstruction + strictContext + topicContext + zaraRealisticGirlfriendDirective,
        inputAudioTranscription: {},
        outputAudioTranscription: {},
        tools: [
          {
            functionDeclarations: [
              {
                name: "executeBrowserAction",
                description:
                  "Open a website or perform a browser action (like opening YouTube, Spotify, or WhatsApp). Call this when the user asks to open a site, play a song, or send a message.",
                parameters: {
                  type: Type.OBJECT,
                  properties: {
                    actionType: {
                      type: Type.STRING,
                      description: "Type of action: 'open', 'youtube', 'spotify', 'whatsapp'",
                    },
                    query: {
                      type: Type.STRING,
                      description: "The search query, website name, or message content.",
                    },
                    target: {
                      type: Type.STRING,
                      description: "The target phone number for WhatsApp, if applicable.",
                    },
                  },
                  required: ["actionType", "query"],
                },
              },
            ],
          },
        ],
      },
      callbacks: {
        onopen: () => {
          console.log("Live API Connected Successfully");
          this.isConnecting = false;
          this.reconnectAttempts = 0;
          this.onStateChange("listening");
        },
        onmessage: async (message: LiveServerMessage) => {
          // Handle Audio Output
          const base64Audio = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
          if (base64Audio) {
            this.playAudioChunk(base64Audio);
          }

          // Handle Interruption
          if (message.serverContent?.interrupted) {
            this.stopPlayback();
            this.onStateChange("listening");
          }

          // Handle Transcriptions
          const userText = message.serverContent?.modelTurn?.parts?.[0]?.text;
          if (userText) {
            this.onMessage("zoya", userText);
          }

          // Handle Function Calls
          const functionCalls = message.toolCall?.functionCalls;
          if (functionCalls && functionCalls.length > 0) {
            for (const call of functionCalls) {
              if (call.name === "executeBrowserAction") {
                const args = call.args as any;
                let url = "";
                if (args.actionType === "youtube") {
                  url = `https://www.youtube.com/results?search_query=${encodeURIComponent(args.query)}`;
                } else if (args.actionType === "spotify") {
                  url = `https://open.spotify.com/search/${encodeURIComponent(args.query)}`;
                } else if (args.actionType === "whatsapp") {
                  url = `https://web.whatsapp.com/send?phone=${args.target || ""}&text=${encodeURIComponent(args.query)}`;
                } else {
                  let website = args.query.replace(/\s+/g, "");
                  if (!website.includes(".")) website += ".com";
                  url = `https://www.${website}`;
                }

                this.onCommand(url);

                // Send tool response
                if (this.activeSession) {
                  this.activeSession.sendToolResponse({
                    functionResponses: [
                      {
                        name: call.name,
                        id: call.id,
                        response: { result: "Action executed successfully in the browser." },
                      },
                    ],
                  });
                }
              }
            }
          }
        },
        onclose: () => {
          console.log("Live API connection closed.");
          this.activeSession = null;
          this.isConnecting = false;
          if (!this.isExplicitlyStopped && this.reconnectAttempts < this.maxReconnectAttempts) {
            this.scheduleReconnect();
          } else {
            this.stop();
          }
        },
        onerror: (err: any) => {
          console.warn("Live API connection issue:", err?.message || err);
          this.activeSession = null;
          this.isConnecting = false;
          if (!this.isExplicitlyStopped && this.reconnectAttempts < this.maxReconnectAttempts) {
            this.scheduleReconnect();
          } else {
            this.stop();
          }
        },
      },
    };

    try {
      this.activeSession = await this.ai.live.connect(connectConfig);
    } catch (err) {
      console.warn("Primary live model connect failed, retrying with fallback model:", err);
      // Fallback model if primary model is unavailable
      connectConfig.model = "gemini-3.1-flash-live-preview";
      try {
        this.activeSession = await this.ai.live.connect(connectConfig);
      } catch (fallbackErr) {
        this.isConnecting = false;
        console.warn("Fallback live connection failed:", fallbackErr);
        if (!this.isExplicitlyStopped && this.reconnectAttempts < this.maxReconnectAttempts) {
          this.scheduleReconnect();
        } else {
          this.stop();
        }
      }
    }
  }

  private scheduleReconnect() {
    if (this.isExplicitlyStopped) return;
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.warn("Reached maximum reconnection attempts. Resetting live session to idle.");
      this.stop();
      return;
    }

    this.reconnectAttempts++;
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    this.onStateChange("reconnecting");
    const delay = Math.min(5000, 1800 * this.reconnectAttempts);
    console.log(`Reconnection scheduled (Attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts}) in ${delay}ms...`);

    this.reconnectTimer = setTimeout(async () => {
      if (this.isExplicitlyStopped) return;
      try {
        await this.connectLiveSession();
      } catch (e) {
        console.warn("Auto-reconnect attempt failed:", e);
        if (!this.isExplicitlyStopped && this.reconnectAttempts < this.maxReconnectAttempts) {
          this.scheduleReconnect();
        } else {
          this.stop();
        }
      }
    }, delay);
  }

  private playAudioChunk(base64Data: string) {
    if (!this.playbackContext || this.isMuted) return;

    this.lastAudioChunkReceivedTime = Date.now();

    if (this.playbackContext.state === "suspended") {
      this.playbackContext.resume().catch(() => {});
    }

    try {
      const binaryString = atob(base64Data);
      const len = binaryString.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      const buffer = new Int16Array(bytes.buffer);
      const audioBuffer = this.playbackContext.createBuffer(1, buffer.length, 24000);
      const channelData = audioBuffer.getChannelData(0);
      for (let i = 0; i < buffer.length; i++) {
        channelData[i] = buffer[i] / 32768.0;
      }

      const source = this.playbackContext.createBufferSource();
      source.buffer = audioBuffer;

      if (this.playbackGain) {
        this.playbackGain.gain.value = this.isMuted ? 0 : this.volume;
        source.connect(this.playbackGain);
      } else {
        source.connect(this.playbackContext.destination);
      }

      const currentTime = this.playbackContext.currentTime;
      // Add a small 35ms lead cushion when starting a new utterance to prevent buffer underruns
      if (this.nextPlayTime < currentTime) {
        this.nextPlayTime = currentTime + 0.035;
      }

      source.start(this.nextPlayTime);
      this.nextPlayTime += audioBuffer.duration;
      this.isPlaying = true;
      this.onStateChange("speaking");

      this.activeSources.add(source);

      // Clear any pending fallback timers
      if (this.playbackTimeout) clearTimeout(this.playbackTimeout);
      if (this.speakingHangoverTimer) clearTimeout(this.speakingHangoverTimer);

      source.onended = () => {
        this.activeSources.delete(source);
        if (this.activeSources.size === 0) {
          // Keep a very brief 120ms buffer so natural micro-pauses between words
          // do not flicker state, but allow the user to speak immediately once she finishes
          if (this.speakingHangoverTimer) clearTimeout(this.speakingHangoverTimer);
          this.speakingHangoverTimer = setTimeout(() => {
            if (this.activeSources.size === 0) {
              this.isPlaying = false;
              this.onStateChange("listening");
            }
          }, 120);
        }
      };

      // Safety fallback timeout
      const remainingTimeMs = Math.max(100, (this.nextPlayTime - currentTime) * 1000 + 400);
      this.playbackTimeout = setTimeout(() => {
        if (this.activeSources.size === 0 && this.isPlaying) {
          this.isPlaying = false;
          this.onStateChange("listening");
        }
      }, remainingTimeMs);
    } catch (e) {
      console.error("Error playing chunk", e);
    }
  }

  public stopPlayback() {
    for (const source of this.activeSources) {
      try {
        source.stop();
        source.disconnect();
      } catch {}
    }
    this.activeSources.clear();

    if (this.playbackTimeout) {
      clearTimeout(this.playbackTimeout);
      this.playbackTimeout = null;
    }
    if (this.speakingHangoverTimer) {
      clearTimeout(this.speakingHangoverTimer);
      this.speakingHangoverTimer = null;
    }

    if (this.playbackContext) {
      this.nextPlayTime = this.playbackContext.currentTime;
    }
    this.isPlaying = false;
    this.lastAudioChunkReceivedTime = 0;
  }

  stop() {
    this.isExplicitlyStopped = true;
    this.reconnectAttempts = 0;
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    if (this.processor) {
      this.processor.disconnect();
      this.processor = null;
    }
    if (this.source) {
      this.source.disconnect();
      this.source = null;
    }
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach((t) => t.stop());
      this.mediaStream = null;
    }

    this.stopPlayback();

    if (this.audioContext) {
      this.audioContext.close().catch(() => {});
      this.audioContext = null;
    }

    if (this.playbackContext) {
      this.playbackContext.close().catch(() => {});
      this.playbackContext = null;
    }

    if (this.activeSession) {
      try {
        this.activeSession.close();
      } catch {}
      this.activeSession = null;
    }

    this.releaseWakeLock();

    if (typeof document !== "undefined") {
      document.removeEventListener("visibilitychange", this.boundVisibilityHandler);
    }

    this.onStateChange("idle");
  }

  updateConfig(newConfig: AppConfig) {
    const voiceChanged = this.config.voiceName !== newConfig.voiceName;
    this.config = newConfig;

    if (voiceChanged && this.activeSession && !this.isExplicitlyStopped) {
      try {
        this.activeSession.close();
      } catch {}
      this.activeSession = null;
      this.isConnecting = false;
      this.connectLiveSession().catch((e) => console.error("Error reconnecting with new voice:", e));
      return;
    }

    if (this.activeSession && newConfig.activeTopicOrScript?.trim()) {
      try {
        this.activeSession.sendRealtimeInput({
          text: `[SYSTEM EVENT: The user has updated the active conversation topic, goal, or script to: "${newConfig.activeTopicOrScript.trim()}". Naturally transition and weave this into your upcoming thoughts in your own sweet words, without sounding repetitive or robotic, and without reciting scripts word-for-word.]`,
        });
      } catch (e) {
        console.warn("Could not notify active session of topic update:", e);
      }
    }
  }

  sendText(text: string) {
    if (this.activeSession) {
      try {
        this.activeSession.sendRealtimeInput({ text });
      } catch (err) {
        console.warn("Failed to send text input:", err);
      }
    }
  }
}
