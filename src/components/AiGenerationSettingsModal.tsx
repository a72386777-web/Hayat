import React, { useState } from "react";
import { 
  ArrowLeft, 
  ChevronRight, 
  Image as ImageIcon, 
  Video, 
  History, 
  HelpCircle, 
  CheckCircle2, 
  AlertCircle, 
  Lock, 
  ShieldCheck, 
  Eye, 
  EyeOff, 
  Trash2, 
  Sliders, 
  Save, 
  Share2, 
  RefreshCw, 
  Edit3, 
  Download, 
  Play, 
  MoreVertical, 
  Sparkles 
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { AppConfig, ImageApiConfig, VideoApiConfig, GenerationHistoryItem, ImageGenerationOptions } from "../types";
import { 
  testImageApiConnection, 
  testVideoApiConnection, 
  getSavedGenerationHistory, 
  saveGenerationToHistory, 
  deleteHistoryItem, 
  generateAiImage 
} from "../services/aiGenerationService";

interface AiGenerationSettingsModalProps {
  config: AppConfig;
  onSaveConfig: (newConfig: AppConfig) => void;
  onClose: () => void;
  initialTab?: "menu" | "image_api" | "video_api" | "history" | "options";
  onTriggerGenerateFromOptions?: (opts: ImageGenerationOptions) => void;
}

export default function AiGenerationSettingsModal({
  config,
  onSaveConfig,
  onClose,
  initialTab = "menu",
  onTriggerGenerateFromOptions,
}: AiGenerationSettingsModalProps) {
  // Navigation stack
  const [currentView, setCurrentView] = useState<"menu" | "image_api" | "video_api" | "history" | "options" | "api_error" | "api_success">(initialTab);
  
  // Image API state
  const [imageProvider, setImageProvider] = useState(config.imageApiConfig?.provider || "openai");
  const [imageKey, setImageKey] = useState(config.imageApiConfig?.apiKey || "");
  const [showImageKey, setShowImageKey] = useState(false);
  const [isImageTesting, setIsImageTesting] = useState(false);
  const [imageStatus, setImageStatus] = useState<{ connected: boolean; tested: boolean; message?: string }>({
    connected: config.imageApiConfig?.isConnected || false,
    tested: false,
    message: config.imageApiConfig?.isConnected ? "Connected • OpenAI (DALL-E 3)" : undefined
  });

  // Video API state
  const [videoProvider, setVideoProvider] = useState(config.videoApiConfig?.provider || "runway");
  const [videoKey, setVideoKey] = useState(config.videoApiConfig?.apiKey || "");
  const [showVideoKey, setShowVideoKey] = useState(false);
  const [isVideoTesting, setIsVideoTesting] = useState(false);
  const [videoStatus, setVideoStatus] = useState<{ connected: boolean; tested: boolean; message?: string }>({
    connected: config.videoApiConfig?.isConnected || false,
    tested: false,
    message: config.videoApiConfig?.isConnected ? "Connected • Runway (Gen-3)" : undefined
  });

  // History state
  const [historyItems, setHistoryItems] = useState<GenerationHistoryItem[]>(() => getSavedGenerationHistory());
  const [historyFilter, setHistoryFilter] = useState<"images" | "videos">("images");

  // Options State (from 7th screen in mockup)
  const [optPrompt, setOptPrompt] = useState("A beautiful village scene with river, green fields, traditional house, sunset");
  const [optStyle, setOptStyle] = useState("Realistic");
  const [optAspectRatio, setOptAspectRatio] = useState("16:9 (Landscape)");
  const [optResolution, setOptResolution] = useState("1024 x 1024 (Default)");
  const [optNegativePrompt, setOptNegativePrompt] = useState("");
  const [isOptionsGenerating, setIsOptionsGenerating] = useState(false);

  // Test Image Connection
  const handleTestImage = async () => {
    setIsImageTesting(true);
    const mockConfig: ImageApiConfig = {
      provider: imageProvider as any,
      providerName: imageProvider === "openai" ? "OpenAI (DALL-E 3)" : "Stability AI",
      model: "DALL-E 3",
      apiKey: imageKey,
      isConnected: false,
    };
    const res = await testImageApiConnection(mockConfig);
    setIsImageTesting(false);
    if (res.success) {
      setImageStatus({ connected: true, tested: true, message: res.message });
    } else {
      setImageStatus({ connected: false, tested: true, message: res.message });
      setCurrentView("api_error");
    }
  };

  // Save Image API
  const handleSaveImageApi = () => {
    const updated: AppConfig = {
      ...config,
      imageApiConfig: {
        provider: imageProvider as any,
        providerName: imageProvider === "openai" ? "OpenAI (DALL-E 3)" : "Stability AI",
        model: "DALL-E 3",
        apiKey: imageKey.trim(),
        isConnected: Boolean(imageKey.trim()),
        lastTested: Date.now(),
      }
    };
    onSaveConfig(updated);
    setCurrentView("api_success");
  };

  // Remove Image API
  const handleRemoveImageApi = () => {
    setImageKey("");
    setImageStatus({ connected: false, tested: false });
    const updated: AppConfig = {
      ...config,
      imageApiConfig: undefined,
    };
    onSaveConfig(updated);
  };

  // Test Video Connection
  const handleTestVideo = async () => {
    setIsVideoTesting(true);
    const mockConfig: VideoApiConfig = {
      provider: videoProvider as any,
      providerName: "Runway (Gen-3)",
      model: "Gen-3",
      apiKey: videoKey,
      isConnected: false,
    };
    const res = await testVideoApiConnection(mockConfig);
    setIsVideoTesting(false);
    if (res.success) {
      setVideoStatus({ connected: true, tested: true, message: res.message });
    } else {
      setVideoStatus({ connected: false, tested: true, message: res.message });
      setCurrentView("api_error");
    }
  };

  // Save Video API
  const handleSaveVideoApi = () => {
    const updated: AppConfig = {
      ...config,
      videoApiConfig: {
        provider: videoProvider as any,
        providerName: "Runway (Gen-3)",
        model: "Gen-3",
        apiKey: videoKey.trim(),
        isConnected: Boolean(videoKey.trim()),
        lastTested: Date.now(),
      }
    };
    onSaveConfig(updated);
    setCurrentView("api_success");
  };

  // Remove Video API
  const handleRemoveVideoApi = () => {
    setVideoKey("");
    setVideoStatus({ connected: false, tested: false });
    const updated: AppConfig = {
      ...config,
      videoApiConfig: undefined,
    };
    onSaveConfig(updated);
  };

  const handleGenerateFromOptions = async () => {
    if (onTriggerGenerateFromOptions) {
      onTriggerGenerateFromOptions({
        prompt: optPrompt,
        style: optStyle,
        aspectRatio: optAspectRatio,
        resolution: optResolution,
        negativePrompt: optNegativePrompt,
      });
      onClose();
      return;
    }
    setIsOptionsGenerating(true);
    try {
      const res = await generateAiImage({
        prompt: optPrompt,
        style: optStyle,
        aspectRatio: optAspectRatio,
        resolution: optResolution,
      }, config.imageApiConfig);
      
      const newItem: GenerationHistoryItem = {
        id: Date.now().toString(),
        prompt: optPrompt,
        type: "image",
        mediaUrl: res.url,
        provider: res.provider,
        model: res.model,
        timestamp: Date.now(),
        dateStr: "Just now",
        aspectRatio: optAspectRatio,
        style: optStyle,
      };
      saveGenerationToHistory(newItem);
      setHistoryItems(getSavedGenerationHistory());
      setCurrentView("history");
    } catch (e) {
      console.error(e);
    } finally {
      setIsOptionsGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex flex-col justify-end sm:justify-center items-center p-0 sm:p-4 text-white">
      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 30, scale: 0.98 }}
        className="w-full max-w-md bg-[#0d1019] border border-white/10 rounded-t-[32px] sm:rounded-3xl shadow-2xl flex flex-col h-[94dvh] sm:h-[88dvh] overflow-hidden relative"
      >
        {/* ========================================================================= */}
        {/* 1. MAIN AI GENERATION MENU SCREEN (Matches 2nd Screen in Screenshot)      */}
        {/* ========================================================================= */}
        {currentView === "menu" && (
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Header */}
            <div className="px-5 py-4 border-b border-white/10 flex items-center gap-3">
              <button
                onClick={onClose}
                className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/80 hover:text-white transition-colors cursor-pointer"
                title="Back"
              >
                <ArrowLeft size={18} />
              </button>
              <h2 className="text-base font-semibold text-white">AI Generation</h2>
            </div>

            {/* Description Banner */}
            <div className="px-5 pt-4 pb-2">
              <p className="text-xs text-white/60 leading-relaxed">
                Configure and manage your image & video generation APIs. Connect your preferred providers to create stunning images and videos.
              </p>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-3 space-y-3.5">
              {/* Image Generation API Card */}
              <div
                onClick={() => setCurrentView("image_api")}
                className="p-4 rounded-2xl bg-[#141724] border border-white/10 hover:border-white/20 transition-all cursor-pointer flex items-center justify-between group shadow-lg"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-11 h-11 rounded-2xl bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0">
                    <ImageIcon size={22} />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-white group-hover:text-blue-300 transition-colors">
                      Image Generation API
                    </h3>
                    <span className={`text-[11px] font-medium block mt-0.5 ${config.imageApiConfig?.isConnected ? "text-emerald-400" : "text-rose-400"}`}>
                      {config.imageApiConfig?.isConnected ? "Connected" : "Not Configured"}
                    </span>
                    <p className="text-[11px] text-white/40 mt-0.5 line-clamp-1">
                      Configure your image generation API key (e.g., OpenAI, Stability AI, etc.)
                    </p>
                  </div>
                </div>
                <ChevronRight size={18} className="text-white/40 group-hover:text-white group-hover:translate-x-0.5 transition-all shrink-0" />
              </div>

              {/* Video Generation API Card */}
              <div
                onClick={() => setCurrentView("video_api")}
                className="p-4 rounded-2xl bg-[#141724] border border-white/10 hover:border-white/20 transition-all cursor-pointer flex items-center justify-between group shadow-lg"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-11 h-11 rounded-2xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0">
                    <Video size={22} />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-white group-hover:text-indigo-300 transition-colors">
                      Video Generation API
                    </h3>
                    <span className={`text-[11px] font-medium block mt-0.5 ${config.videoApiConfig?.isConnected ? "text-emerald-400" : "text-rose-400"}`}>
                      {config.videoApiConfig?.isConnected ? "Connected" : "Not Configured"}
                    </span>
                    <p className="text-[11px] text-white/40 mt-0.5 line-clamp-1">
                      Configure your video generation API key (e.g., Runway, Pika, etc.)
                    </p>
                  </div>
                </div>
                <ChevronRight size={18} className="text-white/40 group-hover:text-white group-hover:translate-x-0.5 transition-all shrink-0" />
              </div>

              {/* Generation Options / Customizer */}
              <div
                onClick={() => setCurrentView("options")}
                className="p-4 rounded-2xl bg-[#141724] border border-white/10 hover:border-white/20 transition-all cursor-pointer flex items-center justify-between group shadow-lg"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-11 h-11 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
                    <Sliders size={22} />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-white group-hover:text-amber-300 transition-colors">
                      Image Generation Options
                    </h3>
                    <p className="text-[11px] text-white/40 mt-0.5">
                      Customize aspect ratio, resolution, style & negative prompts
                    </p>
                  </div>
                </div>
                <ChevronRight size={18} className="text-white/40 group-hover:text-white group-hover:translate-x-0.5 transition-all shrink-0" />
              </div>

              {/* Generation History Card */}
              <div
                onClick={() => setCurrentView("history")}
                className="p-4 rounded-2xl bg-[#141724] border border-white/10 hover:border-white/20 transition-all cursor-pointer flex items-center justify-between group shadow-lg"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-11 h-11 rounded-2xl bg-purple-500/20 text-purple-400 flex items-center justify-center shrink-0">
                    <History size={22} />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-white group-hover:text-purple-300 transition-colors">
                      Generation History
                    </h3>
                    <p className="text-[11px] text-white/40 mt-0.5">
                      View your past generated images and videos
                    </p>
                  </div>
                </div>
                <ChevronRight size={18} className="text-white/40 group-hover:text-white group-hover:translate-x-0.5 transition-all shrink-0" />
              </div>

              {/* How it works Banner */}
              <div className="p-4 rounded-2xl bg-[#121522] border border-amber-500/20 flex items-start gap-3 mt-4">
                <span className="text-amber-400 text-lg mt-0.5">💡</span>
                <div>
                  <h4 className="text-xs font-semibold text-amber-200">How it works?</h4>
                  <p className="text-[11px] text-white/60 leading-relaxed mt-1">
                    Just tell JARA what you want. For example: <br />
                    <span className="text-amber-300/90 font-mono">"একটি সুন্দর গ্রাম্য দৃশ্য তৈরি করো"</span> or <br />
                    <span className="text-amber-300/90 font-mono">"Make a short video from this image"</span>
                  </p>
                </div>
              </div>
            </div>

            {/* Android Keystore encryption footer note */}
            <div className="px-5 py-3 border-t border-white/5 bg-[#0a0c14] flex items-center gap-2 text-[10px] text-white/40">
              <Lock size={12} className="text-blue-400" />
              <span>Your API keys are encrypted and stored securely using Android Keystore.</span>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* 2. IMAGE GENERATION API SCREEN (Matches 3rd Screen in Screenshot)          */}
        {/* ========================================================================= */}
        {currentView === "image_api" && (
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="px-5 py-4 border-b border-white/10 flex items-center gap-3">
              <button
                onClick={() => setCurrentView("menu")}
                className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/80 hover:text-white transition-colors cursor-pointer"
              >
                <ArrowLeft size={18} />
              </button>
              <h2 className="text-base font-semibold text-white">Image Generation API</h2>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {/* Provider Selector */}
              <div>
                <label className="text-xs text-white/60 font-medium block mb-1.5">Provider</label>
                <div className="relative">
                  <div className="w-full bg-[#141724] border border-white/10 rounded-2xl px-4 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center">
                        <ImageIcon size={18} />
                      </div>
                      <div>
                        <select
                          value={imageProvider}
                          onChange={(e) => setImageProvider(e.target.value as any)}
                          className="bg-transparent text-white font-medium text-xs sm:text-sm outline-none cursor-pointer"
                        >
                          <option value="openai" className="bg-[#141724] text-white">OpenAI (DALL·E 3)</option>
                          <option value="stability" className="bg-[#141724] text-white">Stability AI (SD3)</option>
                          <option value="pollinations" className="bg-[#141724] text-white">High-Quality AI Engine</option>
                        </select>
                        <p className="text-[10px] text-white/40 mt-0.5">Supports high quality image generation</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* API Key Field with Lock & Password Masking */}
              <div>
                <label className="text-xs text-white/60 font-medium block mb-1.5">API Key</label>
                <div className="relative flex items-center bg-[#141724] border border-white/10 rounded-2xl px-3.5 py-3">
                  <Lock size={16} className="text-white/40 mr-2.5 shrink-0" />
                  <input
                    type={showImageKey ? "text" : "password"}
                    value={imageKey}
                    onChange={(e) => setImageKey(e.target.value)}
                    placeholder="sk-••••••••••••••••••••••••••••••••"
                    className="flex-1 bg-transparent text-white text-xs sm:text-sm outline-none placeholder:text-white/20 font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowImageKey(!showImageKey)}
                    className="p-1 text-white/40 hover:text-white transition-colors cursor-pointer shrink-0"
                    title={showImageKey ? "Hide Key" : "Show Key"}
                  >
                    {showImageKey ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* Action Buttons: Save & Test Connection */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <button
                  onClick={handleSaveImageApi}
                  className="py-3 px-4 rounded-2xl bg-indigo-600 hover:bg-indigo-500 active:scale-98 text-white font-medium text-xs sm:text-sm transition-all shadow-lg shadow-indigo-600/20 cursor-pointer"
                >
                  Save
                </button>
                <button
                  onClick={handleTestImage}
                  disabled={isImageTesting}
                  className="py-3 px-4 rounded-2xl bg-[#1a1e2d] hover:bg-[#23283b] border border-white/10 text-white font-medium text-xs sm:text-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  {isImageTesting ? <RefreshCw size={14} className="animate-spin" /> : null}
                  <span>Test Connection</span>
                </button>
              </div>

              {/* Connection Status Box */}
              <div>
                <label className="text-xs text-white/60 font-medium block mb-1.5">Connection Status</label>
                <div className="p-4 rounded-2xl bg-[#141724] border border-white/10 flex items-start gap-3">
                  {imageStatus.connected ? (
                    <CheckCircle2 size={20} className="text-emerald-400 shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle size={20} className="text-amber-400 shrink-0 mt-0.5" />
                  )}
                  <div>
                    <h4 className="text-xs sm:text-sm font-semibold text-white">
                      {imageStatus.connected ? "Connected" : "Not Connected"}
                    </h4>
                    <p className="text-[11px] text-white/50 mt-0.5">
                      Provider: {imageProvider === "openai" ? "OpenAI" : "Stability AI"} &nbsp;|&nbsp; Model: DALL·E 3
                    </p>
                    {imageStatus.message && (
                      <p className="text-[10px] text-emerald-300/80 mt-1">{imageStatus.message}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Remove Button */}
              <button
                onClick={handleRemoveImageApi}
                className="w-full py-3 rounded-2xl border border-red-500/40 text-red-400 hover:bg-red-500/10 active:scale-98 text-xs sm:text-sm font-medium transition-all flex items-center justify-center gap-2 cursor-pointer mt-4"
              >
                <Trash2 size={15} />
                <span>Remove</span>
              </button>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* 3. VIDEO GENERATION API SCREEN (Matches 4th Screen in Screenshot)          */}
        {/* ========================================================================= */}
        {currentView === "video_api" && (
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="px-5 py-4 border-b border-white/10 flex items-center gap-3">
              <button
                onClick={() => setCurrentView("menu")}
                className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/80 hover:text-white transition-colors cursor-pointer"
              >
                <ArrowLeft size={18} />
              </button>
              <h2 className="text-base font-semibold text-white">Video Generation API</h2>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {/* Provider Selector */}
              <div>
                <label className="text-xs text-white/60 font-medium block mb-1.5">Provider</label>
                <div className="relative">
                  <div className="w-full bg-[#141724] border border-white/10 rounded-2xl px-4 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
                        <Video size={18} />
                      </div>
                      <div>
                        <select
                          value={videoProvider}
                          onChange={(e) => setVideoProvider(e.target.value as any)}
                          className="bg-transparent text-white font-medium text-xs sm:text-sm outline-none cursor-pointer"
                        >
                          <option value="runway" className="bg-[#141724] text-white">Runway (Gen-3)</option>
                          <option value="pika" className="bg-[#141724] text-white">Pika Labs</option>
                          <option value="luma" className="bg-[#141724] text-white">Luma Dream Machine</option>
                        </select>
                        <p className="text-[10px] text-white/40 mt-0.5">Supports text-to-video and image-to-video</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* API Key */}
              <div>
                <label className="text-xs text-white/60 font-medium block mb-1.5">API Key</label>
                <div className="relative flex items-center bg-[#141724] border border-white/10 rounded-2xl px-3.5 py-3">
                  <Lock size={16} className="text-white/40 mr-2.5 shrink-0" />
                  <input
                    type={showVideoKey ? "text" : "password"}
                    value={videoKey}
                    onChange={(e) => setVideoKey(e.target.value)}
                    placeholder="••••••••••••••••••••••••••••••••"
                    className="flex-1 bg-transparent text-white text-xs sm:text-sm outline-none placeholder:text-white/20 font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowVideoKey(!showVideoKey)}
                    className="p-1 text-white/40 hover:text-white transition-colors cursor-pointer shrink-0"
                  >
                    {showVideoKey ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* Save & Test Connection */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <button
                  onClick={handleSaveVideoApi}
                  className="py-3 px-4 rounded-2xl bg-indigo-600 hover:bg-indigo-500 active:scale-98 text-white font-medium text-xs sm:text-sm transition-all shadow-lg shadow-indigo-600/20 cursor-pointer"
                >
                  Save
                </button>
                <button
                  onClick={handleTestVideo}
                  disabled={isVideoTesting}
                  className="py-3 px-4 rounded-2xl bg-[#1a1e2d] hover:bg-[#23283b] border border-white/10 text-white font-medium text-xs sm:text-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  {isVideoTesting ? <RefreshCw size={14} className="animate-spin" /> : null}
                  <span>Test Connection</span>
                </button>
              </div>

              {/* Status */}
              <div>
                <label className="text-xs text-white/60 font-medium block mb-1.5">Connection Status</label>
                <div className="p-4 rounded-2xl bg-[#141724] border border-white/10 flex items-start gap-3">
                  {videoStatus.connected ? (
                    <CheckCircle2 size={20} className="text-emerald-400 shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle size={20} className="text-amber-400 shrink-0 mt-0.5" />
                  )}
                  <div>
                    <h4 className="text-xs sm:text-sm font-semibold text-white">
                      {videoStatus.connected ? "Connected" : "Not Connected"}
                    </h4>
                    <p className="text-[11px] text-white/50 mt-0.5">
                      Provider: Runway &nbsp;|&nbsp; Model: Gen-3
                    </p>
                    {videoStatus.message && (
                      <p className="text-[10px] text-emerald-300/80 mt-1">{videoStatus.message}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Remove */}
              <button
                onClick={handleRemoveVideoApi}
                className="w-full py-3 rounded-2xl border border-red-500/40 text-red-400 hover:bg-red-500/10 active:scale-98 text-xs sm:text-sm font-medium transition-all flex items-center justify-center gap-2 cursor-pointer mt-4"
              >
                <Trash2 size={15} />
                <span>Remove</span>
              </button>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* 4. IMAGE GENERATION OPTIONS SCREEN (Matches 7th Screen in Screenshot)      */}
        {/* ========================================================================= */}
        {currentView === "options" && (
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="px-5 py-4 border-b border-white/10 flex items-center gap-3">
              <button
                onClick={() => setCurrentView("menu")}
                className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/80 hover:text-white transition-colors cursor-pointer"
              >
                <ArrowLeft size={18} />
              </button>
              <h2 className="text-base font-semibold text-white">Image Generation Options</h2>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {/* Prompt */}
              <div>
                <label className="text-xs text-white/60 font-medium block mb-1.5">Prompt</label>
                <textarea
                  value={optPrompt}
                  onChange={(e) => setOptPrompt(e.target.value)}
                  rows={3}
                  className="w-full bg-[#141724] border border-white/10 rounded-2xl p-3.5 text-xs sm:text-sm text-white outline-none focus:border-indigo-500/50 resize-none font-sans"
                  placeholder="Describe what you want to create..."
                />
              </div>

              {/* Style */}
              <div>
                <label className="text-xs text-white/60 font-medium block mb-1.5">Style</label>
                <select
                  value={optStyle}
                  onChange={(e) => setOptStyle(e.target.value)}
                  className="w-full bg-[#141724] border border-white/10 rounded-2xl px-4 py-3 text-xs sm:text-sm text-white outline-none cursor-pointer"
                >
                  <option value="Realistic" className="bg-[#141724]">Realistic</option>
                  <option value="Cinematic" className="bg-[#141724]">Cinematic</option>
                  <option value="Anime" className="bg-[#141724]">Anime</option>
                  <option value="Digital Art" className="bg-[#141724]">Digital Art</option>
                  <option value="Photographic" className="bg-[#141724]">Photographic</option>
                </select>
              </div>

              {/* Aspect Ratio */}
              <div>
                <label className="text-xs text-white/60 font-medium block mb-1.5">Aspect Ratio</label>
                <select
                  value={optAspectRatio}
                  onChange={(e) => setOptAspectRatio(e.target.value)}
                  className="w-full bg-[#141724] border border-white/10 rounded-2xl px-4 py-3 text-xs sm:text-sm text-white outline-none cursor-pointer"
                >
                  <option value="16:9 (Landscape)" className="bg-[#141724]">16:9 (Landscape)</option>
                  <option value="1:1 (Square)" className="bg-[#141724]">1:1 (Square)</option>
                  <option value="9:16 (Portrait)" className="bg-[#141724]">9:16 (Portrait)</option>
                </select>
              </div>

              {/* Resolution */}
              <div>
                <label className="text-xs text-white/60 font-medium block mb-1.5">Resolution</label>
                <select
                  value={optResolution}
                  onChange={(e) => setOptResolution(e.target.value)}
                  className="w-full bg-[#141724] border border-white/10 rounded-2xl px-4 py-3 text-xs sm:text-sm text-white outline-none cursor-pointer"
                >
                  <option value="1024 x 1024 (Default)" className="bg-[#141724]">1024 x 1024 (Default)</option>
                  <option value="1792 x 1024 (HD Landscape)" className="bg-[#141724]">1792 x 1024 (HD Landscape)</option>
                  <option value="2048 x 2048 (4K Ultra)" className="bg-[#141724]">2048 x 2048 (4K Ultra)</option>
                </select>
              </div>

              {/* Negative Prompt */}
              <div>
                <label className="text-xs text-white/60 font-medium block mb-1.5">Negative Prompt (Optional)</label>
                <input
                  type="text"
                  value={optNegativePrompt}
                  onChange={(e) => setOptNegativePrompt(e.target.value)}
                  placeholder="e.g., blurry, low quality, text, watermark..."
                  className="w-full bg-[#141724] border border-white/10 rounded-2xl px-4 py-3 text-xs sm:text-sm text-white outline-none placeholder:text-white/20"
                />
              </div>

              {/* Reference Image Picker */}
              <div className="w-full bg-[#141724] border border-white/10 rounded-2xl px-4 py-3 flex items-center justify-between cursor-pointer hover:border-white/20 transition-all">
                <div className="flex items-center gap-2.5">
                  <ImageIcon size={16} className="text-white/50" />
                  <span className="text-xs text-white/80">Reference Image (Optional)</span>
                </div>
                <ChevronRight size={16} className="text-white/40" />
              </div>

              {/* Generate Image Button */}
              <button
                onClick={handleGenerateFromOptions}
                disabled={isOptionsGenerating || !optPrompt.trim()}
                className="w-full py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 active:scale-98 text-white font-medium text-xs sm:text-sm transition-all shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 mt-4"
              >
                {isOptionsGenerating ? (
                  <RefreshCw size={16} className="animate-spin" />
                ) : (
                  <Sparkles size={16} />
                )}
                <span>Generate Image</span>
              </button>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* 5. GENERATION HISTORY SCREEN (Matches 8th Screen in Screenshot)            */}
        {/* ========================================================================= */}
        {currentView === "history" && (
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="px-5 py-4 border-b border-white/10 flex items-center gap-3">
              <button
                onClick={() => setCurrentView("menu")}
                className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/80 hover:text-white transition-colors cursor-pointer"
              >
                <ArrowLeft size={18} />
              </button>
              <h2 className="text-base font-semibold text-white">Generation History</h2>
            </div>

            {/* Filter Tabs: Images vs Videos */}
            <div className="p-3 bg-[#111420] border-b border-white/5 flex gap-2">
              <button
                onClick={() => setHistoryFilter("images")}
                className={`flex-1 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  historyFilter === "images"
                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                    : "bg-white/5 text-white/60 hover:text-white"
                }`}
              >
                Images
              </button>
              <button
                onClick={() => setHistoryFilter("videos")}
                className={`flex-1 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  historyFilter === "videos"
                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                    : "bg-white/5 text-white/60 hover:text-white"
                }`}
              >
                Videos
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {historyItems
                .filter((item) => (historyFilter === "images" ? item.type === "image" : item.type === "video"))
                .map((item) => (
                  <div
                    key={item.id}
                    className="p-3 bg-[#141724] border border-white/10 rounded-2xl flex items-center gap-3 hover:border-white/20 transition-all group"
                  >
                    {/* Media Thumbnail */}
                    <div className="w-16 h-16 rounded-xl overflow-hidden bg-black shrink-0 relative">
                      {item.type === "video" ? (
                        <>
                          <img
                            src={item.thumbnailUrl || item.mediaUrl}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                            <Play size={14} className="text-white fill-white" />
                          </div>
                        </>
                      ) : (
                        <img src={item.mediaUrl} alt="" className="w-full h-full object-cover" />
                      )}
                    </div>

                    {/* Metadata */}
                    <div className="flex-1 min-w-0">
                      <h4 className="text-xs font-semibold text-white line-clamp-1 group-hover:text-indigo-300">
                        {item.prompt}
                      </h4>
                      <p className="text-[10px] text-white/40 mt-0.5">{item.dateStr}</p>
                      <div className="flex items-center gap-2 mt-1.5">
                        <span className={`text-[9px] px-1.5 py-0.5 rounded font-medium ${
                          item.type === "video" ? "bg-indigo-500/20 text-indigo-300" : "bg-blue-500/20 text-blue-300"
                        }`}>
                          {item.type === "video" ? "Video" : "Image"}
                        </span>
                        <span className="text-[10px] text-white/50">{item.provider}</span>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        deleteHistoryItem(item.id);
                        setHistoryItems(getSavedGenerationHistory());
                      }}
                      className="p-2 text-white/40 hover:text-red-400 transition-colors cursor-pointer"
                      title="Delete"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                ))}

              {historyItems.filter((item) => (historyFilter === "images" ? item.type === "image" : item.type === "video")).length === 0 && (
                <div className="text-center py-12 text-white/40 text-xs">
                  কোনো অতীত ইতিহাস পাওয়া যায়নি
                </div>
              )}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* 6. API ERROR SCREEN (Matches 11th Screen in Screenshot)                    */}
        {/* ========================================================================= */}
        {currentView === "api_error" && (
          <div className="flex-1 flex flex-col p-6 items-center justify-center text-center">
            <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400 mb-4">
              <AlertCircle size={32} />
            </div>

            <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/30 w-full mb-6">
              <h3 className="text-sm font-semibold text-red-300">API Key Invalid</h3>
              <p className="text-xs text-red-200/80 mt-1 leading-relaxed">
                The API key you entered appears to be invalid or expired. Please check and try again.
              </p>
            </div>

            <div className="text-left w-full mb-6 text-xs text-white/70 space-y-1.5">
              <p className="font-semibold text-white/90">What you can do:</p>
              <p>1. Verify your API key is correct</p>
              <p>2. Check if your account has sufficient credits</p>
              <p>3. Make sure the provider supports the requested generation type</p>
            </div>

            <button
              onClick={() => setCurrentView("image_api")}
              className="w-full py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs sm:text-sm mb-3 cursor-pointer"
            >
              Try Again
            </button>

            <button
              onClick={() => setCurrentView("menu")}
              className="w-full py-3 rounded-2xl bg-white/5 hover:bg-white/10 text-white/80 text-xs sm:text-sm font-medium cursor-pointer"
            >
              Back to Settings
            </button>
          </div>
        )}

        {/* ========================================================================= */}
        {/* 7. SETTINGS SAVED SCREEN (Matches 12th Screen in Screenshot)               */}
        {/* ========================================================================= */}
        {currentView === "api_success" && (
          <div className="flex-1 flex flex-col p-6 justify-between">
            <div>
              <div className="p-4 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center gap-3 mb-6">
                <CheckCircle2 size={24} className="text-emerald-400 shrink-0" />
                <div>
                  <h3 className="text-sm font-semibold text-white">Settings Saved Successfully</h3>
                  <p className="text-xs text-emerald-200/80 mt-0.5">
                    Your API configuration has been updated and connected securely.
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <div className="p-4 rounded-2xl bg-[#141724] border border-white/10 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <ImageIcon size={20} className="text-blue-400" />
                    <div>
                      <h4 className="text-xs font-semibold text-white">Image Generation API</h4>
                      <p className="text-[10px] text-emerald-400 font-medium">● Connected • OpenAI (DALL·E 3)</p>
                    </div>
                  </div>
                  <ChevronRight size={16} className="text-white/40" />
                </div>

                <div className="p-4 rounded-2xl bg-[#141724] border border-white/10 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Video size={20} className="text-indigo-400" />
                    <div>
                      <h4 className="text-xs font-semibold text-white">Video Generation API</h4>
                      <p className="text-[10px] text-emerald-400 font-medium">● Connected • Runway (Gen-3)</p>
                    </div>
                  </div>
                  <ChevronRight size={16} className="text-white/40" />
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-center gap-2 text-[10px] text-white/40">
                <Lock size={12} className="text-blue-400" />
                <span>Your API keys are encrypted and stored securely using Android Keystore.</span>
              </div>
              <button
                onClick={() => setCurrentView("menu")}
                className="w-full py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs sm:text-sm cursor-pointer shadow-lg"
              >
                Done
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
