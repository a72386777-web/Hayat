/**
 * Production-ready SMS Safety Filter & Auto-Reply Engine
 * - Strict exclusion of OTPs, 2FA, verification codes, bank/financial alerts,
 *   shortcodes, automated gateways, security alerts, and emergency messages.
 * - Prevents infinite reply loops & duplicate replies with memory rate-limiting.
 * - Generates cute, sweet, polite Bengali girlfriend AI responses or uses safe fallback.
 */

export interface SmsEvaluationResult {
  shouldReply: boolean;
  blockReason?: string;
  isSensitive: boolean;
}

// Common sensitive patterns (English + Bengali + Digits)
const OTP_KEYWORDS = [
  "otp", "one time password", "verification code", "verify your", "secret code",
  "pin", "passcode", "security code", "auth code", "login code", "confirmation code",
  "কোড", "ওটিপি", "পিন", "ভেরিফিকেশন", "পাসকোড"
];

const BANKING_KEYWORDS = [
  "bank", "credited", "debited", "acct", "account", "balance", "txn", "transaction",
  "atm", "pos", "card ending", "upi", "bKash", "nagad", "rocket", "wallet",
  "statement", "due date", "emi", "debit card", "credit card", "fraud",
  "টাকা", "ব্যালেন্স", "বিকাশ", "নগদ", "রকেট", "অ্যাকাউন্ট", "ডেবিট", "ক্রেডিট"
];

const EMERGENCY_KEYWORDS = [
  "sos", "emergency", "ambulance", "police", "hospital", "fire", "urgent help",
  "জরুরি", "বিপদ", "অ্যাম্বুলেন্স", "পুলিশ", "হাসপাতাল"
];

const AUTOMATED_SERVICE_PREFIXES = [
  "no-reply", "noreply", "donotreply", "alert", "notice", "service", "system", "info", "promo"
];

// Memory cache of recent replies to prevent infinite loops (sender -> timestamp)
const recentReplyTimestamps = new Map<string, number>();

export function isShortCodeOrGateway(sender: string): boolean {
  const cleaned = sender.trim().replace(/[\s\-\+]/g, "");
  // If sender has alphabetical characters only or is less than 6 digits, it's likely a business/telecom shortcode (e.g. "GP", "Airtel", "121", "BOB-TXN")
  if (/^[A-Za-z]+$/i.test(cleaned)) return true;
  if (/^[0-9]+$/.test(cleaned) && cleaned.length < 7) return true;
  for (const prefix of AUTOMATED_SERVICE_PREFIXES) {
    if (sender.toLowerCase().includes(prefix)) return true;
  }
  return false;
}

export function evaluateSmsSafety(sender: string, messageBody: string, rateLimitMinutes: number = 10): SmsEvaluationResult {
  const text = messageBody.toLowerCase();
  const senderLower = sender.toLowerCase();

  // 1. Check for Shortcodes or Gateway Sendings
  if (isShortCodeOrGateway(sender)) {
    return {
      shouldReply: false,
      blockReason: "স্বয়ংক্রিয় গেটওয়ে বা টেলিকম শর্টকোড (Automated gateway / shortcode)",
      isSensitive: true,
    };
  }

  // 2. Check for OTP & Verification Codes
  for (const kw of OTP_KEYWORDS) {
    if (text.includes(kw)) {
      return {
        shouldReply: false,
        blockReason: "গোপন ওটিপি বা ভেরিফিকেশন কোড সনাক্ত (OTP / Verification Code detected)",
        isSensitive: true,
      };
    }
  }

  // Check 4-8 digit numeric codes often sent in OTPs
  if (/\b\d{4,8}\b/.test(messageBody) && (text.includes("code") || text.includes("কোড") || text.includes("enter") || text.includes("valid"))) {
    return {
      shouldReply: false,
      blockReason: "নিরাপত্তা কোড সনাক্ত (Security numeric code)",
      isSensitive: true,
    };
  }

  // 3. Check for Banking / Financial Alerts
  for (const kw of BANKING_KEYWORDS) {
    if (text.includes(kw)) {
      return {
        shouldReply: false,
        blockReason: "ব্যাংকিং অথবা আর্থিক তথ্য বার্তা (Financial / Banking alert)",
        isSensitive: true,
      };
    }
  }

  // 4. Check for Emergency / SOS
  for (const kw of EMERGENCY_KEYWORDS) {
    if (text.includes(kw)) {
      return {
        shouldReply: false,
        blockReason: "জরুরি সেবা বা এসওএস বার্তা (Emergency / SOS message)",
        isSensitive: true,
      };
    }
  }

  // 5. Check Rate Limit / Duplicate Loop Protection
  const lastReply = recentReplyTimestamps.get(senderLower);
  const now = Date.now();
  if (lastReply && (now - lastReply) < rateLimitMinutes * 60 * 1000) {
    const remainingMins = Math.ceil(((rateLimitMinutes * 60 * 1000) - (now - lastReply)) / 60000);
    return {
      shouldReply: false,
      blockReason: `লুপ প্রতিরোধ: এই প্রেরককে ইতিমধ্যে উত্তর পাঠানো হয়েছে (আরও ${remainingMins} মিনিট পর অনুমোদন)`,
      isSensitive: false,
    };
  }

  return {
    shouldReply: true,
    isSensitive: false,
  };
}

export function recordSmsReplySent(sender: string): void {
  recentReplyTimestamps.set(sender.toLowerCase().trim(), Date.now());
}
