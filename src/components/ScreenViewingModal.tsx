import React, { useState, useRef } from 'react';
import { motion } from 'motion/react';
import { 
  Tv, 
  X, 
  ShieldCheck, 
  Camera, 
  Sparkles, 
  StopCircle, 
  AlertCircle, 
  CheckCircle2,
  Eye,
  EyeOff,
  RefreshCw,
  Send
} from 'lucide-react';
import { AppConfig, ScreenViewingConfig } from '../types';
import { analyzeScreenContent } from '../services/geminiService';

interface ScreenViewingModalProps {
  config: AppConfig;
  onSaveConfig: (updated: AppConfig) => void;
  onClose: () => void;
}

export default function ScreenViewingModal({
  config,
  onSaveConfig,
  onClose,
}: ScreenViewingModalProps) {
  const currentScreenConfig: ScreenViewingConfig = config.screenViewingConfig || {
    enabled: false,
    autoAnalysisEnabled: false,
  };

  const [enabled, setEnabled] = useState(currentScreenConfig.enabled);
  const [capturing, setCapturing] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [userQuery, setUserQuery] = useState("");
  const [analysisResult, setAnalysisResult] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const streamRef = useRef<MediaStream | null>(null);

  const handleToggleScreen = async (newVal: boolean) => {
    setEnabled(newVal);
    if (!newVal) {
      // Stop capture immediately
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
      setCapturing(false);
      setCapturedImage(null);
    }
  };

  const handleCaptureScreen = async () => {
    setErrorMsg("");
    setAnalysisResult(null);

    try {
      if (!navigator.mediaDevices || !(navigator.mediaDevices as any).getDisplayMedia) {
        setErrorMsg("আপনার ব্রাউজারে স্ক্রিন ক্যাপচার এপিআই সক্রিয় নেই।");
        return;
      }

      setCapturing(true);
      const stream = await (navigator.mediaDevices as any).getDisplayMedia({
        video: { displaySurface: "monitor" },
        audio: false,
      });

      streamRef.current = stream;

      const track = stream.getVideoTracks()[0];
      const imageCapture = (window as any).ImageCapture ? new (window as any).ImageCapture(track) : null;

      if (imageCapture) {
        const bitmap = await imageCapture.grabFrame();
        const canvas = document.createElement("canvas");
        canvas.width = bitmap.width;
        canvas.height = bitmap.height;
        const ctx = canvas.getContext("2d");
        ctx?.drawImage(bitmap, 0, 0);
        const dataUrl = canvas.toDataURL("image/jpeg", 0.8);
        setCapturedImage(dataUrl);
      } else {
        // Fallback using video element
        const video = document.createElement("video");
        video.srcObject = stream;
        video.play();
        await new Promise((r) => setTimeout(r, 600));

        const canvas = document.createElement("canvas");
        canvas.width = video.videoWidth || 1280;
        canvas.height = video.videoHeight || 720;
        const ctx = canvas.getContext("2d");
        ctx?.drawImage(video, 0, 0);
        const dataUrl = canvas.toDataURL("image/jpeg", 0.8);
        setCapturedImage(dataUrl);
      }

      // Stop tracks after single frame grab
      stream.getTracks().forEach((t: any) => t.stop());
      streamRef.current = null;
      setCapturing(false);
    } catch (e: any) {
      console.warn("Screen capture cancelled or error", e);
      setCapturing(false);
      if (e.name !== "NotAllowedError") {
        setErrorMsg("স্ক্রিন ক্যাপচার শুরু করা সম্ভব হয়নি।");
      }
    }
  };

  const handleAnalyze = async () => {
    if (!capturedImage) return;
    setAnalyzing(true);
    setErrorMsg("");

    try {
      const result = await analyzeScreenContent(capturedImage, userQuery, config);
      setAnalysisResult(result);
    } catch (e) {
      setErrorMsg("স্ক্রিন বিশ্লেষণ সম্পন্ন করা সম্ভব হয়নি।");
    } finally {
      setAnalyzing(false);
    }
  };

  const handleSave = () => {
    const updated: AppConfig = {
      ...config,
      screenViewingConfig: {
        enabled,
        autoAnalysisEnabled: currentScreenConfig.autoAnalysisEnabled,
        lastCapturedTimestamp: capturedImage ? Date.now() : undefined,
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
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-pink-500 via-rose-500 to-amber-500 flex items-center justify-center shadow-lg shadow-pink-500/20">
              <Tv className="text-white" size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-base font-semibold text-white tracking-wide">
                  রিয়েলটাইম স্ক্রিন ভিউয়িং (Screen Viewing)
                </h2>
                {enabled && (
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-semibold">
                    সক্রিয়
                  </span>
                )}
              </div>
              <p className="text-[11px] sm:text-xs text-white/50">
                MediaProjection সম্মতি নিয়ে স্ক্রিন দেখা ও সহায়তা
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
              <div className="text-sm font-semibold text-white">স্ক্রিন ভিউয়িং সক্ষম করুন</div>
              <p className="text-[11px] text-white/50 mt-0.5">
                কখনোই গোপনে রেকর্ড করা হয় না। শুধুমাত্র আপনার নির্দেশে স্ক্রিন দেখে উত্তর দেয়।
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={enabled}
                onChange={(e) => handleToggleScreen(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-white/20 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-pink-500"></div>
            </label>
          </div>

          {/* Privacy Note */}
          <div className="p-3.5 bg-pink-500/10 border border-pink-500/25 rounded-2xl space-y-1 text-[11px] leading-relaxed">
            <div className="flex items-center gap-1.5 text-pink-300 font-semibold">
              <ShieldCheck size={14} />
              <span>জিরো-সার্ভেইলেন্স সিকিউরিটি আর্কিটেকচার:</span>
            </div>
            <p className="text-white/80">
              অ্যান্ড্রয়েড <strong>MediaProjection</strong> নিয়মানুযায়ী ব্যবহারকারীর অনুমতি ছাড়া কোনো ফ্রেম নেওয়া হয় না। আপনি যখনই ফিচারটি বন্ধ করবেন, সাথে সাথে সকল ফ্রেম ক্যাপচারিং চিরতরে থেমে যাবে।
            </p>
          </div>

          {/* Live Capture & Ask Zara Box */}
          {enabled && (
            <div className="p-4 bg-black/50 border border-white/10 rounded-2xl space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-white flex items-center gap-1.5">
                  <Camera size={14} className="text-amber-400" />
                  স্ক্রিনের বর্তমান দৃশ্য ক্যাপচার
                </span>
                <button
                  type="button"
                  onClick={handleCaptureScreen}
                  disabled={capturing}
                  className="px-3 py-1.5 bg-gradient-to-r from-pink-500 to-rose-500 hover:brightness-110 text-white rounded-xl font-semibold text-[11px] flex items-center gap-1 shadow-md active:scale-95 transition-all cursor-pointer"
                >
                  {capturing ? (
                    <>
                      <RefreshCw size={12} className="animate-spin" />
                      <span>অনুমতি নেওয়া হচ্ছে...</span>
                    </>
                  ) : (
                    <>
                      <Eye size={12} />
                      <span>স্ক্রিন শেয়ার ও ফ্রেম নিন</span>
                    </>
                  )}
                </button>
              </div>

              {capturedImage && (
                <div className="space-y-2 pt-2 border-t border-white/5">
                  <div className="relative rounded-xl overflow-hidden border border-white/10 max-h-48 bg-black flex items-center justify-center">
                    <img
                      src={capturedImage}
                      alt="Captured screen frame"
                      className="w-full h-auto object-contain max-h-48"
                    />
                    <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-black/70 text-[10px] text-white/80">
                      ফ্রেম প্রস্তুত
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={userQuery}
                      onChange={(e) => setUserQuery(e.target.value)}
                      placeholder="জারাকে জিজ্ঞেস করুন (যেমন: এই পেজে কী লেখা আছে?)..."
                      className="flex-1 bg-black/60 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder:text-white/30"
                    />
                    <button
                      type="button"
                      onClick={handleAnalyze}
                      disabled={analyzing}
                      className="px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl font-semibold text-xs flex items-center gap-1.5 shadow-md active:scale-95 transition-all cursor-pointer"
                    >
                      {analyzing ? (
                        <>
                          <RefreshCw size={13} className="animate-spin" />
                          <span>বিশ্লেষণ...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles size={13} />
                          <span>জিজ্ঞেস করুন</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}

              {analysisResult && (
                <div className="p-3 rounded-xl bg-pink-500/15 border border-pink-500/30 text-white/95 text-[11px] leading-relaxed">
                  <div className="font-semibold text-pink-300 mb-1 flex items-center gap-1">
                    <Sparkles size={12} />
                    <span>জারার মিষ্টি উত্তর:</span>
                  </div>
                  <p>{analysisResult}</p>
                </div>
              )}

              {errorMsg && (
                <div className="p-2 rounded-lg bg-red-500/20 text-red-300 text-[11px]">
                  {errorMsg}
                </div>
              )}
            </div>
          )}
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
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-pink-500 to-rose-600 hover:brightness-110 active:scale-95 text-white font-semibold text-xs sm:text-sm shadow-lg shadow-pink-500/25 flex items-center gap-1.5 transition-all"
          >
            <CheckCircle2 size={16} />
            <span>সংরক্ষণ করুন</span>
          </button>
        </div>
      </motion.div>
    </div>
  );
}
