export interface SmsSafetyConfig {
  autoReplyEnabled: boolean;
  fallbackReply: string;
  useGeminiReply: boolean;
  rateLimitMinutes: number; // e.g., max 1 reply per sender every X minutes

  // Quiet Hours / Work Mode Scheduling & Professional Tone
  quietHoursEnabled?: boolean;
  quietHoursStart?: string; // e.g. "09:00"
  quietHoursEnd?: string;   // e.g. "18:00"
  quietHoursTone?: "formal" | "professional" | "minimal" | "sassy";
  quietHoursReplyTemplate?: string;
}

export interface SleepModeConfig {
  enabled: boolean;
  startTime: string; // "23:00"
  endTime: string;   // "07:00"
  allowEmergencyExceptions: boolean;
  autoReplyDuringSleep: boolean;
}

export interface ScreenViewingConfig {
  enabled: boolean;
  autoAnalysisEnabled: boolean;
  lastCapturedTimestamp?: number;
}

// AI Image Generation Provider Configurations
export type ImageProviderType = "openai" | "stability" | "pollinations" | "replicate";
export type VideoProviderType = "runway" | "pika" | "luma" | "kling";

export interface ImageApiConfig {
  provider: ImageProviderType;
  providerName: string;
  model: string;
  apiKey: string;
  isConnected: boolean;
  lastTested?: number;
}

export interface VideoApiConfig {
  provider: VideoProviderType;
  providerName: string;
  model: string;
  apiKey: string;
  isConnected: boolean;
  lastTested?: number;
}

export interface GenerationHistoryItem {
  id: string;
  prompt: string;
  type: "image" | "video";
  mediaUrl: string;
  thumbnailUrl?: string;
  provider: string;
  model: string;
  timestamp: number;
  dateStr: string;
  aspectRatio?: string;
  style?: string;
  resolution?: string;
  negativePrompt?: string;
}

export interface ImageGenerationOptions {
  prompt: string;
  style: string;
  aspectRatio: string;
  resolution: string;
  negativePrompt?: string;
  referenceImage?: string; // base64
}

// Command Manager Specifications
export interface ExecutableCommand {
  id: string;
  name: string;
  bengaliName: string;
  description: string;
  icon: string;
  enabled: boolean;
  triggerPhrases: string[];
  actionType: "auto_sms_reply" | "open_app" | "call_contact" | "send_message" | "set_reminder" | "sleep_mode" | "background_operation" | "custom";
  parametersRequired: string[];
  requiredPermissions: string[];
  customActionUrl?: string;
  isBuiltIn: boolean;
}

export interface CommandExecutionResult {
  success: boolean;
  commandName: string;
  actionType: string;
  spokenFeedback: string;
  visualCardType?: "sms_reply" | "open_app" | "call_contact" | "set_reminder" | "sleep_mode" | "background_operation" | "custom";
  details?: {
    recipient?: string;
    message?: string;
    appName?: string;
    appUrl?: string;
    contactName?: string;
    reminderTitle?: string;
    reminderTime?: string;
    sleepResumeTime?: string;
  };
}

export interface AppConfig {
  apiKey: string;
  userName: string;
  assistantName: string;
  systemPrompt: string;
  voiceName?: string;
  activeTopicOrScript?: string;
  devicePin?: string; // e.g. "34558023" for voice screen unlock
  
  // Advanced Assistant Features
  smsSafetyConfig?: SmsSafetyConfig;
  sleepModeConfig?: SleepModeConfig;
  screenViewingConfig?: ScreenViewingConfig;

  // AI Image & Video Generation Configurations
  imageApiConfig?: ImageApiConfig;
  videoApiConfig?: VideoApiConfig;

  // Background and Floating Overlay
  backgroundServiceEnabled?: boolean;
  floatingWidgetEnabled?: boolean;
  floatingOverlayConfig?: {
    enabled: boolean;
    autoAnimateOnTts: boolean;
    pulseGlowEnabled: boolean;
    upDownFloatEnabled: boolean;
  };

  // Custom Wake Word Configuration
  wakeWord?: string; // e.g. "জারা", "Zara", "হেই জারা", "Hey Zara", "জারভিস", "Jarvis"
  wakeWordEnabled?: boolean;
}

export type AppState = "idle" | "listening" | "processing" | "speaking" | "reconnecting";

export interface PermissionStatusItem {
  id: string;
  title: string;
  description: string;
  icon: string;
  status: "granted" | "not_granted" | "requires_settings";
  requiredFor: string;
  isCritical: boolean;
}

export interface SmsMessageRecord {
  id: string;
  sender: string;
  body: string;
  timestamp: number;
  status: "blocked_sensitive" | "blocked_rate_limit" | "replied" | "ignored";
  reason?: string;
  replySent?: string;
}
