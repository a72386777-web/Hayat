import React, { useState } from "react";
import { Lock, KeyRound, ShieldAlert, X, Check, ArrowRight } from "lucide-react";
import { motion } from "motion/react";

interface PasswordAuthModalProps {
  title: string;
  onSuccess: () => void;
  onClose: () => void;
}

export default function PasswordAuthModal({
  title,
  onSuccess,
  onClose,
}: PasswordAuthModalProps) {
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Verify password is exact match "wahed"
    if (password.trim() === "wahed") {
      setErrorMsg("");
      onSuccess();
    } else {
      setErrorMsg("ভুল পাসওয়ার্ড! সঠিক পাসওয়ার্ড না দিলে এই সেটিংসে প্রবেশ নিষিদ্ধ।");
    }
  };

  return (
    <div className="fixed inset-0 z-[60] bg-black/85 backdrop-blur-md flex items-center justify-center p-4 text-white">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="w-full max-w-sm bg-[#0d111e] border border-cyan-500/40 rounded-3xl shadow-2xl p-6 relative overflow-hidden"
      >
        {/* Glow */}
        <div className="absolute -top-12 -right-12 w-32 h-32 rounded-full bg-cyan-500/20 blur-3xl pointer-events-none" />

        <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center">
              <Lock size={18} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Security Check</h3>
              <p className="text-[10px] text-white/50">নিরাপত্তা পাসওয়ার্ড যাচাই</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 text-white/60 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X size={15} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <p className="text-xs text-white/80 leading-relaxed mb-3">
              <strong className="text-cyan-300">"{title}"</strong> সেটিংসে প্রবেশ করতে মালিকের সুরক্ষা পাসওয়ার্ড দিন:
            </p>

            <div className="relative">
              <input
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setErrorMsg("");
                }}
                autoFocus
                placeholder="পাসওয়ার্ড লিখুন..."
                required
                className="w-full bg-[#141a2c] border border-white/15 focus:border-cyan-400 rounded-xl px-4 py-3 text-white text-sm outline-none transition-all pr-10 shadow-inner"
              />
              <KeyRound size={16} className="absolute right-3.5 top-3.5 text-white/30" />
            </div>
          </div>

          {errorMsg && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-2.5 rounded-xl bg-rose-500/20 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2"
            >
              <ShieldAlert size={14} className="shrink-0" />
              <span>{errorMsg}</span>
            </motion.div>
          )}

          <div className="pt-2 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 text-xs font-semibold cursor-pointer"
            >
              বাতিল
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-bold shadow-lg shadow-cyan-500/30 flex items-center gap-1.5 cursor-pointer"
            >
              <span>প্রবেশ করুন</span>
              <ArrowRight size={14} />
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
