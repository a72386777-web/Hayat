import React, { useState } from "react";
import { 
  User, 
  Volume2, 
  History, 
  ShieldCheck, 
  Info, 
  ChevronRight, 
  X,
  Lock,
  Cpu,
  Trash2,
  Layers
} from "lucide-react";
import { motion } from "motion/react";
import { AppConfig } from "../types";
import PasswordAuthModal from "./PasswordAuthModal";

interface JaraSettingsMainModalProps {
  config: AppConfig;
  onOpenGeminiLiveApi: () => void;
  onOpenAiGeneration?: () => void;
  onOpenVoiceSelector: () => void;
  onOpenPermissions: () => void;
  onOpenCommandManager?: () => void;
  onOpenHistory: () => void;
  onOpenAccountProfile: () => void;
  onOpenScreenViewing?: () => void;
  onOpenSmsAutoReply?: () => void;
  onOpenSleepMode?: () => void;
  onOpenTopicScript?: () => void;
  showFloatingOverlay?: boolean;
  onToggleFloatingOverlay?: () => void;
  onClearMemory: () => void;
  onClose: () => void;
}

export default function JaraSettingsMainModal({
  config,
  onOpenGeminiLiveApi,
  onOpenVoiceSelector,
  onOpenPermissions,
  onOpenHistory,
  onOpenAccountProfile,
  showFloatingOverlay,
  onToggleFloatingOverlay,
  onClearMemory,
  onClose,
}: JaraSettingsMainModalProps) {
  // Password protection state - for Profile settings
  const [protectedModal, setProtectedModal] = useState<{
    isOpen: boolean;
    title: string;
    action: () => void;
  } | null>(null);

  const handleProtectedClick = (title: string, action: () => void) => {
    setProtectedModal({
      isOpen: true,
      title,
      action,
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex flex-col justify-end sm:justify-center items-center p-0 sm:p-4 text-white">
      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 30, scale: 0.98 }}
        className="w-full max-w-md bg-[#0a0d16] border border-white/10 rounded-t-[32px] sm:rounded-3xl shadow-2xl flex flex-col h-[94dvh] sm:h-[88dvh] overflow-hidden relative"
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-pink-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <span className="text-lg">🤖</span>
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-wide">JARA / JARVIS</h2>
              <p className="text-[11px] text-white/50">Your Personal AI Assistant</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-2xl bg-white/5 hover:bg-white/10 text-white/70 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
            title="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* Subheader */}
        <div className="px-5 pt-3 pb-2 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-white">Settings</h3>
            <p className="text-xs text-white/50 mt-0.5">সব সেটিংস ও নিয়ন্ত্রণ এখন এখানেই</p>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/25 text-[10px] text-cyan-300 font-mono">
            <Lock size={11} />
            <span>PIN Protected (wahed)</span>
          </div>
        </div>

        {/* Scrollable Settings Menu Items (Green marked items removed per user request) */}
        <div className="flex-1 overflow-y-auto px-5 py-2 space-y-2.5">
          {/* 1. GEMINI LIVE API SETTINGS */}
          <div
            onClick={onOpenGeminiLiveApi}
            className="p-4 rounded-2xl bg-gradient-to-r from-cyan-950/80 via-blue-950/60 to-slate-900 border-2 border-cyan-400 shadow-lg shadow-cyan-500/20 flex items-center justify-between cursor-pointer group transition-all hover:scale-[1.01]"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-cyan-500 to-blue-600 text-white flex items-center justify-center shadow-md shadow-cyan-500/40">
                <Cpu size={20} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-xs sm:text-sm font-bold text-white group-hover:text-cyan-200">
                    Gemini Live API Settings
                  </h4>
                  <span className="text-[9px] uppercase px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/40">
                    {config.apiKey ? "Connected" : "Set API"}
                  </span>
                </div>
                <p className="text-[11px] text-cyan-300/80 mt-0.5">
                  জারার সাথে সরাসরি লাইভ কানেক্ট ও এপিআই সেভ
                </p>
              </div>
            </div>
            <ChevronRight size={19} className="text-cyan-300 group-hover:translate-x-0.5 transition-transform" />
          </div>

          {/* 2. Account & Profile (PIN PROTECTED: "wahed") */}
          <div
            onClick={() => handleProtectedClick("Account & Profile (প্রোফাইল সেটিংস)", onOpenAccountProfile)}
            className="p-3.5 rounded-2xl bg-[#121524] border border-white/5 hover:border-white/15 transition-all flex items-center justify-between cursor-pointer group shadow-sm"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-blue-500/15 text-blue-400 flex items-center justify-center">
                <User size={18} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs sm:text-sm font-medium text-white group-hover:text-blue-300">
                    ব্যক্তিগত প্রোফাইল ও কনফিগ (Profile)
                  </span>
                  <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-0.5">
                    <Lock size={9} /> PIN
                  </span>
                </div>
                <span className="text-[10px] text-white/40">মালিকের নাম, এআই চরিত্র ও প্রম্পট কনফিগারেশন</span>
              </div>
            </div>
            <ChevronRight size={17} className="text-white/30 group-hover:text-white transition-colors" />
          </div>

          {/* 3. Voice & Speech */}
          <div
            onClick={onOpenVoiceSelector}
            className="p-3.5 rounded-2xl bg-[#121524] border border-white/5 hover:border-emerald-500/30 transition-all flex items-center justify-between cursor-pointer group shadow-sm"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center">
                <Volume2 size={18} />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs sm:text-sm font-medium text-white group-hover:text-emerald-300">
                  Voice & Speech (কণ্ঠ নির্বাচন)
                </span>
                <span className="text-[10px] text-pink-300 px-2 py-0.5 rounded-full bg-pink-500/15 border border-pink-500/30">
                  {config.voiceName || "Kore"}
                </span>
              </div>
            </div>
            <ChevronRight size={17} className="text-white/30 group-hover:text-white transition-colors" />
          </div>

          {/* 4. Conversation History */}
          <div
            onClick={onOpenHistory}
            className="p-3.5 rounded-2xl bg-[#121524] border border-white/5 hover:border-purple-500/30 transition-all flex items-center justify-between cursor-pointer group shadow-sm"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-purple-500/15 text-purple-400 flex items-center justify-center">
                <History size={18} />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs sm:text-sm font-medium text-white group-hover:text-purple-300">
                  Conversation History (কথোপকথনের ইতিহাস)
                </span>
              </div>
            </div>
            <ChevronRight size={17} className="text-white/30 group-hover:text-white transition-colors" />
          </div>

          {/* 5. Permissions & Security */}
          <div
            onClick={onOpenPermissions}
            className="p-3.5 rounded-2xl bg-[#121524] border border-white/5 hover:border-amber-500/30 transition-all flex items-center justify-between cursor-pointer group shadow-sm"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-500/15 text-amber-400 flex items-center justify-center">
                <ShieldCheck size={18} />
              </div>
              <div>
                <span className="text-xs sm:text-sm font-medium text-white group-hover:text-amber-300 block">
                  Permissions & Security (অ্যাপ পারমিশন)
                </span>
                <span className="text-[10px] text-white/40">মাইক্রোফোন, স্টোরেজ, কল ও সিস্টেম পারমিশন</span>
              </div>
            </div>
            <ChevronRight size={17} className="text-white/30 group-hover:text-white transition-colors" />
          </div>

          {/* 6. Floating Overlay & Home Screen Background Mode */}
          <div
            onClick={onToggleFloatingOverlay}
            className="p-3.5 rounded-2xl bg-gradient-to-r from-pink-950/40 via-purple-950/30 to-cyan-950/40 border border-cyan-500/30 hover:border-cyan-400 transition-all flex items-center justify-between cursor-pointer group shadow-sm"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-cyan-500/20 text-cyan-300 flex items-center justify-center shadow-[0_0_12px_rgba(6,182,212,0.4)]">
                <Layers size={18} />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs sm:text-sm font-bold text-white group-hover:text-cyan-200 block">
                    ফ্লোটিং ওভারলে বাবল (Floating Icon)
                  </span>
                  <span className="text-[9px] bg-cyan-500/20 text-cyan-300 px-1.5 py-0.5 rounded font-mono border border-cyan-500/40">
                    {showFloatingOverlay !== false ? "Active" : "Off"}
                  </span>
                </div>
                <span className="text-[10px] text-cyan-200/70">
                  হোম স্ক্রিন ও অন্য অ্যাপের ওপর স্পিকিং অ্যানিমেশন ও ড্র্যাগ বাবল
                </span>
              </div>
            </div>
            <ChevronRight size={17} className="text-cyan-400 group-hover:translate-x-0.5 transition-transform" />
          </div>

          {/* 7. Clear Memory */}
          <div
            onClick={onClearMemory}
            className="p-3.5 rounded-2xl bg-[#141018] border border-red-500/20 hover:border-red-500/40 transition-all flex items-center justify-between cursor-pointer group shadow-sm"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-red-500/15 text-red-400 flex items-center justify-center">
                <Trash2 size={18} />
              </div>
              <div>
                <span className="text-xs sm:text-sm font-medium text-red-300 group-hover:text-red-200 block">
                  Clear Memory & Chat (স্মৃতি মুছুন)
                </span>
                <span className="text-[10px] text-white/40">জারার সাথে সব আগের বার্তা ও স্মৃতি সাফ করুন</span>
              </div>
            </div>
            <ChevronRight size={17} className="text-red-400/60 group-hover:text-red-300 transition-colors" />
          </div>

          {/* 7. About JARA */}
          <div
            className="p-3.5 rounded-2xl bg-[#121524] border border-white/5 hover:border-white/15 transition-all flex items-center justify-between cursor-pointer group shadow-sm"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-teal-500/15 text-teal-400 flex items-center justify-center">
                <Info size={18} />
              </div>
              <span className="text-xs sm:text-sm font-medium text-white group-hover:text-teal-300">
                About JARA v2.5 (Super Assistant)
              </span>
            </div>
          </div>
        </div>

        {/* Bottom Navigation Bar */}
        <div className="px-6 py-3 border-t border-white/5 bg-[#080a12] flex items-center justify-between text-xs text-white/50">
          <button 
            onClick={onClose}
            className="flex flex-col items-center gap-1 hover:text-white cursor-pointer"
          >
            <span className="text-base">🏠</span>
            <span className="text-[10px]">Home</span>
          </button>

          <button 
            onClick={onClose}
            className="flex flex-col items-center gap-1 hover:text-white cursor-pointer"
          >
            <span className="text-base">💬</span>
            <span className="text-[10px]">Chat</span>
          </button>

          <button 
            onClick={onOpenHistory}
            className="flex flex-col items-center gap-1 hover:text-white cursor-pointer"
          >
            <span className="text-base">🕒</span>
            <span className="text-[10px]">History</span>
          </button>

          <button 
            className="flex flex-col items-center gap-1 text-cyan-400 font-semibold cursor-pointer"
          >
            <span className="text-base">⚙️</span>
            <span className="text-[10px]">Settings</span>
          </button>
        </div>

        {/* Password Authentication Modal (ONLY FOR PROFILE) */}
        {protectedModal?.isOpen && (
          <PasswordAuthModal
            title={protectedModal.title}
            onSuccess={() => {
              const runAction = protectedModal.action;
              setProtectedModal(null);
              runAction();
            }}
            onClose={() => setProtectedModal(null)}
          />
        )}
      </motion.div>
    </div>
  );
}
