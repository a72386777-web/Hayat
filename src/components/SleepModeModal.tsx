import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  Moon, 
  X, 
  Clock, 
  CheckCircle2, 
  ShieldCheck, 
  BellOff, 
  MessageSquare,
  Sparkles
} from 'lucide-react';
import { AppConfig, SleepModeConfig } from '../types';
import { isCurrentTimeInSleepRange } from '../services/sleepModeService';

interface SleepModeModalProps {
  config: AppConfig;
  onSaveConfig: (updated: AppConfig) => void;
  onClose: () => void;
}

export default function SleepModeModal({
  config,
  onSaveConfig,
  onClose,
}: SleepModeModalProps) {
  const currentSleepConfig: SleepModeConfig = config.sleepModeConfig || {
    enabled: false,
    startTime: "23:00",
    endTime: "07:00",
    allowEmergencyExceptions: true,
    autoReplyDuringSleep: true,
  };

  const [enabled, setEnabled] = useState(currentSleepConfig.enabled);
  const [startTime, setStartTime] = useState(currentSleepConfig.startTime);
  const [endTime, setEndTime] = useState(currentSleepConfig.endTime);
  const [autoReply, setAutoReply] = useState(currentSleepConfig.autoReplyDuringSleep);
  const [allowEmergency, setAllowEmergency] = useState(currentSleepConfig.allowEmergencyExceptions);

  const currentlyActive = enabled && isCurrentTimeInSleepRange(startTime, endTime);

  const handleSave = () => {
    const updated: AppConfig = {
      ...config,
      sleepModeConfig: {
        enabled,
        startTime,
        endTime,
        allowEmergencyExceptions: allowEmergency,
        autoReplyDuringSleep: autoReply,
      },
    };
    onSaveConfig(updated);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex flex-col justify-end sm:justify-center items-center p-0 sm:p-4 text-white">
      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 30, scale: 0.98 }}
        className="w-full max-w-xl bg-[#141620] border border-white/15 rounded-t-[28px] sm:rounded-3xl shadow-2xl flex flex-col max-h-[92dvh] overflow-hidden relative"
      >
        {/* Mobile handle */}
        <div className="w-12 h-1 bg-white/20 rounded-full mx-auto mt-2 sm:hidden shrink-0" />

        {/* Header */}
        <div className="shrink-0 px-4 py-3 sm:px-6 sm:py-4 border-b border-white/10 bg-[#161824] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <Moon className="text-white" size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-base font-semibold text-white tracking-wide">
                  স্লিপ মোড ও ব্যাকগ্রাউন্ড অপারেশন
                </h2>
                {currentlyActive && (
                  <span className="px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-[10px] font-semibold animate-pulse">
                    বর্তমানে ঘুমন্ত
                  </span>
                )}
              </div>
              <p className="text-[11px] sm:text-xs text-white/50">
                ফোন লক থাকা অবস্থায় ব্যাকগ্রাউন্ডে নিরাপদ স্বয়ংক্রিয় সেবা
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/70 hover:text-white"
          >
            <X size={16} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto overscroll-contain p-4 sm:p-6 space-y-4 text-xs">
          {/* Main Toggle */}
          <div className="p-3.5 bg-white/[0.03] border border-white/10 rounded-2xl flex items-center justify-between">
            <div>
              <div className="text-sm font-semibold text-white">স্লিপ মোড সক্রিয় করুন</div>
              <p className="text-[11px] text-white/50 mt-0.5">
                নির্ধারিত সময়ে ফোন নীরব রাখবে এবং কোনো এসএমএস আসলে ঘুম সংক্রান্ত উত্তর দেবে।
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={enabled}
                onChange={(e) => setEnabled(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-white/20 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-500"></div>
            </label>
          </div>

          {/* Time pickers */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-black/40 border border-white/10 rounded-xl space-y-1">
              <label className="text-white/70 font-semibold flex items-center gap-1.5 text-[11px]">
                <Clock size={13} className="text-indigo-400" />
                ঘুম শুরু (Start Time)
              </label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full bg-transparent border-none text-white font-mono text-sm focus:outline-none"
              />
            </div>
            <div className="p-3 bg-black/40 border border-white/10 rounded-xl space-y-1">
              <label className="text-white/70 font-semibold flex items-center gap-1.5 text-[11px]">
                <Clock size={13} className="text-purple-400" />
                ঘুম শেষ (End Time)
              </label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full bg-transparent border-none text-white font-mono text-sm focus:outline-none"
              />
            </div>
          </div>

          {/* Foreground & Lock Screen Compliance */}
          <div className="p-3.5 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl space-y-2">
            <div className="flex items-center gap-2 text-indigo-300 font-semibold text-xs">
              <ShieldCheck size={15} />
              <span>অ্যান্ড্রয়েড আর্কিটেকচার কমপ্লায়েন্স:</span>
            </div>
            <p className="text-[11px] text-white/80 leading-relaxed">
              স্লিপ মোডে জারা অ্যান্ড্রয়েড <strong>Foreground Service</strong> ও নোটিফিকেশন চ্যানেলের মাধ্যমে পরিচালিত হয়। ফলে স্ক্রিন অফ থাকলেও বা অ্যাপ ব্যাকগ্রাউন্ডে গেলেও সিস্টেম এটি বন্ধ করে দেয় না, এবং কোনো ব্যাটারি অপচয় ছাড়াই সচল থাকে।
            </p>
          </div>

          {/* Checkboxes */}
          <div className="space-y-3 pt-1">
            <label className="flex items-center gap-2.5 p-2 rounded-xl hover:bg-white/5 cursor-pointer">
              <input
                type="checkbox"
                checked={autoReply}
                onChange={(e) => setAutoReply(e.target.checked)}
                className="accent-indigo-500 w-4 h-4 rounded"
              />
              <div>
                <div className="font-semibold text-white/90">ঘুমানোর সময় এসএমএস আসলে স্বয়ংক্রিয় উত্তর</div>
                <div className="text-[11px] text-white/50">
                  "ওয়াহেদ এখন ঘুমে আছেন, সকালে যোগাযোগ করবেন" এই মর্মে ভদ্র উত্তর পাঠাবে।
                </div>
              </div>
            </label>

            <label className="flex items-center gap-2.5 p-2 rounded-xl hover:bg-white/5 cursor-pointer">
              <input
                type="checkbox"
                checked={allowEmergency}
                onChange={(e) => setAllowEmergency(e.target.checked)}
                className="accent-indigo-500 w-4 h-4 rounded"
              />
              <div>
                <div className="font-semibold text-white/90">জরুরি বার্তা সুরক্ষা এক্সেপশন</div>
                <div className="text-[11px] text-white/50">
                  জরুরি বা বারবার কল/মেসেজ আসলে সাইলেন্ট ভেঙে সতর্ক করবে।
                </div>
              </div>
            </label>
          </div>
        </div>

        {/* Footer */}
        <div className="shrink-0 bg-[#161824] border-t border-white/10 px-4 py-3 sm:px-6 sm:py-3.5 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 text-xs font-medium border border-white/10"
          >
            বাতিল
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 via-purple-600 to-pink-600 hover:brightness-110 active:scale-95 text-white font-semibold text-xs sm:text-sm shadow-lg shadow-indigo-500/25 flex items-center gap-1.5 transition-all"
          >
            <CheckCircle2 size={16} />
            <span>সংরক্ষণ করুন</span>
          </button>
        </div>
      </motion.div>
    </div>
  );
}
