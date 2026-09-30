import React, { useEffect, useRef } from "react";
import { motion } from "motion/react";

export type VisualizerState = "idle" | "listening" | "processing" | "speaking" | "reconnecting";

interface VisualizerProps {
  state: VisualizerState;
  audioIntensity?: number; // 0.0 to 1.0 audio energy
  className?: string;
  height?: number;
}

export default function Visualizer({
  state,
  audioIntensity = 0,
  className = "",
  height = 90,
}: VisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const phaseRef = useRef<number>(0);
  const smoothedIntensityRef = useRef<number>(0);

  // Smooth out audio intensity for fluid organic waves
  useEffect(() => {
    // If speaking, minimum baseline intensity so waves are always alive and vibrant
    let target = audioIntensity;
    if (state === "speaking") {
      target = Math.max(0.35, audioIntensity * 2.2);
    } else if (state === "listening") {
      target = Math.max(0.2, audioIntensity * 1.8);
    } else if (state === "processing") {
      target = 0.45;
    } else {
      target = 0.08; // Gentle idle wave
    }

    const interval = setInterval(() => {
      // Exponential moving average for liquid-smooth wave reaction
      smoothedIntensityRef.current += (target - smoothedIntensityRef.current) * 0.22;
    }, 16);

    return () => clearInterval(interval);
  }, [state, audioIntensity]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let dpr = window.devicePixelRatio || 1;
    let width = canvas.clientWidth || 320;
    let ch = height;
    canvas.width = width * dpr;
    canvas.height = ch * dpr;
    ctx.scale(dpr, dpr);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.clientWidth || 320;
      ch = height;
      dpr = window.devicePixelRatio || 1;
      canvas.width = width * dpr;
      canvas.height = ch * dpr;
      ctx.scale(dpr, dpr);
    };

    window.addEventListener("resize", handleResize);

    // Wave Configurations with dynamic vibrant neon palettes
    const waveLayers = [
      {
        // 1. Electric Cyan Wave
        freq: 0.022,
        speed: 0.048,
        colorStart: "rgba(34, 211, 238, 0.85)",
        colorEnd: "rgba(6, 182, 212, 0.05)",
        strokeColor: "#22d3ee",
        shadowColor: "#06b6d4",
        phaseOffset: 0,
        ampMultiplier: 1.0,
      },
      {
        // 2. Neon Magenta / Rose Wave
        freq: 0.018,
        speed: -0.042,
        colorStart: "rgba(244, 63, 94, 0.8)",
        colorEnd: "rgba(225, 29, 72, 0.05)",
        strokeColor: "#fb7185",
        shadowColor: "#f43f5e",
        phaseOffset: Math.PI / 2.5,
        ampMultiplier: 1.25,
      },
      {
        // 3. Cosmic Violet / Purple Wave
        freq: 0.026,
        speed: 0.035,
        colorStart: "rgba(168, 85, 247, 0.75)",
        colorEnd: "rgba(147, 51, 234, 0.05)",
        strokeColor: "#c084fc",
        shadowColor: "#a855f7",
        phaseOffset: Math.PI / 1.5,
        ampMultiplier: 0.9,
      },
      {
        // 4. Warm Gold / Amber Wave
        freq: 0.015,
        speed: -0.028,
        colorStart: "rgba(251, 191, 36, 0.7)",
        colorEnd: "rgba(245, 158, 11, 0.05)",
        strokeColor: "#fde047",
        shadowColor: "#fbbf24",
        phaseOffset: Math.PI,
        ampMultiplier: 0.75,
      },
    ];

    const render = () => {
      ctx.clearRect(0, 0, width, ch);

      const intensity = smoothedIntensityRef.current;
      const centerY = ch / 2;
      const baseAmp = 6 + intensity * (ch * 0.42);

      phaseRef.current += 0.04 + intensity * 0.04;

      // Draw each dynamic color wave layer
      waveLayers.forEach((layer) => {
        ctx.save();
        ctx.beginPath();

        const grad = ctx.createLinearGradient(0, centerY - baseAmp, 0, ch);
        grad.addColorStop(0, layer.colorStart);
        grad.addColorStop(1, layer.colorEnd);

        ctx.fillStyle = grad;
        ctx.strokeStyle = layer.strokeColor;
        ctx.lineWidth = 1.8 + intensity * 1.5;
        ctx.shadowColor = layer.shadowColor;
        ctx.shadowBlur = 8 + intensity * 14;

        ctx.moveTo(0, centerY);

        const currentPhase = phaseRef.current * layer.speed * 20 + layer.phaseOffset;
        const amp = baseAmp * layer.ampMultiplier;

        // Draw smooth sinusoidal curve across the width with envelope dampening at edges
        for (let x = 0; x <= width; x += 3) {
          // Envelope: smooth bell curve so waves taper nicely toward the left & right borders
          const normX = x / width;
          const envelope = Math.sin(normX * Math.PI);

          const y =
            centerY +
            Math.sin(x * layer.freq + currentPhase) * amp * envelope +
            Math.sin(x * (layer.freq * 2.1) + currentPhase * 1.5) * (amp * 0.35) * envelope;

          ctx.lineTo(x, y);
        }

        ctx.stroke();

        // Fill bottom with subtle translucent glow
        ctx.lineTo(width, ch);
        ctx.lineTo(0, ch);
        ctx.closePath();
        ctx.fill();

        ctx.restore();
      });

      // Center energetic light pulse synchronized with audio intensity
      if (intensity > 0.15) {
        ctx.save();
        const pulseGrad = ctx.createRadialGradient(
          width / 2,
          centerY,
          0,
          width / 2,
          centerY,
          35 + intensity * 45
        );
        pulseGrad.addColorStop(
          0,
          state === "speaking"
            ? "rgba(244, 63, 94, 0.45)"
            : state === "listening"
            ? "rgba(34, 211, 238, 0.45)"
            : "rgba(168, 85, 247, 0.35)"
        );
        pulseGrad.addColorStop(1, "rgba(0, 0, 0, 0)");

        ctx.fillStyle = pulseGrad;
        ctx.beginPath();
        ctx.arc(width / 2, centerY, 35 + intensity * 45, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      animFrameRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
      window.removeEventListener("resize", handleResize);
    };
  }, [height, state]);

  return (
    <div
      className={`relative w-full overflow-hidden flex flex-col items-center justify-center select-none ${className}`}
      style={{ height: `${height}px` }}
    >
      {/* Background soft ambient halo glow */}
      <motion.div
        animate={{
          scale: state === "speaking" ? [1, 1.15, 1] : [1, 1.04, 1],
          opacity: state === "speaking" ? [0.4, 0.8, 0.4] : [0.15, 0.35, 0.15],
        }}
        transition={{ duration: state === "speaking" ? 0.8 : 3, repeat: Infinity }}
        className="absolute inset-x-10 -bottom-2 h-14 bg-gradient-to-r from-cyan-500/25 via-pink-500/30 to-purple-500/25 blur-2xl rounded-full pointer-events-none"
      />

      {/* Dynamic 60fps Color Wave Canvas */}
      <canvas
        ref={canvasRef}
        className="w-full h-full relative z-10 block pointer-events-none"
      />

      {/* Status Label Overlay (Subtle) */}
      <div className="absolute top-1 z-20 flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-black/60 border border-white/10 backdrop-blur-md text-[9px] font-mono tracking-wider text-white/70">
        <span
          className={`w-1.5 h-1.5 rounded-full ${
            state === "speaking"
              ? "bg-pink-400 animate-ping"
              : state === "listening"
              ? "bg-cyan-400 animate-pulse"
              : state === "processing"
              ? "bg-amber-400 animate-ping"
              : "bg-white/40"
          }`}
        />
        <span className="uppercase text-[9px] font-semibold text-white/80">
          {state === "speaking"
            ? "Voice Audio Active"
            : state === "listening"
            ? "Hearing Mic"
            : state === "processing"
            ? "Thinking"
            : "Standby"}
        </span>
      </div>
    </div>
  );
}
