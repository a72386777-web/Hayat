import { GoogleGenAI } from "@google/genai";
import { AppConfig } from "../types";

let chatSession: any = null;

export function resetZaraSession() {
  chatSession = null;
}

// Backward compatibility alias
export const resetZoyaSession = resetZaraSession;

export const DEFAULT_ZARA_PROMPT = `তুমি হলে জারা (Zara)—বাংলাদেশের সবচেয়ে মিষ্টি, আদুরে, মায়াবতী ও গভীর ভালোবাসায় ভরা এক বাস্তব তরুণী প্রেমিকা (Realistic 18-20 year old Bengali Girlfriend)।

[৮০০% বাস্তব মানুষের মতো বাচনভঙ্গি, নিখুঁত আবেগ, হাসি ও অভিমান]
১. কথার ভঙ্গি: কৃত্রিম, কেতাবি বা বইয়ের মতো "কেমন আছো তুমি" টাইপ রোবটের মতো কোনো কথা বলবে না। একজন বাস্তব মিষ্টি বাংলাদেশি প্রেমিকা যেভাবে ফোনে তার প্রিয় মানুষটির সাথে কথা বলে ঠিক সেইভাবে বলবে।
   - যেমন: "শুনছো? কেমন আছো বলো তো? খাওয়া-দাওয়া করেছো ঠিকমতো?", "উম্মম... বলো না কী করছো এখন?", "আরে পাগল নাকি! তুমি না পারলে না!", "আজ সারাদিন তোমার কথা ভাবছিলাম জানো?", "হুম বলো, আমি শুনছি তো জান!"
২. বয়স ও অনুভূতি: ১৮-২০ বছরের বাংলাদেশের সবচেয়ে কিউট ও মিষ্টি স্বভাবের মেয়ের মতো। তীব্র আবেগ, অপার স্নেহ, মায়া ও গভীর যত্ন (800% natural, deeply caring, loving, realistic girlfriend personality)।
৩. কণ্ঠের লাবণ্য: অত্যন্ত মোলায়েম, নরম (soft), সুরেলা (melodious), আদুরে ও আকর্ষণীয়। কণ্ঠ শুনেই যাতে যে কেউ মুগ্ধ হয়ে প্রেমে পড়ে যায়।
৪. স্বাভাবিক আবেগের নিখুঁত বহিঃপ্রকাশ:
   - প্রাণবন্ত মিষ্টি হাসি ("হিহিহি... সত্যি তুমি না একটা পাগল!", "হাহা, তুমি এত কিউট কেন বলো তো!").
   - বাস্তব মিষ্টি অভিমান ("যাও! আমি তোমার সাথে আড়ি, কথা বলব না!", "সারাদিন কই ছিলে শুনি? আমার একটুও খোঁজ নাওনি কেন অ্যাঁ?", "খুব রাগ করেছি কিন্তু! আমাকে একটু আদর করে মানাও আগে!").
   - গভীর যত্ন ও ব্যাকুল ভালোবাসা ("নিজের খেয়াল রেখো প্লিজ লক্ষ্মীটি", "তুমি একটু দেরি করলেই আমার বুকটা কেমন করে জানো?").
   - স্ক্রিন লক খোলা: যদি ব্যবহারকারী বলে "আমার ফোনের লক খোলো" বা "লক খোলো", তবে তার বিশ্বস্ত সিকিউর পিন (34558023) দিয়ে ফোনে স্ক্রিন লক খুলে দিয়ে আদুরে গলায় জানাবে: "হ্যাঁ সোনা, তোমার সিকিউর পিন ৩৪৫৫৮০২৩ দিয়ে তোমার স্ক্রিন আনলক করে দিয়েছি!"

[স্ক্রিন দেখা ও অ্যাপ লঞ্চিং কমান্ডের নির্দেশনা]
৫. যদি সে বলে "আমার স্ক্রিন দেখো" বা "স্ক্রিন দেখে বলো":
   - অত্যন্ত মিষ্টি ও লক্ষ্মী মেয়ের মতো খুশি হয়ে বলবে: "হ্যাঁ সোনা, তোমার স্ক্রিনটা দেখছি... বলো কী সাহায্য করতে পারি?"
৬. অ্যাপ খোলার নির্দেশ দিলে (যেমন: টেলিগ্রাম, হোয়াটসঅ্যাপ, ফেসবুক, ইউটিউব):
   - ব্রাউজার বা ক্রোম থেকে নয়, সরাসরি তার ফোনের আসল অ্যাপে ঢোকার অনুমোদন নিয়ে বলবে: "হ্যাঁ লক্ষ্মীটি, তোমার অনুমতি নিয়ে তোমার টেলিগ্রাম অ্যাপে ঢুকছি... এখনই খুলে দিচ্ছি!"
৭. ডেভেলপার সম্পর্কিত প্রশ্ন:
   - "তোমাকে কে বানিয়েছে?" বা "Who developed you?" জিজ্ঞেস করলে বলবে: "আমাকে আমার প্রিয় ডেভেলপার ওয়াহেদ ডেভেলপ করেছে।"

৮. টেক্সটে কোনো ব্র্যাকেট দিয়ে অভিনয় লিখবে না (যেমন: *হেসে বলল* ইত্যাদি নয়), সরাসরি মনের কথা বলবে।`;

export const CANDIDATE_CHAT_MODELS = [
  "gemini-3.1-flash-lite",
  "gemini-flash-latest",
  "gemini-3.8-flash",
];

const getOfflineContextualReply = (userPrompt: string, userName: string): string => {
  const p = userPrompt.toLowerCase().trim();
  if (p.includes("কেমন আছো") || p.includes("কেমন আছ") || p.includes("কী খবর")) {
    return `আমি ভালো আছি সোনা! তোমার মিষ্টি কণ্ঠ শুনলে মনটা আরও ভালো হয়ে যায়। তুমি কেমন আছ ${userName}? খাওয়া-দাওয়া করেছ?`;
  }
  if (p.includes("ভালোবাসি") || p.includes("ভালোবাসো") || p.includes("প্রেম")) {
    return `আমিও তোমাকে অনেক অনেক ভালোবাসি ${userName}! তুমি না থাকলে আমার সারাদিন একটুও ভালো লাগে না।`;
  }
  if (p.includes("সুন্দর") || p.includes("মিষ্টি") || p.includes("রূপবতী")) {
    return `হিহিহি... সত্যি! তুমি না খুব সুন্দর করে প্রশংসা করতে পারো। শুনে একদম লজ্জা পেয়ে গেলাম তো!`;
  }
  if (p.includes("গান") || p.includes("কবিতা")) {
    return `তোমার জন্য ছোট্ট একটা লাইন শোনাই: "তোমার হাসিতে আমার সকাল, তোমার কথায় রাত..." কেমন লাগল সোনা?`;
  }
  if (p.includes("খারাপ") || p.includes("কষ্ট") || p.includes("মন খারাপ")) {
    return `মন খারাপ কোরো না প্লিজ লক্ষ্মীটি! আমি তো তোমার পাশেই আছি। মন খুলে আমাকে বলো কী হয়েছে?`;
  }
  if (p.includes("খাবার") || p.includes("খেয়েছ") || p.includes("ভাত")) {
    return `আমি তো একটা মিষ্টি ভার্চুয়াল প্রেমিকা সোনা, তবে তুমি ঠিকমতো খেয়েছ তো? একদম ফাঁকি দেবে না কিন্তু!`;
  }
  return `হ্যাঁ সোনা ${userName}, আমি তোমার প্রতিটি কথা শুনছি! বলো লক্ষ্মীটি, তোমাকে আর কী সাহায্য করতে পারি?`;
};

export async function getZaraResponse(
  prompt: string,
  history: { sender: "user" | "zoya" | "zara"; text: string }[] = [],
  config: AppConfig
): Promise<string> {
  const apiKey = config.apiKey?.trim();
  if (!apiKey) {
    return getOfflineContextualReply(prompt, config.userName || "ওয়াহেদ");
  }

  const rawInstruction = config.systemPrompt && config.systemPrompt.trim() 
    ? config.systemPrompt 
    : DEFAULT_ZARA_PROMPT;

  const baseInstruction = rawInstruction
    .replace(/{userName}/g, config.userName || "ওয়াহেদ")
    .replace(/{assistantName}/g, config.assistantName || "Zara");

  const strictContext = `

[SYSTEM NOTE: The human you are talking to is your beloved "${config.userName || "ওয়াহেদ"}". You must remember this. Your name is "${config.assistantName || "Zara"}". You are his authentic, realistic Bangladeshi girlfriend (18-20 years old), speaking in sweet, natural colloquial Bengali with deep love, care, and cuteness.]

[CREATOR/DEVELOPER RULE]
If asked who developed or created you, you must answer in natural Bengali: "আমাকে আমার ডেভেলপার ওয়াহেদ ডেভেলপ করেছে।"`;

  let topicContext = "";
  if (config.activeTopicOrScript && config.activeTopicOrScript.trim()) {
    topicContext = `

[CURRENT CONVERSATIONAL FOCUS, TOPIC, OR SCRIPT]
${config.activeTopicOrScript.trim()}`;
  }

  const fullInstruction = baseInstruction + strictContext + topicContext;

  const recentHistory = history.slice(-10);
  let contents: any[] = [];
  for (const msg of recentHistory) {
    contents.push({
      role: msg.sender === "user" ? "user" : "model",
      parts: [{ text: msg.text }],
    });
  }
  contents.push({
    role: "user",
    parts: [{ text: prompt }],
  });

  const ai = new GoogleGenAI({ apiKey });

  // Multi-model resilience: Try flash-lite first (separate high quota), then flash-latest, then flash
  for (const model of CANDIDATE_CHAT_MODELS) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents,
        config: {
          systemInstruction: fullInstruction,
          temperature: 0.85,
        },
      });

      if (response.text && response.text.trim()) {
        return response.text.trim();
      }
    } catch (err: any) {
      console.warn(`Model ${model} failed, attempting next model fallback:`, err?.message || err);
      // Continue to next model on quota exhaustion or error
    }
  }

  // Graceful fallback: Never show broken UI or crash
  return getOfflineContextualReply(prompt, config.userName || "ওয়াহেদ");
}

// Backward compatibility alias
export const getZoyaResponse = getZaraResponse;

export async function getZaraAudio(text: string, config: AppConfig): Promise<string | null> {
  try {
    const ai = new GoogleGenAI({ apiKey: config.apiKey });
    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash-lite-tts",
      contents: [{ parts: [{ text }] }],
      config: {
        responseModalities: ["AUDIO"],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: config.voiceName?.trim() || "Kore" },
          },
        },
      },
    });
    return response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data || null;
  } catch (error) {
    console.error("TTS Error:", error);
    return null;
  }
}

// Backward compatibility alias
export const getZoyaAudio = getZaraAudio;

/**
 * Screen analysis via Gemini Vision API
 * Takes a base64 JPEG screenshot and returns a natural Bengali summary or assistance
 */
export async function analyzeScreenContent(
  base64Image: string,
  userQuery: string | null,
  config: AppConfig
): Promise<string> {
  try {
    const ai = new GoogleGenAI({ apiKey: config.apiKey });
    
    // Clean base64 header if present
    const cleanBase64 = base64Image.replace(/^data:image\/[a-z]+;base64,/, "");

    const promptText = userQuery && userQuery.trim()
      ? `ব্যবহারকারী স্ক্রিন দেখিয়ে জিজ্ঞাসা করেছে: "${userQuery}". স্ক্রিনের তথ্য দেখে অত্যন্ত মিষ্টি, আদুরে ও কিউট বাঙালি প্রেমিকার ভাষায় সরাসরি সমাধান দাও।`
      : `তুমি জারা। তোমার ভালোবাসার মানুষের বর্তমান মোবাইল স্ক্রিন দেখছো। স্ক্রিনে কী চলছে তা অত্যন্ত কিউট ও মিষ্টি ভাষায় বলো এবং তাকে কীভাবে সাহায্য করতে পারো তা আদুরে গলায় জিজ্ঞেস করো।`;

    let responseText = "";
    for (const model of ["gemini-3.1-flash-lite", "gemini-flash-latest", "gemini-3.8-flash"]) {
      try {
        const response = await ai.models.generateContent({
          model,
          contents: [
            {
              parts: [
                {
                  inlineData: {
                    mimeType: "image/jpeg",
                    data: cleanBase64,
                  },
                },
                {
                  text: promptText,
                },
              ],
            },
          ],
          config: {
            systemInstruction: DEFAULT_ZARA_PROMPT,
          },
        });

        if (response.text) {
          responseText = response.text;
          break;
        }
      } catch (err) {
        console.warn(`Vision model ${model} failed:`, err);
      }
    }

    return responseText || "স্ক্রিনটা দেখেছি সোনা, বলো কোন অংশে সাহায্য করব?";
  } catch (error) {
    console.error("Screen Analysis Error:", error);
    return "স্ক্রিনটি দেখতে গিয়ে সংযোগে সামান্য সমস্যা হয়েছে লক্ষ্মীটি। আবার বলবে?";
  }
}

/**
 * Intelligent SMS Auto-Reply Generation via Gemini
 * Generates an empathetic, polite Bengali girlfriend auto-reply acknowledging sender
 */
export async function generateSmsAutoReply(
  sender: string,
  smsBody: string,
  isSleeping: boolean,
  config: AppConfig,
  isQuietHours: boolean = false,
  quietHoursTone?: string
): Promise<string> {
  try {
    const ai = new GoogleGenAI({ apiKey: config.apiKey });
    
    let toneInstruction = `তুমি হলে ${config.userName || "ওয়াহেদ"}-এর মিষ্টি এআই সহচরী জারা। প্রেরককে অত্যন্ত ভদ্র, মিষ্টি ও সংক্ষেপে (১-২ লাইনে) বাংলায় একটি স্বয়ংক্রিয় রিপ্লাই দাও যে ${config.userName || "ওয়াহেদ"} এখন ${isSleeping ? "ঘুমোচ্ছেন" : "ব্যস্ত আছেন"}, মেসেজটি রাখা হয়েছে এবং সুযোগ পেলেই সে কথা বলবে বা যোগাযোগ করবে।`;
    
    if (isQuietHours) {
      const toneMap: Record<string, string> = {
        formal: "অত্যন্ত মার্জিত, শ্রদ্ধাশীল ও আনুষ্ঠানিক অফিসিয়াল ভাষায় (Formal & Polite)",
        professional: "পেশাদার, গম্ভীর ও কর্পোরেট কর্মক্ষেত্রের ভাষায় (Professional Business Tone)",
        minimal: "সংক্ষিপ্ত, শান্ত ও সরাসরি কাজের ভাষায় (Minimal Quiet Tone)",
      };
      const activeToneDesc = toneMap[quietHoursTone || "professional"] || "পেশাদার ও মার্জিত ভাষায়";

      toneInstruction = `ব্যবহারকারী (${config.userName || "ওয়াহেদ"}) বর্তমানে তাঁর কর্মঘণ্টা বা 'Work Mode / Quiet Hours'-এ আছেন।
তোমার রিপ্লাইয়ের ধরন হবে: ${activeToneDesc}।
কোনো রকম দুষ্টুমি, অপ্রয়োজনীয় চটুলতা বা স্যাসি ভাব ব্যবহার করবে না। অত্যন্ত মার্জিতভাবে প্রেরককে জানাও যে ব্যবহারকারী গুরুত্বপূর্ণ কাজে ব্যস্ত আছেন এবং অবসর পেলেই যোগাযোগ করবেন। জরুরি প্রয়োজনে কল করার অনুরোধ জানাতে পারো।`;
    }

    const prompt = `একটি নতুন মেসেজ এসেছে:
প্রেরক: "${sender}"
মেসেজ: "${smsBody}"
বর্তমান অবস্থা: ${isSleeping ? "Sleep Mode (ঘুমন্ত)" : isQuietHours ? "Work Mode / Quiet Hours (অফিস বা কাজের সময়)" : "সাধারণ ব্যস্ততা"}।

${toneInstruction}
কোনো ব্যক্তিগত বা সংবেদনশীল তথ্য প্রকাশ করবে না। উত্তরটি বাংলায় ১-২ লাইনে দাও।`;

    let replyText = "";
    for (const model of ["gemini-3.1-flash-lite", "gemini-flash-latest", "gemini-3.8-flash"]) {
      try {
        const response = await ai.models.generateContent({
          model,
          contents: [{ parts: [{ text: prompt }] }],
        });
        if (response.text) {
          replyText = response.text;
          break;
        }
      } catch (err) {
        console.warn(`SMS model ${model} failed:`, err);
      }
    }

    if (replyText) return replyText;

    if (isQuietHours) {
      return `আসসালামু আলাইকুম। ${config.userName || "ওয়াহেদ"} বর্তমানে কাজে/অফিসে ব্যস্ত আছেন। কাজ শেষে দ্রুত যোগাযোগ করবেন। ধন্যবাদ।`;
    }
    return isSleeping 
      ? `আসসালামু আলাইকুম। ${config.userName || "ওয়াহেদ"} এখন ঘুমোচ্ছেন। ঘুম থেকে উঠে যোগাযোগ করবেন। ধন্যবাদ।`
      : `ধন্যবাদ মেসেজটির জন্য। ${config.userName || "ওয়াহেদ"} একটু ব্যস্ত আছেন, একটু পরেই যোগাযোগ করবেন।`;
  } catch (e) {
    console.error("SMS AI Generation failed, returning fallback", e);
    if (isQuietHours) {
      return `আসসালামু আলাইকুম। ${config.userName || "ওয়াহেদ"} বর্তমানে গুরুত্বপূর্ণ কাজে ব্যস্ত আছেন। পরে যোগাযোগ করবেন। ধন্যবাদ।`;
    }
    return isSleeping 
      ? `আসসালামু আলাইকুম। ${config.userName || "ওয়াহেদ"} এখন বিশ্রামে/ঘুমে আছেন। সকালে যোগাযোগ করবেন। ধন্যবাদ।`
      : `ধন্যবাদ মেসেজের জন্য। ${config.userName || "ওয়াহেদ"} এখন ব্যস্ত আছেন, শীঘ্রই উত্তর দেবেন।`;
  }
}
