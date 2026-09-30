package com.zara.assistant.service

import android.animation.ObjectAnimator
import android.animation.PropertyValuesHolder
import android.animation.ValueAnimator
import android.annotation.SuppressLint
import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.graphics.PixelFormat
import android.os.Build
import android.os.IBinder
import android.provider.Settings
import android.view.Gravity
import android.view.LayoutInflater
import android.view.MotionEvent
import android.view.View
import android.view.WindowManager
import android.view.animation.AccelerateDecelerateInterpolator
import android.widget.ImageView
import androidx.core.app.NotificationCompat
import com.zara.assistant.MainActivity
import com.zara.assistant.R
import kotlin.math.abs

/**
 * Android Floating Overlay Service for Zara Assistant
 * Displays a small circular floating icon over the Home Screen and other apps.
 *
 * Requirements met:
 * • Animated Up-Down floating motion & pulsing glow when Zara speaks via TTS.
 * • Animation strictly runs during speech playback and stops when speech ends.
 * • Positioned in the lower screen area (as in reference image) and fully draggable.
 * • Tapping the floating icon opens the Zara Assistant MainActivity.
 * • Uses SYSTEM_ALERT_WINDOW and foreground service types correctly.
 */
class ZaraFloatingOverlayService : Service() {

    companion object {
        const val CHANNEL_ID = "zara_overlay_channel"
        const val NOTIFICATION_ID = 2002

        // Broadcast actions to notify overlay of speech state
        const val ACTION_TTS_STARTED = "com.zara.assistant.TTS_STARTED"
        const val ACTION_TTS_FINISHED = "com.zara.assistant.TTS_FINISHED"
        const val ACTION_OPEN_ASSISTANT = "com.zara.assistant.OPEN_ASSISTANT"

        fun start(context: Context) {
            if (Settings.canDrawOverlays(context)) {
                val intent = Intent(context, ZaraFloatingOverlayService::class.java)
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                    context.startForegroundService(intent)
                } else {
                    context.startService(intent)
                }
            }
        }

        fun stop(context: Context) {
            val intent = Intent(context, ZaraFloatingOverlayService::class.java)
            context.stopService(intent)
        }

        fun notifySpeechStarted(context: Context) {
            context.sendBroadcast(Intent(ACTION_TTS_STARTED))
        }

        fun notifySpeechFinished(context: Context) {
            context.sendBroadcast(Intent(ACTION_TTS_FINISHED))
        }
    }

    private var windowManager: WindowManager? = null
    private var overlayView: View? = null
    private var floatAnimator: ObjectAnimator? = null
    private var pulseAnimator: ObjectAnimator? = null
    private var isSpeaking = false

    private val ttsStateReceiver = object : BroadcastReceiver() {
        override fun onReceive(context: Context?, intent: Intent?) {
            when (intent?.action) {
                ACTION_TTS_STARTED -> startSpeakingAnimation()
                ACTION_TTS_FINISHED -> stopSpeakingAnimation()
            }
        }
    }

    override fun onCreate() {
        super.onCreate()
        createNotificationChannel()
        startForeground(NOTIFICATION_ID, buildForegroundNotification())

        val filter = IntentFilter().apply {
            addAction(ACTION_TTS_STARTED)
            addAction(ACTION_TTS_FINISHED)
        }
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            registerReceiver(ttsStateReceiver, filter, RECEIVER_NOT_EXPORTED)
        } else {
            registerReceiver(ttsStateReceiver, filter)
        }

        initOverlayWindow()
    }

    @SuppressLint("InflateParams", "ClickableViewAccessibility")
    private fun initOverlayWindow() {
        if (!Settings.canDrawOverlays(this)) return

        windowManager = getSystemService(WINDOW_SERVICE) as WindowManager

        val layoutFlag = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY
        } else {
            @Suppress("DEPRECATION")
            WindowManager.LayoutParams.TYPE_PHONE
        }

        // Standard 64dp size for the circular floating icon
        val density = resources.displayMetrics.density
        val iconSize = (64 * density).toInt()

        val params = WindowManager.LayoutParams(
            iconSize,
            iconSize,
            layoutFlag,
            WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE or
                    WindowManager.LayoutParams.FLAG_LAYOUT_NO_LIMITS,
            PixelFormat.TRANSLUCENT
        ).apply {
            // Positioned near lower right area as shown in reference image
            gravity = Gravity.BOTTOM or Gravity.END
            x = (28 * density).toInt()
            y = (96 * density).toInt()
        }

        // Programmatic or inflated view containing Zara's Logo & Glow ring
        overlayView = View(this).apply {
            setBackgroundResource(R.drawable.zara_floating_bubble_bg) // Circular Zara Logo with neon ring
        }

        // Draggable touch handling with tap detection to launch Zara
        var initialX = 0
        var initialY = 0
        var initialTouchX = 0f
        var initialTouchY = 0f
        val touchSlop = 10 * density

        overlayView?.setOnTouchListener { view, event ->
            when (event.action) {
                MotionEvent.ACTION_DOWN -> {
                    initialX = params.x
                    initialY = params.y
                    initialTouchX = event.rawX
                    initialTouchY = event.rawY
                    true
                }
                MotionEvent.ACTION_MOVE -> {
                    // Update WindowManager position with drag
                    params.x = initialX - (event.rawX - initialTouchX).toInt()
                    params.y = initialY - (event.rawY - initialTouchY).toInt()
                    windowManager?.updateViewLayout(overlayView, params)
                    true
                }
                MotionEvent.ACTION_UP -> {
                    val deltaX = abs(event.rawX - initialTouchX)
                    val deltaY = abs(event.rawY - initialTouchY)
                    // If finger movement is within click threshold, treat as tap
                    if (deltaX < touchSlop && deltaY < touchSlop) {
                        openZaraAssistant()
                    }
                    true
                }
                else -> false
            }
        }

        try {
            windowManager?.addView(overlayView, params)
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }

    /**
     * Zara is speaking via TTS:
     * Logo slowly floats Up-Down and softly pulses with glow
     */
    private fun startSpeakingAnimation() {
        if (isSpeaking || overlayView == null) return
        isSpeaking = true

        // 1. Up-Down gentle floating motion (translationY)
        floatAnimator?.cancel()
        floatAnimator = ObjectAnimator.ofFloat(overlayView, "translationY", 0f, -22f, 0f).apply {
            duration = 1800
            repeatCount = ValueAnimator.INFINITE
            interpolator = AccelerateDecelerateInterpolator()
            start()
        }

        // 2. Pulse / Glow scale animation
        pulseAnimator?.cancel()
        val scaleX = PropertyValuesHolder.ofFloat("scaleX", 1.0f, 1.08f, 1.0f)
        val scaleY = PropertyValuesHolder.ofFloat("scaleY", 1.0f, 1.08f, 1.0f)
        pulseAnimator = ObjectAnimator.ofPropertyValuesHolder(overlayView, scaleX, scaleY).apply {
            duration = 1400
            repeatCount = ValueAnimator.INFINITE
            interpolator = AccelerateDecelerateInterpolator()
            start()
        }
    }

    /**
     * Zara finished speaking:
     * Animation immediately stops and resets to resting position
     */
    private fun stopSpeakingAnimation() {
        isSpeaking = false

        floatAnimator?.cancel()
        pulseAnimator?.cancel()

        overlayView?.animate()
            ?.translationY(0f)
            ?.scaleX(1.0f)
            ?.scaleY(1.0f)
            ?.setDuration(300)
            ?.start()
    }

    /**
     * Tapping the floating logo opens Zara Assistant
     */
    private fun openZaraAssistant() {
        val launchIntent = Intent(this, MainActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_SINGLE_TOP
        }
        startActivity(launchIntent)
    }

    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                CHANNEL_ID,
                "Zara Floating Companion",
                NotificationManager.IMPORTANCE_LOW
            ).apply {
                description = "Shows floating Zara assistant logo over home screen"
                setShowBadge(false)
            }
            val manager = getSystemService(NotificationManager::class.java)
            manager.createNotificationChannel(channel)
        }
    }

    private fun buildForegroundNotification(): Notification {
        val pendingIntent = PendingIntent.getActivity(
            this,
            0,
            Intent(this, MainActivity::class.java),
            PendingIntent.FLAG_IMMUTABLE
        )

        return NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle("Zara Floating Assistant")
            .setContentText("জারা ব্যাকগ্রাউন্ড ও হোম স্ক্রিনে সক্রিয় রয়েছে")
            .setSmallIcon(R.drawable.ic_zara_logo)
            .setContentIntent(pendingIntent)
            .setOngoing(true)
            .build()
    }

    override fun onDestroy() {
        super.onDestroy()
        try {
            unregisterReceiver(ttsStateReceiver)
        } catch (_: Exception) {}

        stopSpeakingAnimation()

        if (overlayView != null) {
            try {
                windowManager?.removeView(overlayView)
            } catch (_: Exception) {}
            overlayView = null
        }
    }

    override fun onBind(intent: Intent?): IBinder? = null
}
