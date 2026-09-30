import React, { useState } from "react";
import { motion } from "motion/react";
import { Mic, MicOff, Volume2, X, Move } from "lucide-react";
import { AppState } from "../types";

interface FloatingBackgroundOverlayProps {
  state: AppState;
  isSessionActive: boolean;
  onToggleListening: () => void;
  onClose: () => void;
}

export default function FloatingBackgroundOverlay({
  state,
  isSessionActive,
  onToggleListening,
  onClose,
}: FloatingBackgroundOverlayProps) {
  const [position, setPosition] = useState({ x: 20, y: 120 });
  const [isExpanded, setIsExpanded] = useState(false);

  // Speed and glow calculations matching JARVIS Core
  const isSpeaking = state === "speaking";
  const isListening = state === "listening";

  return (
    <motion.div
      drag
      dragMomentum={false}
      className="fixed z-[9999] touch-none select-none cursor-grab active:cursor-grabbing"
      style={{ left: position.x, top: position.y }}
    >
      <div className="relative group">
        {/* Floating Futuristic Core Widget */}
        <div 
          onClick={() => {
            onToggleListening();
            setIsExpanded(!isExpanded);
          }}
          className={`w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-[#0a0d18]/95 border-2 shadow-2xl flex items-center justify-center transition-all duration-300 relative overflow-hidden backdrop-blur-xl ${
            isSpeaking 
              ? "border-amber-400 shadow-[0_0_35px_rgba(251,191,36,0.8)] scale-105" 
              : isListening 
                ? "border-emerald-400 shadow-[0_0_30px_rgba(52,211,153,0.7)] scale-105" 
                : "border-cyan-500/50 shadow-[0_0_20px_rgba(6,182,212,0.4)] hover:border-cyan-400"
          }`}
          title="JARVIS / ZARA Background Floating Assistant (Drag anywhere)"
        >
          {/* Animated Inner Arc Rings */}
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: isSpeaking ? 2 : isListening ? 4 : 8, repeat: Infinity, ease: "linear" }}
            className="absolute inset-1 rounded-full border border-dashed border-amber-400/60 pointer-events-none"
          />

          <motion.div
            animate={{ rotate: -360 }}
            transition={{ duration: isSpeaking ? 1.5 : 6, repeat: Infinity, ease: "linear" }}
            className="absolute inset-2.5 rounded-full border border-dotted border-cyan-400/80 pointer-events-none"
          />

          {/* Glowing Center Core */}
          <motion.div
            animate={{
              scale: isSpeaking ? [1, 1.25, 0.95, 1.2, 1] : isListening ? [1, 1.1, 1] : [1, 1.05, 1],
              opacity: isSpeaking ? [0.9, 1, 0.9] : [0.8, 1, 0.8],
            }}
            transition={{ duration: isSpeaking ? 0.5 : 2, repeat: Infinity }}
            className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gradient-to-tr from-amber-400 via-rose-500 to-amber-200 flex items-center justify-center shadow-lg relative z-10"
          >
            {isSpeaking ? (
              <Volume2 size={16} className="text-black animate-pulse" />
            ) : isListening ? (
              <Mic size={16} className="text-black" />
            ) : (
              <span className="text-black font-extrabold text-xs">J</span>
            )}
          </motion.div>

          {/* Speaking Audio Wave Ripple */}
          {isSpeaking && (
            <motion.div
              initial={{ scale: 0.8, opacity: 0.8 }}
              animate={{ scale: [0.8, 1.6], opacity: [0.8, 0] }}
              transition={{ duration: 0.9, repeat: Infinity, ease: "easeOut" }}
              className="absolute inset-0 rounded-full border-2 border-amber-400 pointer-events-none"
            />
          )}
        </div>

        {/* Mini close trigger button on hover/tap */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}
          className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-black/80 border border-white/20 text-white/70 hover:text-white flex items-center justify-center text-[10px] cursor-pointer"
          title="ফ্লোটিং বন্ধ করুন"
        >
          <X size={10} />
        </button>

        {/* State Capsule Beneath Floating Bubble */}
        <div className="absolute -bottom-5 left-1/2 -translate-x-1/2 whitespace-nowrap pointer-events-none">
          <span className={`text-[9px] font-mono px-2 py-0.5 rounded-full backdrop-blur-md border uppercase font-bold shadow-lg ${
            isSpeaking 
              ? "bg-amber-500/20 text-amber-300 border-amber-500/40" 
              : isListening 
                ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40 animate-pulse" 
                : "bg-black/80 text-cyan-300 border-cyan-500/30"
          }`}>
            {isSpeaking ? "Speaking..." : isListening ? "Listening..." : "JARVIS Active"}
          </span>
        </div>
      </div>
    </motion.div>
  );
}
