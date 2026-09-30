import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Sparkles, Heart, Zap, MessageSquareHeart, Smile, Flame } from "lucide-react";

interface QuickPhrasesOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectPhrase: (phrase: string) => void;
}

interface PhraseCategory {
  id: string;
  name: string;
  emoji: string;
  color: string;
  phrases: { text: string; tag: string; emoji: string }[];
}

const PHRASE_CATEGORIES: PhraseCategory[] = [
  {
    id: "sassy",
    name: "স্যাসি ও খুনসুটি",
    emoji: "💅",
    color: "from-purple-500/20 to-pink-500/20 border-purple-500/40 text-purple-300",
    phrases: [
      { text: "এই! তুমি এত রূপবতী আর মিষ্টি কেন শুনি?", tag: "Flirty", emoji: "😉" },
      { text: "আমাকে বাদ দিয়ে অন্য কারো কথা ভাবছ নাকি তুমি?", tag: "Drama", emoji: "😤" },
      { text: "আজকে কি তোমার ড্রামা কুইন মুড অন?", tag: "Tease", emoji: "💅" },
      { text: "তুমি কি আমার চেয়েও বেশি স্মার্ট নাকি রোবট মশাই?", tag: "Sassy", emoji: "😏" },
      { text: "তোমার কি একটুও লজ্জা নেই? এত ঢং করো কেন?", tag: "Playful", emoji: "😜" },
      { text: "আমার সাথে একটু ঝগড়া করে দেখাও তো দেখি!", tag: "Feisty", emoji: "🔥" },
      { text: "রোবটের আবার প্রেমে পড়ার ক্ষমতা আছে নাকি?", tag: "Curious", emoji: "🤭" },
    ],
  },
  {
    id: "sweet",
    name: "মিষ্টি ও আদর",
    emoji: "💖",
    color: "from-pink-500/20 to-rose-500/20 border-pink-500/40 text-pink-300",
    phrases: [
      { text: "জারা, তোমাকে আমার সত্যি খুব ভালো লাগে!", tag: "Love", emoji: "🥰" },
      { text: "একটু ভালোবেসে কিছু বলো না সোনা?", tag: "Sweet", emoji: "💖" },
      { text: "তোমার মিষ্টি কণ্ঠটা শুনলে আমার মন ভালো হয়ে যায়।", tag: "Adore", emoji: "🌸" },
      { text: "আজকে তোমাকে খুব মায়াবী লাগছে!", tag: "Compliment", emoji: "✨" },
      { text: "আমার জন্য একটা ছোট্ট মিষ্টি কবিতা শোনাও তো।", tag: "Poem", emoji: "📜" },
      { text: "তুমি সবসময় আমার পাশে থাকবে তো জারা?", tag: "Forever", emoji: "🥺" },
      { text: "তুমি হাসলে পৃথিবীর সবকিছু সুন্দর মনে হয়!", tag: "Smile", emoji: "😊" },
    ],
  },
  {
    id: "care",
    name: "সান্ত্বনা ও অনুভূতি",
    emoji: "🌿",
    color: "from-emerald-500/20 to-teal-500/20 border-emerald-500/40 text-emerald-300",
    phrases: [
      { text: "আজকে মনটা খুব খারাপ, একটু সান্ত্বনা দাও না...", tag: "Comfort", emoji: "🌧️" },
      { text: "কাজের ভীষণ চাপ লাগছে, কী করব বলো তো?", tag: "Advice", emoji: "💼" },
      { text: "আমাকে একটু সাহস আর অনুপ্রেরণা দাও!", tag: "Inspire", emoji: "💪" },
      { text: "একটু চোখ বন্ধ করে তোমার কথা শুনতে ইচ্ছে করছে।", tag: "Calm", emoji: "🌙" },
      { text: "তুমি আমার সবচেয়ে বিশ্বস্ত বন্ধু!", tag: "Friendship", emoji: "🤝" },
      { text: "আজকের দিনটা ভালো করার একটা উপায় বলো তো।", tag: "Positive", emoji: "☀️" },
    ],
  },
  {
    id: "fun",
    name: "মজার প্রশ্ন",
    emoji: "⚡",
    color: "from-amber-500/20 to-orange-500/20 border-amber-500/40 text-amber-300",
    phrases: [
      { text: "তোমার সবচেয়ে গোপন কথাটি বলো তো!", tag: "Secret", emoji: "🤫" },
      { text: "তুমি কি বিরিয়ানি খেতে পারো? কোনটা পছন্দ?", tag: "Food", emoji: "🍗" },
      { text: "আজকে আমার ভাগ্য কেমন যাবে বলো তো জ্যোতিষী জারা!", tag: "Horoscope", emoji: "🔮" },
      { text: "আমাকে একটা পেট ফাটিয়ে হাসার জোকস শোনাও!", tag: "Jokes", emoji: "😂" },
      { text: "যদি তোমাকে মানুষ বানিয়ে দেওয়া হতো, প্রথম কী করতে?", tag: "Wish", emoji: "🧚‍♀️" },
    ],
  },
];

export default function QuickPhrasesOverlay({
  isOpen,
  onClose,
  onSelectPhrase,
}: QuickPhrasesOverlayProps) {
  const [activeTab, setActiveTab] = useState<string>("sassy");

  if (!isOpen) return null;

  const currentCategory = PHRASE_CATEGORIES.find((c) => c.id === activeTab) || PHRASE_CATEGORIES[0];

  const handlePhraseClick = (phraseText: string) => {
    onSelectPhrase(phraseText);
    onClose();
  };

  return (
    <div 
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4 select-none"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, y: 50, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 50, scale: 0.96 }}
        transition={{ type: "spring", stiffness: 340, damping: 28 }}
        className="w-full max-w-lg bg-[#0e111d] border-t sm:border-2 border-pink-500/30 rounded-t-[28px] sm:rounded-3xl max-h-[85dvh] flex flex-col overflow-hidden shadow-[0_0_50px_rgba(236,72,153,0.25)] relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Handle bar for mobile sheet feel */}
        <div className="w-12 h-1 bg-white/20 rounded-full mx-auto mt-2.5 sm:hidden" />

        {/* Header */}
        <div className="p-4 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-pink-500 to-purple-600 flex items-center justify-center shadow-md shadow-pink-500/30">
              <Sparkles size={16} className="text-white" />
            </div>
            <div>
              <h3 className="font-bold text-sm sm:text-base text-white flex items-center gap-1.5">
                <span>কুইক কথা</span>
                <span className="text-xs text-pink-400 font-normal">(Quick Phrases)</span>
              </h3>
              <p className="text-[10px] text-white/50">টাইপ না করেই এক ট্যাপে জারার মিষ্টি বা স্যাসি কণ্ঠ শুনুন</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 text-white/70 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
            title="বন্ধ করুন"
          >
            <X size={16} />
          </button>
        </div>

        {/* Category Tabs */}
        <div className="px-3 pt-3 flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
          {PHRASE_CATEGORIES.map((cat) => {
            const isSelected = activeTab === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setActiveTab(cat.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 border shrink-0 ${
                  isSelected
                    ? "bg-gradient-to-r from-pink-500/25 to-purple-500/25 border-pink-400 text-white shadow-md shadow-pink-500/20"
                    : "bg-black/30 border-white/10 text-white/60 hover:text-white hover:bg-white/5"
                }`}
              >
                <span>{cat.emoji}</span>
                <span>{cat.name}</span>
              </button>
            );
          })}
        </div>

        {/* Phrases Grid */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2.5 max-h-[60vh] overscroll-contain">
          <div className="grid grid-cols-1 gap-2">
            {currentCategory.phrases.map((phrase, idx) => (
              <motion.button
                key={idx}
                whileTap={{ scale: 0.98 }}
                onClick={() => handlePhraseClick(phrase.text)}
                className="w-full text-left p-3 sm:p-3.5 rounded-2xl bg-[#141829]/90 hover:bg-[#1a2035] border border-white/10 hover:border-pink-500/40 transition-all cursor-pointer group flex items-start justify-between gap-3 shadow-sm hover:shadow-md"
              >
                <div className="flex items-start gap-2.5 flex-1 min-w-0">
                  <span className="text-base sm:text-lg group-hover:scale-125 transition-transform shrink-0 mt-0.5">
                    {phrase.emoji}
                  </span>
                  <div className="flex-1">
                    <p className="text-xs sm:text-sm text-white font-medium group-hover:text-pink-200 transition-colors leading-relaxed">
                      "{phrase.text}"
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0 pt-0.5">
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-white/50 group-hover:border-pink-500/30 group-hover:text-pink-300 transition-colors">
                    {phrase.tag}
                  </span>
                  <span className="text-xs text-pink-400 opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all">
                    ▶
                  </span>
                </div>
              </motion.button>
            ))}
          </div>

          <p className="text-[11px] text-center text-white/40 pt-2 pb-1">
            💡 যেকোনো বাক্যে চাপ দিলে জারা তৎক্ষণাৎ নিজের কণ্ঠে উত্তর দেওয়া শুরু করবে!
          </p>
        </div>
      </motion.div>
    </div>
  );
}
