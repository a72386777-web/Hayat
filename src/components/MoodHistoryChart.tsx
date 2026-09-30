import React, { useState } from "react";
import { Sparkles, TrendingUp, Heart, Zap, Smile, Check, Trash2, Clock, Filter, ChevronDown } from "lucide-react";
import { ZaraSentiment } from "./ZaraLiveCompanion";

export interface MoodHistoryPoint {
  id: string;
  timestamp: number;
  timeStr: string;
  sentiment: ZaraSentiment;
  score: number; // 5: smiling, 4: sassy, 3: nodding, 2: comforting, 1: idle
  moodEmoji: string;
  moodName: string;
  phraseSnippet: string;
}

interface MoodHistoryChartProps {
  history: MoodHistoryPoint[];
  onClearHistory?: () => void;
}

export const MOOD_META: Record<ZaraSentiment, { score: number; emoji: string; name: string; color: string }> = {
  smiling: { score: 5, emoji: "💖", name: "খুশি", color: "#f43f5e" },
  sassy: { score: 4, emoji: "💅", name: "স্যাসি", color: "#a855f7" },
  nodding: { score: 3, emoji: "✨", name: "একমত", color: "#06b6d4" },
  comforting: { score: 2, emoji: "🌿", name: "শান্ত", color: "#10b981" },
  idle: { score: 1, emoji: "💤", name: "স্বাভাবিক", color: "#94a3b8" },
};

const FILTER_OPTIONS = [
  { id: "all", label: "সব অনুভূতি", emoji: "🌟" },
  { id: "smiling", label: "খুশি (Happy)", emoji: "💖" },
  { id: "sassy", label: "স্যাসি (Sassy)", emoji: "💅" },
  { id: "nodding", label: "একমত (Nodding)", emoji: "✨" },
  { id: "comforting", label: "শান্ত (Comforting)", emoji: "🌿" },
];

export default function MoodHistoryChart({ history, onClearHistory }: MoodHistoryChartProps) {
  const [selectedPoint, setSelectedPoint] = useState<MoodHistoryPoint | null>(null);
  const [moodFilter, setMoodFilter] = useState<string>("all");

  // Generate fallback points if history is sparse so chart is always visually appealing
  const displayHistory = React.useMemo(() => {
    if (history.length >= 3) return history;
    const now = Date.now();
    const defaults: MoodHistoryPoint[] = [
      {
        id: "d1",
        timestamp: now - 3600000 * 3,
        timeStr: "৩ ঘন্টা আগে",
        sentiment: "comforting",
        score: 2,
        moodEmoji: "🌿",
        moodName: "শান্ত",
        phraseSnippet: "একটু গভীর শ্বাস নাও, আমি তোমার পাশে আছি...",
      },
      {
        id: "d2",
        timestamp: now - 3600000 * 2,
        timeStr: "২ ঘন্টা আগে",
        sentiment: "nodding",
        score: 3,
        moodEmoji: "✨",
        moodName: "একমত",
        phraseSnippet: "হ্যাঁ অবশ্যই, তোমার কথা ঠিক আছে!",
      },
      {
        id: "d3",
        timestamp: now - 3600000,
        timeStr: "১ ঘন্টা আগে",
        sentiment: "sassy",
        score: 4,
        moodEmoji: "💅",
        moodName: "স্যাসি",
        phraseSnippet: "এই! চুল এলোমেলো করে দিলে তো! 😜",
      },
      {
        id: "d4",
        timestamp: now - 1800000,
        timeStr: "৩০ মি. আগে",
        sentiment: "smiling",
        score: 5,
        moodEmoji: "💖",
        moodName: "খুশি",
        phraseSnippet: "তোমাকে আমার সত্যি খুব ভালো লাগে জানু! 🥰",
      },
      ...history,
    ];
    return defaults.slice(-12);
  }, [history]);

  // Filter history based on user selection (All, Sassy, Happy, Comforting, etc.)
  const filteredHistory = React.useMemo(() => {
    if (moodFilter === "all") return displayHistory;
    return displayHistory.filter((pt) => pt.sentiment === moodFilter);
  }, [displayHistory, moodFilter]);

  // Chart Dimensions
  const width = 360;
  const height = 140;
  const paddingX = 24;
  const paddingTop = 15;
  const paddingBottom = 25;

  const chartW = width - paddingX * 2;
  const chartH = height - paddingTop - paddingBottom;

  const minScore = 1;
  const maxScore = 5;

  // Calculate coordinates for SVG line
  const points = filteredHistory.map((pt, i) => {
    const x = paddingX + (filteredHistory.length > 1 ? (i / (filteredHistory.length - 1)) * chartW : chartW / 2);
    const y = paddingTop + (1 - (pt.score - minScore) / (maxScore - minScore)) * chartH;
    return { ...pt, x, y };
  });

  const pathD = points.reduce((acc, pt, i) => {
    return i === 0 ? `M ${pt.x},${pt.y}` : `${acc} L ${pt.x},${pt.y}`;
  }, "");

  // Area under line for glowing gradient fill
  const areaD = points.length > 1
    ? `${pathD} L ${points[points.length - 1].x},${height - paddingBottom} L ${points[0].x},${height - paddingBottom} Z`
    : "";

  // Sentiment distribution stats
  const total = displayHistory.length;
  const happyCount = displayHistory.filter((p) => p.sentiment === "smiling").length;
  const sassyCount = displayHistory.filter((p) => p.sentiment === "sassy").length;
  const happyPercent = total > 0 ? Math.round((happyCount / total) * 100) : 0;
  const sassyPercent = total > 0 ? Math.round((sassyCount / total) * 100) : 0;

  return (
    <div className="w-full flex flex-col gap-3 text-white select-none">
      {/* Top Metrics Row */}
      <div className="grid grid-cols-3 gap-2">
        <div className="p-2.5 rounded-2xl bg-[#141829]/80 border border-pink-500/20 flex flex-col">
          <span className="text-[10px] text-pink-300 font-semibold flex items-center gap-1">
            <Heart size={11} className="text-pink-400 fill-pink-400" />
            <span>খুশি মুড</span>
          </span>
          <span className="text-lg font-bold text-white mt-0.5">{happyPercent}%</span>
          <span className="text-[9px] text-white/40">{happyCount} টি মুহূর্ত</span>
        </div>

        <div className="p-2.5 rounded-2xl bg-[#141829]/80 border border-purple-500/20 flex flex-col">
          <span className="text-[10px] text-purple-300 font-semibold flex items-center gap-1">
            <Zap size={11} className="text-purple-400" />
            <span>স্যাসি ভাব</span>
          </span>
          <span className="text-lg font-bold text-white mt-0.5">{sassyPercent}%</span>
          <span className="text-[9px] text-white/40">{sassyCount} টি খুনসুটি</span>
        </div>

        <div className="p-2.5 rounded-2xl bg-[#141829]/80 border border-cyan-500/20 flex flex-col">
          <span className="text-[10px] text-cyan-300 font-semibold flex items-center gap-1">
            <TrendingUp size={11} className="text-cyan-400" />
            <span>রেকর্ড সংখ্যা</span>
          </span>
          <span className="text-lg font-bold text-white mt-0.5">{filteredHistory.length}</span>
          <span className="text-[9px] text-white/40">
            {moodFilter === "all" ? "মোট রেকর্ড" : "ফিল্টার্ড"}
          </span>
        </div>
      </div>

      {/* Mood Filter Controls (Dropdown + Pills) */}
      <div className="p-2.5 rounded-2xl bg-black/40 border border-white/10 flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-semibold text-white/70 flex items-center gap-1.5">
            <Filter size={12} className="text-pink-400" />
            <span>মুড ফিল্টার (Filter by Mood):</span>
          </span>

          {/* Quick Dropdown on small screens */}
          <div className="relative">
            <select
              value={moodFilter}
              onChange={(e) => setMoodFilter(e.target.value)}
              className="bg-[#141829] border border-white/15 text-white text-[11px] font-medium rounded-lg px-2 py-1 pr-6 outline-none focus:border-pink-500 appearance-none cursor-pointer"
            >
              {FILTER_OPTIONS.map((opt) => (
                <option key={opt.id} value={opt.id} className="bg-[#141829] text-white">
                  {opt.emoji} {opt.label}
                </option>
              ))}
            </select>
            <ChevronDown size={11} className="absolute right-1.5 top-1/2 -translate-y-1/2 text-white/40 pointer-events-none" />
          </div>
        </div>

        {/* Filter Toggle Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-0.5">
          {FILTER_OPTIONS.map((opt) => {
            const isSelected = moodFilter === opt.id;
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => setMoodFilter(opt.id)}
                className={`px-2.5 py-1 rounded-xl text-[10px] font-semibold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1 border shrink-0 ${
                  isSelected
                    ? "bg-gradient-to-r from-pink-500/30 to-purple-500/30 border-pink-400 text-white shadow-sm shadow-pink-500/20"
                    : "bg-white/5 border-white/10 text-white/60 hover:text-white"
                }`}
              >
                <span>{opt.emoji}</span>
                <span>{opt.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* SVG Line Chart Card */}
      <div className="relative p-3 rounded-2xl bg-[#0f1322] border border-white/10 shadow-inner flex flex-col items-center overflow-hidden">
        <div className="w-full flex items-center justify-between mb-1 px-1">
          <span className="text-xs font-semibold text-white/80 flex items-center gap-1.5">
            <TrendingUp size={14} className="text-pink-400" />
            <span>মুড ওঠানামার গ্রাফ {moodFilter !== "all" && `(${FILTER_OPTIONS.find(f => f.id === moodFilter)?.label})`}</span>
          </span>

          <span className="text-[10px] text-white/40">
            বিন্দুতে চাপ দিয়ে বিস্তারিত দেখুন
          </span>
        </div>

        {filteredHistory.length === 0 ? (
          <div className="py-10 text-center text-xs text-white/40">
            এই ফিল্টারে এখনো কোনো অনুভূতির রেকর্ড নেই।
          </div>
        ) : (
          /* SVG Canvas */
          <div className="w-full flex items-center justify-center relative py-1">
            <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto max-h-[160px] overflow-visible">
              <defs>
                <linearGradient id="moodLineGrad" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#06b6d4" />
                  <stop offset="50%" stopColor="#ec4899" />
                  <stop offset="100%" stopColor="#a855f7" />
                </linearGradient>

                <linearGradient id="moodAreaGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#ec4899" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="#a855f7" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Horizontal Grid lines */}
              {[5, 4, 3, 2, 1].map((lvl) => {
                const y = paddingTop + (1 - (lvl - minScore) / (maxScore - minScore)) * chartH;
                return (
                  <g key={lvl} opacity={0.15}>
                    <line x1={paddingX} y1={y} x2={width - paddingX} y2={y} stroke="#ffffff" strokeDasharray="3 3" />
                  </g>
                );
              })}

              {/* Area Fill under the line */}
              {areaD && <path d={areaD} fill="url(#moodAreaGrad)" />}

              {/* Line Graph */}
              {pathD && (
                <path
                  d={pathD}
                  fill="none"
                  stroke="url(#moodLineGrad)"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="drop-shadow-[0_0_8px_rgba(236,72,153,0.6)]"
                />
              )}

              {/* Data Points */}
              {points.map((pt) => {
                const isSelected = selectedPoint?.id === pt.id;
                return (
                  <g key={pt.id} className="cursor-pointer" onClick={() => setSelectedPoint(pt)}>
                    {/* Outer halo */}
                    <circle
                      cx={pt.x}
                      cy={pt.y}
                      r={isSelected ? 7 : 4.5}
                      fill={pt.sentiment === "smiling" ? "#ec4899" : pt.sentiment === "sassy" ? "#a855f7" : "#06b6d4"}
                      stroke="#ffffff"
                      strokeWidth={isSelected ? "2.5" : "1.5"}
                      className="transition-all hover:r-6"
                    />
                  </g>
                );
              })}
            </svg>
          </div>
        )}

        {/* Y-axis Labels Legend */}
        <div className="w-full flex items-center justify-between text-[10px] text-white/50 px-2 pt-1 border-t border-white/5">
          <span className="flex items-center gap-1">
            <span>💖</span>
            <span>খুশি</span>
          </span>
          <span className="flex items-center gap-1">
            <span>💅</span>
            <span>স্যাসি</span>
          </span>
          <span className="flex items-center gap-1">
            <span>✨</span>
            <span>একমত</span>
          </span>
          <span className="flex items-center gap-1">
            <span>🌿</span>
            <span>শান্ত</span>
          </span>
        </div>
      </div>

      {/* Selected Point Tooltip / Inspection Card */}
      {selectedPoint && (
        <div className="p-3 rounded-2xl bg-gradient-to-r from-pink-950/40 via-purple-950/40 to-slate-900 border border-pink-500/30 flex flex-col gap-1 shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-pink-300 flex items-center gap-1.5">
              <span className="text-base">{selectedPoint.moodEmoji}</span>
              <span>{selectedPoint.moodName} মুড</span>
            </span>
            <span className="text-[10px] text-white/50 flex items-center gap-1">
              <Clock size={10} />
              <span>{selectedPoint.timeStr}</span>
            </span>
          </div>

          <p className="text-xs text-white/90 italic font-sans leading-relaxed">
            "{selectedPoint.phraseSnippet}"
          </p>
        </div>
      )}

      {/* Recent Mood Log List (Filtered) */}
      <div className="space-y-1.5 max-h-[160px] overflow-y-auto overscroll-contain pr-1">
        <span className="text-[11px] font-semibold text-white/60 block px-1">
          {moodFilter === "all" ? "সাম্প্রতিক অনুভূতির তালিকা:" : `${FILTER_OPTIONS.find(f => f.id === moodFilter)?.label}-এর তালিকা:`}
        </span>
        {filteredHistory.slice(-5).reverse().map((item) => (
          <div
            key={item.id}
            onClick={() => setSelectedPoint(item)}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 hover:border-pink-500/30 transition-all cursor-pointer flex items-center justify-between text-xs"
          >
            <div className="flex items-center gap-2 min-w-0 flex-1 mr-2">
              <span className="text-base shrink-0">{item.moodEmoji}</span>
              <div className="truncate">
                <span className="font-semibold text-white mr-1.5">{item.moodName}</span>
                <span className="text-white/50 text-[11px] truncate">"{item.phraseSnippet}"</span>
              </div>
            </div>

            <span className="text-[10px] text-white/40 shrink-0">{item.timeStr}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
