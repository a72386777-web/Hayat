import React, { useState } from "react";
import { 
  ArrowLeft, 
  Plus, 
  Check, 
  X, 
  Trash2, 
  CheckCircle2, 
  MessageSquare, 
  Smartphone, 
  PhoneCall, 
  Send, 
  Bell, 
  Moon, 
  ShieldCheck, 
  Sparkles, 
  FileText, 
  ExternalLink,
  ChevronRight,
  Info
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { ExecutableCommand, CommandExecutionResult, AppConfig } from "../types";
import { 
  getStoredCommands, 
  toggleCommandState, 
  addCustomCommand, 
  deleteCustomCommand 
} from "../services/commandManagerService";

interface CommandManagerModalProps {
  config: AppConfig;
  onClose: () => void;
  onExecuteCommandPreview?: (result: CommandExecutionResult) => void;
}

export default function CommandManagerModal({
  config,
  onClose,
  onExecuteCommandPreview,
}: CommandManagerModalProps) {
  const [commands, setCommands] = useState<ExecutableCommand[]>(() => getStoredCommands());
  const [activeTab, setActiveTab] = useState<"available" | "prompt" | "examples" | "add_custom">("available");
  
  // Custom command form
  const [customName, setCustomName] = useState("");
  const [customTrigger, setCustomTrigger] = useState("");
  const [customAction, setCustomAction] = useState("OPEN_APP / MUSIC");
  const [customUrl, setCustomUrl] = useState("https://spotify.com");

  // Selected example card for interactive preview (matching the 7 bottom mini-screens in infographic)
  const [previewExample, setPreviewExample] = useState<
    "sms" | "app" | "call" | "reminder" | "sleep" | "background" | "custom" | null
  >("sms");

  const handleToggle = (id: string, currentState: boolean) => {
    const updated = toggleCommandState(id, !currentState);
    setCommands([...updated]);
  };

  const handleSaveCustom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customName.trim() || !customTrigger.trim()) return;

    const updated = addCustomCommand({
      name: customName.trim(),
      bengaliName: customName.trim(),
      description: `Custom User Action: ${customAction}`,
      icon: "app",
      enabled: true,
      triggerPhrases: [customTrigger.trim().toLowerCase()],
      actionType: "custom",
      parametersRequired: [],
      requiredPermissions: ["INTERNET"],
      customActionUrl: customUrl.trim(),
    });

    setCommands([...updated]);
    setCustomName("");
    setCustomTrigger("");
    setActiveTab("available");
  };

  const getIcon = (iconName: string) => {
    switch (iconName) {
      case "message":
        return <MessageSquare size={18} className="text-emerald-400" />;
      case "app":
        return <Smartphone size={18} className="text-cyan-400" />;
      case "phone":
        return <PhoneCall size={18} className="text-indigo-400" />;
      case "send":
        return <Send size={18} className="text-amber-400" />;
      case "bell":
        return <Bell size={18} className="text-rose-400" />;
      case "moon":
        return <Moon size={18} className="text-blue-400" />;
      case "shield":
      default:
        return <ShieldCheck size={18} className="text-purple-400" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex flex-col justify-end sm:justify-center items-center p-0 sm:p-4 text-white">
      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 30, scale: 0.98 }}
        className="w-full max-w-2xl bg-[#090d18] border border-cyan-500/30 rounded-t-[32px] sm:rounded-3xl shadow-2xl flex flex-col h-[94dvh] sm:h-[90dvh] overflow-hidden relative"
      >
        {/* Top Header */}
        <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between bg-[#0e1424]">
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/80 hover:text-white transition-colors cursor-pointer"
            >
              <ArrowLeft size={18} />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-cyan-400 font-bold tracking-wider text-sm sm:text-base">JARVIS</span>
                <span className="text-xs text-white/50">|</span>
                <h2 className="text-xs sm:text-sm font-semibold text-white">Command Manager</h2>
              </div>
              <p className="text-[10px] text-white/50">AI Studio ও রিয়েল অ্যান্ড্রয়েড ফাংশন টুল কলিং</p>
            </div>
          </div>

          {/* Navigation Sub-Tabs */}
          <div className="flex items-center gap-1 bg-black/40 p-1 rounded-xl border border-white/10 text-xs">
            <button
              onClick={() => setActiveTab("available")}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
                activeTab === "available" ? "bg-cyan-500 text-black font-semibold" : "text-white/60 hover:text-white"
              }`}
            >
              কমান্ড তালিকা
            </button>
            <button
              onClick={() => setActiveTab("examples")}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
                activeTab === "examples" ? "bg-cyan-500 text-black font-semibold" : "text-white/60 hover:text-white"
              }`}
            >
              লাইভ উদাহরণ
            </button>
            <button
              onClick={() => setActiveTab("prompt")}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
                activeTab === "prompt" ? "bg-cyan-500 text-black font-semibold" : "text-white/60 hover:text-white"
              }`}
            >
              মাস্টার প্রম্পট
            </button>
          </div>
        </div>

        {/* Tab 1: Available Commands (Matches 2nd Panel in User Infographic) */}
        {activeTab === "available" && (
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3">
            <div className="flex items-center justify-between pb-1">
              <div>
                <h3 className="text-xs sm:text-sm font-bold text-white flex items-center gap-2">
                  <span className="text-cyan-400">⚙️</span>
                  Available Commands (এইগুলো আপনি AI Studio-তে সেট করবেন)
                </h3>
                <p className="text-[11px] text-white/50 mt-0.5">
                  প্রতিটি কমান্ডের সাথে রিয়েল অ্যান্ড্রয়েড ফাংশন এবং পারমিশন যুক্ত রয়েছে
                </p>
              </div>

              <button
                onClick={() => setActiveTab("add_custom")}
                className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-md shadow-indigo-600/30 cursor-pointer"
              >
                <Plus size={14} />
                <span>নতুন কমান্ড</span>
              </button>
            </div>

            {/* List of Command Switch Cards */}
            <div className="space-y-2.5">
              {commands.map((cmd) => (
                <div
                  key={cmd.id}
                  className="p-3.5 rounded-2xl bg-[#111728] border border-white/5 hover:border-cyan-500/30 transition-all flex items-center justify-between group shadow-md"
                >
                  <div className="flex items-center gap-3 min-w-0 pr-3">
                    <div className="w-10 h-10 rounded-2xl bg-black/50 border border-white/10 flex items-center justify-center shrink-0">
                      {getIcon(cmd.icon)}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="text-xs sm:text-sm font-bold text-white group-hover:text-cyan-300 transition-colors">
                          {cmd.name}
                        </h4>
                        {!cmd.isBuiltIn && (
                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-pink-500/20 text-pink-300 font-medium">
                            Custom
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-white/70 line-clamp-1">{cmd.bengaliName}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] text-cyan-400/80 font-mono">
                          উচ্চারণ: "{cmd.triggerPhrases[0]}"
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    {!cmd.isBuiltIn && (
                      <button
                        onClick={() => {
                          const updated = deleteCustomCommand(cmd.id);
                          setCommands([...updated]);
                        }}
                        className="p-1.5 text-white/40 hover:text-red-400 transition-colors cursor-pointer"
                        title="Delete Command"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}

                    {/* Toggle Switch Button */}
                    <button
                      type="button"
                      onClick={() => handleToggle(cmd.id, cmd.enabled)}
                      className={`w-12 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors duration-300 ${
                        cmd.enabled ? "bg-emerald-500" : "bg-white/20"
                      }`}
                    >
                      <motion.div
                        layout
                        transition={{ type: "spring", stiffness: 500, damping: 30 }}
                        className={`bg-white w-4 h-4 rounded-full shadow-md ${cmd.enabled ? "ml-6" : "ml-0"}`}
                      />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Quick Add New Command Card */}
            <div
              onClick={() => setActiveTab("add_custom")}
              className="p-4 rounded-2xl bg-gradient-to-r from-purple-950/40 via-indigo-950/40 to-blue-950/40 border border-indigo-500/40 hover:border-indigo-400/70 transition-all flex items-center justify-between cursor-pointer group shadow-lg"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-lg shadow-indigo-600/30">
                  <Plus size={20} />
                </div>
                <div>
                  <h4 className="text-xs sm:text-sm font-bold text-white group-hover:text-indigo-200">
                    Add New Command
                  </h4>
                  <p className="text-[11px] text-white/60">আপনি নিজেই নতুন কমান্ড যোগ করতে পারবেন</p>
                </div>
              </div>
              <ChevronRight size={18} className="text-white/40 group-hover:text-white transition-colors" />
            </div>
          </div>
        )}

        {/* Tab 2: Master Prompt (Matches 3rd Panel in User Infographic) */}
        {activeTab === "prompt" && (
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
            <div className="flex items-center gap-3 p-3 rounded-2xl bg-cyan-500/10 border border-cyan-500/30">
              <FileText size={24} className="text-cyan-400 shrink-0" />
              <div>
                <h3 className="text-xs sm:text-sm font-bold text-cyan-300">
                  Master Prompt (AI Studio-তে এইটি ব্যবহার করবেন)
                </h3>
                <p className="text-[11px] text-white/60">
                  Gemini API এর Function Calling এবং Tool Dispatching এর জন্য সিস্টেম ইন্সট্রাকশন
                </p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-[#0b0f1a] border border-white/10 font-mono text-xs text-white/85 leading-relaxed space-y-3 shadow-inner">
              <p className="text-cyan-300 font-semibold">
                You are JARVIS / ZARA, an advanced AI assistant built for Android. Do not only add commands to the system prompt. Implement every command as a real executable Android function/tool and connect it to the Gemini assistant.
              </p>
              <ol className="list-decimal pl-5 space-y-1.5 text-white/75">
                <li>Understand the user’s voice/text command</li>
                <li>Match it with the correct command</li>
                <li>Call the corresponding Kotlin function/tool</li>
                <li>Use Android permissions where required</li>
                <li>Execute the action and provide a clear response</li>
                <li>Support background operation, foreground service, and device automation</li>
                <li>Allow adding new commands from the user</li>
                <li>Never give fake or prompt-only responses.</li>
              </ol>
              <p className="text-white/60 pt-2 border-t border-white/10 text-[11px]">
                Make JARVIS / ZARA powerful, reliable, and easy to use. Always confirm sensitive actions with the user before execution.
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center gap-3">
              <CheckCircle2 size={20} className="text-emerald-400 shrink-0" />
              <p className="text-xs text-emerald-200">
                This prompt will make your AI Studio create real Android functions, connect them with Gemini function calling, and enable actual execution of each command.
              </p>
            </div>
          </div>
        )}

        {/* Tab 3: Live Examples (Matches 7 Mini-Screens at the bottom of the User Infographic) */}
        {activeTab === "examples" && (
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
            <div>
              <h3 className="text-xs sm:text-sm font-bold text-white flex items-center gap-2">
                <span className="text-cyan-400">⚡</span>
                কমান্ডগুলো কিভাবে কাজ করবে? (Live Example)
              </h3>
              <p className="text-[11px] text-white/50 mt-0.5">
                নিচের যে কোনো কমান্ডে ট্যাপ করে তার বাস্তব অ্যান্ড্রয়েড স্ক্রিন ও এক্সিকিউশন দেখুন
              </p>
            </div>

            {/* Horizontal Mini-Screen Selector Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              {[
                { id: "sms", label: "1. Auto SMS Reply", icon: "💬" },
                { id: "app", label: "2. Open App", icon: "📱" },
                { id: "call", label: "3. Call Contact", icon: "📞" },
                { id: "reminder", label: "4. Set Reminder", icon: "⏰" },
                { id: "sleep", label: "5. Sleep Mode", icon: "🌙" },
                { id: "background", label: "6. Background", icon: "🛡️" },
                { id: "custom", label: "7. Custom Cmd", icon: "➕" },
              ].map((ex) => (
                <button
                  key={ex.id}
                  onClick={() => setPreviewExample(ex.id as any)}
                  className={`p-2.5 rounded-xl border text-left flex items-center gap-2 transition-all cursor-pointer ${
                    previewExample === ex.id
                      ? "bg-cyan-500/20 border-cyan-400 text-cyan-300 font-semibold"
                      : "bg-[#111624] border-white/10 text-white/70 hover:text-white"
                  }`}
                >
                  <span>{ex.icon}</span>
                  <span className="truncate">{ex.label}</span>
                </button>
              ))}
            </div>

            {/* Active Live Simulation Window (Matching Infographic mockups) */}
            <div className="w-full bg-[#0b0f1a] border border-cyan-500/30 rounded-2xl p-4 flex flex-col items-center justify-center min-h-[260px] relative shadow-2xl">
              {previewExample === "sms" && (
                <div className="w-full max-w-sm bg-[#161b2b] rounded-2xl p-4 border border-white/10 space-y-3">
                  <div className="flex items-center gap-2.5 pb-2 border-b border-white/10 text-xs">
                    <div className="w-7 h-7 rounded-full bg-cyan-600 flex items-center justify-center text-white font-bold">R</div>
                    <div>
                      <div className="font-semibold text-white">Rafiq</div>
                      <div className="text-[10px] text-white/50">12:30 PM</div>
                    </div>
                  </div>
                  <div className="bg-white/10 p-2.5 rounded-xl text-xs text-white/90">
                    ভাই, তুমি কেমন আছো?
                  </div>
                  <div className="bg-emerald-600/30 border border-emerald-500/30 p-2.5 rounded-xl text-xs text-emerald-200 ml-6">
                    আমি এখন ব্যস্ত আছি, পরে কথা বলবো। (JARVIS Auto Reply)
                  </div>
                  <div className="text-[11px] text-emerald-400 font-semibold flex items-center gap-1.5 pt-1">
                    <CheckCircle2 size={13} />
                    JARVIS: মেসেজের রিপ্লাই পাঠানো হয়েছে!
                  </div>
                </div>
              )}

              {previewExample === "app" && (
                <div className="w-full max-w-sm bg-[#161b2b] rounded-2xl p-4 border border-white/10 space-y-3 text-center">
                  <div className="text-xs text-white/50">Google Launcher Screen</div>
                  <div className="flex items-center justify-center gap-4 py-3">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-600 flex items-center justify-center text-white text-xl">📱</div>
                    <div className="w-12 h-12 rounded-2xl bg-red-600 flex items-center justify-center text-white text-xl">▶️</div>
                    <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center text-white text-xl">✈️</div>
                  </div>
                  <div className="text-[11px] text-cyan-400 font-semibold flex items-center justify-center gap-1.5">
                    <CheckCircle2 size={13} />
                    JARVIS: WhatsApp / YouTube সরাসরি খুলে দিয়েছি!
                  </div>
                </div>
              )}

              {previewExample === "call" && (
                <div className="w-full max-w-sm bg-[#161b2b] rounded-2xl p-5 border border-white/10 text-center space-y-4">
                  <div className="w-16 h-16 rounded-full bg-blue-600 mx-auto flex items-center justify-center text-2xl text-white font-bold">
                    R
                  </div>
                  <div>
                    <h4 className="text-base font-bold text-white">Rahim</h4>
                    <p className="text-xs text-cyan-300 animate-pulse mt-0.5">Calling via Android Phone Intent...</p>
                  </div>
                  <div className="text-[11px] text-emerald-400 font-semibold flex items-center justify-center gap-1.5">
                    <CheckCircle2 size={13} />
                    JARVIS: রহিমকে কল করা হয়েছে...
                  </div>
                </div>
              )}

              {previewExample === "reminder" && (
                <div className="w-full max-w-sm bg-[#161b2b] rounded-2xl p-5 border border-white/10 text-center space-y-3">
                  <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-400 mx-auto flex items-center justify-center">
                    <Bell size={20} />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">Meeting with Team</h4>
                    <p className="text-xs text-white/60">Tomorrow, 10:00 AM</p>
                  </div>
                  <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-semibold">
                    <Check size={12} /> Saved to Android Calendar
                  </div>
                  <div className="text-[11px] text-emerald-400 font-semibold flex items-center justify-center gap-1.5 pt-1">
                    <CheckCircle2 size={13} />
                    JARVIS: রিমাইন্ডার সেট করা হয়েছে!
                  </div>
                </div>
              )}

              {previewExample === "sleep" && (
                <div className="w-full max-w-sm bg-[#161b2b] rounded-2xl p-5 border border-white/10 text-center space-y-3">
                  <div className="w-12 h-12 rounded-full bg-indigo-500/20 text-indigo-300 mx-auto flex items-center justify-center text-xl">
                    🌙
                  </div>
                  <h4 className="text-sm font-bold text-white">Sleep Mode Activated</h4>
                  <p className="text-xs text-white/50">Listening will resume at 6:00 AM</p>
                  <div className="text-[11px] text-emerald-400 font-semibold flex items-center justify-center gap-1.5">
                    <CheckCircle2 size={13} />
                    JARVIS: স্লিপ মোড চালু করা হয়েছে
                  </div>
                </div>
              )}

              {previewExample === "background" && (
                <div className="w-full max-w-sm bg-[#161b2b] rounded-2xl p-4 border border-white/10 space-y-3">
                  <div className="p-3 bg-black/60 rounded-xl border border-white/10 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-bold text-xs">
                      J
                    </div>
                    <div>
                      <h5 className="text-xs font-bold text-white">JARVIS Foreground Service</h5>
                      <p className="text-[10px] text-white/60">Running in background • Listening for your commands...</p>
                    </div>
                  </div>
                  <div className="text-[11px] text-emerald-400 font-semibold flex items-center justify-center gap-1.5">
                    <CheckCircle2 size={13} />
                    JARVIS: ব্যাকগ্রাউন্ডে কাজ চালু রয়েছে
                  </div>
                </div>
              )}

              {previewExample === "custom" && (
                <div className="w-full max-w-sm bg-[#161b2b] rounded-2xl p-4 border border-white/10 space-y-2 text-xs">
                  <div className="text-white/50 text-[10px]">Custom Command Editor</div>
                  <div className="p-2 bg-black/40 rounded-lg">
                    <span className="text-white/50">Command Name:</span> <strong className="text-white">Play Music</strong>
                  </div>
                  <div className="p-2 bg-black/40 rounded-lg">
                    <span className="text-white/50">Trigger Phrase:</span> <strong className="text-cyan-300">মিউজিক বাজাও</strong>
                  </div>
                  <div className="p-2 bg-black/40 rounded-lg">
                    <span className="text-white/50">Action:</span> <strong className="text-white">OPEN_APP / MUSIC</strong>
                  </div>
                  <div className="text-[11px] text-emerald-400 font-semibold flex items-center justify-center gap-1.5 pt-1">
                    <CheckCircle2 size={13} />
                    JARVIS: নতুন কমান্ড যুক্ত ও কার্যকর করা হয়েছে
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 4: Add New Custom Command */}
        {activeTab === "add_custom" && (
          <form onSubmit={handleSaveCustom} className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
            <div>
              <h3 className="text-xs sm:text-sm font-bold text-white flex items-center gap-2">
                <Plus size={16} className="text-indigo-400" />
                Add New Custom Command
              </h3>
              <p className="text-[11px] text-white/50 mt-0.5">
                আপনার পছন্দের বাক্য ও নির্দিষ্ট অ্যাকশন দিয়ে নতুন ভয়েস কমান্ড তৈরি করুন
              </p>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-white/70 block mb-1">কমান্ডের নাম (Command Name)</label>
                <input
                  type="text"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  placeholder="যেমন: Play Relaxing Music"
                  required
                  className="w-full bg-[#111624] border border-white/10 rounded-xl p-3 text-white outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="text-white/70 block mb-1">ট্রিগার বাক্য (Trigger Phrase)</label>
                <input
                  type="text"
                  value={customTrigger}
                  onChange={(e) => setCustomTrigger(e.target.value)}
                  placeholder="যেমন: রিল্যাক্সিং মিউজিক বাজাও"
                  required
                  className="w-full bg-[#111624] border border-white/10 rounded-xl p-3 text-white outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="text-white/70 block mb-1">অ্যাকশন টাইপ (Action Type)</label>
                <select
                  value={customAction}
                  onChange={(e) => setCustomAction(e.target.value)}
                  className="w-full bg-[#111624] border border-white/10 rounded-xl p-3 text-white outline-none"
                >
                  <option value="OPEN_APP / MUSIC">OPEN_APP / MUSIC</option>
                  <option value="OPEN_WEBSITE">OPEN_WEBSITE</option>
                  <option value="SEND_MESSAGE">SEND_MESSAGE</option>
                  <option value="RUN_AUTOMATION">RUN_AUTOMATION</option>
                </select>
              </div>

              <div>
                <label className="text-white/70 block mb-1">অ্যাকশন লিংক বা অ্যাপ স্কিম (Action URL)</label>
                <input
                  type="text"
                  value={customUrl}
                  onChange={(e) => setCustomUrl(e.target.value)}
                  placeholder="https://... অথবা spotify:search:..."
                  className="w-full bg-[#111624] border border-white/10 rounded-xl p-3 text-white outline-none focus:border-cyan-500 font-mono text-xs"
                />
              </div>
            </div>

            <div className="pt-2 flex gap-3">
              <button
                type="button"
                onClick={() => setActiveTab("available")}
                className="flex-1 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-white/80 font-medium text-xs cursor-pointer"
              >
                বাতিল
              </button>
              <button
                type="submit"
                className="flex-1 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-lg shadow-indigo-600/30 cursor-pointer"
              >
                কমান্ড সংরক্ষণ করুন
              </button>
            </div>
          </form>
        )}

        {/* Bottom Banner */}
        <div className="p-3 border-t border-white/10 bg-[#080c16] flex items-center justify-between text-[11px] text-white/60">
          <div className="flex items-center gap-1.5">
            <ShieldCheck size={14} className="text-cyan-400" />
            <span>Foreground Service & Scoped Android APIs</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white font-medium cursor-pointer"
          >
            ঠিক আছে
          </button>
        </div>
      </motion.div>
    </div>
  );
}
