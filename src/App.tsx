import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { 
  Mic, 
  MicOff, 
  Loader2, 
  Volume2, 
  VolumeX, 
  Keyboard, 
  Send, 
  Trash2, 
  Video, 
  Settings, 
  Edit3, 
  Key, 
  Download, 
  ScrollText, 
  RefreshCw, 
  MessageSquare, 
  Heart,
  Tv,
  Moon,
  ShieldCheck,
  Smartphone,
  Sparkles,
  X,
  CheckCircle2,
  Menu,
  Music,
  BookOpen,
  MessageCircle,
  Image as ImageIcon,
  Scan,
  Brain,
  Home,
  ChevronUp,
  ChevronDown,
  TrendingUp,
  Layers
} from "lucide-react";
import ZaraLiveCompanion, { detectSentiment, ZaraSentiment } from "./components/ZaraLiveCompanion";
import idleAvatar from "./assets/images/zara_cyber_avatar.jpg";
import { getZaraResponse, getZaraAudio, resetZaraSession, DEFAULT_ZARA_PROMPT } from "./services/geminiService";
import { usePWAInstall } from "./hooks/usePWAInstall";
import { processCommand } from "./services/commandService";
import { LiveSessionManager } from "./services/liveService";
import Visualizer from "./components/Visualizer";
import PermissionModal from "./components/PermissionModal";
import PermissionSetupModal from "./components/PermissionSetupModal";
import SetupScreen from "./components/SetupScreen";
import TopicScriptModal from "./components/TopicScriptModal";
import VoiceSelectorModal from "./components/VoiceSelectorModal";
import SmsAutoReplyModal from "./components/SmsAutoReplyModal";
import SleepModeModal from "./components/SleepModeModal";
import ScreenViewingModal from "./components/ScreenViewingModal";
import JaraSettingsMainModal from "./components/JaraSettingsMainModal";
import AiGenerationSettingsModal from "./components/AiGenerationSettingsModal";
import GeneratedMediaViewerModal from "./components/GeneratedMediaViewerModal";
import CommandManagerModal from "./components/CommandManagerModal";
import ZaraFloatingOverlay from "./components/ZaraFloatingOverlay";
import GeminiLiveApiModal from "./components/GeminiLiveApiModal";
import PasswordAuthModal from "./components/PasswordAuthModal";
import DailyAffirmationModal from "./components/DailyAffirmationModal";
import QuickPhrasesOverlay from "./components/QuickPhrasesOverlay";
import MoodHistoryChart, { MoodHistoryPoint, MOOD_META } from "./components/MoodHistoryChart";
import { getTodayAffirmation } from "./data/dailyAffirmations";
import { executeAndroidCommand } from "./services/commandManagerService";
import { generateAiImage, generateAiVideo, saveGenerationToHistory } from "./services/aiGenerationService";
import { playPCM } from "./utils/audioUtils";
import { isCurrentTimeInSleepRange } from "./services/sleepModeService";
import { motion, AnimatePresence } from "motion/react";
import { AppConfig, AppState, GenerationHistoryItem, ImageGenerationOptions, CommandExecutionResult } from "./types";

interface ChatMessage {
  id: string;
  sender: "user" | "zara" | "zoya";
  text: string;
}

declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

export default function App() {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [showAndroidGuide, setShowAndroidGuide] = useState(false);

  // Permission Setup on First Launch
  const [showPermissionSetup, setShowPermissionSetup] = useState(() => {
    return !localStorage.getItem("zara_permissions_onboarded");
  });

  const [config, setConfig] = useState<AppConfig>(() => {
    // 1. Check existing zara config
    const savedZara = localStorage.getItem("zara_app_config");
    if (savedZara) {
      try {
        const parsed = JSON.parse(savedZara);
        return {
          apiKey: parsed.apiKey || (typeof process !== "undefined" && process.env?.GEMINI_API_KEY) || "",
          userName: parsed.userName || "ওয়াহেদ",
          assistantName: "Zara",
          voiceName: parsed.voiceName || "Kore",
          systemPrompt: parsed.systemPrompt || DEFAULT_ZARA_PROMPT,
          activeTopicOrScript: parsed.activeTopicOrScript || "",
          smsSafetyConfig: parsed.smsSafetyConfig || {
            autoReplyEnabled: false,
            fallbackReply: `আসসালামু আলাইকুম। ${parsed.userName || "ওয়াহেদ"} এখন একটু ব্যস্ত আছেন। পরে যোগাযোগ করবেন। ধন্যবাদ!`,
            useGeminiReply: true,
            rateLimitMinutes: 10,
          },
          sleepModeConfig: parsed.sleepModeConfig || {
            enabled: false,
            startTime: "23:00",
            endTime: "07:00",
            allowEmergencyExceptions: true,
            autoReplyDuringSleep: true,
          },
          screenViewingConfig: parsed.screenViewingConfig || {
            enabled: false,
            autoAnalysisEnabled: false,
          },
          wakeWord: parsed.wakeWord || "জারা",
          wakeWordEnabled: false,
        };
      } catch (e) {
        console.error("Failed to parse zara_app_config", e);
      }
    }

    // Default fresh configuration
    const envKey = (typeof process !== "undefined" && process.env?.GEMINI_API_KEY) || "";
    const freshConfig: AppConfig = {
      apiKey: envKey,
      userName: "ওয়াহেদ",
      assistantName: "Zara",
      voiceName: "Kore",
      systemPrompt: DEFAULT_ZARA_PROMPT,
      activeTopicOrScript: "",
      wakeWord: "জারা",
      wakeWordEnabled: false,
      smsSafetyConfig: {
        autoReplyEnabled: false,
        fallbackReply: "আসসালামু আলাইকুম। ওয়াহেদ এখন একটু ব্যস্ত আছেন। পরে যোগাযোগ করবেন। ধন্যবাদ!",
        useGeminiReply: true,
        rateLimitMinutes: 10,
      },
      sleepModeConfig: {
        enabled: false,
        startTime: "23:00",
        endTime: "07:00",
        allowEmergencyExceptions: true,
        autoReplyDuringSleep: true,
      },
      screenViewingConfig: {
        enabled: false,
        autoAnalysisEnabled: false,
      },
    };
    localStorage.setItem("zara_app_config", JSON.stringify(freshConfig));
    return freshConfig;
  });

  const [appState, setAppState] = useState<AppState>("idle");
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    const saved = localStorage.getItem("zara_chat_history") || localStorage.getItem("zoya_chat_history");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Failed to parse chat history", e);
      }
    }
    return [];
  });
  const messagesRef = useRef(messages);

  useEffect(() => {
    messagesRef.current = messages;
    localStorage.setItem("zara_chat_history", JSON.stringify(messages));
  }, [messages]);

  useEffect(() => {
    document.title = config?.assistantName 
      ? `${config.assistantName} - আপনার এআই সহচরী`
      : "জারা - এআই সহচরী";
  }, [config?.assistantName]);

  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(1.0);
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [historyModalTab, setHistoryModalTab] = useState<"chat" | "mood">("chat");
  const [showQuickPhrases, setShowQuickPhrases] = useState(false);

  // Mood History tracking state
  const [moodHistory, setMoodHistory] = useState<MoodHistoryPoint[]>(() => {
    const saved = localStorage.getItem("zara_mood_history");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {}
    }
    return [];
  });

  const recordMoodEvent = (text: string) => {
    if (!text) return;
    const sentiment = detectSentiment(text);
    const meta = MOOD_META[sentiment] || MOOD_META.smiling;
    const now = new Date();
    const timeStr = `${now.getHours()}:${String(now.getMinutes()).padStart(2, "0")}`;
    const newPt: MoodHistoryPoint = {
      id: Date.now().toString() + "-" + Math.random().toString(36).slice(2, 6),
      timestamp: Date.now(),
      timeStr,
      sentiment,
      score: meta.score,
      moodEmoji: meta.emoji,
      moodName: meta.name,
      phraseSnippet: text.slice(0, 50) + (text.length > 50 ? "..." : ""),
    };
    setMoodHistory((prev) => {
      const updated = [...prev, newPt].slice(-50);
      localStorage.setItem("zara_mood_history", JSON.stringify(updated));
      return updated;
    });
  };

  // New Modals for Android capabilities
  const [showSmsModal, setShowSmsModal] = useState(false);
  const [showSleepModal, setShowSleepModal] = useState(false);
  const [showScreenModal, setShowScreenModal] = useState(false);

  // Command Manager & Background Floating Overlay
  const [showCommandManager, setShowCommandManager] = useState(false);
  const [showFloatingOverlay, setShowFloatingOverlay] = useState(true);
  const [isHomeScreenMode, setIsHomeScreenMode] = useState(false);
  const [activeCommandResult, setActiveCommandResult] = useState<CommandExecutionResult | null>(null);

  // Gemini Live API direct configuration modal
  const [showGeminiLiveApiModal, setShowGeminiLiveApiModal] = useState(false);

  // App-level Password Protection for restricted settings
  const [appPasswordModal, setAppPasswordModal] = useState<{
    isOpen: boolean;
    title: string;
    onSuccess: () => void;
  } | null>(null);

  // AI Image & Video Generation Modals
  const [showJaraMainSettings, setShowJaraMainSettings] = useState(false);
  const [showAiGenModal, setShowAiGenModal] = useState(false);
  const [aiGenInitialTab, setAiGenInitialTab] = useState<"menu" | "image_api" | "video_api" | "history" | "options">("menu");
  const [activeGeneratedMedia, setActiveGeneratedMedia] = useState<GenerationHistoryItem | null>(null);
  const [generationProgress, setGenerationProgress] = useState<{
    active: boolean;
    type: "image" | "video";
    step: string;
    prompt: string;
  }>({
    active: false,
    type: "image",
    step: "Preparing...",
    prompt: "",
  });

  useEffect(() => {
    if (liveSessionRef.current) {
      liveSessionRef.current.isMuted = isMuted;
      liveSessionRef.current.volume = volume;
    }
  }, [isMuted, volume]);

  const [showTextInput, setShowTextInput] = useState(false);
  const [textInput, setTextInput] = useState("");
  const [showPermissionModal, setShowPermissionModal] = useState(false);
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [isMicHearing, setIsMicHearing] = useState(false);
  const [audioIntensity, setAudioIntensity] = useState<number>(0);
  const [videoSrc, setVideoSrc] = useState<string | null>(() => {
    return localStorage.getItem("zara_video_bg") || localStorage.getItem("zoya_video_bg") || null;
  });

  const liveSessionRef = useRef<LiveSessionManager | null>(null);
  const isTogglingSessionRef = useRef(false);
  const isSessionActiveRef = useRef(isSessionActive);
  isSessionActiveRef.current = isSessionActive;
  const appStateRef = useRef(appState);
  appStateRef.current = appState;
  const lastWakeTriggerTimeRef = useRef(0);

  const [showTopicModal, setShowTopicModal] = useState(false);
  const [showVoiceModal, setShowVoiceModal] = useState(false);
  const [updatingPWA, setUpdatingPWA] = useState(false);

  // Daily 'Affirmation of the Day' feature
  const [showDailyAffirmation, setShowDailyAffirmation] = useState(false);
  const todayAffirmation = useMemo(() => getTodayAffirmation(), []);

  useEffect(() => {
    // Check if affirmation was already shown today on this device
    const todayKey = new Date().toISOString().split("T")[0];
    const lastSeen = localStorage.getItem("zara_last_affirmation_date");
    if (lastSeen !== todayKey) {
      // Delay slightly for smooth entrance after app initializes
      const timer = setTimeout(() => {
        setShowDailyAffirmation(true);
        localStorage.setItem("zara_last_affirmation_date", todayKey);
      }, 850);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleSpeakAffirmation = async (text: string) => {
    if (!text) return;
    setAppState("speaking");
    try {
      const audioBase64 = await getZaraAudio(text, config);
      if (audioBase64) {
        await playPCM(audioBase64, isMuted ? 0 : volume, (lvl) => setAudioIntensity(lvl));
      } else if (typeof window !== "undefined" && "speechSynthesis" in window) {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = "bn-BD";
        utterance.onend = () => {
          setAppState(isSessionActive ? "listening" : "idle");
          setAudioIntensity(0);
        };
        window.speechSynthesis.speak(utterance);
        return;
      }
    } catch (err) {
      console.warn("Error playing affirmation audio:", err);
    }
    setAppState(isSessionActive ? "listening" : "idle");
    setAudioIntensity(0);
  };

  const isSleepingNow = Boolean(
    config?.sleepModeConfig?.enabled &&
    isCurrentTimeInSleepRange(config.sleepModeConfig.startTime, config.sleepModeConfig.endTime)
  );

  const handleConfigComplete = (newConfig: AppConfig) => {
    localStorage.setItem("zara_app_config", JSON.stringify(newConfig));
    setConfig(newConfig);
    setShowSettings(false);
    resetZaraSession();
    if (liveSessionRef.current) {
      liveSessionRef.current.updateConfig(newConfig);
    }
  };

  // Poke / Tap interaction handler for witty & sassy response
  const handleCompanionPoke = async (sassyText?: string) => {
    if (!sassyText) return;
    
    // Add to chat history
    setMessages((prev) => [
      ...prev,
      { id: Date.now().toString() + "-z", sender: "zara", text: sassyText }
    ]);
    recordMoodEvent(sassyText);
    
    // Voice speech for the witty response
    if (!isMuted) {
      setAppState("speaking");
      try {
        const audioBase64 = await getZaraAudio(sassyText, config);
        if (audioBase64) {
          await playPCM(audioBase64, isMuted ? 0 : volume, (lvl) => setAudioIntensity(lvl));
        } else if (typeof window !== "undefined" && "speechSynthesis" in window) {
          const utterance = new SpeechSynthesisUtterance(sassyText);
          utterance.lang = "bn-BD";
          utterance.onend = () => {
            setAppState(isSessionActive ? "listening" : "idle");
            setAudioIntensity(0);
          };
          window.speechSynthesis.speak(utterance);
          return;
        }
      } catch (err) {
        console.warn("Error playing poke audio:", err);
      }
      setAppState(isSessionActive ? "listening" : "idle");
      setAudioIntensity(0);
    }
  };

  const handleSelectVoice = (newVoice: string) => {
    if (!config) return;
    const updatedConfig: AppConfig = {
      ...config,
      voiceName: newVoice,
    };
    setConfig(updatedConfig);
    localStorage.setItem("zara_app_config", JSON.stringify(updatedConfig));
    resetZaraSession();
    if (liveSessionRef.current) {
      liveSessionRef.current.updateConfig(updatedConfig);
    }
  };

  const handleUpdateTopic = (newTopic: string) => {
    if (!config) return;
    const updatedConfig: AppConfig = {
      ...config,
      activeTopicOrScript: newTopic,
    };
    setConfig(updatedConfig);
    localStorage.setItem("zara_app_config", JSON.stringify(updatedConfig));
    resetZaraSession();
    if (liveSessionRef.current) {
      liveSessionRef.current.updateConfig(updatedConfig);
    }
  };

  const handleForceUpdateApp = async () => {
    setUpdatingPWA(true);
    try {
      if ("serviceWorker" in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        for (const reg of registrations) {
          await reg.unregister();
        }
      }
      if ("caches" in window) {
        const cacheNames = await caches.keys();
        await Promise.all(cacheNames.map((name) => caches.delete(name)));
      }
    } catch (e) {
      console.warn("Cache reset error:", e);
    } finally {
      window.location.reload();
    }
  };

  const handleVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setVideoSrc(url);
      localStorage.setItem("zara_video_bg", url);
    }
  };

  const handleTextCommand = useCallback(async (finalTranscript: string) => {
    if (!finalTranscript.trim() || !config) {
      setAppState("idle");
      return;
    }

    setMessages((prev) => [...prev, { id: Date.now().toString(), sender: "user", text: finalTranscript }]);
    
    // If live session is active, send text through it
    if (isSessionActive && liveSessionRef.current) {
      liveSessionRef.current.sendText(finalTranscript);
      return;
    }

    setAppState("processing");

    // 1. Process Command Dispatcher
    const commandResult = processCommand(finalTranscript);
    let responseText = "";

    // 1. Check for AI Generation Commands (Images & Videos)
    if (commandResult.isGenerationCommand) {
      const genType = commandResult.generationType || "image";
      const genPrompt = commandResult.generationPrompt || finalTranscript;

      // Notify user via Zara's natural sweet voice
      const ackText = genType === "video" 
        ? "আমি আপনার জন্য একটি সুন্দর অ্যানিমেশন ভিডিও তৈরি করছি, একটু অপেক্ষা করুন সোনা..."
        : "আমি আপনার জন্য একটি সুন্দর বাস্তব দৃশ্য তৈরি করছি, একটু অপেক্ষা করুন লক্ষ্মীটি...";

      setMessages((prev) => [...prev, { id: Date.now().toString() + "-z", sender: "zara", text: ackText }]);

      if (!isMuted) {
        setAppState("speaking");
        const audioBase64 = await getZaraAudio(ackText, config);
        if (audioBase64) {
          await playPCM(audioBase64, isMuted ? 0 : volume, (lvl) => setAudioIntensity(lvl));
        }
      }

      setAppState("processing");
      setGenerationProgress({
        active: true,
        type: genType,
        step: "Preparing...",
        prompt: genPrompt,
      });

      try {
        if (genType === "video") {
          const videoRes = await generateAiVideo(
            genPrompt,
            undefined,
            config.videoApiConfig,
            (step) => setGenerationProgress((p) => ({ ...p, step }))
          );

          const newItem: GenerationHistoryItem = {
            id: Date.now().toString(),
            prompt: genPrompt,
            type: "video",
            mediaUrl: videoRes.url,
            provider: videoRes.provider,
            model: videoRes.model,
            timestamp: Date.now(),
            dateStr: "Just now",
          };

          saveGenerationToHistory(newItem);
          setGenerationProgress((p) => ({ ...p, active: false }));
          setActiveGeneratedMedia(newItem);

          const doneText = "আপনার চমৎকার অ্যানিমেশন ভিডিওটি তৈরি হয়ে গেছে! স্ক্রিনে দেখুন।";
          setMessages((prev) => [...prev, { id: Date.now().toString() + "-done", sender: "zara", text: doneText }]);
        } else {
          const imgRes = await generateAiImage(
            {
              prompt: genPrompt,
              style: "Realistic",
              aspectRatio: "16:9 (Landscape)",
              resolution: "1024 x 1024",
            },
            config.imageApiConfig,
            (step) => setGenerationProgress((p) => ({ ...p, step }))
          );

          const newItem: GenerationHistoryItem = {
            id: Date.now().toString(),
            prompt: genPrompt,
            type: "image",
            mediaUrl: imgRes.url,
            provider: imgRes.provider,
            model: imgRes.model,
            timestamp: Date.now(),
            dateStr: "Just now",
            aspectRatio: "16:9 (Landscape)",
            style: "Realistic",
          };

          saveGenerationToHistory(newItem);
          setGenerationProgress((p) => ({ ...p, active: false }));
          setActiveGeneratedMedia(newItem);

          const doneText = "আপনার জন্য কাঙ্ক্ষিত চমৎকার সুন্দর দৃশ্যটি তৈরি করে দিয়েছি! কেমন লেগেছে বলুন তো?";
          setMessages((prev) => [...prev, { id: Date.now().toString() + "-done", sender: "zara", text: doneText }]);
        }
      } catch (err: any) {
        console.error("AI Generation error:", err);
        setGenerationProgress((p) => ({ ...p, active: false }));
        setMessages((prev) => [
          ...prev, 
          { 
            id: Date.now().toString() + "-err", 
            sender: "zara", 
            text: "ইমেজ বা ভিডিও জেনারেট করতে সাময়িক সমস্যা হয়েছে। সেটিংস থেকে আপনার API Key টি চেক করে নেবেন প্লিজ।" 
          }
        ]);
      }

      setAppState("idle");
      return;
    }

    // 2. Check for Real Android Executable Commands (Auto SMS Reply, Call Contact, Send Message, Set Reminder, Sleep Mode, Background Operation, Device Unlock, Custom Commands)
    const executableResult = await executeAndroidCommand(finalTranscript, config);
    if (executableResult && executableResult.success) {
      responseText = executableResult.spokenFeedback;
      setActiveCommandResult(executableResult);
      setMessages((prev) => [...prev, { id: Date.now().toString() + "-cmd", sender: "zara", text: responseText }]);
      recordMoodEvent(responseText);

      if (!isMuted) {
        setAppState("speaking");
        const audioBase64 = await getZaraAudio(responseText, config);
        if (audioBase64) {
          await playPCM(audioBase64, isMuted ? 0 : volume, (lvl) => setAudioIntensity(lvl));
        }
      }

      setAppState("idle");
      return;
    }

    // 3. Check for browser commands
    if (commandResult.isBrowserAction) {
      responseText = commandResult.action;
      setMessages((prev) => [...prev, { id: Date.now().toString() + "-z", sender: "zara", text: responseText }]);
      
      if (!isMuted) {
        setAppState("speaking");
        const audioBase64 = await getZaraAudio(responseText, config);
        if (audioBase64) {
          await playPCM(audioBase64, isMuted ? 0 : volume, (lvl) => setAudioIntensity(lvl));
        }
      }

      setAppState("idle");

      setTimeout(() => {
        if (commandResult.url) {
          window.open(commandResult.url, "_blank");
        }
      }, 1500);
    } else {
      // 2. Natural Bengali Chat via Gemini
      responseText = await getZaraResponse(finalTranscript, messagesRef.current, config);
      setMessages((prev) => [...prev, { id: Date.now().toString() + "-z", sender: "zara", text: responseText }]);
      recordMoodEvent(responseText);
      
      if (!isMuted) {
        setAppState("speaking");
        const audioBase64 = await getZaraAudio(responseText, config);
        if (audioBase64) {
          await playPCM(audioBase64, isMuted ? 0 : volume, (lvl) => setAudioIntensity(lvl));
        }
      }
      setAppState("idle");
    }
  }, [isMuted, volume, isSessionActive, config]);

  useEffect(() => {
    return () => {
      if (liveSessionRef.current) {
        liveSessionRef.current.stop();
      }
    };
  }, []);

  const toggleListening = async () => {
    if (isTogglingSessionRef.current) return;
    isTogglingSessionRef.current = true;

    try {
      if (isSessionActive) {
        setIsSessionActive(false);
        setIsMicHearing(false);
        if (liveSessionRef.current) {
          liveSessionRef.current.stop();
          liveSessionRef.current = null;
        }
        setAppState("idle");
        resetZaraSession();
      } else {
        if (!config) return;
        if (!config.apiKey.trim()) {
          setShowSettings(true);
          return;
        }
        try {
          setIsSessionActive(true);
          resetZaraSession();
          
          const session = new LiveSessionManager(config);
          session.isMuted = isMuted;
          liveSessionRef.current = session;
          
          session.onStateChange = (state) => {
            setAppState(state);
            if (state === "idle") {
              setIsSessionActive(false);
              liveSessionRef.current = null;
            } else {
              setIsSessionActive(true);
            }
          };
          
          session.onMessage = (sender, text) => {
            const finalSender = sender === "user" ? "user" : "zara";
            setMessages((prev) => [...prev, { id: Date.now().toString() + "-" + finalSender, sender: finalSender, text }]);
            if (finalSender === "zara") {
              recordMoodEvent(text);
            }
          };
          
          session.onCommand = (url) => {
            setTimeout(() => {
              window.open(url, "_blank");
            }, 1000);
          };

          session.onAudioLevel = (level) => {
            setAudioIntensity(level);
            if (level > 0.012) {
              setIsMicHearing(true);
            } else if (level < 0.005) {
              setIsMicHearing(false);
            }
          };

          await session.start();
        } catch (e: any) {
          const isPermDenied = 
            e?.name === "NotAllowedError" || 
            e?.name === "PermissionDeniedError" ||
            String(e?.message || e).toLowerCase().includes("permission denied");

          if (isPermDenied) {
            console.warn("Microphone access was denied by user or environment:", e?.message || e);
            setShowPermissionModal(true);
          } else {
            console.warn("Could not start voice session:", e?.message || e);
          }
          if (liveSessionRef.current) {
            liveSessionRef.current.stop();
            liveSessionRef.current = null;
          }
          setIsSessionActive(false);
          setAppState("idle");
        }
      }
    } finally {
      setTimeout(() => {
        isTogglingSessionRef.current = false;
      }, 350);
    }
  };

  const handleTextSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!textInput.trim()) return;
    
    handleTextCommand(textInput);
    setTextInput("");
  };

  // Latest message for display
  const latestMessage = messages.length > 0 ? messages[messages.length - 1] : null;

  // Active Sentiment & Dynamic Ambient Lighting
  const activeSentiment: ZaraSentiment = useMemo(() => {
    if (appState === "speaking" && latestMessage?.sender === "zara") {
      return detectSentiment(latestMessage.text);
    }
    if (appState === "listening" || isMicHearing) {
      return "nodding";
    }
    if (appState === "processing") {
      return "sassy";
    }
    return "idle";
  }, [appState, latestMessage, isMicHearing]);

  const ambientTheme = useMemo(() => {
    switch (activeSentiment) {
      case "smiling":
        return {
          leftBeam: "from-pink-500 via-rose-500 to-transparent",
          rightBeam: "from-rose-500 via-pink-500 to-transparent",
          leftShadow: "shadow-[0_0_16px_#f43f5e]",
          rightShadow: "shadow-[0_0_16px_#ec4899]",
          topGlow: "bg-pink-600/22",
          bottomGlow: "bg-rose-600/20",
          radialAura: "radial-gradient(circle, rgba(244,63,94,0.18) 0%, rgba(236,72,153,0.08) 50%, transparent 75%)",
          moodEmoji: "💖",
          moodText: "খুশি",
        };
      case "sassy":
        return {
          leftBeam: "from-purple-500 via-fuchsia-500 to-transparent",
          rightBeam: "from-fuchsia-500 via-violet-600 to-transparent",
          leftShadow: "shadow-[0_0_16px_#a855f7]",
          rightShadow: "shadow-[0_0_16px_#d946ef]",
          topGlow: "bg-purple-600/25",
          bottomGlow: "bg-fuchsia-600/22",
          radialAura: "radial-gradient(circle, rgba(217,70,239,0.2) 0%, rgba(168,85,247,0.08) 50%, transparent 75%)",
          moodEmoji: "💅",
          moodText: "স্যাসি",
        };
      case "nodding":
        return {
          leftBeam: "from-cyan-400 via-blue-500 to-transparent",
          rightBeam: "from-blue-500 via-cyan-400 to-transparent",
          leftShadow: "shadow-[0_0_16px_#06b6d4]",
          rightShadow: "shadow-[0_0_16px_#3b82f6]",
          topGlow: "bg-cyan-600/22",
          bottomGlow: "bg-blue-600/20",
          radialAura: "radial-gradient(circle, rgba(6,182,212,0.18) 0%, rgba(59,130,246,0.08) 50%, transparent 75%)",
          moodEmoji: "✨",
          moodText: "একমত",
        };
      case "comforting":
        return {
          leftBeam: "from-emerald-400 via-teal-500 to-transparent",
          rightBeam: "from-teal-500 via-emerald-600 to-transparent",
          leftShadow: "shadow-[0_0_16px_#10b981]",
          rightShadow: "shadow-[0_0_16px_#14b8a6]",
          topGlow: "bg-emerald-600/20",
          bottomGlow: "bg-teal-600/20",
          radialAura: "radial-gradient(circle, rgba(16,185,129,0.18) 0%, rgba(20,184,166,0.08) 50%, transparent 75%)",
          moodEmoji: "🌿",
          moodText: "শান্ত",
        };
      default: // idle
        return {
          leftBeam: "from-cyan-400 via-teal-400 to-transparent",
          rightBeam: "from-pink-500 via-purple-500 to-transparent",
          leftShadow: "shadow-[0_0_12px_#22d3ee]",
          rightShadow: "shadow-[0_0_12px_#ec4899]",
          topGlow: "bg-cyan-600/10",
          bottomGlow: "bg-purple-600/10",
          radialAura: "radial-gradient(circle, rgba(34,211,238,0.12) 0%, rgba(236,72,153,0.08) 50%, transparent 75%)",
          moodEmoji: "💖",
          moodText: "খুশি",
        };
    }
  }, [activeSentiment]);

  // Manual Voice Control: The voice session strictly stays OFF until the user manually
  // activates the microphone button, and stays ON until the user manually turns it OFF.
  // No background automatic speech recognition or mic toggling runs on app entry.

  // Greeting & Date calculations matching screenshot
  const now = new Date();
  const currentHour = now.getHours();
  const greetingTime = currentHour < 12 ? "Good morning" : currentHour < 17 ? "Good afternoon" : "Good evening";
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const bnDays = ["রবি", "সোম", "মঙ্গল", "বুধ", "বৃহস্পতি", "শুক্র", "শনি"];
  const bnDigits = ["০", "১", "২", "৩", "৪", "৫", "৬", "৭", "৮", "৯"];
  const toBn = (n: number | string) => String(n).replace(/[0-9]/g, (d) => bnDigits[Number(d)]);
  const todayDateBn = toBn(now.getDate());
  const todayFullBn = `${todayDateBn} ${months[now.getMonth()]} ${bnDays[now.getDay()]}`;

  return (
    <div 
      className="h-[100dvh] w-screen bg-[#05060b] text-white flex flex-col items-center justify-between font-sans relative overflow-hidden m-0 p-0 select-none"
      onClick={() => {
        setMenuOpen(false);
        setShowVolumeSlider(false);
      }}
    >
      {/* Dynamic Laser Side Edge Neon Beams (Sync with Mood / Sentiment) */}
      <div className={`fixed top-0 bottom-0 left-0 w-[2px] bg-gradient-to-b ${ambientTheme.leftBeam} pointer-events-none z-50 opacity-90 transition-all duration-700 ${ambientTheme.leftShadow}`} />
      <div className={`fixed top-0 bottom-0 right-0 w-[2px] bg-gradient-to-b ${ambientTheme.rightBeam} pointer-events-none z-50 opacity-90 transition-all duration-700 ${ambientTheme.rightShadow}`} />

      {/* Dynamic Background Ambient Glows & Floor Radial Aura (Sync with Mood / Sentiment) */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden transition-all duration-700">
        <div 
          className="absolute inset-0 transition-opacity duration-700 pointer-events-none"
          style={{ background: ambientTheme.radialAura }}
        />
        <div className={`absolute top-[-10%] left-[20%] w-[480px] h-[480px] ${ambientTheme.topGlow} blur-[140px] rounded-full transition-colors duration-700`} />
        <div className={`absolute bottom-[-10%] right-[20%] w-[480px] h-[480px] ${ambientTheme.bottomGlow} blur-[140px] rounded-full transition-colors duration-700`} />
      </div>

      {/* Permissions First-Launch Setup */}
      {showPermissionSetup && (
        <PermissionSetupModal
          assistantName={config?.assistantName || "Zara"}
          onComplete={() => {
            localStorage.setItem("zara_permissions_onboarded", "true");
            setShowPermissionSetup(false);
          }}
          onCancel={() => {
            localStorage.setItem("zara_permissions_onboarded", "true");
            setShowPermissionSetup(false);
          }}
        />
      )}

      {showSettings && (
        <SetupScreen 
          initialConfig={config} 
          onComplete={handleConfigComplete} 
          onCancel={() => setShowSettings(false)}
        />
      )}
      {showPermissionModal && (
        <PermissionModal 
          assistantName={config?.assistantName || "Zara"}
          onClose={() => setShowPermissionModal(false)} 
          onSwitchToText={() => {
            setShowPermissionModal(false);
            setShowQuickPhrases(true);
          }}
        />
      )}
      {showIOSGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-3xl bg-[#141620] p-6 border border-white/10 shadow-2xl flex flex-col items-center text-center gap-4">
            <div className="w-14 h-14 bg-pink-500/10 rounded-full flex items-center justify-center">
              <Download size={26} className="text-pink-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white mb-2">আইফোনে ইনস্টল করুন</h3>
              <p className="text-xs text-white/70 leading-relaxed">
                ১. সাফারি ব্রাউজারের নিচে <strong>Share (শেয়ার)</strong> বাটনে ট্যাপ করুন।<br/>
                ২. নিচে স্ক্রল করে <strong>Add to Home Screen</strong> এ চাপুন।
              </p>
            </div>
            <button
              onClick={() => setShowIOSGuide(false)}
              className="w-full py-2.5 rounded-xl bg-white/10 hover:bg-white/20 transition-colors text-white text-sm font-medium cursor-pointer"
            >
              ঠিক আছে
            </button>
          </div>
        </div>
      )}
      {showAndroidGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-3xl bg-[#141620] p-6 border border-white/10 shadow-2xl flex flex-col items-center text-center gap-4">
            <div className="w-14 h-14 bg-pink-500/10 rounded-full flex items-center justify-center">
              <Download size={26} className="text-pink-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white mb-2">অ্যাপ ইনস্টল করুন</h3>
              <p className="text-xs text-white/70 leading-relaxed">
                ১. ব্রাউজারের উপরে ডানদিকের <strong>তিনটি ডট (⋮)</strong> মেন্যুতে চাপুন।<br/>
                ২. <strong>Install app</strong> অথবা <strong>Add to Home Screen</strong> চাপুন।
              </p>
            </div>
            <button
              onClick={() => setShowAndroidGuide(false)}
              className="w-full py-2.5 rounded-xl bg-white/10 hover:bg-white/20 transition-colors text-white text-sm font-medium cursor-pointer"
            >
              ঠিক আছে
            </button>
          </div>
        </div>
      )}

      {/* Video Background */}
      {videoSrc && (
        <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden bg-black flex items-center justify-center">
          <video 
            src={videoSrc}
            autoPlay
            loop
            muted={true}
            playsInline
            className="absolute inset-0 w-full h-full object-cover opacity-40 blur-2xl scale-110"
          />
          <video 
            src={videoSrc}
            autoPlay
            loop
            muted={true}
            playsInline
            className="relative w-full h-full object-contain opacity-90 z-10"
          />
        </div>
      )}

      {/* Top Header (Matches Screenshot: Hamburger Menu on Left, ZARA PERSONAL AI in Center, Avatar on Right) */}
      <header className="w-full flex items-center justify-between px-3 py-2 z-30 shrink-0 max-w-md mx-auto">
        <button
          onClick={() => setShowJaraMainSettings(true)}
          className="w-10 h-10 rounded-2xl flex items-center justify-center text-white/80 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
          title="Menu / Settings"
          aria-label="Menu"
        >
          <Menu size={22} />
        </button>

        <div 
          className="flex flex-col items-center select-none cursor-pointer" 
          onClick={() => setShowJaraMainSettings(true)}
        >
          <span className="text-sm font-black tracking-[0.3em] uppercase bg-gradient-to-r from-cyan-300 via-blue-400 to-cyan-100 bg-clip-text text-transparent drop-shadow-[0_0_10px_rgba(34,211,238,0.5)]">
            ZARA
          </span>
          <span className="text-[9px] font-bold tracking-[0.24em] text-cyan-400/60 uppercase">
            PERSONAL AI
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Home Screen Mode Simulation Toggle */}
          <button
            onClick={() => setIsHomeScreenMode(true)}
            className="px-2.5 py-1 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 hover:text-cyan-200 transition-all text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-sm active:scale-95"
            title="হোম স্ক্রিন ফ্লোটিং বাবল মোড দেখুন"
          >
            <Layers size={13} />
            <span className="hidden sm:inline">হোম স্ক্রিন</span>
          </button>

          <button
            onClick={() => setShowSettings(true)}
            className="w-8 h-8 rounded-full overflow-hidden border border-cyan-400/80 shadow-[0_0_12px_rgba(34,211,238,0.6)] hover:scale-105 transition-transform cursor-pointer"
            title="Account / Profile"
            aria-label="Account Profile"
          >
            <img src={idleAvatar} alt="Zara Profile" className="w-full h-full object-cover object-top" />
          </button>
        </div>
      </header>

      {/* Greeting & Streak Row (Matches Screenshot: 'Good evening, Jaanu😍 ✨' and '🔥 6') */}
      <div className="w-full flex items-center justify-between px-4 pt-0.5 pb-1 z-30 shrink-0 max-w-md mx-auto">
        <div>
          <h1 className="text-base sm:text-lg font-bold text-white flex items-center gap-1.5 tracking-tight">
            <span>{greetingTime}, {config?.ownerName ? config.ownerName : "Jaanu"}😍</span>
            <span className="text-amber-300 text-sm">✨</span>
          </h1>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className={`w-2 h-2 rounded-full ${isSessionActive ? "bg-emerald-400 animate-ping" : "bg-cyan-400/80"}`} />
            <p className="text-[11px] text-white/50">
              {isSessionActive 
                ? (appState === "speaking" ? "Talking with you..." : appState === "listening" ? "Listening to you..." : "Ready when you are") 
                : "Ready when you are"}
            </p>
          </div>
        </div>

        {/* Streak Badge */}
        <div className="flex items-center gap-1 px-3 py-1 rounded-full bg-[#171422]/90 border border-amber-500/35 text-amber-300 text-xs font-bold shadow-lg shadow-amber-950/20">
          <span className="text-sm">🔥</span>
          <span>6</span>
        </div>
      </div>

      {/* Main Content Area - 3D Companion Character Stage */}
      <main className="flex-1 w-full flex flex-col items-center justify-center px-1 sm:px-2 relative z-10 max-w-lg mx-auto overflow-visible py-0">
        {/* Active Command Execution Result Live Card if active */}
        <AnimatePresence>
          {activeCommandResult && (
            <motion.div
              initial={{ opacity: 0, y: 15, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -15, scale: 0.95 }}
              className="w-full max-w-[340px] mb-2 p-3 rounded-2xl bg-[#0e1424]/95 border border-cyan-500/40 backdrop-blur-md shadow-2xl shadow-cyan-500/20 relative z-30"
            >
              <button
                onClick={() => setActiveCommandResult(null)}
                className="absolute top-2.5 right-2.5 text-white/40 hover:text-white p-1 rounded-full cursor-pointer"
              >
                <X size={14} />
              </button>

              <div className="flex items-center gap-2 mb-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                  <span className="text-cyan-400">⚡</span>
                  {activeCommandResult.commandName}
                </h4>
              </div>
              <p className="text-[11px] text-cyan-200/90 leading-tight">
                {activeCommandResult.spokenFeedback}
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Active Generation Progress Card if active */}
        <AnimatePresence>
          {generationProgress.active && (
            <motion.div
              initial={{ opacity: 0, y: 15, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -15, scale: 0.95 }}
              className="w-full max-w-[340px] mb-2 p-3 rounded-2xl bg-[#121524]/95 border border-indigo-500/40 backdrop-blur-md shadow-2xl z-30"
            >
              <div className="flex items-center gap-2.5 mb-1.5">
                <div className="w-7 h-7 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
                  <Sparkles size={15} />
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-white">AI Media Generation</h4>
                  <p className="text-[10px] text-white/50 truncate max-w-[200px]">{generationProgress.prompt}</p>
                </div>
              </div>
              <div className="text-[10px] text-emerald-400 flex items-center gap-1.5">
                <Loader2 size={11} className="animate-spin" />
                <span>{generationProgress.step}</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Interactive 3D Companion Character (Completely borderless, fresh dark cosmic space) */}
        <ZaraLiveCompanion
          appState={appState}
          isSessionActive={isSessionActive}
          isMicHearing={isMicHearing}
          audioIntensity={audioIntensity}
          currentMood="Happy"
          latestText={latestMessage?.text}
          onTapCompanion={handleCompanionPoke}
        />

        {/* Dynamic Color Waves Visualizer Syncing with Assistant Audio Intensity */}
        <div className="w-full max-w-[360px] mx-auto -mt-3 mb-1 px-2 z-20 transition-all duration-300">
          <Visualizer
            state={appState}
            audioIntensity={audioIntensity}
            height={isSessionActive || appState === "speaking" ? 75 : 55}
          />
        </div>

        {/* Live Subtitle / Latest Speech Bubble */}
        <AnimatePresence>
          {latestMessage && (
            <motion.div
              initial={{ opacity: 0, y: 8, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.95 }}
              className="w-full max-w-[340px] bg-[#0d101e]/85 border border-white/10 rounded-2xl px-3.5 py-2 backdrop-blur-md shadow-xl flex items-start gap-2.5 z-20 mt-1"
            >
              <div className={`w-2 h-2 rounded-full mt-1 shrink-0 ${latestMessage.sender === 'user' ? 'bg-cyan-400' : 'bg-pink-400'}`} />
              <div className="flex-1 min-w-0">
                <span className="text-[10px] uppercase tracking-wider font-semibold text-white/50 block mb-0.5">
                  {latestMessage.sender === 'user' ? 'আপনি' : 'জারা (Zara)'}
                </span>
                <p className="text-xs text-white/90 leading-relaxed line-clamp-2">
                  {latestMessage.text}
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Elevated Prominent Voice Speaking Action Button (Easy thumb reach above bottom bars) */}
        <div className="w-full max-w-[340px] flex items-center justify-center pt-2 pb-1 z-30">
          <motion.button
            whileTap={{ scale: 0.96 }}
            type="button"
            onClick={toggleListening}
            className={`w-full py-2.5 px-4 rounded-2xl flex items-center justify-between transition-all duration-300 cursor-pointer shadow-xl border ${
              isSessionActive
                ? "bg-gradient-to-r from-pink-600 via-rose-600 to-pink-500 border-pink-300 text-white shadow-[0_0_28px_rgba(244,63,94,0.85)] animate-pulse"
                : "bg-gradient-to-r from-[#d9226e] via-[#e11d48] to-[#be185d] hover:from-[#f43f5e] hover:to-[#e11d48] border-pink-400/50 text-white shadow-[0_0_20px_rgba(217,34,110,0.55)] hover:shadow-[0_0_25px_rgba(244,63,94,0.7)]"
            }`}
            title={isSessionActive ? "কথোপকথন থামাতে ট্যাপ করুন" : "কথা বলতে ট্যাপ করুন"}
            aria-label="ভয়েস বাটন"
          >
            <div className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 shadow-md ${
                isSessionActive ? "bg-white text-pink-600 animate-bounce" : "bg-white/20 text-white"
              }`}>
                <Mic size={17} />
              </div>
              <div className="text-left">
                <span className="text-xs sm:text-sm font-bold block leading-tight">
                  {isSessionActive ? "জারা শুনছে... বলুন!" : "কথা বলতে এখানে চাপ দিন"}
                </span>
                <span className="text-[10px] text-pink-200/85 leading-tight">
                  {isSessionActive ? "কথা শেষ হলে থামাতে চাপুন" : "সরাসরি বাংলায় ভয়েস কথোপকথন (Voice On)"}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              {isSessionActive ? (
                <span className="flex h-3 w-3 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-pink-200 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-white"></span>
                </span>
              ) : (
                <span className="text-[11px] bg-white/20 px-2 py-0.5 rounded-full font-semibold text-white shadow-sm">
                  🎙️ ভয়েস অন
                </span>
              )}
            </div>
          </motion.button>
        </div>
      </main>

      {/* Bottom Section - Exact match to user-provided UI (IMG_20260929_165029.jpg) */}
      <footer className="w-full flex flex-col items-center gap-2 z-30 shrink-0 max-w-md mx-auto px-3 pb-3">
        {/* Row 1: 4 Quick Feature Cards (Music, Study, Vent, Photo) */}
        <div className="w-full grid grid-cols-4 gap-2">
          {/* Music */}
          <button
            onClick={() => {
              handleTextCommand("একটি মিষ্টি বাংলা গান শোনাও বা মিউজিক প্লে করো");
            }}
            className="flex flex-col sm:flex-row items-center justify-center gap-1.5 py-2.5 px-1.5 rounded-2xl bg-[#090b16]/95 hover:bg-[#121626] border border-[#44203e] text-white/90 transition-all text-xs font-semibold cursor-pointer shadow-md active:scale-95"
            title="Music"
          >
            <span className="text-sm">🎵</span>
            <span className="text-xs font-semibold">Music</span>
          </button>

          {/* Study */}
          <button
            onClick={() => setShowTopicModal(true)}
            className="flex flex-col sm:flex-row items-center justify-center gap-1.5 py-2.5 px-1.5 rounded-2xl bg-[#090b16]/95 hover:bg-[#121626] border border-[#44203e] text-white/90 transition-all text-xs font-semibold cursor-pointer shadow-md active:scale-95"
            title="Study"
          >
            <span className="text-sm">📚</span>
            <span className="text-xs font-semibold">Study</span>
          </button>

          {/* Vent */}
          <button
            onClick={() => {
              handleTextCommand("জারা, আমার মনটা একটু খারাপ, তোমার সাথে গল্প করতে চাই");
            }}
            className="flex flex-col sm:flex-row items-center justify-center gap-1.5 py-2.5 px-1.5 rounded-2xl bg-[#090b16]/95 hover:bg-[#121626] border border-[#44203e] text-white/90 transition-all text-xs font-semibold cursor-pointer shadow-md active:scale-95"
            title="Vent"
          >
            <span className="text-sm">💖</span>
            <span className="text-xs font-semibold">Vent</span>
          </button>

          {/* Photo */}
          <button
            onClick={() => {
              setAiGenInitialTab("menu");
              setShowAiGenModal(true);
            }}
            className="flex flex-col sm:flex-row items-center justify-center gap-1.5 py-2.5 px-1.5 rounded-2xl bg-[#090b16]/95 hover:bg-[#121626] border border-[#44203e] text-white/90 transition-all text-xs font-semibold cursor-pointer shadow-md active:scale-95"
            title="Photo"
          >
            <span className="text-sm">📸</span>
            <span className="text-xs font-semibold">Photo</span>
          </button>
        </div>

        {/* Row 2: 3 Info Cards (WEATHER: ২৮° নারায়ণগঞ্জ, TODAY: ২৯ ২৯ Sep মঙ্গল, MOOD: 💖 খুশি) */}
        <div className="w-full grid grid-cols-3 gap-2">
          {/* WEATHER Card */}
          <div 
            onClick={() => handleTextCommand("নারায়ণগঞ্জের বর্তমান আবহাওয়া কেমন?")}
            className="p-2.5 rounded-2xl bg-[#090b16]/95 border border-[#44203e] flex flex-col justify-between shadow-md cursor-pointer hover:border-[#ff3e6c]/50 transition-colors"
          >
            <span className="text-[10px] font-bold text-white/45 tracking-wider uppercase">WEATHER</span>
            <span className="text-lg sm:text-xl font-bold text-white my-0.5">২৮°</span>
            <span className="text-[11px] text-white/40">নারায়ণগঞ্জ</span>
          </div>

          {/* TODAY Card (Click to open Daily Affirmation) */}
          <div 
            onClick={() => setShowDailyAffirmation(true)}
            className="p-2.5 rounded-2xl bg-[#090b16]/95 border border-[#44203e] flex flex-col justify-between shadow-md cursor-pointer hover:border-[#ff3e6c]/50 transition-colors group"
            title="আজকের অনুপ্রেরণা (Affirmation of the Day) দেখতে ট্যাপ করুন"
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-white/45 tracking-wider uppercase">TODAY</span>
              <span className="text-[9px] text-pink-400 group-hover:scale-105 transition-transform">✨ বার্তা</span>
            </div>
            <span className="text-lg sm:text-xl font-bold text-white my-0.5">{todayDateBn}</span>
            <span className="text-[11px] text-white/40">{todayFullBn}</span>
          </div>

          {/* MOOD Card (Dynamic Ambient Light Reflection) */}
          <div 
            onClick={() => handleTextCommand("জারা তুমি কেমন আছ? তোমার মন কেমন?")}
            className="p-2.5 rounded-2xl bg-[#090b16]/95 border border-[#44203e] flex flex-col justify-between shadow-md cursor-pointer hover:border-[#ff3e6c]/50 transition-colors group"
            title="জারার বর্তমান অনুভূতি ও মেজাজ"
          >
            <span className="text-[10px] font-bold text-white/45 tracking-wider uppercase">MOOD</span>
            <div className="my-1 flex items-center gap-1.5 transition-all">
              <span className="text-base group-hover:scale-110 transition-transform">{ambientTheme.moodEmoji}</span>
              <span className="text-sm font-bold text-white/95">{ambientTheme.moodText}</span>
            </div>
          </div>
        </div>

        {/* Quick Sassy & Sweet Phrases Carousel (Trigger Zara's voice without typing) */}
        <div className="w-full flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5 px-0.5">
          <button
            type="button"
            onClick={() => setShowQuickPhrases(true)}
            className="px-2.5 py-1 rounded-xl bg-gradient-to-r from-pink-500/25 to-purple-500/25 hover:from-pink-500/35 hover:to-purple-500/35 border border-pink-500/40 text-[11px] font-semibold text-pink-300 flex items-center gap-1 shrink-0 cursor-pointer shadow-sm active:scale-95 transition-all"
            title="সব কুইক কথা খুলুন"
          >
            <Sparkles size={12} className="text-pink-400" />
            <span>⚡ কুইক কথা</span>
          </button>

          {[
            { text: "তুমি এত সুন্দর কেন?", emoji: "😉" },
            { text: "আজকে কি ড্রামা কুইন মুড?", emoji: "💅" },
            { text: "তোমাকে খুব ভালো লাগে!", emoji: "💖" },
            { text: "একটা মিষ্টি কবিতা শোনাও", emoji: "📜" },
            { text: "মনটা একটু খারাপ...", emoji: "🌧️" },
          ].map((item, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleTextCommand(item.text)}
              className="px-2.5 py-1 rounded-xl bg-[#090b16]/90 hover:bg-[#15192c] border border-white/10 hover:border-pink-500/30 text-[11px] text-white/80 hover:text-white whitespace-nowrap shrink-0 cursor-pointer transition-all active:scale-95 flex items-center gap-1 shadow-sm"
              title="এই কথাটি জারার কাছে পাঠান"
            >
              <span>{item.emoji}</span>
              <span>{item.text}</span>
            </button>
          ))}
        </div>

        {/* Row 3: Bengali Speech Input Bar (Speaker Icon + "জারাকে বাংলায় কিছু বলুন..." + Pink Mic Button) */}
        <form
          onSubmit={handleTextSubmit}
          className="w-full flex items-center justify-between p-2 pl-3 pr-2 rounded-2xl bg-[#090b16]/95 border border-[#44203e] shadow-xl backdrop-blur-md"
        >
          <div className="flex items-center gap-2 flex-1 min-w-0 mr-2">
            <button
              type="button"
              onClick={() => setShowQuickPhrases(true)}
              className="p-1 rounded-lg text-pink-400 hover:text-pink-300 hover:bg-pink-500/10 cursor-pointer transition-colors shrink-0"
              title="কুইক কথা ও স্যাসি রেসপন্স"
            >
              <Sparkles size={16} />
            </button>
            <input
              type="text"
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              placeholder="জারাকে বাংলায় কিছু বলুন..."
              className="w-full bg-transparent border-none outline-none text-white placeholder:text-white/45 text-xs sm:text-sm font-sans"
            />
          </div>

          <button
            type="button"
            onClick={toggleListening}
            className={`w-9 h-9 rounded-full flex items-center justify-center text-white transition-all cursor-pointer shrink-0 shadow-lg ${
              isSessionActive
                ? "bg-gradient-to-r from-pink-500 to-rose-600 animate-pulse shadow-[0_0_15px_#ff3e6c]"
                : "bg-[#d9226e] hover:bg-[#e11d48] shadow-[0_0_12px_rgba(217,34,110,0.5)] active:scale-95"
            }`}
            title={isSessionActive ? "মাইক্রোফোন বন্ধ করুন" : "মাইক্রোফোন চালু করুন"}
            aria-label="Voice Input Button"
          >
            <Mic size={17} className="text-white" />
          </button>
        </form>

        {/* Row 4: Bottom Navigation Bar (Home, Vision, Glowing 🎙️ Orb, Memory, Settings) */}
        <div className="w-full relative pt-2 pb-1">
          {/* Dock Pill Container */}
          <div className="w-full h-15 rounded-3xl bg-[#090b16]/95 border border-[#44203e] backdrop-blur-xl flex items-center justify-between px-6 shadow-2xl">
            {/* Home */}
            <button
              onClick={() => {}}
              className="flex flex-col items-center gap-0.5 text-[#ec4899] font-semibold cursor-pointer transition-colors"
              title="Home"
            >
              <span className="text-lg">🏠</span>
              <span className="text-[11px] font-semibold">Home</span>
            </button>

            {/* Vision */}
            <button
              onClick={() => setShowScreenModal(true)}
              className="flex flex-col items-center gap-0.5 text-white/60 hover:text-white cursor-pointer transition-colors mr-7"
              title="Vision"
            >
              <span className="text-lg">👁️</span>
              <span className="text-[11px]">Vision</span>
            </button>

            {/* Memory */}
            <button
              onClick={() => setShowHistoryModal(true)}
              className="flex flex-col items-center gap-0.5 text-white/60 hover:text-white cursor-pointer transition-colors ml-7"
              title="Memory"
            >
              <span className="text-lg">🧠</span>
              <span className="text-[11px]">Memory</span>
            </button>

            {/* Settings */}
            <button
              onClick={() => setShowJaraMainSettings(true)}
              className="flex flex-col items-center gap-0.5 text-white/60 hover:text-white cursor-pointer transition-colors"
              title="Settings"
            >
              <Settings size={20} className="text-[#38bdf8]" />
              <span className="text-[11px]">Settings</span>
            </button>
          </div>

          {/* Elevated Center Glowing Vintage Microphone Orb */}
          <div className="absolute left-1/2 -top-2.5 -translate-x-1/2 z-40">
            <button
              onClick={toggleListening}
              className={`w-14 h-14 rounded-full p-1 flex items-center justify-center relative cursor-pointer group transition-all duration-300 hover:scale-105 active:scale-95 ${
                isSessionActive
                  ? "shadow-[0_0_30px_rgba(255,62,108,0.9)]"
                  : "shadow-[0_0_20px_rgba(255,62,108,0.65)]"
              }`}
              title={isSessionActive ? "কথোপকথন থামাতে ট্যাপ করুন" : "কথা বলতে ট্যাপ করুন"}
              aria-label="Voice Activation Mic Orb"
            >
              {/* Outer Glowing Border Ring */}
              <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-[#ff3e6c] via-[#ff6b8b] to-[#ff477e] opacity-90 blur-[2px]" />

              {/* Pulsing Active Ring */}
              {isSessionActive && (
                <motion.div
                  animate={{ scale: [1, 1.4, 1], opacity: [0.8, 0, 0.8] }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: "easeOut" }}
                  className="absolute -inset-1 rounded-full border-2 border-pink-400 pointer-events-none"
                />
              )}

              {/* Inner Gradient Circle */}
              <div className="relative w-full h-full rounded-full bg-gradient-to-b from-[#ff5376] to-[#e6195e] flex items-center justify-center shadow-inner border border-white/20">
                <span className="text-2xl filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]">🎙️</span>
              </div>
            </button>
          </div>
        </div>
      </footer>

      {/* History Drawer Modal */}
      {showHistoryModal && (
        <div 
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4"
          onClick={() => setShowHistoryModal(false)}
        >
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 40 }}
            className="w-full max-w-lg bg-[#141620] border border-white/10 rounded-t-[28px] sm:rounded-3xl max-h-[85dvh] flex flex-col overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header & Tab Switcher */}
            <div className="p-3.5 border-b border-white/10 flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 p-1 rounded-xl bg-black/40 border border-white/10">
                <button
                  type="button"
                  onClick={() => setHistoryModalTab("chat")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                    historyModalTab === "chat"
                      ? "bg-gradient-to-r from-pink-500/30 to-purple-500/30 border border-pink-500/50 text-white shadow-sm"
                      : "text-white/60 hover:text-white"
                  }`}
                >
                  <MessageSquare size={13} className="text-pink-400" />
                  <span>চ্যাট স্মৃতি</span>
                </button>

                <button
                  type="button"
                  onClick={() => setHistoryModalTab("mood")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                    historyModalTab === "mood"
                      ? "bg-gradient-to-r from-cyan-500/30 to-blue-500/30 border border-cyan-500/50 text-white shadow-sm"
                      : "text-white/60 hover:text-white"
                  }`}
                >
                  <TrendingUp size={13} className="text-cyan-400" />
                  <span>মুড ট্রেন্ড গ্রাফ</span>
                </button>
              </div>

              <button
                onClick={() => setShowHistoryModal(false)}
                className="text-xs text-white/60 hover:text-white px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 transition-colors cursor-pointer"
              >
                বন্ধ করুন
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {historyModalTab === "mood" ? (
                <MoodHistoryChart
                  history={moodHistory}
                  onClearHistory={() => {
                    setMoodHistory([]);
                    localStorage.removeItem("zara_mood_history");
                  }}
                />
              ) : messages.length === 0 ? (
                <div className="text-center py-12 text-white/40 text-xs">
                  এখনো কোনো কথোপকথন শুরু হয়নি। জারার সাথে কথা বলুন!
                </div>
              ) : (
                messages.map((m) => (
                  <div
                    key={m.id}
                    className={`flex flex-col ${m.sender === "user" ? "items-end" : "items-start"}`}
                  >
                    <span className="text-[10px] text-white/40 mb-1 px-1">
                      {m.sender === "user" ? "আপনি" : "জারা"}
                    </span>
                    <div
                      className={`max-w-[85%] px-3.5 py-2.5 rounded-2xl text-xs sm:text-sm leading-relaxed ${
                        m.sender === "user"
                          ? "bg-violet-600/30 border border-violet-500/30 text-white rounded-br-none"
                          : "bg-pink-600/20 border border-pink-500/30 text-pink-50 rounded-bl-none"
                      }`}
                    >
                      {m.text}
                    </div>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        </div>
      )}

      {/* Screen Viewing Modal */}
      {showScreenModal && (
        <ScreenViewingModal
          config={config}
          onSaveConfig={handleConfigComplete}
          onClose={() => setShowScreenModal(false)}
        />
      )}

      {/* SMS Auto-Reply Modal */}
      {showSmsModal && (
        <SmsAutoReplyModal
          config={config}
          onSaveConfig={handleConfigComplete}
          onClose={() => setShowSmsModal(false)}
        />
      )}

      {/* Sleep Mode Modal */}
      {showSleepModal && (
        <SleepModeModal
          config={config}
          onSaveConfig={handleConfigComplete}
          onClose={() => setShowSleepModal(false)}
        />
      )}

      {/* Topic & Script Focus Modal */}
      {showTopicModal && (
        <TopicScriptModal
          assistantName={config?.assistantName || "Zara"}
          currentTopic={config?.activeTopicOrScript || ""}
          onSave={handleUpdateTopic}
          onClose={() => setShowTopicModal(false)}
        />
      )}

      {/* Voice Selection Modal */}
      {showVoiceModal && (
        <VoiceSelectorModal
          assistantName={config?.assistantName || "Zara"}
          currentVoice={config?.voiceName || "Kore"}
          onSelectVoice={handleSelectVoice}
          onClose={() => setShowVoiceModal(false)}
        />
      )}

      {/* JARA Main Settings Modal (Matches 1st Screen in Screenshot) */}
      {showJaraMainSettings && (
        <JaraSettingsMainModal
          config={config}
          onOpenGeminiLiveApi={() => {
            setShowJaraMainSettings(false);
            setShowGeminiLiveApiModal(true);
          }}
          onOpenAiGeneration={() => {
            setShowJaraMainSettings(false);
            setAiGenInitialTab("menu");
            setShowAiGenModal(true);
          }}
          onOpenVoiceSelector={() => {
            setShowJaraMainSettings(false);
            setShowVoiceModal(true);
          }}
          onOpenPermissions={() => {
            setShowJaraMainSettings(false);
            setShowPermissionSetup(true);
          }}
          onOpenCommandManager={() => {
            setShowJaraMainSettings(false);
            setShowCommandManager(true);
          }}
          onOpenHistory={() => {
            setShowJaraMainSettings(false);
            setShowHistoryModal(true);
          }}
          onOpenAccountProfile={() => {
            setShowJaraMainSettings(false);
            setShowSettings(true);
          }}
          onOpenScreenViewing={() => {
            setShowJaraMainSettings(false);
            setShowScreenModal(true);
          }}
          onOpenSmsAutoReply={() => {
            setShowJaraMainSettings(false);
            setShowSmsModal(true);
          }}
          onOpenSleepMode={() => {
            setShowJaraMainSettings(false);
            setShowSleepModal(true);
          }}
          onOpenTopicScript={() => {
            setShowJaraMainSettings(false);
            setShowTopicModal(true);
          }}
          showFloatingOverlay={showFloatingOverlay || isHomeScreenMode}
          onToggleFloatingOverlay={() => {
            setShowJaraMainSettings(false);
            setIsHomeScreenMode(true);
          }}
          onClearMemory={() => {
            if (confirm("আপনি কি নিশ্চিত যে জারার সাথে সব কথোপকথন ও স্মৃতি মুছে ফেলতে চান?")) {
              setMessages([]);
              resetZaraSession();
              localStorage.removeItem("zara_chat_history");
              localStorage.removeItem("zoya_chat_history");
            }
          }}
          onClose={() => setShowJaraMainSettings(false)}
        />
      )}

      {/* Gemini Live API Dedicated Modal (Directly sets and activates Live AI API) */}
      {showGeminiLiveApiModal && (
        <GeminiLiveApiModal
          config={config}
          onSave={handleConfigComplete}
          onClose={() => setShowGeminiLiveApiModal(false)}
        />
      )}

      {/* App-level Password Auth Modal for commands and sensitive settings */}
      {appPasswordModal?.isOpen && (
        <PasswordAuthModal
          title={appPasswordModal.title}
          onSuccess={() => {
            const action = appPasswordModal.onSuccess;
            setAppPasswordModal(null);
            action();
          }}
          onClose={() => setAppPasswordModal(null)}
        />
      )}

      {/* Command Manager Modal (Matches 2nd & 3rd Panels in User Infographic) */}
      {showCommandManager && (
        <CommandManagerModal
          config={config}
          onClose={() => setShowCommandManager(false)}
          onExecuteCommandPreview={(res) => setActiveCommandResult(res)}
        />
      )}

      {/* Real Floating Zara Logo Overlay (Supports Home Screen, Background, Draggable, Up-Down Motion & Pulse Glow during TTS) */}
      {(showFloatingOverlay || isHomeScreenMode || appState === "speaking") && (
        <ZaraFloatingOverlay
          isSpeaking={appState === "speaking" || audioIntensity > 0.015}
          audioIntensity={audioIntensity}
          isHomeScreenMode={isHomeScreenMode}
          onToggleHomeScreenMode={() => setIsHomeScreenMode((prev) => !prev)}
          onOpenAssistant={() => {
            setIsHomeScreenMode(false);
          }}
          onTestSpeech={(text) => handleSpeakAffirmation(text)}
          enabled={true}
        />
      )}

      {/* AI Generation Settings Modal (Matches 2nd, 3rd, 4th, 7th, 8th, 11th, 12th screens) */}
      {showAiGenModal && (
        <AiGenerationSettingsModal
          config={config}
          onSaveConfig={handleConfigComplete}
          initialTab={aiGenInitialTab}
          onClose={() => setShowAiGenModal(false)}
          onTriggerGenerateFromOptions={async (opts) => {
            setGenerationProgress({
              active: true,
              type: "image",
              step: "Preparing...",
              prompt: opts.prompt,
            });
            try {
              const res = await generateAiImage(
                opts,
                config.imageApiConfig,
                (step) => setGenerationProgress((p) => ({ ...p, step }))
              );
              const newItem: GenerationHistoryItem = {
                id: Date.now().toString(),
                prompt: opts.prompt,
                type: "image",
                mediaUrl: res.url,
                provider: res.provider,
                model: res.model,
                timestamp: Date.now(),
                dateStr: "Just now",
                aspectRatio: opts.aspectRatio,
                style: opts.style,
              };
              saveGenerationToHistory(newItem);
              setGenerationProgress((p) => ({ ...p, active: false }));
              setActiveGeneratedMedia(newItem);
            } catch (e) {
              setGenerationProgress((p) => ({ ...p, active: false }));
            }
          }}
        />
      )}

      {/* Generated Media Viewer Modal (Matches 6th & 10th screens with Save, Share, Regenerate, Edit Prompt) */}
      {activeGeneratedMedia && (
        <GeneratedMediaViewerModal
          item={activeGeneratedMedia}
          onClose={() => setActiveGeneratedMedia(null)}
          onRegenerate={() => {
            const prompt = activeGeneratedMedia.prompt;
            setActiveGeneratedMedia(null);
            handleTextCommand(activeGeneratedMedia.type === "video" ? `ভিডিও বানাও ${prompt}` : `ছবি তৈরি করো ${prompt}`);
          }}
          onEditPrompt={() => {
            const prompt = activeGeneratedMedia.prompt;
            setActiveGeneratedMedia(null);
            setTextInput(prompt);
            setShowTextInput(true);
          }}
        />
      )}

      {/* Daily Affirmation of the Day Modal (First open of each day & on demand) */}
      {showDailyAffirmation && (
        <DailyAffirmationModal
          affirmation={todayAffirmation}
          onClose={() => setShowDailyAffirmation(false)}
          onSpeak={handleSpeakAffirmation}
        />
      )}

      {/* Quick Phrases Overlay (Tap pre-defined sassy or sweet phrases) */}
      <QuickPhrasesOverlay
        isOpen={showQuickPhrases}
        onClose={() => setShowQuickPhrases(false)}
        onSelectPhrase={(phrase) => handleTextCommand(phrase)}
      />
    </div>
  );
}
