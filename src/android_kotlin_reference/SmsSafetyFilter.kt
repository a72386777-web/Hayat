package com.zara.assistant.security

import android.content.Context
import java.util.concurrent.ConcurrentHashMap

data class SafetyCheckResult(
    val shouldReply: Boolean,
    val isSensitive: Boolean,
    val reason: String? = null
)

/**
 * Mobile Security & Safety Filter:
 * Ensures absolute zero leaks of OTPs, 2FA, verification codes, bank/financial alerts,
 * shortcodes, emergency messages, and prevents reply loops.
 */
object SmsSafetyFilter {

    private val lastReplyTimes = ConcurrentHashMap<String, Long>()

    private val OTP_PATTERNS = listOf(
        "otp", "one time password", "verification code", "verify your", "secret code",
        "pin", "passcode", "security code", "auth code", "login code", "confirmation code",
        "কোড", "ওটিপি", "পিন", "ভেরিফিকেশন", "পাসকোড"
    )

    private val BANKING_PATTERNS = listOf(
        "bank", "credited", "debited", "acct", "account", "balance", "txn", "transaction",
        "atm", "pos", "card ending", "upi", "bKash", "nagad", "rocket", "wallet",
        "statement", "due date", "emi", "debit card", "credit card", "fraud",
        "টাকা", "ব্যালেন্স", "বিকাশ", "নগদ", "রকেট", "অ্যাকাউন্ট", "ডেবিট", "ক্রেডিট"
    )

    private val EMERGENCY_PATTERNS = listOf(
        "sos", "emergency", "ambulance", "police", "hospital", "fire", "urgent help",
        "জরুরি", "বিপদ", "অ্যাম্বুলেন্স", "পুলিশ", "হাসপাতাল"
    )

    fun evaluate(context: Context, sender: String, body: String, rateLimitMinutes: Int): SafetyCheckResult {
        val lowerBody = body.lowercase()
        val lowerSender = sender.lowercase().trim()

        // 1. Telecom Gateway / Shortcode check
        if (isShortcodeOrGateway(sender)) {
            return SafetyCheckResult(false, true, "Automated gateway / shortcode sender")
        }

        // 2. OTP & 2FA protection
        if (OTP_PATTERNS.any { lowerBody.contains(it) }) {
            return SafetyCheckResult(false, true, "Sensitive OTP / Verification code")
        }

        // Generic numeric OTP check (4-8 digits in text)
        if (Regex("""\b\d{4,8}\b""").containsMatchIn(body) &&
            (lowerBody.contains("code") || lowerBody.contains("কোড") || lowerBody.contains("enter") || lowerBody.contains("valid"))) {
            return SafetyCheckResult(false, true, "Numeric security code pattern")
        }

        // 3. Banking & Financial Alerts
        if (BANKING_PATTERNS.any { lowerBody.contains(it) }) {
            return SafetyCheckResult(false, true, "Banking / Financial transaction alert")
        }

        // 4. Emergency alerts
        if (EMERGENCY_PATTERNS.any { lowerBody.contains(it) }) {
            return SafetyCheckResult(false, true, "Emergency / SOS message")
        }

        // 5. Anti-loop & rate-limiting protection
        val lastTimestamp = lastReplyTimes[lowerSender]
        val now = System.currentTimeMillis()
        if (lastTimestamp != null && (now - lastTimestamp) < (rateLimitMinutes * 60 * 1000L)) {
            return SafetyCheckResult(false, false, "Rate limit: reply loop suppression")
        }

        return SafetyCheckResult(true, false, null)
    }

    fun recordReplySent(context: Context, sender: String) {
        lastReplyTimes[sender.lowercase().trim()] = System.currentTimeMillis()
    }

    private fun isShortcodeOrGateway(sender: String): Boolean {
        val cleaned = sender.replace(Regex("""[\s\-+]"""), "")
        if (Regex("""^[A-Za-z]+$""").matches(cleaned)) return true
        if (Regex("""^[0-9]+$""").matches(cleaned) && cleaned.length < 7) return true
        val automatedWords = listOf("no-reply", "noreply", "alert", "notice", "service", "system", "info", "promo")
        return automatedWords.any { sender.lowercase().contains(it) }
    }
}
