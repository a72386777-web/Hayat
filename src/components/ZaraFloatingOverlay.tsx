import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Sparkles, 
  Volume2, 
  Maximize2, 
  X, 
  Move,
  MessageCircle,
  Phone,
  Search,
  Mic,
  Camera
} from "lucide-react";
import idleAvatar from "../assets/images/zara_cyber_avatar.jpg";

interface ZaraFloatingOverlayProps {
  isSpeaking: boolean;
  audioIntensity?: number;
  onOpenAssistant: () => void;
  isHomeScreenMode: boolean;
  onToggleHomeScreenMode?: () => void;
  onTestSpeech?: (text: string) => void;
  enabled?: boolean;
}

export default function ZaraFloatingOverlay({
  isSpeaking,
  audioIntensity = 0,
  onOpenAssistant,
  isHomeScreenMode,
  onToggleHomeScreenMode,
  onTestSpeech,
  enabled = true,
}: ZaraFloatingOverlayProps) {
  // Dragged position offset
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [showQuickBubble, setShowQuickBubble] = useState(false);

  if (!enabled) return null;

  // Waveform bars dynamic heights when speaking
  const normalizedLevel = Math.min(1, Math.max(0.15, audioIntensity * 12));

  return (
    <>
      {/* 1. Android Home Screen Simulation Mode (Reference: IMG_20260930_141238.jpg) */}
      <AnimatePresence>
        {isHomeScreenMode && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-[#060812] select-none flex flex-col justify-between overflow-hidden text-white font-sans"
            style={{
              backgroundImage: "radial-gradient(ellipse at center, rgba(15, 23, 42, 0.9) 0%, rgba(2, 6, 23, 1) 100%)",
            }}
          >
            {/* Top Status Bar */}
            <div className="w-full flex items-center justify-between px-6 pt-3 text-[11px] text-white/70">
              <span className="font-semibold tracking-wider">10:51</span>
              <div className="flex items-center gap-2 text-[10px]">
                <span>30.0 KB/s</span>
                <span>📶 81%</span>
              </div>
            </div>

            {/* Android Home Screen Widgets & Apps */}
            <div className="w-full max-w-sm mx-auto flex flex-col items-center px-6 pt-6 flex-1">
              {/* Date & Day */}
              <div className="w-full text-left mb-6">
                <span className="text-xl sm:text-2xl font-light text-white tracking-wide block">
                  Saturday, 27 Jun
                </span>
              </div>

              {/* Grid of Apps (Clock, Tools, App Market, Google, Play Store) */}
              <div className="w-full grid grid-cols-4 gap-4 mb-8">
                <div className="flex flex-col items-center gap-1.5 cursor-pointer hover:opacity-80">
                  <div className="w-13 h-13 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 flex items-center justify-center text-xl shadow-md">
                    <span>🕒</span>
                  </div>
                  <span className="text-[11px] text-white/80">Clock</span>
                </div>

                <div className="flex flex-col items-center gap-1.5 cursor-pointer hover:opacity-80">
                  <div className="w-13 h-13 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 flex items-center justify-center text-xl shadow-md">
                    <span>🧰</span>
                  </div>
                  <span className="text-[11px] text-white/80">Tools</span>
                </div>

                <div className="flex flex-col items-center gap-1.5 cursor-pointer hover:opacity-80">
                  <div className="w-13 h-13 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 flex items-center justify-center text-xl shadow-md">
                    <span>🛍️</span>
                  </div>
                  <span className="text-[11px] text-white/80">App Market</span>
                </div>

                <div className="flex flex-col items-center gap-1.5 cursor-pointer hover:opacity-80">
                  <div className="w-13 h-13 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 flex items-center justify-center text-xl shadow-md">
                    <span>▶️</span>
                  </div>
                  <span className="text-[11px] text-white/80">Play Store</span>
                </div>
              </div>

              {/* Google Search Pill Widget */}
              <div className="w-full h-12 rounded-full bg-white/15 backdrop-blur-xl border border-white/20 px-4 flex items-center justify-between shadow-lg mb-8">
                <div className="flex items-center gap-2">
                  <span className="text-lg font-bold text-amber-400">G</span>
                  <span className="text-xs text-white/40">Search...</span>
                </div>
                <div className="flex items-center gap-3 text-white/70">
                  <Mic size={16} className="text-cyan-400" />
                  <Camera size={16} className="text-pink-400" />
                </div>
              </div>

              {/* Guide Toast explaining the floating overlay */}
              <div className="p-3 rounded-2xl bg-cyan-950/40 border border-cyan-500/30 text-center max-w-xs mt-2 backdrop-blur-md">
                <span className="text-xs font-semibold text-cyan-300 block mb-0.5">
                  📱 হোম স্ক্রিন মোড সক্রিয়
                </span>
                <span className="text-[11px] text-white/70 leading-relaxed block">
                  নিচের ডানদিকের ফ্লোটিং লোগোটি দেখুন। কথা বলার সময় এটি আপ-ডাউন করবে এবং ড্র্যাগ করে সরানো যাবে।
                </span>

                {onTestSpeech && (
                  <button
                    type="button"
                    onClick={() => onTestSpeech("হ্যালো জানু! আমি ব্যাকগ্রাউন্ডে তোমার সাথেই আছি...")}
                    className="mt-2.5 px-3 py-1 rounded-xl bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white text-[11px] font-semibold cursor-pointer shadow-md active:scale-95 transition-all"
                  >
                    🎙️ জারার ভয়েস টেস্ট করুন
                  </button>
                )}
              </div>
            </div>

            {/* Android Bottom Dock Apps (Dialer, Messages, Chrome, Camera) */}
            <div className="w-full px-6 pb-6 pt-3 flex items-center justify-between max-w-sm mx-auto">
              <div className="w-12 h-12 rounded-full bg-emerald-500/90 flex items-center justify-center text-white shadow-lg cursor-pointer">
                <Phone size={20} />
              </div>
              <div className="w-12 h-12 rounded-full bg-sky-500/90 flex items-center justify-center text-white shadow-lg cursor-pointer">
                <MessageCircle size={20} />
              </div>
              <div className="w-12 h-12 rounded-full bg-amber-500/90 flex items-center justify-center text-white shadow-lg cursor-pointer">
                <Search size={20} />
              </div>
              <div className="w-12 h-12 rounded-full bg-indigo-500/90 flex items-center justify-center text-white shadow-lg cursor-pointer">
                <span>📸</span>
              </div>
            </div>

            {/* Exit Home Screen Mode Button */}
            <button
              type="button"
              onClick={onToggleHomeScreenMode}
              className="absolute top-12 right-4 px-3 py-1.5 rounded-xl bg-black/60 border border-white/20 text-white/80 hover:text-white text-xs flex items-center gap-1.5 cursor-pointer backdrop-blur-md"
              title="ফুল অ্যাসিস্ট্যান্টে ফিরে যান"
            >
              <Maximize2 size={13} />
              <span>ফুল স্ক্রিন</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 2. Draggable Floating Circular Icon Overlay */}
      {/* Positioned initially in lower-right area matching the green circle in IMG_20260930_141238.jpg */}
      <motion.div
        drag
        dragMomentum={false}
        dragElastic={0.08}
        onDragStart={() => setIsDragging(true)}
        onDragEnd={(_, info) => {
          setIsDragging(false);
          setPosition((prev) => ({
            x: prev.x + info.offset.x,
            y: prev.y + info.offset.y,
          }));
        }}
        className="fixed z-50 cursor-grab active:cursor-grabbing select-none touch-none"
        style={{
          right: isHomeScreenMode ? "32px" : "18px",
          bottom: isHomeScreenMode ? "95px" : "110px",
        }}
        animate={{
          x: position.x,
          y: position.y,
        }}
        transition={{ type: "spring", stiffness: 350, damping: 25 }}
      >
        <div className="relative group">
          {/* Subtle Outer Pulsing Waveform Ring (Only runs when Zara is speaking) */}
          <AnimatePresence>
            {isSpeaking && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{
                  opacity: [0.5, 0.9, 0.5],
                  scale: [1, 1.22, 1],
                }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{
                  duration: 1.6,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
                className="absolute -inset-3 rounded-full bg-gradient-to-tr from-cyan-500/30 via-pink-500/30 to-purple-500/20 blur-md pointer-events-none"
              />
            )}
          </AnimatePresence>

          {/* Secondary Ripple Aura */}
          {isSpeaking && (
            <motion.div
              animate={{
                scale: [1, 1.35, 1.5],
                opacity: [0.6, 0.25, 0],
              }}
              transition={{
                duration: 2.0,
                repeat: Infinity,
                ease: "easeOut",
              }}
              className="absolute -inset-1 rounded-full border border-cyan-400/60 pointer-events-none"
            />
          )}

          {/* Main Floating Circular Icon Container */}
          <motion.div
            animate={
              isSpeaking
                ? {
                    // Slow Up-Down floating translation
                    y: [0, -8, 0],
                    // Subtle breathing pulse scale
                    scale: [1, 1.06, 1],
                  }
                : {
                    // When speech stops, strictly rest at baseline
                    y: 0,
                    scale: 1,
                  }
            }
            transition={
              isSpeaking
                ? {
                    duration: 1.8,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }
                : {
                    duration: 0.35,
                    ease: "easeOut",
                  }
            }
            onClick={() => {
              // Only trigger tap when not dragging
              if (!isDragging) {
                onOpenAssistant();
              }
            }}
            className={`w-14 h-14 sm:w-16 sm:h-16 rounded-full p-0.5 relative transition-all duration-300 cursor-pointer overflow-hidden ${
              isSpeaking
                ? "shadow-[0_0_22px_rgba(6,182,212,0.9),0_0_36px_rgba(236,72,153,0.55)] border-2 border-cyan-300 ring-2 ring-pink-500/50"
                : "shadow-[0_0_14px_rgba(0,0,0,0.6)] border border-cyan-400/40 hover:border-pink-400/80 bg-black/60"
            }`}
            title="জারাকে খুলতে ট্যাপ করুন (টেনে যেকোনো জায়গায় রাখা যাবে)"
          >
            {/* Background Glow */}
            <div className="absolute inset-0 bg-gradient-to-tr from-cyan-950 via-slate-900 to-pink-950 rounded-full" />

            {/* Official Zara Logo Avatar */}
            <img
              src={idleAvatar}
              alt="Zara Assistant"
              className={`w-full h-full object-cover rounded-full pointer-events-none transition-transform duration-300 ${
                isSpeaking ? "scale-105 brightness-110" : "opacity-90"
              }`}
            />

            {/* Audio Waveform Bars (Vertical glowing bars matching user's reference image) */}
            <AnimatePresence>
              {isSpeaking && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 bg-black/25 backdrop-blur-[0.5px] rounded-full flex items-center justify-center gap-0.5 px-2 pointer-events-none"
                >
                  {[0.5, 0.9, 1.2, 0.8, 0.4].map((multiplier, idx) => (
                    <motion.div
                      key={idx}
                      animate={{
                        height: [
                          `${Math.max(4, 8 * multiplier)}px`,
                          `${Math.max(8, 22 * multiplier * normalizedLevel)}px`,
                          `${Math.max(4, 6 * multiplier)}px`,
                        ],
                      }}
                      transition={{
                        duration: 0.4 + idx * 0.08,
                        repeat: Infinity,
                        repeatType: "reverse",
                        ease: "easeInOut",
                      }}
                      className="w-1 rounded-full bg-gradient-to-t from-cyan-400 to-pink-400 shadow-[0_0_6px_#06b6d4]"
                    />
                  ))}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Speaking Status Mini Dot */}
            <div className="absolute bottom-1 right-1 flex h-2.5 w-2.5">
              {isSpeaking ? (
                <>
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-300 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-cyan-400 shadow-[0_0_6px_#06b6d4]"></span>
                </>
              ) : (
                <span className="relative inline-flex rounded-full h-2 w-2 bg-pink-400/80"></span>
              )}
            </div>
          </motion.div>

          {/* Quick Drag Hint on Hover / Touch */}
          <div className="absolute -top-6 left-1/2 -translate-x-1/2 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity bg-black/80 px-2 py-0.5 rounded-full text-[9px] text-white/80 whitespace-nowrap shadow-md">
            টেনে সরান / ট্যাপে ওপেন
          </div>
        </div>
      </motion.div>
    </>
  );
}
