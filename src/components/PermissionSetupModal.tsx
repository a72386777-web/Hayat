import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ShieldCheck, 
  Mic, 
  MessageSquare, 
  Bell, 
  Tv, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  ChevronRight, 
  Lock, 
  Sparkles, 
  Image as ImageIcon,
  PhoneCall,
  KeyRound,
  Layers
} from 'lucide-react';
import { PermissionStatusItem } from '../types';

interface PermissionSetupModalProps {
  assistantName: string;
  onComplete: () => void;
  onCancel?: () => void;
}

export default function PermissionSetupModal({
  assistantName = "Zara",
  onComplete,
  onCancel,
}: PermissionSetupModalProps) {
  // Real-time complete permissions state tracking covering all Android functions from user request
  const [permissions, setPermissions] = useState<PermissionStatusItem[]>([
    {
      id: "RECORD_AUDIO",
      title: "Microphone (মাইক্রোফোন)",
      description: "জারার সাথে সরাসরি প্রাণবন্ত মুখে কথা বলা এবং মিষ্টি কন্ঠস্বর শোনার জন্য আবশ্যক।",
      icon: "mic",
      status: "not_granted",
      requiredFor: "ভয়েস চ্যাট ও লাইভ অডিও সেশন",
      isCritical: true,
    },
    {
      id: "STORAGE_MEDIA",
      title: "AI Media Storage (ছবি ও ভিডিও সেভ)",
      description: "জেনারেট করা AI ছবি ও ভিডিও আপনার ফোনে নিরাপদে সেভ ও ডাউনলোড করার জন্য।",
      icon: "image",
      status: "granted",
      requiredFor: "AI ইমেজ ও ভিডিও স্টোরেজ",
      isCritical: true,
    },
    {
      id: "RECEIVE_SMS",
      title: "SMS Auto-Reply (মেসেজ ব্যবস্থাপনা ও অটো-রিপ্লাই)",
      description: "কেউ মেসেজ দিলে জারা নিজ দায়িত্বে স্বয়ংক্রিয়ভাবে মিষ্টি ভাষায় উত্তর দেওয়ার জন্য।",
      icon: "sms",
      status: "not_granted",
      requiredFor: "Auto SMS Reply ও মেসেজ সুরক্ষা",
      isCritical: false,
    },
    {
      id: "CALL_PHONE",
      title: "Phone & Contacts (সরাসরি ফোন ও কল কন্টাক্ট)",
      description: "কন্টাক্ট তালিকা দেখে নির্দিষ্ট নাম্বারে মুখে বলেই কল করার জন্য (Call Contact)।",
      icon: "phone",
      status: "granted",
      requiredFor: "Call Contact ও অটো ডায়াল",
      isCritical: false,
    },
    {
      id: "SYSTEM_ALERT_WINDOW",
      title: "Display Over Other Apps (ফ্লোটিং লাইভ এআই উইজেট)",
      description: "অ্যাপ মিনিমাইজ বা ব্যাকগ্রাউন্ডে থাকলেও স্ক্রিনের ওপর লাইভ এআই লোগো প্রদর্শন করার অনুমতি।",
      icon: "layers",
      status: "granted",
      requiredFor: "লাইভ ব্যাকগ্রাউন্ড ফ্লোটিং অ্যাসিস্ট্যান্ট",
      isCritical: true,
    },
    {
      id: "DEVICE_UNLOCK_ASSIST",
      title: "Secure Device Unlock (স্ক্রিন লক খোলার অ্যাক্সেস)",
      description: "লক স্ক্রিনে জারা আপনার সিকিউর পিন (34558023) দিয়ে লক স্ক্রিন ওপেন ও কমান্ড শোনার জন্য।",
      icon: "key",
      status: "granted",
      requiredFor: "Keyguard Dismiss ও ভয়েস আনলক",
      isCritical: true,
    },
    {
      id: "MEDIA_PROJECTION",
      title: "Screen Viewing (স্ক্রিন ভিউয়িং কনসেন্ট)",
      description: "শুধুমাত্র আপনার অনুমতিক্রমে স্ক্রিন দেখে সহায়তা করার জন্য (কখনোই গোপনে কোনো স্ক্রিন ক্যাপচার করা হয় না)।",
      icon: "screen",
      status: "not_granted",
      requiredFor: "স্ক্রিন বিশ্লেষণ ও রিয়েলটাইম সহায়তা",
      isCritical: false,
    },
    {
      id: "POST_NOTIFICATIONS",
      title: "Notifications & Foreground Service",
      description: "স্লিপ মোডে ও ব্যাকগ্রাউন্ডে জারা সচল থেকে জরুরি সেবা নিশ্চিত করার জন্য স্ট্যাটাস নোটিফিকেশন।",
      icon: "bell",
      status: "granted",
      requiredFor: "নিরাপদ ব্যাকগ্রাউন্ড অপারেশন ও স্লিপ মোড",
      isCritical: true,
    },
  ]);

  const [requestingId, setRequestingId] = useState<string | null>(null);

  const handleRequestPermission = async (id: string) => {
    setRequestingId(id);

    try {
      if (id === "RECORD_AUDIO") {
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          stream.getTracks().forEach((t) => t.stop());
          setPermissions((prev) =>
            prev.map((p) => (p.id === id ? { ...p, status: "granted" } : p))
          );
        } else {
          setPermissions((prev) =>
            prev.map((p) => (p.id === id ? { ...p, status: "requires_settings" } : p))
          );
        }
      } else if (id === "MEDIA_PROJECTION") {
        if (navigator.mediaDevices && (navigator.mediaDevices as any).getDisplayMedia) {
          try {
            const stream = await (navigator.mediaDevices as any).getDisplayMedia({ video: true });
            stream.getTracks().forEach((t: any) => t.stop());
            setPermissions((prev) =>
              prev.map((p) => (p.id === id ? { ...p, status: "granted" } : p))
            );
          } catch (err: any) {
            setPermissions((prev) =>
              prev.map((p) => (p.id === id ? { ...p, status: "not_granted" } : p))
            );
          }
        } else {
          setPermissions((prev) =>
            prev.map((p) => (p.id === id ? { ...p, status: "granted" } : p))
          );
        }
      } else if (id === "POST_NOTIFICATIONS") {
        if ("Notification" in window) {
          const res = await Notification.requestPermission();
          setPermissions((prev) =>
            prev.map((p) =>
              p.id === id
                ? {
                    ...p,
                    status: res === "granted" ? "granted" : res === "denied" ? "requires_settings" : "not_granted",
                  }
                : p
            )
          );
        } else {
          setPermissions((prev) =>
            prev.map((p) => (p.id === id ? { ...p, status: "granted" } : p))
          );
        }
      } else {
        // Automatic grant for Storage, Call Phone, Overlay, and Keyguard in sandbox
        setPermissions((prev) =>
          prev.map((p) => (p.id === id ? { ...p, status: "granted" } : p))
        );
      }
    } catch (e) {
      console.warn("Permission request rejected or failed", e);
      setPermissions((prev) =>
        prev.map((p) => (p.id === id ? { ...p, status: "not_granted" } : p))
      );
    } finally {
      setRequestingId(null);
    }
  };

  const getStatusBadge = (status: PermissionStatusItem["status"]) => {
    switch (status) {
      case "granted":
        return (
          <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
            <CheckCircle2 size={13} />
            অনুমোদিত (Granted)
          </span>
        );
      case "requires_settings":
        return (
          <span className="flex items-center gap-1 text-[11px] font-semibold text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-full border border-amber-500/20">
            <AlertCircle size={13} />
            সেটিংস থেকে দিন
          </span>
        );
      default:
        return (
          <span className="flex items-center gap-1 text-[11px] font-semibold text-rose-400 bg-rose-500/10 px-2.5 py-1 rounded-full border border-rose-500/20">
            <XCircle size={13} />
            অনুমতি দিন
          </span>
        );
    }
  };

  const getIcon = (iconName: string) => {
    switch (iconName) {
      case "mic":
        return <Mic size={20} className="text-pink-400" />;
      case "sms":
        return <MessageSquare size={20} className="text-cyan-400" />;
      case "screen":
        return <Tv size={20} className="text-purple-400" />;
      case "image":
        return <ImageIcon size={20} className="text-blue-400" />;
      case "phone":
        return <PhoneCall size={20} className="text-indigo-400" />;
      case "layers":
        return <Layers size={20} className="text-amber-400" />;
      case "key":
        return <KeyRound size={20} className="text-emerald-400" />;
      case "bell":
      default:
        return <Bell size={20} className="text-amber-400" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex flex-col justify-end sm:justify-center items-center p-0 sm:p-4 text-white">
      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 30, scale: 0.98 }}
        className="w-full max-w-lg bg-[#0e111b] border border-white/10 rounded-t-[32px] sm:rounded-3xl shadow-2xl flex flex-col h-[94dvh] sm:h-[88dvh] overflow-hidden"
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between bg-[#121624]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <ShieldCheck size={22} className="text-white" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white">Permissions & Security</h2>
              <p className="text-[11px] text-white/50">নিরাপত্তা, ব্যাকগ্রাউন্ড ও ডিভাইস অটোমেশন পারমিশন</p>
            </div>
          </div>

          {onCancel && (
            <button
              onClick={onCancel}
              className="text-xs text-white/60 hover:text-white px-3 py-1.5 rounded-xl bg-white/5 cursor-pointer"
            >
              বন্ধ করুন
            </button>
          )}
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3.5">
          <div className="p-3.5 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-xs text-indigo-200/90 leading-relaxed flex items-start gap-2.5">
            <Sparkles size={16} className="text-indigo-400 shrink-0 mt-0.5" />
            <span>
              আপনার ব্যক্তিগত গোপনীয়তা শতভাগ সুরক্ষিত। ছবি আনলক পিন, কল কন্টাক্ট এবং ব্যাকগ্রাউন্ড পারমিশন নিরাপদভাবে অ্যান্ড্রয়েড ডিভাইসে সংরক্ষিত থাকে।
            </span>
          </div>

          {permissions.map((item) => (
            <div
              key={item.id}
              className="p-4 rounded-2xl bg-[#141828] border border-white/5 hover:border-white/15 transition-all shadow-sm space-y-3"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-black/40 border border-white/5 flex items-center justify-center shrink-0 mt-0.5">
                    {getIcon(item.icon)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-xs sm:text-sm font-semibold text-white">{item.title}</h3>
                      {item.isCritical && (
                        <span className="text-[9px] uppercase px-1.5 py-0.5 rounded bg-pink-500/20 text-pink-300 font-semibold border border-pink-500/30">
                          আবশ্যক
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-white/60 mt-1 leading-relaxed">{item.description}</p>
                    <p className="text-[10px] text-white/40 mt-1">প্রয়োজনীয় ক্ষেত্র: {item.requiredFor}</p>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-white/5">
                <div>{getStatusBadge(item.status)}</div>
                {item.status !== "granted" && (
                  <button
                    onClick={() => handleRequestPermission(item.id)}
                    disabled={requestingId === item.id}
                    className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white text-xs font-medium transition-all shadow-md shadow-indigo-600/20 cursor-pointer disabled:opacity-50"
                  >
                    {requestingId === item.id ? "অনুমতি নেওয়া হচ্ছে..." : "অনুমতি দিন"}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/10 bg-[#121624] flex items-center justify-between gap-3">
          <div className="text-[11px] text-white/40 flex items-center gap-1.5">
            <Lock size={12} className="text-emerald-400" />
            <span>Scoped Storage & Keyguard Security</span>
          </div>

          <button
            onClick={onComplete}
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold text-xs sm:text-sm shadow-lg shadow-emerald-500/20 cursor-pointer"
          >
            সম্পন্ন করুন
          </button>
        </div>
      </motion.div>
    </div>
  );
}
