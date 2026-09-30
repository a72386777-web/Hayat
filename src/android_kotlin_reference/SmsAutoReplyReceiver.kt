package com.zara.assistant.receiver

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.provider.Telephony
import android.telephony.SmsManager
import android.util.Log
import com.zara.assistant.data.AppPreferences
import com.zara.assistant.security.SmsSafetyFilter
import com.zara.assistant.service.GeminiApiService
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch

/**
 * Production-ready Android SMS BroadcastReceiver:
 * - Detects incoming SMS
 * - Enforces zero-risk safety filter (OTP, Banking, Emergency, Shortcodes)
 * - Checks Rate-Limiting & Infinite Loop prevention
 * - Auto-replies with sweet Bengali girlfriend tone or safe fallback
 */
class SmsAutoReplyReceiver : BroadcastReceiver() {

    companion object {
        private const val TAG = "SmsAutoReplyReceiver"
    }

    override fun onReceive(context: Context, intent: Intent) {
        if (intent.action != Telephony.Sms.Intents.SMS_RECEIVED_ACTION) return

        val prefs = AppPreferences(context)
        val smsConfig = prefs.getSmsSafetyConfig()
        val sleepConfig = prefs.getSleepModeConfig()

        // Verify if Auto-Reply is enabled or Sleep Mode Auto-Reply is active
        val isSleepNow = sleepConfig.isCurrentlySleepTime()
        val isAutoReplyActive = smsConfig.autoReplyEnabled || (isSleepNow && sleepConfig.autoReplyDuringSleep)

        if (!isAutoReplyActive) {
            return
        }

        val messages = Telephony.Sms.Intents.getMessagesFromIntent(intent)
        if (messages.isNullOrEmpty()) return

        for (sms in messages) {
            val sender = sms.displayOriginatingAddress ?: continue
            val body = sms.displayMessageBody ?: continue

            // 1. Strict Security & Loop Evaluation
            val eval = SmsSafetyFilter.evaluate(context, sender, body, smsConfig.rateLimitMinutes)
            if (!eval.shouldReply) {
                Log.d(TAG, "SMS reply blocked for security: ${eval.reason}")
                continue
            }

            // 2. Dispatch Reply Asynchronously
            val pendingResult = goAsync()
            CoroutineScope(Dispatchers.IO).launch {
                try {
                    val replyMessage = if (smsConfig.useGeminiReply && prefs.getApiKey().isNotEmpty()) {
                        GeminiApiService.generateSmsReply(
                            context = context,
                            sender = sender,
                            body = body,
                            isSleeping = isSleepNow
                        )
                    } else {
                        smsConfig.fallbackReply
                    }

                    // Send SMS response
                    sendSingleSms(sender, replyMessage)

                    // Mark timestamp to prevent reply storms
                    SmsSafetyFilter.recordReplySent(context, sender)
                } catch (e: Exception) {
                    Log.e(TAG, "Failed to send auto-reply safely", e)
                } finally {
                    pendingResult.finish()
                }
            }
        }
    }

    private fun sendSingleSms(destinationAddress: String, text: String) {
        val smsManager: SmsManager = SmsManager.getDefault()
        val parts = smsManager.divideMessage(text)
        if (parts.size > 1) {
            smsManager.sendMultipartTextMessage(destinationAddress, null, parts, null, null)
        } else {
            smsManager.sendTextMessage(destinationAddress, null, text, null, null)
        }
    }
}
