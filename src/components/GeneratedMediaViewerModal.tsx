import React, { useState } from "react";
import { 
  ArrowLeft, 
  Download, 
  Share2, 
  RefreshCw, 
  Edit3, 
  Sparkles, 
  Check, 
  ExternalLink,
  Play,
  Pause
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { GenerationHistoryItem } from "../types";

interface GeneratedMediaViewerModalProps {
  item: GenerationHistoryItem;
  onClose: () => void;
  onRegenerate: () => void;
  onEditPrompt: () => void;
}

export default function GeneratedMediaViewerModal({
  item,
  onClose,
  onRegenerate,
  onEditPrompt,
}: GeneratedMediaViewerModalProps) {
  const [copied, setCopied] = useState(false);
  const [isPlaying, setIsPlaying] = useState(true);
  const isVideo = item.type === "video";

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "JARA AI Generated Media",
          text: item.prompt,
          url: item.mediaUrl,
        });
      } catch (e) {
        console.error(e);
      }
    } else {
      navigator.clipboard.writeText(item.mediaUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownload = () => {
    const a = document.createElement("a");
    a.href = item.mediaUrl;
    a.download = `jara-${item.type}-${Date.now()}.${isVideo ? "mp4" : "jpg"}`;
    a.target = "_blank";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex flex-col justify-end sm:justify-center items-center p-0 sm:p-4 text-white">
      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 30, scale: 0.98 }}
        className="w-full max-w-md bg-[#0c0e17] border border-white/10 rounded-t-[32px] sm:rounded-3xl shadow-2xl flex flex-col h-[94dvh] sm:h-[88dvh] overflow-hidden"
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/80 hover:text-white transition-colors cursor-pointer"
            >
              <ArrowLeft size={18} />
            </button>
            <h2 className="text-base font-semibold text-white">
              {isVideo ? "Generated Video" : "Generated Image"}
            </h2>
          </div>
          <span className={`text-[10px] uppercase font-semibold px-2.5 py-1 rounded-full ${
            isVideo ? "bg-indigo-500/20 text-indigo-300 border border-indigo-500/30" : "bg-blue-500/20 text-blue-300 border border-blue-500/30"
          }`}>
            {isVideo ? "Video" : "Image"}
          </span>
        </div>

        {/* Media Preview Box (Matches 6th & 10th screen in user image) */}
        <div className="flex-1 overflow-y-auto flex flex-col p-4">
          <div className="w-full aspect-[4/3] rounded-2xl overflow-hidden bg-black/60 relative border border-white/10 shadow-2xl flex items-center justify-center">
            {isVideo ? (
              <video
                src={item.mediaUrl}
                autoPlay
                loop
                playsInline
                controls
                className="w-full h-full object-contain"
              />
            ) : (
              <img
                src={item.mediaUrl}
                alt={item.prompt}
                className="w-full h-full object-cover"
              />
            )}
          </div>

          {/* Metadata Box */}
          <div className="mt-4 p-4 rounded-2xl bg-[#141724] border border-white/10 space-y-2">
            <div>
              <span className="text-[10px] text-white/40 uppercase tracking-wider font-semibold block">Prompt</span>
              <p className="text-xs sm:text-sm text-white/95 leading-relaxed mt-0.5">
                {item.prompt}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/5 text-[11px]">
              <div>
                <span className="text-white/40 block">Provider</span>
                <span className="text-white/80 font-medium">{item.provider}</span>
              </div>
              <div>
                <span className="text-white/40 block">Created</span>
                <span className="text-white/80 font-medium">{item.dateStr}</span>
              </div>
            </div>
          </div>

          {/* Action Row: Save, Share, Regenerate, Edit Prompt */}
          <div className="grid grid-cols-4 gap-2 mt-4">
            {/* Save */}
            <button
              onClick={handleDownload}
              className="py-3 px-2 rounded-2xl bg-[#141724] hover:bg-[#1c2032] border border-white/10 flex flex-col items-center justify-center gap-1.5 transition-all text-white/80 hover:text-white cursor-pointer"
            >
              <Download size={18} />
              <span className="text-[11px] font-medium">Save</span>
            </button>

            {/* Share */}
            <button
              onClick={handleShare}
              className="py-3 px-2 rounded-2xl bg-[#141724] hover:bg-[#1c2032] border border-white/10 flex flex-col items-center justify-center gap-1.5 transition-all text-white/80 hover:text-white cursor-pointer"
            >
              {copied ? <Check size={18} className="text-emerald-400" /> : <Share2 size={18} />}
              <span className="text-[11px] font-medium">{copied ? "Copied" : "Share"}</span>
            </button>

            {/* Regenerate */}
            <button
              onClick={onRegenerate}
              className="py-3 px-2 rounded-2xl bg-[#141724] hover:bg-[#1c2032] border border-white/10 flex flex-col items-center justify-center gap-1.5 transition-all text-white/80 hover:text-white cursor-pointer"
            >
              <RefreshCw size={18} />
              <span className="text-[11px] font-medium">Regenerate</span>
            </button>

            {/* Edit Prompt / Download */}
            <button
              onClick={isVideo ? handleDownload : onEditPrompt}
              className="py-3 px-2 rounded-2xl bg-[#141724] hover:bg-[#1c2032] border border-white/10 flex flex-col items-center justify-center gap-1.5 transition-all text-white/80 hover:text-white cursor-pointer"
            >
              {isVideo ? <Download size={18} /> : <Edit3 size={18} />}
              <span className="text-[11px] font-medium">{isVideo ? "Download" : "Edit Prompt"}</span>
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
