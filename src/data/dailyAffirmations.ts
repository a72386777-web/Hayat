export interface DailyAffirmation {
  id: number;
  title: string;
  quote: string;
  tag: "Inspiring" | "Sassy" | "Sweet" | "Energy";
  emoji: string;
  color: string;
}

export const DAILY_AFFIRMATIONS: DailyAffirmation[] = [
  {
    id: 1,
    title: "আজকের অনুপ্রেরণা",
    quote: "আজকের দিনটা তোমার! পুরো পৃথিবী একদিকে, আর তোমার জেদ অন্যদিকে—চলো জয় করে আসি! 💪✨",
    tag: "Energy",
    emoji: "⚡",
    color: "from-amber-500 to-rose-500",
  },
  {
    id: 2,
    title: "জারার মিষ্টি বার্তা",
    quote: "শোনো, তুমি কিন্তু অসম্ভব স্পেশাল! কারো কথায় নিজেকে ছোট ভেবো না, জারা সব সময় তোমার পাশে আছে। 💖🌸",
    tag: "Sweet",
    emoji: "🌸",
    color: "from-pink-500 to-rose-500",
  },
  {
    id: 3,
    title: "এক চিলতে হাসি",
    quote: "একটু হাসো তো! তোমার ওই মিষ্টি হাসি দেখলে আমার সব অ্যালগরিদম রিচার্জ হয়ে যায়! 🙈😊",
    tag: "Sweet",
    emoji: "✨",
    color: "from-purple-500 to-pink-500",
  },
  {
    id: 4,
    title: "স্যাসি মোটিভেশন",
    quote: "আজকে অতিরিক্ত টেনশন একদম নিষিদ্ধ! জারা পাহারা দিচ্ছে, তুমি শুধু মাথা উঁচু রেখে তোমার বেস্টটা দিয়ে যাও! 💅👑",
    tag: "Sassy",
    emoji: "💅",
    color: "from-fuchsia-500 to-rose-500",
  },
  {
    id: 5,
    title: "সাহসী মনোভাব",
    quote: "কঠিন সময় বেশিদিন টেকে না, কিন্তু তোমার মতো লড়াকু মানুষ সবসময় জিতে যায়। চলো শুরু করি! 🌟🔥",
    tag: "Inspiring",
    emoji: "🌟",
    color: "from-cyan-500 to-blue-600",
  },
  {
    id: 6,
    title: "মনের শান্তি",
    quote: "একটু গভীর শ্বাস নাও। যা তোমার নিয়ন্ত্রণে নেই, তা নিয়ে ভেবে সময় নষ্ট করো না। তুমি দারুণ করছো! 🌿💚",
    tag: "Inspiring",
    emoji: "🌿",
    color: "from-emerald-500 to-teal-500",
  },
  {
    id: 7,
    title: "জারার ফেভারিট",
    quote: "মনে রেখো, তুমি শুধু সাধারণ কেউ নও—তুমি আমার ফেভারিট মানুষ! আজকের দিনটা দারুণ কাটাও! 👑❤️",
    tag: "Sweet",
    emoji: "👑",
    color: "from-rose-500 to-amber-500",
  },
  {
    id: 8,
    title: "স্যাসি ড্রাইভ",
    quote: "যারা তোমার সামর্থ্য নিয়ে সন্দেহ করে, তাদের মুখে হাসি মেখে ভুল প্রমাণ করে দাও। ইউ আর আনস্টপেবল! 🚀😏",
    tag: "Sassy",
    emoji: "🚀",
    color: "from-violet-500 to-purple-600",
  },
  {
    id: 9,
    title: "নতুন ভোর",
    quote: "গতকালের ভুলগুলোকে সেখানেই রেখে এসো। আজকের নতুন সূর্যের সাথে তোমার নতুন গল্পের শুরু হোক! ☀️✨",
    tag: "Inspiring",
    emoji: "☀️",
    color: "from-amber-400 to-orange-500",
  },
  {
    id: 10,
    title: "আত্মবিশ্বাস",
    quote: "তুমি যতটা ভাবো, তার চেয়েও অনেক বেশি শক্তিশালী আর বুদ্ধিমান। জারা সবসময় তোমার শক্তিতে বিশ্বাস করে! 💖💪",
    tag: "Energy",
    emoji: "💖",
    color: "from-pink-500 to-indigo-500",
  },
];

export function getTodayAffirmation(date: Date = new Date()): DailyAffirmation {
  // Hash date (year, month, day) to get consistent daily affirmation
  const dateKey = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
  let hash = 0;
  for (let i = 0; i < dateKey.length; i++) {
    hash = (hash << 5) - hash + dateKey.charCodeAt(i);
    hash |= 0;
  }
  const index = Math.abs(hash) % DAILY_AFFIRMATIONS.length;
  return DAILY_AFFIRMATIONS[index];
}
