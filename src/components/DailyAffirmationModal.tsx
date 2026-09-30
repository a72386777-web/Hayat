import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Sparkles, Volume2, X, Heart, RefreshCw, CheckCircle2 } from "lucide-react";
import { DailyAffirmation, DAILY_AFFIRMATIONS } from "../data/dailyAffirmations";
import zaraAvatarImg from "../assets/images/zara_cyber_live_seamless.png";

interface DailyAffirmationModalProps {
  affirmation: DailyAffirmation;
  onClose: () => void;
  onSpeak: (text: string) => void;
}

export default function DailyAffirmationModal({
  affirmation: initialAffirmation,
  onClose,
  onSpeak,
}: DailyAffirmationModalProps) {
  const [currentAffirmation, setCurrentAffirmation] = useState<DailyAffirmation>(initialAffirmation);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);

  const handleNextQuote = () => {
    const nextList = DAILY_AFFIRMATIONS.filter((item) => item.id !== currentAffirmation.id);
    const randomNext = nextList[Math.floor(Math.random() * nextList.length)];
    setCurrentAffirmation(randomNext);
  };

  const handleSpeakClick = () => {
    setIsPlayingAudio(true);
    onSpeak(currentAffirmation.quote);
    setTimeout(() => {
      setIsPlayingAudio(false);
    }, 4500);
  };

  // Format today's date in Bengali
  const now = new Date();
  const monthsBn = ["জানুয়ারি", "ফেব্রুয়ারি", "মার্চ", "এপ্রিল", "মে", "জুন", "জুলাই", "আগস্ট", "সেপ্টেম্বর", "অক্টোবর", "নভেম্বর", "ডিসেম্বর"];
  const daysBn = ["রবিবার", "সোমবার", "মঙ্গলবার", "বুধবার", "বৃহস্পতিবার", "শুক্রবার", "শনিবার"];
  const bnDigits = ["০", "১", "২", "৩", "৪", "৫", "৬", "৭", "৮", "৯"];
  const toBn = (n: number | string) => String(n).replace(/[0-9]/g, (d) => bnDigits[Number(d)]);
  const dateFormatted = `${toBn(now.getDate())} ${monthsBn[now.getMonth()]}, ${daysBn[now.getDay()]}`;

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 select-none">
      <motion.div
        initial={{ opacity: 0, scale: 0.88, y: 25 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        transition={{ type: "spring", stiffness: 320, damping: 26 }}
        className="w-full max-w-sm bg-[#0c0f1c] border-2 border-pink-500/40 rounded-3xl p-5 shadow-[0_0_50px_rgba(236,72,153,0.3)] relative overflow-hidden flex flex-col text-white"
      >
        {/* Ambient Top Glow */}
        <div className="absolute -top-16 left-1/2 -translate-x-1/2 w-48 h-32 bg-gradient-to-b from-pink-500/30 to-purple-500/10 blur-3xl rounded-full pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white/70 hover:text-white flex items-center justify-center transition-colors cursor-pointer z-20"
          title="বন্ধ করুন"
        >
          <X size={16} />
        </button>

        {/* Header with holographic Zara avatar badge */}
        <div className="flex items-center gap-3 mb-4 z-10">
          <div className="relative w-12 h-12 rounded-2xl bg-gradient-to-tr from-pink-600 to-indigo-600 p-0.5 shadow-lg shadow-pink-500/30 shrink-0">
            <div className="w-full h-full rounded-[14px] bg-[#0c0f1c] overflow-hidden flex items-center justify-center">
              <img
                src={zaraAvatarImg}
                alt="Zara"
                className="w-full h-full object-contain scale-125 translate-y-1"
              />
            </div>
            <span className="absolute -bottom-1 -right-1 text-xs">✨</span>
          </div>

          <div>
            <div className="flex items-center gap-1.5">
              <h3 className="text-sm font-bold text-white tracking-wide">
                Affirmation of the Day
              </h3>
            </div>
            <p className="text-[11px] text-pink-300/80 font-medium">
              {dateFormatted}
            </p>
          </div>
        </div>

        {/* Quote Card */}
        <div className="relative my-2 p-4 rounded-2xl bg-[#141729]/90 border border-white/10 shadow-inner overflow-hidden">
          {/* Decorative subtle quotation mark */}
          <span className="absolute -top-2 -left-1 text-5xl font-serif text-white/5 pointer-events-none select-none">
            “
          </span>

          <div className="flex items-center justify-between gap-2 mb-2">
            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-pink-500/20 text-pink-300 border border-pink-500/30 flex items-center gap-1">
              <span>{currentAffirmation.emoji}</span>
              <span>{currentAffirmation.tag}</span>
            </span>

            <span className="text-[10px] text-white/40">
              {currentAffirmation.title}
            </span>
          </div>

          <p className="text-sm sm:text-base font-medium text-white/95 leading-relaxed font-sans z-10 relative">
            "{currentAffirmation.quote}"
          </p>

          <div className="mt-3 pt-2 border-t border-white/5 flex items-center justify-between text-[11px] text-white/50">
            <span className="flex items-center gap-1 text-pink-400">
              <Heart size={12} className="fill-pink-500 text-pink-400" />
              <span>জারার তরফ থেকে ভালোবাসা</span>
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-4 flex flex-col gap-2 z-10">
          <div className="flex items-center gap-2">
            {/* Listen in Zara's voice */}
            <button
              onClick={handleSpeakClick}
              className={`flex-1 py-2.5 px-3 rounded-xl border flex items-center justify-center gap-1.5 text-xs font-semibold cursor-pointer transition-all active:scale-95 shadow-md ${
                isPlayingAudio
                  ? "bg-pink-600 border-pink-400 text-white shadow-pink-500/40 animate-pulse"
                  : "bg-gradient-to-r from-pink-500/20 to-purple-500/20 hover:from-pink-500/30 hover:to-purple-500/30 border-pink-500/40 text-pink-300"
              }`}
              title="জারার মিষ্টি কণ্ঠে শুনুন"
            >
              <Volume2 size={15} className={isPlayingAudio ? "animate-bounce" : ""} />
              <span>{isPlayingAudio ? "জারা বলছে..." : "জারার কণ্ঠে শুনুন"}</span>
            </button>

            {/* Random Another Quote */}
            <button
              onClick={handleNextQuote}
              className="py-2.5 px-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 hover:text-white flex items-center justify-center gap-1 text-xs font-semibold cursor-pointer transition-colors active:scale-95"
              title="আরেকটি অনুপ্রেরণা দেখুন"
            >
              <RefreshCw size={14} />
              <span className="hidden sm:inline">অন্যটি</span>
            </button>
          </div>

          {/* Dismiss / Thank You */}
          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-xl bg-gradient-to-r from-pink-500 via-rose-500 to-pink-600 hover:from-pink-600 hover:to-rose-600 text-white font-bold text-xs shadow-lg shadow-pink-500/30 flex items-center justify-center gap-1.5 cursor-pointer transition-all active:scale-95"
          >
            <CheckCircle2 size={14} />
            <span>ধন্যবাদ জারা, দিনটা শুরু করি! 💕</span>
          </button>
        </div>
      </motion.div>
    </div>
  );
}
