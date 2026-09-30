import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  MessageSquare, 
  X, 
  ShieldAlert, 
  CheckCircle2, 
  Send, 
  Clock, 
  Sparkles, 
  AlertTriangle,
  Play,
  Briefcase,
  Building2
} from 'lucide-react';
import { AppConfig, SmsSafetyConfig, SmsMessageRecord } from '../types';
import { evaluateSmsSafety, recordSmsReplySent } from '../services/smsSafetyService';
import { generateSmsAutoReply } from '../services/geminiService';

interface SmsAutoReplyModalProps {
  config: AppConfig;
  onSaveConfig: (updated: AppConfig) => void;
  onClose: () => void;
}

export default function SmsAutoReplyModal({
  config,
  onSaveConfig,
  onClose,
}: SmsAutoReplyModalProps) {
  const currentSmsConfig: SmsSafetyConfig = config.smsSafetyConfig || {
    autoReplyEnabled: false,
    fallbackReply: `আসসালামু আলাইকুম। ${config.userName || "ওয়াহেদ"} এখন একটু ব্যস্ত আছেন। পরে যোগাযোগ করবেন। ধন্যবাদ!`,
    useGeminiReply: true,
    rateLimitMinutes: 10,
    quietHoursEnabled: false,
    quietHoursStart: "09:00",
    quietHoursEnd: "18:00",
    quietHoursTone: "professional",
    quietHoursReplyTemplate: `আসসালামু আলাইকুম। ${config.userName || "ওয়াহেদ"} বর্তমানে গুরুত্বপূর্ণ কর্মব্যস্ততায় আছেন। কাজ শেষে যোগাযোগ করবেন। ধন্যবাদ।`,
  };

  const [enabled, setEnabled] = useState(currentSmsConfig.autoReplyEnabled);
  const [useGemini, setUseGemini] = useState(currentSmsConfig.useGeminiReply);
  const [fallbackText, setFallbackText] = useState(currentSmsConfig.fallbackReply);
  const [rateLimit, setRateLimit] = useState(currentSmsConfig.rateLimitMinutes);

  // Quiet Hours / Work Mode state
  const [quietHoursEnabled, setQuietHoursEnabled] = useState(currentSmsConfig.quietHoursEnabled || false);
  const [quietHoursStart, setQuietHoursStart] = useState(currentSmsConfig.quietHoursStart || "09:00");
  const [quietHoursEnd, setQuietHoursEnd] = useState(currentSmsConfig.quietHoursEnd || "18:00");
  const [quietHoursTone, setQuietHoursTone] = useState<"formal" | "professional" | "minimal" | "sassy">(
    currentSmsConfig.quietHoursTone || "professional"
  );
  const [quietHoursTemplate, setQuietHoursTemplate] = useState(
    currentSmsConfig.quietHoursReplyTemplate ||
    `আসসালামু আলাইকুম। ${config.userName || "ওয়াহেদ"} বর্তমানে গুরুত্বপূর্ণ কর্মব্যস্ততায় আছেন। কাজ শেষে যোগাযোগ করবেন। ধন্যবাদ।`
  );

  // Simulation test state
  const [simSender, setSimSender] = useState("+8801712345678");
  const [simBody, setSimBody] = useState("কেমন আছেন? জরুরি একটা কথা ছিল।");
  const [simResult, setSimResult] = useState<SmsMessageRecord | null>(null);
  const [testing, setTesting] = useState(false);

  const handleSave = () => {
    const updated: AppConfig = {
      ...config,
      smsSafetyConfig: {
        autoReplyEnabled: enabled,
        useGeminiReply: useGemini,
        fallbackReply: fallbackText.trim(),
        rateLimitMinutes: rateLimit,
        quietHoursEnabled,
        quietHoursStart,
        quietHoursEnd,
        quietHoursTone,
        quietHoursReplyTemplate: quietHoursTemplate.trim(),
      },
    };
    onSaveConfig(updated);
    onClose();
  };

  const handleRunSimulation = async () => {
    setTesting(true);
    setSimResult(null);

    const evaluation = evaluateSmsSafety(simSender, simBody, rateLimit);

    if (!evaluation.shouldReply) {
      setSimResult({
        id: Date.now().toString(),
        sender: simSender,
        body: simBody,
        timestamp: Date.now(),
        status: evaluation.isSensitive ? "blocked_sensitive" : "blocked_rate_limit",
        reason: evaluation.blockReason,
      });
      setTesting(false);
      return;
    }

    let reply = quietHoursEnabled ? quietHoursTemplate : fallbackText;
    if (useGemini && config.apiKey) {
      reply = await generateSmsAutoReply(
        simSender,
        simBody,
        false,
        config,
        quietHoursEnabled,
        quietHoursTone
      );
    }

    recordSmsReplySent(simSender);

    setSimResult({
      id: Date.now().toString(),
      sender: simSender,
      body: simBody,
      timestamp: Date.now(),
      status: "replied",
      replySent: reply,
    });
    setTesting(false);
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
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-cyan-500 via-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
              <MessageSquare className="text-white" size={20} />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-semibold text-white tracking-wide">
                এসএমএস অটো-রিপ্লাই ও সুরক্ষা (SMS Auto-Reply)
              </h2>
              <p className="text-[11px] sm:text-xs text-white/50">
                OTP ও ব্যাংকিং সুরক্ষাসহ নিরাপদ স্বয়ংক্রিয় উত্তর
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
              <div className="text-sm font-semibold text-white">এসএমএস অটো-রিপ্লাই চালু করুন</div>
              <p className="text-[11px] text-white/50 mt-0.5">
                আগত মেসেজ পরীক্ষা করে নিরাপদ হলে স্বয়ংক্রিয় ভদ্র উত্তর পাঠাবে।
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={enabled}
                onChange={(e) => setEnabled(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-white/20 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cyan-500"></div>
            </label>
          </div>

          {/* Safety Rules Highlight Card */}
          <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/25 rounded-2xl space-y-1.5">
            <div className="flex items-center gap-2 text-emerald-300 font-semibold text-xs">
              <ShieldAlert size={15} />
              <span>বিল্ট-ইন জিরো-রিস্ক নিরাপত্তা ফিল্টার:</span>
            </div>
            <ul className="text-[11px] text-white/80 space-y-1 list-disc pl-4 leading-relaxed">
              <li><strong>ওটিপি ও সিকিউরিটি কোড:</strong> কখনই কোনো ওটিপি বা ২-ফ্যাক্টর কোডে উত্তর যাবে না।</li>
              <li><strong>ব্যাংকিং ও লেনদেন:</strong> বিকাশ, নগদ, ব্যাংক বা কার্ড সংক্রান্ত মেসেজে পুরোপুরি নিস্ক্রিয়।</li>
              <li><strong>লুপ ও স্প্যাম প্রতিরোধ:</strong> একই নম্বরে বারবার উত্তর যাওয়া ও লুপ সৃষ্টি কঠোরভাবে বন্ধ।</li>
            </ul>
          </div>

          {/* AI vs Static Fallback */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="font-semibold text-white/90 flex items-center gap-1.5">
                <Sparkles size={14} className="text-pink-400" />
                জারার এআই দিয়ে মিষ্টি উত্তর তৈরি
              </label>
              <input
                type="checkbox"
                checked={useGemini}
                onChange={(e) => setUseGemini(e.target.checked)}
                className="accent-pink-500 w-4 h-4 cursor-pointer"
              />
            </div>
            <p className="text-[11px] text-white/50">
              চালু রাখলে জারা প্রম্পট ও পরিস্থিতি বুঝে প্রেরককে অত্যন্ত মিষ্টি ও সংক্ষেপে উত্তর দেবে।
            </p>
          </div>

          {/* Fallback Template */}
          <div className="space-y-1.5">
            <label className="font-semibold text-white/90">ডিফল্ট ফলব্যাক মেসেজ (Fallback Reply)</label>
            <textarea
              value={fallbackText}
              onChange={(e) => setFallbackText(e.target.value)}
              rows={2}
              className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-xs text-white placeholder:text-white/30 focus:outline-none focus:border-cyan-500 font-sans"
            />
          </div>

          {/* Quiet Hours / Work Mode Scheduling & Formal Tone */}
          <div className="p-3.5 bg-gradient-to-r from-blue-950/30 to-indigo-950/30 border border-blue-500/30 rounded-2xl space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Briefcase size={16} className="text-blue-400" />
                <div>
                  <span className="font-semibold text-xs sm:text-sm text-white block">
                    অফিস ও কাজের সময় (Work Mode / Quiet Hours)
                  </span>
                  <span className="text-[10px] text-blue-200/70">
                    নির্ধারিত কর্মসময়ে স্যাসি ভাব বন্ধ করে ফরমাল ও পেশাদার রিপ্লাই দেবে
                  </span>
                </div>
              </div>

              <input
                type="checkbox"
                checked={quietHoursEnabled}
                onChange={(e) => setQuietHoursEnabled(e.target.checked)}
                className="accent-blue-500 w-4 h-4 cursor-pointer"
              />
            </div>

            {quietHoursEnabled && (
              <div className="space-y-2.5 pt-1 border-t border-white/10">
                {/* Time Range Pickers */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="text-[11px] text-white/70">শুরুর সময় (Start Time)</label>
                    <input
                      type="time"
                      value={quietHoursStart}
                      onChange={(e) => setQuietHoursStart(e.target.value)}
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-blue-400"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] text-white/70">শেষ সময় (End Time)</label>
                    <input
                      type="time"
                      value={quietHoursEnd}
                      onChange={(e) => setQuietHoursEnd(e.target.value)}
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-blue-400"
                    />
                  </div>
                </div>

                {/* Response Tone Selector */}
                <div className="space-y-1">
                  <label className="text-[11px] text-white/70">কাজের সময়ের টোন (Response Tone):</label>
                  <div className="grid grid-cols-3 gap-1.5">
                    {[
                      { id: "professional", label: "👔 পেশাদার", desc: "Professional" },
                      { id: "formal", label: "💼 ফরমাল", desc: "Corporate" },
                      { id: "minimal", label: "🕊️ সংক্ষিপ্ত", desc: "Minimal" },
                    ].map((t) => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => setQuietHoursTone(t.id as any)}
                        className={`p-2 rounded-xl border text-center transition-all cursor-pointer ${
                          quietHoursTone === t.id
                            ? "bg-blue-500/25 border-blue-400 text-white shadow-sm"
                            : "bg-black/30 border-white/10 text-white/60 hover:text-white"
                        }`}
                      >
                        <span className="text-[11px] font-semibold block">{t.label}</span>
                        <span className="text-[9px] text-white/40">{t.desc}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Work Mode Custom Reply Template */}
                <div className="space-y-1">
                  <label className="text-[11px] text-white/70">কাজের সময়ের ফলব্যাক মেসেজ:</label>
                  <textarea
                    value={quietHoursTemplate}
                    onChange={(e) => setQuietHoursTemplate(e.target.value)}
                    rows={2}
                    placeholder="কাজের সময়ের মেসেজ..."
                    className="w-full bg-black/40 border border-white/10 rounded-xl p-2.5 text-xs text-blue-100 placeholder:text-white/30 focus:outline-none focus:border-blue-400 font-sans"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Rate Limit Slider */}
          <div className="p-3 bg-white/[0.02] border border-white/5 rounded-xl space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-white/80 flex items-center gap-1.5">
                <Clock size={13} className="text-cyan-400" />
                একই নম্বরে পুনরাবৃত্তি বিরতি
              </span>
              <span className="font-semibold text-cyan-300">{rateLimit} মিনিট</span>
            </div>
            <input
              type="range"
              min="5"
              max="60"
              step="5"
              value={rateLimit}
              onChange={(e) => setRateLimit(Number(e.target.value))}
              className="w-full h-1 bg-white/20 rounded-full appearance-none cursor-pointer accent-cyan-500"
            />
          </div>

          {/* Live Simulator Test Box */}
          <div className="p-3.5 bg-black/50 border border-white/10 rounded-2xl space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-white flex items-center gap-1.5">
                <Play size={13} className="text-amber-400" />
                নিরাপত্তা ফিল্টার টেস্ট করুন (Live Simulator)
              </span>
              <button
                type="button"
                onClick={handleRunSimulation}
                disabled={testing}
                className="px-3 py-1 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/30 rounded-lg text-[10px] font-semibold transition-all active:scale-95"
              >
                {testing ? "যাচাই হচ্ছে..." : "যাচাই করুন"}
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <input
                type="text"
                value={simSender}
                onChange={(e) => setSimSender(e.target.value)}
                placeholder="প্রেরক (যেমন: +88017... বা bKash)"
                className="bg-black/60 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white"
              />
              <div className="flex gap-1">
                <button
                  type="button"
                  onClick={() => {
                    setSimSender("16247");
                    setSimBody("Your OTP for bKash is 984512. Valid for 3 mins. Do not share.");
                  }}
                  className="px-2 py-1 bg-white/5 hover:bg-white/10 rounded text-[10px] text-white/60 truncate"
                >
                  ওটিপি স্যাম্পল
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSimSender("+8801999999999");
                    setSimBody("দোস্ত তুই এখন কই? কল দিস তো ফ্রি হলে।");
                  }}
                  className="px-2 py-1 bg-white/5 hover:bg-white/10 rounded text-[10px] text-white/60 truncate"
                >
                  বন্ধুর মেসেজ
                </button>
              </div>
            </div>

            <input
              type="text"
              value={simBody}
              onChange={(e) => setSimBody(e.target.value)}
              placeholder="মেসেজের টেক্সট..."
              className="w-full bg-black/60 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white"
            />

            {simResult && (
              <div
                className={`p-2.5 rounded-xl border text-[11px] leading-relaxed ${
                  simResult.status === "replied"
                    ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-200"
                    : "bg-red-500/15 border-red-500/30 text-red-200"
                }`}
              >
                <div className="font-semibold flex items-center gap-1.5 mb-1">
                  {simResult.status === "replied" ? (
                    <>
                      <CheckCircle2 size={13} className="text-emerald-400" />
                      <span>অনুমোদিত ও স্বয়ংক্রিয় উত্তর প্রস্তুত:</span>
                    </>
                  ) : (
                    <>
                      <AlertTriangle size={13} className="text-red-400" />
                      <span>ব্লক করা হয়েছে: {simResult.reason}</span>
                    </>
                  )}
                </div>
                {simResult.replySent && (
                  <div className="text-white/90 bg-black/40 p-2 rounded-lg mt-1 italic font-sans">
                    "{simResult.replySent}"
                  </div>
                )}
              </div>
            )}
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
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:brightness-110 active:scale-95 text-white font-semibold text-xs sm:text-sm shadow-lg shadow-cyan-500/25 flex items-center gap-1.5 transition-all"
          >
            <CheckCircle2 size={16} />
            <span>সংরক্ষণ করুন</span>
          </button>
        </div>
      </motion.div>
    </div>
  );
}
