import React from 'react';
import { motion } from 'motion/react';
import { MicOff } from 'lucide-react';

interface Props {
  assistantName?: string;
  onClose: () => void;
  onSwitchToText?: () => void;
}

export default function PermissionModal({ assistantName = "Zara", onClose, onSwitchToText }: Props) {
  const companionName = assistantName?.trim() || "Zara";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="w-full max-w-md bg-[#141620] border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl flex flex-col items-center text-center relative overflow-hidden"
      >
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-pink-500 via-rose-500 to-amber-500" />
        
        <div className="w-16 h-16 rounded-full bg-pink-500/20 flex items-center justify-center mb-5">
          <MicOff size={30} className="text-pink-400" />
        </div>
        
        <h2 className="text-xl sm:text-2xl font-semibold text-white mb-2">মাইক্রোফোন অনুমতি প্রয়োজন</h2>
        <p className="text-white/60 text-xs sm:text-sm mb-5 leading-relaxed">
          আপনার ব্রাউজারে বা ডিভাইসে মাইক্রোফোনের অনুমতি দেওয়া হয়নি। আপনি অনুমতি দিয়ে কথা বলতে পারেন, অথবা সরাসরি চ্যাট/কুইক কথায় যোগাযোগ করতে পারেন।
        </p>
        
        <div className="bg-white/5 border border-white/10 rounded-2xl p-4 text-left w-full mb-6">
          <p className="text-xs sm:text-sm text-pink-300 font-medium mb-2">অনুমতি চালুর সহজ উপায়:</p>
          <ol className="text-xs text-white/70 list-decimal pl-4 space-y-1.5 leading-relaxed">
            <li>ব্রাউজারের অ্যাড্রেস বারের শুরুতে <strong>লক আইকন (🔒)</strong> বা <strong>টিউন আইকন (⚙️)</strong> এ ট্যাপ করুন।</li>
            <li><strong>Microphone (মাইক্রোফোন)</strong> অপশনে গিয়ে <strong>Allow</strong> সিলেক্ট করুন।</li>
            <li>তারপর পেজটি রিফ্রেশ করুন।</li>
          </ol>
        </div>
        
        <div className="flex flex-col w-full gap-2.5">
          <button 
            type="button"
            onClick={() => window.location.reload()}
            className="w-full py-3 px-4 bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white font-medium rounded-xl transition-all shadow-lg shadow-pink-500/20 cursor-pointer active:scale-95 text-sm"
          >
            অনুমতি দিয়েছি, পেজ রিফ্রেশ করুন
          </button>
          {onSwitchToText && (
            <button 
              type="button"
              onClick={onSwitchToText}
              className="w-full py-2.5 px-4 bg-pink-500/20 hover:bg-pink-500/30 text-pink-300 border border-pink-500/30 font-medium rounded-xl transition-colors cursor-pointer text-xs sm:text-sm"
            >
              💬 মাইক্রোফোন ছাড়াই লিখুন ও কুইক কথা বলুন
            </button>
          )}
          <button 
            type="button"
            onClick={onClose}
            className="w-full py-2 px-4 bg-white/5 hover:bg-white/10 text-white/70 font-medium rounded-xl transition-colors cursor-pointer text-xs sm:text-sm"
          >
            বন্ধ করুন
          </button>
        </div>
      </motion.div>
    </div>
  );
}
