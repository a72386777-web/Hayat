import React, { useState } from "react";
import { KeyRound, Check, Sparkles, AlertCircle, X, ShieldCheck, Cpu, ExternalLink, Zap } from "lucide-react";
import { motion } from "motion/react";
import { AppConfig } from "../types";

interface GeminiLiveApiModalProps {
  config: AppConfig;
  onSave: (updatedConfig: AppConfig) => void;
  onClose: () => void;
}

export default function GeminiLiveApiModal({
  config,
  onSave,
  onClose,
}: GeminiLiveApiModalProps) {
  const [apiKey, setApiKey] = useState(config.apiKey || "");
  const [showKey, setShowKey] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: "success" | "error" | "info"; text: string } | null>(null);
  const [isSaved, setIsSaved] = useState(false);

  const handleTestConnection = async () => {
    const keyToTest = apiKey.trim();
    if (!keyToTest) {
      setStatusMsg({ type: "error", text: "দয়া করে প্রথমে একটি বৈধ Gemini API Key প্রদান করুন।" });
      return;
    }

    setIsTesting(true);
    setStatusMsg({ type: "info", text: "Gemini Live API সংযোগ পরীক্ষা করা হচ্ছে..." });

    try {
      // Test Gemini API endpoint
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models?key=${keyToTest}`
      );

      if (response.ok) {
        setStatusMsg({
          type: "success",
          text: "অভিনন্দন! আপনার Gemini Live API Key সফলভাবে যাচাই হয়েছে এবং সক্রিয় রয়েছে!",
        });
      } else {
        const data = await response.json().catch(() => null);
        const errMsg = data?.error?.message || "অবৈধ API Key অথবা এক্সেস সীমাবদ্ধতা।";
        setStatusMsg({ type: "error", text: `সংযোগ ব্যর্থ: ${errMsg}` });
      }
    } catch (err: any) {
      setStatusMsg({ type: "error", text: "নেটওয়ার্ক ত্রুটি বা সংযোগে সমস্যা। আপনার ইন্টারনেট চেক করুন।" });
    } finally {
      setIsTesting(false);
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const finalKey = apiKey.trim();
    if (!finalKey) {
      setStatusMsg({ type: "error", text: "Gemini API Key খালি রাখা যাবে না।" });
      return;
    }

    const updated: AppConfig = {
      ...config,
      apiKey: finalKey,
    };

    onSave(updated);
    setIsSaved(true);
    setStatusMsg({
      type: "success",
      text: "API Key সফলভাবে সংরক্ষিত হয়েছে! জারা এখন সরাসরি লাইভ মোডে কার্যকর থাকবে।",
    });

    setTimeout(() => {
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex flex-col justify-end sm:justify-center items-center p-0 sm:p-4 text-white">
      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 30, scale: 0.98 }}
        className="w-full max-w-lg bg-[#0a0d18] border border-cyan-500/40 rounded-t-[32px] sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden relative"
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between bg-[#0e1426]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/30">
              <Cpu size={22} className="text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm sm:text-base font-bold text-white">Gemini Live API Settings</h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                  LIVE AI
                </span>
              </div>
              <p className="text-[11px] text-white/50">জারার লাইভ ভয়েস, ব্রেইন ও ফাংশন নিয়ন্ত্রণ এপিআই</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {/* Content Body */}
        <form onSubmit={handleSave} className="p-5 space-y-4">
          <div className="p-3.5 rounded-2xl bg-gradient-to-r from-blue-950/40 to-cyan-950/40 border border-cyan-500/30 text-xs text-cyan-200/90 leading-relaxed flex items-start gap-2.5">
            <Zap size={18} className="text-cyan-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-white">সরাসরি লাইভ কানেকশন:</p>
              <p className="text-[11px] text-cyan-300/80 mt-0.5">
                এখানে আপনার Gemini API Key বসালে জারা সম্পূর্ণ লাইভ হয়ে যাবে। এটি তাৎক্ষণিকভাবে আপনার কথা শুনে রিয়েলটাইমে উত্তর দেওয়া, স্ক্রিন দেখা এবং অ্যান্ড্রয়েড কমান্ড সম্পন্ন করতে পারবে।
              </p>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-white flex items-center gap-1.5">
                <KeyRound size={14} className="text-cyan-400" />
                <span>Gemini API Key</span>
              </label>
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                className="text-[11px] text-cyan-400 hover:text-cyan-300 cursor-pointer"
              >
                {showKey ? "লুকান (Hide)" : "দেখান (Show)"}
              </button>
            </div>

            <input
              type={showKey ? "text" : "password"}
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="AIzaSy..."
              required
              className="w-full bg-[#121728] border border-white/15 focus:border-cyan-400 rounded-xl px-4 py-3 text-white text-xs sm:text-sm font-mono outline-none transition-all shadow-inner"
            />
          </div>

          {/* Status Message */}
          {statusMsg && (
            <motion.div
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                statusMsg.type === "success"
                  ? "bg-emerald-500/20 border border-emerald-500/40 text-emerald-300"
                  : statusMsg.type === "error"
                  ? "bg-rose-500/20 border border-rose-500/40 text-rose-300"
                  : "bg-blue-500/20 border border-blue-500/40 text-blue-300"
              }`}
            >
              {statusMsg.type === "success" ? (
                <Check size={16} className="shrink-0" />
              ) : (
                <AlertCircle size={16} className="shrink-0" />
              )}
              <span>{statusMsg.text}</span>
            </motion.div>
          )}

          {/* Test connection & Instructions link */}
          <div className="flex items-center justify-between pt-1">
            <button
              type="button"
              onClick={handleTestConnection}
              disabled={isTesting}
              className="px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-cyan-300 text-xs font-medium border border-cyan-500/30 flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
            >
              <Sparkles size={14} />
              <span>{isTesting ? "যাচাই করা হচ্ছে..." : "Test Connection (সংযোগ পরীক্ষা)"}</span>
            </button>

            <a
              href="https://aistudio.google.com/app/apikey"
              target="_blank"
              rel="noreferrer"
              className="text-[11px] text-white/50 hover:text-cyan-300 flex items-center gap-1 transition-colors"
            >
              <span>Get API Key</span>
              <ExternalLink size={12} />
            </a>
          </div>

          {/* Action Buttons */}
          <div className="pt-3 border-t border-white/10 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white/80 text-xs font-semibold cursor-pointer"
            >
              বাতিল
            </button>
            <button
              type="submit"
              disabled={isSaved}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold text-xs sm:text-sm shadow-lg shadow-cyan-500/30 cursor-pointer disabled:opacity-50 flex items-center gap-2"
            >
              <Check size={16} />
              <span>{isSaved ? "সংরক্ষিত!" : "Save & Activate Live (সেভ করুন)"}</span>
            </button>
          </div>
        </form>

        {/* Footer info */}
        <div className="px-5 py-3 border-t border-white/5 bg-[#080b14] flex items-center gap-2 text-[10px] text-white/40">
          <ShieldCheck size={13} className="text-emerald-400" />
          <span>API Key সরাসরি ব্রাউজার সিকিউর স্টোরেজে সংরক্ষিত থাকে এবং জারার সাথে লাইভ সংযুক্ত থাকে।</span>
        </div>
      </motion.div>
    </div>
  );
}
