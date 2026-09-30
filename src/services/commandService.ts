/**
 * Intelligent Native App & Browser Dispatcher
 * Directly launches device installed apps (Telegram, YouTube, WhatsApp, Facebook, Camera, Gallery, etc.)
 * Detects AI Image Generation and Video Generation commands naturally.
 */

export function processCommand(command: string): {
  action: string;
  url?: string;
  isBrowserAction: boolean;
  isAppLaunch?: boolean;
  appName?: string;
  isGenerationCommand?: boolean;
  generationType?: "image" | "video";
  generationPrompt?: string;
} {
  const lowerCmd = command.toLowerCase().trim();

  // 0. AI IMAGE & VIDEO GENERATION NATURAL COMMANDS
  // Detects: "একটি সুন্দর গ্রাম্য দৃশ্য তৈরি করো", "Create an image of...", "Generate a realistic portrait", "Turn this image into an animation", "Create a cinematic video", etc.
  const videoKeywords = [
    "ভিডিও বানাও", "ভিডিও তৈরি করো", "ভিডিও জেনারেট", "অ্যানিমেশন ভিডিও", 
    "create a video", "generate a video", "make a video", "create a cinematic video",
    "animation video", "turn this image into an animation", "animate this", "ভিডিও বানিয়ে দাও"
  ];
  const isVideoReq = videoKeywords.some((kw) => lowerCmd.includes(kw));

  const imageKeywords = [
    "ছবি আঁকো", "ছবি বানাও", "ছবি তৈরি করো", "দৃশ্য তৈরি করো", "ছবি জেনারেট",
    "create an image", "generate an image", "make an image", "generate a realistic portrait",
    "draw an image", "ইমেজ তৈরি করো", "একটি সুন্দর", "ছবি বানিয়ে দাও"
  ];
  const isImageReq = imageKeywords.some((kw) => lowerCmd.includes(kw));

  if (isVideoReq) {
    let cleanPrompt = command
      .replace(/জারারা|জারা|দয়া করে|প্লিজ/gi, "")
      .replace(/ভিডিও বানাও|ভিডিও তৈরি করো|ভিডিও জেনারেট করো|ভিডিও বানিয়ে দাও|অ্যানিমেশন ভিডিওতে পরিণত করো/gi, "")
      .replace(/create a video of|generate a video of|make a video of|create a cinematic video of|create a video|generate a video/gi, "")
      .trim();
    if (!cleanPrompt) cleanPrompt = "Turn this into a cinematic animated video";

    return {
      action: "আমি আপনার জন্য একটি অ্যানিমেশন ভিডিওতে পরিণত করছি...",
      isBrowserAction: false,
      isGenerationCommand: true,
      generationType: "video",
      generationPrompt: cleanPrompt,
    };
  }

  if (isImageReq) {
    let cleanPrompt = command
      .replace(/জারারা|জারা|দয়া করে|প্লিজ/gi, "")
      .replace(/ছবি আঁকো|ছবি বানাও|ছবি তৈরি করো|ছবি বানিয়ে দাও|দৃশ্য তৈরি করো|ইমেজ তৈরি করো/gi, "")
      .replace(/create an image of|generate an image of|make an image of|create an image|generate an image/gi, "")
      .trim();
    if (!cleanPrompt) cleanPrompt = "A beautiful scenic view with traditional houses and sunset";

    return {
      action: "আমি আপনার জন্য একটি সুন্দর বাস্তব দৃশ্য তৈরি করছি...",
      isBrowserAction: false,
      isGenerationCommand: true,
      generationType: "image",
      generationPrompt: cleanPrompt,
    };
  }

  // 1. Telegram App Launch Intent (e.g. "টেলিগ্রামে ঢোকো", "telegram খোলো", "টেলিগ্রাম ওপেন করো")
  if (
    lowerCmd.includes("টেলিগ্রাম") ||
    lowerCmd.includes("telegram") ||
    lowerCmd.includes("টিজি")
  ) {
    if (
      lowerCmd.includes("ঢোকো") ||
      lowerCmd.includes("খোলো") ||
      lowerCmd.includes("খুলো") ||
      lowerCmd.includes("ওপেন") ||
      lowerCmd.includes("open") ||
      lowerCmd.includes("যাও") ||
      lowerCmd.includes("লগিন")
    ) {
      return {
        action: "হ্যাঁ সোনা, তোমার অনুমতি নিয়ে তোমার টেলিগ্রাম অ্যাপে ঢুকছি... এখনই খুলে দিচ্ছি!",
        // Launches native Telegram android app directly via intent
        url: "intent://#Intent;package=org.telegram.messenger;scheme=tg;end",
        isBrowserAction: true,
        isAppLaunch: true,
        appName: "Telegram",
      };
    }
  }

  // 2. YouTube Native App Launch
  const ytBengaliMatch = lowerCmd.match(/(?:ইউটিউবে|youtube\s*(?:এ|তে|-এ|-তে)?)\s+(.+?)\s+(?:চালাও|বাজাও|খুঁজে দাও|শোনাও|চালিয়ে দাও|play\s*করো)/i)
    || lowerCmd.match(/^play\s+(.+?)\s+on\s+youtube$/i);
  if (ytBengaliMatch) {
    const songName = ytBengaliMatch[1].trim();
    const query = encodeURIComponent(songName);
    return {
      action: `তোমার জন্য সরাসরি ইউটিউবে "${songName}" চালিয়ে দিচ্ছি, লক্ষ্মীটি!`,
      url: `vnd.youtube://results?search_query=${query}`,
      isBrowserAction: true,
      isAppLaunch: true,
      appName: "YouTube",
    };
  }

  if (
    (lowerCmd.includes("ইউটিউব") || lowerCmd.includes("youtube")) &&
    (lowerCmd.includes("খোলো") || lowerCmd.includes("খুলো") || lowerCmd.includes("ওপেন") || lowerCmd.includes("open"))
  ) {
    return {
      action: "ইউটিউব অ্যাপ খুলে দিচ্ছি!",
      url: "vnd.youtube://",
      isBrowserAction: true,
      isAppLaunch: true,
      appName: "YouTube",
    };
  }

  // 3. WhatsApp Native App Launch
  const waMatch = lowerCmd.match(/^send\s+a\s+whatsapp\s+message\s+to\s+([\d\+\s]+)\s+saying\s+(.+)$/i)
    || lowerCmd.match(/(?:হোয়াটসঅ্যাপে|হোয়াটসঅ্যাপে|whatsapp\s*(?:এ|তে|-এ|-তে)?)\s+([\d\+\s]+)\s+(?:নম্বরে|কে)\s+(?:বলো|মেসেজ পাঠাও|লিখে পাঠাও)\s*(.+)/i);
  if (waMatch) {
    const number = waMatch[1].replace(/\s+/g, "");
    const message = encodeURIComponent(waMatch[2].trim());
    return {
      action: `হোয়াটসঅ্যাপে মেসেজ পাঠানোর ব্যবস্থা করে দিচ্ছি, এখনই চলে যাবে!`,
      url: `whatsapp://send?phone=${number}&text=${message}`,
      isBrowserAction: true,
      isAppLaunch: true,
      appName: "WhatsApp",
    };
  }

  if (
    (lowerCmd.includes("হোয়াটসঅ্যাপ") || lowerCmd.includes("হোয়াটসঅ্যাপ") || lowerCmd.includes("whatsapp")) &&
    (lowerCmd.includes("খোলো") || lowerCmd.includes("খুলো") || lowerCmd.includes("ওপেন") || lowerCmd.includes("open"))
  ) {
    return {
      action: "হোয়াটসঅ্যাপ অ্যাপ সরাসরি খুলে দিচ্ছি!",
      url: "whatsapp://",
      isBrowserAction: true,
      isAppLaunch: true,
      appName: "WhatsApp",
    };
  }

  // 4. Facebook Native App
  if (
    (lowerCmd.includes("ফেসবুক") || lowerCmd.includes("facebook")) &&
    (lowerCmd.includes("খোলো") || lowerCmd.includes("খুলো") || lowerCmd.includes("ওপেন") || lowerCmd.includes("open"))
  ) {
    return {
      action: "ফেসবুক অ্যাপে নিয়ে যাচ্ছি...",
      url: "fb://facewebmodal/f?href=https://facebook.com",
      isBrowserAction: true,
      isAppLaunch: true,
      appName: "Facebook",
    };
  }

  // 5. Spotify Native App Launch
  const spotifyBengaliMatch = lowerCmd.match(/(?:স্পটিফাইতে|স্পটিফাইয়ে|spotify\s*(?:এ|তে|-এ|-তে)?)\s+(.+?)\s+(?:চালাও|বাজাও|খুঁজো|শোনাও|play\s*করো)/i)
    || lowerCmd.match(/^(?:play|search)\s+(.+?)\s+on\s+spotify$/i);
  if (spotifyBengaliMatch) {
    const songName = spotifyBengaliMatch[1].trim();
    const query = encodeURIComponent(songName);
    return {
      action: `দাঁড়াও সোনা, স্পটিফাই অ্যাপে তোমার প্রিয় "${songName}" গানটা বাজাচ্ছি...`,
      url: `spotify:search:${query}`,
      isBrowserAction: true,
      isAppLaunch: true,
      appName: "Spotify",
    };
  }

  // 6. Generic Website Browsing
  const openBengaliMatch = lowerCmd.match(/^open\s+(.+)$/i)
    || lowerCmd.match(/(.+?)\s+(?:ওয়েবসাইট|ওয়েবসাইট|সাইট)?\s*(?:খোলো|খুলো|open\s*করো)$/i);
  if (
    openBengaliMatch &&
    !lowerCmd.includes("youtube") &&
    !lowerCmd.includes("spotify") &&
    !lowerCmd.includes("ইউটিউব") &&
    !lowerCmd.includes("স্পটিফাই") &&
    !lowerCmd.includes("telegram") &&
    !lowerCmd.includes("টেলিগ্রাম")
  ) {
    let rawTarget = openBengaliMatch[1].trim();
    let website = rawTarget.replace(/\s+/g, "").replace(/ওয়েবসাইট|ওয়েবসাইট/g, "");
    if (!website.includes(".")) {
      website += ".com";
    }
    return {
      action: `হ্যাঁ লক্ষ্মীটি, তোমার জন্য ${rawTarget} খুলে দিচ্ছি!`,
      url: `https://www.${website}`,
      isBrowserAction: true,
    };
  }

  return { action: "", isBrowserAction: false };
}
