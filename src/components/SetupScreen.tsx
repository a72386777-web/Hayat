import React, { useState } from "react";
import { Sparkles, KeyRound, User, MessageSquareHeart, Check, Volume2, X, Heart, Mic, Radio } from "lucide-react";
import { motion } from "motion/react";
import { AppConfig } from "../types";
import { DEFAULT_ZARA_PROMPT } from "../services/geminiService";

interface SetupScreenProps {
  onComplete: (config: AppConfig) => void;
  onCancel?: () => void;
  initialConfig?: AppConfig;
}

const VOICE_OPTIONS = [
  {
    id: "Kore",
    name: "Kore",
    bengaliName: "কোরে (মায়াবী)",
    tag: "সবচেয়ে মিষ্টি 🌸",
    desc: "অত্যন্ত মিষ্টি, নরম ও খাঁটি বাঙালি মেয়ের মতো প্রাণবন্ত কণ্ঠ। যত্নশীল ভালোবাসায় ভরা অনুভূতি।",
    recommended: true,
  },
  {
    id: "Aoede",
    name: "Aoede",
    bengaliName: "আওইদে (সুরেলা)",
    tag: "সুরভিত 🎵",
    desc: "খোলা, সুরেলা ও সুন্দর স্বাভাবিক কণ্ঠ। সাবলীল ও স্পষ্ট মিষ্টি প্রকাশভঙ্গি।",
  },
  {
    id: "Leda",
    name: "Leda",
    bengaliName: "লেডা (কোমল)",
    tag: "নিষ্পাপ ✨",
    desc: "একটি মিষ্টি, নরম ও নিষ্পাপ অনুভূতিমাখা কণ্ঠ। মিষ্টি তরুণী প্রেমিকার কোমল ভাব।",
  },
  {
    id: "Zephyr",
    name: "Zephyr",
    bengaliName: "জেফার (স্নিগ্ধ)",
    tag: "ফিসফিস স্নিগ্ধ 🍃",
    desc: "ধীর, প্রশান্ত ও মনে শান্তি আনা স্নিগ্ধ কণ্ঠ। গভীর রাতের শান্ত আলাপের জন্য দারুণ।",
  },
  {
    id: "Callirrhoe",
    name: "Callirrhoe",
    bengaliName: "ক্যালিহোই (উষ্ণ)",
    tag: "আন্তরিক 💖",
    desc: "উষ্ণতা ও আনন্দমাখা মিষ্টি কণ্ঠ। একজন যত্নশীল ও হাসিখুশি বন্ধুর মতো পাশে থাকা।",
  },
  {
    id: "Despina",
    name: "Despina",
    bengaliName: "দেসপিনা (মার্জিত)",
    tag: "কাব্যিক 🌺",
    desc: "মার্জিত ও শালীন অনুভূতিতে ভরা আকর্ষণীয় কণ্ঠ। কবিতা ও সুন্দর আলাপের জন্য উপযুক্ত।",
  },
];

export default function SetupScreen({ onComplete, onCancel, initialConfig }: SetupScreenProps) {
  // Try to use process.env.GEMINI_API_KEY if available
  const envApiKey = typeof process !== "undefined" && process.env?.GEMINI_API_KEY ? process.env.GEMINI_API_KEY : "";
  const [apiKey, setApiKey] = useState(initialConfig?.apiKey || envApiKey || "");
  const [userName, setUserName] = useState(initialConfig?.userName || "ওয়াহেদ");
  const [assistantName, setAssistantName] = useState(initialConfig?.assistantName || "Zara");
  const [voiceName, setVoiceName] = useState(initialConfig?.voiceName || "Kore");
  const [systemPrompt, setSystemPrompt] = useState(initialConfig?.systemPrompt || "");
  const [wakeWord, setWakeWord] = useState(initialConfig?.wakeWord || "জারা");
  const [wakeWordEnabled, setWakeWordEnabled] = useState(initialConfig?.wakeWordEnabled === true);
  const [errorMsg, setErrorMsg] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    const finalKey = apiKey.trim() || envApiKey;
    if (!finalKey) {
      setErrorMsg("দয়া করে আপনার Gemini API Key দিন।");
      return;
    }
    if (!userName.trim()) {
      setErrorMsg("দয়া করে আপনার নাম দিন।");
      return;
    }
    if (!assistantName.trim()) {
      setErrorMsg("দয়া করে সহচরীর নাম দিন (যেমন: Zara)।");
      return;
    }
    
    let finalPrompt = systemPrompt.trim();
    if (!finalPrompt) {
      finalPrompt = DEFAULT_ZARA_PROMPT;
    }

    onComplete({
      apiKey: finalKey,
      userName: userName.trim(),
      assistantName: assistantName.trim(),
      voiceName: voiceName,
      systemPrompt: finalPrompt,
      activeTopicOrScript: initialConfig?.activeTopicOrScript,
      wakeWord: wakeWord.trim() || assistantName.trim(),
      wakeWordEnabled,
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex flex-col justify-end sm:justify-center items-center p-0 sm:p-4 md:p-6 text-white">
      {/* Background Ambient Glows */}
      <div className="fixed inset-0 w-full h-full overflow-hidden pointer-events-none opacity-40">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-violet-900/20 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-pink-900/20 blur-[120px] rounded-full" />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 30, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 30, scale: 0.98 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
        className="w-full max-w-2xl bg-[#141620] border border-white/15 rounded-t-[28px] sm:rounded-3xl shadow-2xl shadow-black/95 flex flex-col h-[94dvh] sm:h-[90dvh] max-h-[94dvh] overflow-hidden relative z-10"
      >
        {/* Mobile Drag Indicator */}
        <div className="w-12 h-1 bg-white/20 rounded-full mx-auto mt-2 sm:hidden shrink-0" />

        {/* 1. FIXED TOP HEADER */}
        <div className="shrink-0 px-4 py-3 sm:px-6 sm:py-3.5 border-b border-white/10 bg-[#161824] flex items-center justify-between gap-3 relative z-10">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-gradient-to-tr from-pink-500 via-rose-500 to-amber-500 flex items-center justify-center shadow-lg shadow-pink-500/20 shrink-0">
              <Sparkles className="text-white" size={20} />
            </div>
            <div className="min-w-0">
              <h1 className="text-sm sm:text-base font-semibold text-white tracking-wide truncate">
                {initialConfig ? "জারা - সেটিংস ও পছন্দ" : "জারা - আপনার ব্যক্তিগত এআই সহচরী"}
              </h1>
              <p className="text-[11px] sm:text-xs text-white/50 truncate">
                মিষ্টি বাংলা কণ্ঠ, ব্যক্তিত্ব ও পছন্দের সমন্বয়
              </p>
            </div>
          </div>

          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white/5 hover:bg-white/15 active:bg-white/25 border border-white/10 text-white/80 hover:text-white flex items-center justify-center transition-all shrink-0 cursor-pointer"
              title="বন্ধ করুন"
              aria-label="Close"
            >
              <X size={18} className="text-white" />
            </button>
          )}
        </div>

        {/* 2. SCROLLABLE FORM BODY */}
        <form onSubmit={handleSubmit} className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto overscroll-contain p-4 sm:p-6 space-y-4 relative z-10">
            {errorMsg && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }} 
                animate={{ opacity: 1, y: 0 }} 
                className="p-3 rounded-xl bg-red-500/10 border border-red-500/40 text-red-300 text-xs sm:text-sm font-medium text-center shadow-lg"
              >
                {errorMsg}
              </motion.div>
            )}

            {/* API Key */}
            <div className="space-y-1.5">
              <label className="text-xs sm:text-sm font-medium text-white/80 flex items-center gap-2">
                <KeyRound size={15} className="text-violet-400" />
                Gemini API Key
              </label>
              <input 
                type="password" 
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="AIzaSy..."
                className="w-full bg-black/40 border border-white/10 rounded-xl px-3.5 py-2.5 sm:py-3 text-xs sm:text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-violet-500 transition-colors font-mono"
              />
              <p className="text-[10px] sm:text-xs text-white/40">
                আপনার ব্রাউজারে সুরক্ষিত থাকে। কি সংগ্রহ করতে পারেন <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-violet-400 hover:underline">Google AI Studio</a> থেকে।
              </p>
            </div>

            {/* User Name & Assistant Name */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs sm:text-sm font-medium text-white/80 flex items-center gap-2">
                  <User size={15} className="text-pink-400" />
                  আপনার নাম (Your Name)
                </label>
                <input 
                  type="text" 
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  placeholder="যেমন: ওয়াহেদ"
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-3.5 py-2.5 sm:py-3 text-xs sm:text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-pink-500 transition-colors"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs sm:text-sm font-medium text-white/80 flex items-center gap-2">
                  <Sparkles size={15} className="text-cyan-400" />
                  সহচরীর নাম (Companion Name)
                </label>
                <input 
                  type="text" 
                  value={assistantName}
                  onChange={(e) => setAssistantName(e.target.value)}
                  placeholder="Zara"
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-3.5 py-2.5 sm:py-3 text-xs sm:text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-cyan-500 transition-colors"
                />
              </div>
            </div>

            {/* Custom Wake Word Configuration */}
            <div className="p-3.5 rounded-2xl bg-cyan-950/20 border border-cyan-500/30 space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="text-xs sm:text-sm font-semibold text-white flex items-center gap-2">
                  <Radio size={16} className="text-cyan-400 animate-pulse" />
                  ভয়েস ওয়েক-ওয়ার্ড (Voice Wake Word)
                </label>

                <button
                  type="button"
                  onClick={() => setWakeWordEnabled(!wakeWordEnabled)}
                  className={`px-2.5 py-1 rounded-full text-[10px] font-semibold transition-all cursor-pointer border ${
                    wakeWordEnabled
                      ? "bg-cyan-500/20 border-cyan-400 text-cyan-300 shadow-sm shadow-cyan-500/30"
                      : "bg-white/10 border-white/20 text-white/50"
                  }`}
                >
                  {wakeWordEnabled ? "চালু আছে ✓" : "বন্ধ"}
                </button>
              </div>

              <div className="space-y-1.5">
                <input
                  type="text"
                  value={wakeWord}
                  onChange={(e) => setWakeWord(e.target.value)}
                  placeholder="যেমন: জারা, হেই জারা, জারভিস"
                  disabled={!wakeWordEnabled}
                  className="w-full bg-black/50 border border-cyan-500/30 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-cyan-200 placeholder:text-white/25 focus:outline-none focus:border-cyan-400 disabled:opacity-40 transition-colors"
                />

                {/* Quick Wake Word Presets */}
                <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                  <span className="text-[10px] text-white/50">কুইক সিলেক্ট:</span>
                  {["জারা", "হেই জারা", "Zara", "Hey Zara", "জারভিস", "জয়া"].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => {
                        setWakeWord(preset);
                        setWakeWordEnabled(true);
                      }}
                      className={`text-[10px] px-2 py-0.5 rounded-md border transition-all cursor-pointer ${
                        wakeWord.toLowerCase() === preset.toLowerCase()
                          ? "bg-cyan-500/30 border-cyan-400 text-cyan-200"
                          : "bg-white/5 border-white/10 text-white/60 hover:text-white hover:bg-white/10"
                      }`}
                    >
                      {preset}
                    </button>
                  ))}
                </div>

                <p className="text-[10px] text-cyan-300/70 pt-0.5 leading-relaxed">
                  💡 মাইকে স্পর্শ না করেই মুখ দিয়ে এই নাম বললে জারা সাথে সাথে সক্রিয় হয়ে কথা শোনা শুরু করবে।
                </p>
              </div>
            </div>

            {/* Voice Selection */}
            <div className="space-y-2 pt-1">
              <div className="flex items-center justify-between">
                <label className="text-xs sm:text-sm font-medium text-white/80 flex items-center gap-2">
                  <Volume2 size={15} className="text-amber-400" />
                  কণ্ঠ নির্বাচন (Sweet Female Voices)
                </label>
                <span className="text-[10px] sm:text-xs text-pink-300 font-medium bg-pink-500/15 px-2 py-0.5 rounded-full border border-pink-500/25">
                  ৬টি নারী কণ্ঠ
                </span>
              </div>

              {/* Scrollable Voices Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[220px] overflow-y-auto overscroll-contain pr-1">
                {VOICE_OPTIONS.map((v) => {
                  const isSelected = voiceName === v.id;
                  return (
                    <button
                      key={v.id}
                      type="button"
                      onClick={() => setVoiceName(v.id)}
                      className={`text-left p-3 rounded-xl border transition-all cursor-pointer relative flex flex-col justify-between gap-1 active:scale-[0.99] ${
                        isSelected
                          ? "bg-pink-500/20 border-pink-500/70 shadow-md ring-1 ring-pink-500/40"
                          : "bg-black/40 border-white/10 hover:border-white/20 hover:bg-white/5"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-xs sm:text-sm font-semibold text-white">{v.name}</span>
                          <span className="text-[11px] text-pink-300 font-medium">{v.bengaliName}</span>
                          <span className="text-[10px] text-pink-300/80 font-medium">{v.tag}</span>
                        </div>
                        {isSelected && (
                          <div className="w-5 h-5 rounded-full bg-pink-500 flex items-center justify-center shrink-0">
                            <Check size={12} className="text-white stroke-[3]" />
                          </div>
                        )}
                      </div>
                      <p className="text-[10px] sm:text-[11px] text-white/60 leading-relaxed line-clamp-2">{v.desc}</p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Personality / System Prompt */}
            <div className="space-y-1.5 pt-1">
              <label className="text-xs sm:text-sm font-medium text-white/80 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MessageSquareHeart size={15} className="text-rose-400" />
                  ব্যক্তিত্ব ও আচরণ নীতি (Personality & Prompt)
                </div>
              </label>
              <textarea 
                value={systemPrompt}
                onChange={(e) => setSystemPrompt(e.target.value)}
                placeholder="ডিফল্ট মিষ্টি, আদুরে ও বাস্তব বাঙালি প্রেমিকা ব্যক্তিত্বের প্রম্পট ব্যবহার করতে খালি রাখুন..."
                rows={4}
                className="w-full bg-black/40 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder:text-white/30 focus:outline-none focus:border-rose-500 transition-colors font-sans leading-relaxed resize-y"
              />
              <p className="text-[10px] text-white/40">
                খাঁটি বাংলায় কথা বলা, মিষ্টি অনুভূতি ও কিউট অভিমানের জন্য বিশেষভাবে প্রস্তুত।
              </p>
            </div>
          </div>

          {/* 3. ALWAYS VISIBLE STICKY FOOTER */}
          <div className="shrink-0 bg-[#161824] border-t border-white/10 px-4 py-3 sm:px-6 sm:py-3.5 flex items-center justify-between gap-3 safe-bottom z-20">
            {onCancel ? (
              <button 
                type="button"
                onClick={onCancel}
                className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 active:bg-white/20 text-white/80 font-medium text-xs sm:text-sm border border-white/10 transition-colors cursor-pointer"
              >
                বাতিল
              </button>
            ) : (
              <div className="text-[11px] text-white/40">তথ্য সুরক্ষিতভাবে ডিভাইসে থাকবে</div>
            )}

            <button 
              type="submit"
              className="flex-1 sm:flex-initial px-6 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 via-pink-600 to-rose-600 hover:from-violet-500 hover:to-rose-500 text-white font-semibold text-xs sm:text-sm shadow-lg shadow-pink-500/25 transition-all duration-300 active:scale-95 cursor-pointer flex items-center justify-center gap-2"
            >
              <Check size={16} className="stroke-[3]" />
              <span>{initialConfig ? "সংরক্ষণ করুন" : "জারার সাথে কথা শুরু করুন"}</span>
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
