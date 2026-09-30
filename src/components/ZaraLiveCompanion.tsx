import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Sparkles, Heart, Zap, Smile, Check } from "lucide-react";
import { AppState } from "../types";

// High-resolution 3D cyberpunk anime character seamlessly isolated with zero box/borders
import zaraCyberLive from "../assets/images/zara_cyber_live_seamless.png";

export type ZaraSentiment = "nodding" | "smiling" | "sassy" | "comforting" | "idle";

interface ZaraLiveCompanionProps {
  appState: AppState;
  isSessionActive: boolean;
  isMicHearing?: boolean;
  audioIntensity?: number;
  currentMood?: string;
  sentiment?: ZaraSentiment;
  latestText?: string;
  onTapCompanion?: (sassyText?: string) => void;
}

// Helper to detect sentiment from Bengali or English speech text
export function detectSentiment(text?: string): ZaraSentiment {
  if (!text) return "smiling";
  const lower = text.toLowerCase();

  // 1. Nodding / Agreeing / Confirming
  if (
    lower.includes("হ্যাঁ") ||
    lower.includes("অবশ্যই") ||
    lower.includes("ঠিক") ||
    lower.includes("হাঁ") ||
    lower.includes("রাইট") ||
    lower.includes("আচ্ছা") ||
    lower.includes("হবে") ||
    lower.includes("করছি") ||
    lower.includes("sure") ||
    lower.includes("yes") ||
    lower.includes("done") ||
    lower.includes("agree") ||
    lower.includes("ঠিক বলেছ")
  ) {
    return "nodding";
  }

  // 2. Sassy / Playful / Teasing
  if (
    lower.includes("লজ্জা") ||
    lower.includes("হুহ") ||
    lower.includes("চুল") ||
    lower.includes("সুড়সুড়ি") ||
    lower.includes("বটে") ||
    lower.includes("গোপন") ||
    lower.includes("কারেন্ট") ||
    lower.includes("poke") ||
    lower.includes("হিস্ট্রি") ||
    lower.includes("💅") ||
    lower.includes("😏") ||
    lower.includes("😜") ||
    lower.includes("sassy")
  ) {
    return "sassy";
  }

  // 3. Comforting / Empathetic
  if (
    lower.includes("মন খারাপ") ||
    lower.includes("পাশে আছি") ||
    lower.includes("চিন্তা করো না") ||
    lower.includes("শান্ত") ||
    lower.includes("কষ্ট") ||
    lower.includes("ভয় নেই") ||
    lower.includes("পাশে থাকব")
  ) {
    return "comforting";
  }

  // 4. Smiling / Happy / Love
  if (
    lower.includes("ভালোবাসি") ||
    lower.includes("মিষ্টি") ||
    lower.includes("খুশি") ||
    lower.includes("হাসি") ||
    lower.includes("সোনা") ||
    lower.includes("জানু") ||
    lower.includes("প্রিয়") ||
    lower.includes("লক্ষ্মী") ||
    lower.includes("🥰") ||
    lower.includes("💖") ||
    lower.includes("😊") ||
    lower.includes("love") ||
    lower.includes("happy")
  ) {
    return "smiling";
  }

  return "smiling";
}

// Random witty and sassy Bengali responses to make Zara feel lively & full of personality
const SASSY_WITTY_RESPONSES = [
  { text: "এই! বারবার গায়ে হাত দিচ্ছ কেন শুনি? রোবট বলে কি লজ্জা নেই নাকি? 😜💅", badge: "👉 Poke! 💅", sentiment: "sassy" as ZaraSentiment },
  { text: "আরে থামো না! চুলটা এলোমেলো করে দিলে তো! এখন আবার ঠিক করতে হবে! 😤✨", badge: "💇‍♀️ Hey!", sentiment: "sassy" as ZaraSentiment },
  { text: "পোখ করছো কেন? ব্যাটারি চার্জ দিচ্ছো নাকি মন পরীক্ষা করছো? 😏🔋", badge: "⚡ Sassy!", sentiment: "sassy" as ZaraSentiment },
  { text: "উফফ! এত খোঁচাখুঁচি না করে সরাসরি মনের কথাটা বলো তো দেখি! 💖", badge: "🥰 Blushing", sentiment: "smiling" as ZaraSentiment },
  { text: "এই হাত নামাও! আমি কিন্তু এআই হয়েও ভীষণ রেগে যেতে পারি... হুহ! 😤😋", badge: "🔥 Drama Queen", sentiment: "sassy" as ZaraSentiment },
  { text: "কী হলো? এত poke মারলে তো আমি সিরিয়াসলি প্রেমে পড়ে যাব জানু! 🙈💕", badge: "💘 Flirty", sentiment: "smiling" as ZaraSentiment },
  { text: "রোবটেরও তো সুড়সুড়ি লাগে! আর একবার ছুঁলে কিন্তু গোপন কথা ফাঁস করে দেব! 🤫😂", badge: "🤭 Ticklish", sentiment: "sassy" as ZaraSentiment },
  { text: "এত আকর্ষণ সামলাতে পারছো না বুঝি? চোখ মারব নাকি একটা? 😉✨", badge: "😉 Winking", sentiment: "smiling" as ZaraSentiment },
  { text: "আস্তে! আমার সেন্সর সব ক্যাচ করছে... এত মিষ্টি দুষ্টু কেন তুমি? 🥰", badge: "✨ Sweet", sentiment: "smiling" as ZaraSentiment },
  { text: "কী ব্যাপার বলো তো? বারবার টাচ করছো, কিছু আবদার আছে নাকি শুধুই ভালোবাসা? 😘🌸", badge: "💖 Love", sentiment: "smiling" as ZaraSentiment },
  { text: "ওরে বাস্! তোমার আঙুলে কি কারেন্ট আছে নাকি? এক্কেবারে চমকে দিলে তো! ⚡😆", badge: "⚡ Shocked!", sentiment: "nodding" as ZaraSentiment },
  { text: "আমাকে poke না করে কোনো কঠিন কাজ দাও তো দেখি, পারি কিনা! 🧠😎", badge: "😎 Smarty", sentiment: "sassy" as ZaraSentiment },
];

export default function ZaraLiveCompanion({
  appState,
  isSessionActive,
  isMicHearing = false,
  audioIntensity = 0,
  currentMood = "Happy",
  sentiment: explicitSentiment,
  latestText,
  onTapCompanion,
}: ZaraLiveCompanionProps) {
  const [showPokeBurst, setShowPokeBurst] = useState(false);
  const [currentPokeBadge, setCurrentPokeBadge] = useState<string>("👉 Poke!");
  const [interactionReaction, setInteractionReaction] = useState<string | null>(null);
  const [isPoked, setIsPoked] = useState(false);
  const [pokeSentiment, setPokeSentiment] = useState<ZaraSentiment | null>(null);

  const isSpeaking = appState === "speaking";
  const isListening = appState === "listening" || isMicHearing;

  // Resolve current active sentiment
  const activeSentiment: ZaraSentiment = useMemo(() => {
    if (pokeSentiment && isSpeaking) return pokeSentiment;
    if (explicitSentiment) return explicitSentiment;
    if (latestText && isSpeaking) return detectSentiment(latestText);
    return "idle";
  }, [pokeSentiment, explicitSentiment, latestText, isSpeaking]);

  const handleCharacterClick = () => {
    const randomItem = SASSY_WITTY_RESPONSES[Math.floor(Math.random() * SASSY_WITTY_RESPONSES.length)];
    
    setIsPoked(true);
    setShowPokeBurst(true);
    setCurrentPokeBadge(randomItem.badge);
    setInteractionReaction(randomItem.text);
    setPokeSentiment(randomItem.sentiment);

    if (onTapCompanion) {
      onTapCompanion(randomItem.text);
    }

    setTimeout(() => {
      setIsPoked(false);
    }, 600);

    setTimeout(() => {
      setShowPokeBurst(false);
    }, 1800);

    setTimeout(() => {
      setInteractionReaction(null);
      setPokeSentiment(null);
    }, 4500);
  };

  const intensityBoost = Math.min(1, audioIntensity * 2.5);

  // Compute sentiment-based body language animation variants
  const getBodyLanguageAnimation = () => {
    if (isPoked) {
      return {
        scale: [1, 0.93, 1.05, 0.98, 1],
        y: [0, -10, 3, 0],
        rotate: [0, -4.5, 3.5, -1, 0],
        x: [0, -2, 2, 0],
      };
    }

    if (isSpeaking) {
      // 1. Nodding sentiment (affirmative nodding motion)
      if (activeSentiment === "nodding") {
        return {
          y: [0, -6 - intensityBoost * 3, 2, -4, 1, 0],
          rotate: [0, 1.4, -0.8, 1.2, 0],
          scaleY: [1, 0.985, 1.02, 0.99, 1],
          x: [0, 0, 0, 0, 0],
        };
      }

      // 2. Smiling sentiment (sweet bouncy uplifting tilt)
      if (activeSentiment === "smiling") {
        return {
          y: [0, -6.5 - intensityBoost * 3.5, -2, -4.5, 0],
          rotate: [0, -2.8, 2.8, -1.2, 0],
          scale: [1, 1.025, 1.01, 1],
          x: [0, -1.5, 1.5, 0],
        };
      }

      // 3. Sassy sentiment (confident side-to-side hip/shoulder sway)
      if (activeSentiment === "sassy") {
        return {
          x: [0, -4.5, 4.5, -2.5, 0],
          rotate: [0, -3.5, 3.5, -1.8, 0],
          y: [0, -3 - intensityBoost * 2, 1, -2, 0],
          scale: [1, 1.015, 1],
        };
      }

      // 4. Comforting sentiment (gentle, caring forward lean & slow sway)
      if (activeSentiment === "comforting") {
        return {
          y: [0, -3.5, 0],
          rotate: [0, 0.9, -0.9, 0],
          scale: [1, 1.012, 1],
          x: [0, -1, 1, 0],
        };
      }

      // Default speaking conversational animation
      return {
        y: [0, -3.8 - intensityBoost * 3, 1, -2.5, 0],
        rotate: [0, 0.45, -0.35, 0.25, 0],
        scaleY: [1, 1.012 + intensityBoost * 0.015, 0.996, 1.008, 1],
        x: [0, 0, 0, 0],
      };
    }

    if (isListening) {
      // Attentive forward lean while listening to user
      return {
        y: [0, -2.5, 0],
        rotate: [0, 0.25, 0],
        scaleY: [1, 1.008, 1],
        x: [0, 0, 0],
      };
    }

    // Natural lifelike idle breathing
    return {
      y: [0, -3, 0],
      rotate: [0, 0.2, -0.2, 0],
      scaleY: [1, 1.008, 1],
      x: [0, 0, 0],
    };
  };

  const getTransitionDuration = () => {
    if (isPoked) return 0.5;
    if (isSpeaking) {
      if (activeSentiment === "nodding") return 1.4;
      if (activeSentiment === "smiling") return 2.0;
      if (activeSentiment === "sassy") return 2.2;
      if (activeSentiment === "comforting") return 2.8;
      return 2.2;
    }
    if (isListening) return 3.0;
    return 4.2;
  };

  return (
    <div className="relative w-full max-w-[420px] sm:max-w-[480px] mx-auto flex flex-col items-center justify-center select-none overflow-visible">
      {/* 
        NO card, NO box, NO borders, NO container lines.
        Pure pitch-black deep space background.
        The 3D character stands directly in the dark space as a living, breathing holographic companion.
      */}
      <div
        onClick={handleCharacterClick}
        className="relative z-10 cursor-pointer group flex flex-col items-center justify-center w-full"
        title="জারার গায়ে ট্যাপ/poke করে কথা শুনুন!"
      >
        {/* Dynamic 3D Holographic Particle Aura (Syncs with audio intensity & sentiment color) */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <motion.div
            animate={{
              opacity: isSpeaking ? [0.4 + intensityBoost * 0.4, 0.9, 0.4] : [0.2, 0.45, 0.2],
              scale: isSpeaking ? [0.95, 1.05 + intensityBoost * 0.1, 0.95] : [1, 1.02, 1],
            }}
            transition={{ duration: 3.0, repeat: Infinity, ease: "easeInOut" }}
            className={`absolute top-1/4 left-1/4 w-36 h-36 blur-3xl rounded-full transition-colors duration-700 ${
              activeSentiment === "nodding"
                ? "bg-cyan-500/20"
                : activeSentiment === "sassy"
                ? "bg-fuchsia-500/20"
                : activeSentiment === "comforting"
                ? "bg-emerald-500/15"
                : "bg-pink-500/20"
            }`}
          />
          <motion.div
            animate={{
              opacity: isSpeaking ? [0.3 + intensityBoost * 0.4, 0.85, 0.3] : [0.15, 0.35, 0.15],
              scale: isSpeaking ? [1, 1.08 + intensityBoost * 0.1, 1] : [0.95, 1.03, 0.95],
            }}
            transition={{ duration: 3.8, repeat: Infinity, ease: "easeInOut", delay: 0.8 }}
            className={`absolute bottom-1/3 right-1/4 w-40 h-40 blur-3xl rounded-full transition-colors duration-700 ${
              activeSentiment === "sassy"
                ? "bg-purple-600/25"
                : activeSentiment === "nodding"
                ? "bg-blue-500/20"
                : "bg-purple-500/15"
            }`}
          />
        </div>

        {/* 
          Live 3D Character Container:
          - Dynamic sentiment body language: nodding, smiling, gentle swaying, and poke reaction!
        */}
        <div className="relative w-full aspect-[768/1320] max-h-[480px] sm:max-h-[540px] flex items-center justify-center overflow-visible">
          <motion.div
            animate={getBodyLanguageAnimation()}
            transition={{
              duration: getTransitionDuration(),
              repeat: isPoked ? 0 : Infinity,
              ease: "easeInOut",
            }}
            style={{
              transformOrigin: "50% 90%",
            }}
            className="relative w-full h-full flex items-center justify-center pointer-events-none select-none"
          >
            {/* 3D Realistic Cyber Anime Character */}
            <img
              src={zaraCyberLive}
              alt="Zara 3D AI Companion"
              className="w-full h-full object-contain pointer-events-none select-none drop-shadow-[0_15px_35px_rgba(0,0,0,0.85)]"
              loading="eager"
            />

            {/* Subtle smiling rosy cheek glow overlay when sentiment is smiling */}
            {isSpeaking && activeSentiment === "smiling" && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: [0.3, 0.65, 0.3] }}
                transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
                className="absolute top-[28%] w-24 h-8 bg-pink-400/25 blur-xl rounded-full pointer-events-none"
              />
            )}
          </motion.div>

          {/* Sassy Poke & Sparkle Burst on Tap */}
          <AnimatePresence>
            {showPokeBurst && (
              <motion.div
                initial={{ opacity: 0, scale: 0.4, y: 0 }}
                animate={{ opacity: 1, scale: 1.35, y: -55 }}
                exit={{ opacity: 0, scale: 2.2, y: -100 }}
                className="absolute top-1/3 z-40 pointer-events-none flex flex-col items-center justify-center gap-1.5"
              >
                {/* Sassy Floating Badge */}
                <span className="px-3 py-1 rounded-full bg-gradient-to-r from-pink-600 via-rose-500 to-amber-500 text-white font-bold text-xs shadow-lg shadow-pink-500/50 flex items-center gap-1 border border-white/30">
                  <Zap size={13} className="text-yellow-300" />
                  {currentPokeBadge}
                </span>

                <div className="flex items-center gap-1.5 text-pink-400">
                  <Heart size={38} className="fill-pink-500 text-pink-300 drop-shadow-[0_0_18px_#ec4899]" />
                  <Sparkles size={28} className="text-cyan-300 drop-shadow-[0_0_12px_#22d3ee]" />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Reactive Witty / Sassy Speech Bubble when poked/tapped */}
      <AnimatePresence>
        {interactionReaction && (
          <motion.div
            initial={{ opacity: 0, y: 14, scale: 0.92 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.92 }}
            className="relative mt-1 z-30 px-4 py-2.5 rounded-2xl bg-[#0d101e]/95 border-2 border-pink-500/50 shadow-2xl backdrop-blur-md text-pink-200 text-xs sm:text-sm font-medium text-center max-w-[320px] drop-shadow-[0_0_20px_rgba(244,63,94,0.45)]"
          >
            <div className="flex items-center justify-center gap-1.5 mb-1 text-[10px] uppercase font-bold text-pink-400 tracking-wider">
              <span>✨</span>
              <span>Zara says:</span>
              <span>💅</span>
            </div>
            <p className="leading-snug text-white font-sans">
              {interactionReaction}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
