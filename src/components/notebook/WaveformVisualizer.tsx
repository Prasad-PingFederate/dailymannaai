"use client";

import React, { useEffect, useRef } from "react";

interface WaveformVisualizerProps {
  stream: MediaStream | null;
  isRecording: boolean;
  color?: string;
}

export default function WaveformVisualizer({
  stream,
  isRecording,
  color = "#c8973a", // Default gold color
}: WaveformVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    if (isRecording && stream && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }

      const audioCtx = audioCtxRef.current;
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 512;
      const source = audioCtx.createMediaStreamSource(stream);
      source.connect(analyser);
      analyserRef.current = analyser;

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      let rotation = 0;

      const draw = () => {
        animationRef.current = requestAnimationFrame(draw);
        analyser.getByteFrequencyData(dataArray);

        // Clear with slight trailing for movement effect
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        const width = canvas.width;
        const height = canvas.height;
        const centerX = width / 2;
        const centerY = height / 2;

        // Calculate average volume for pulse
        const volume = dataArray.reduce((a, b) => a + b, 0) / bufferLength;
        const pulse = 1 + (volume / 255) * 1.5;

        rotation += 0.01;

        // Draw multiple layers of "spirit" waves
        for (let j = 0; j < 3; j++) {
          const opacity = (3 - j) / 4;
          ctx.beginPath();
          ctx.strokeStyle = `${color}${Math.floor(opacity * 255).toString(16).padStart(2, '0')}`;
          ctx.lineWidth = 2 + j;

          for (let i = 0; i < bufferLength; i++) {
            const angle = (i / bufferLength) * Math.PI * 2 + rotation * (j + 1);
            const value = dataArray[i] / 255.0;

            // Dynamic radius based on frequency and pulse
            const r = (50 + (value * 80 * pulse)) * (1 - j * 0.1);

            const x = centerX + Math.cos(angle) * r;
            const y = centerY + Math.sin(angle) * r;

            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
          }
          ctx.closePath();
          ctx.stroke();

          // Fill with a soft glow
          ctx.fillStyle = `${color}${Math.floor(opacity * 20).toString(16).padStart(2, '0')}`;
          if (j === 0) ctx.fill();
        }

        // Draw central orb core
        const coreGradient = ctx.createRadialGradient(centerX, centerY, 5, centerX, centerY, 40 * pulse);
        coreGradient.addColorStop(0, color);
        coreGradient.addColorStop(1, `${color}00`);
        ctx.fillStyle = coreGradient;
        ctx.beginPath();
        ctx.arc(centerX, centerY, 60 * pulse, 0, Math.PI * 2);
        ctx.fill();
      };

      draw();
    } else {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      if (canvasRef.current) {
        const ctx = canvasRef.current.getContext("2d");
        ctx?.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      }
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isRecording, stream, color]);

  return (
    <div className="relative flex items-center justify-center">
      {/* Decorative pulsating ring around the canvas */}
      <div className="absolute w-[200px] h-[200px] border border-accent/10 rounded-full animate-[ping_3s_infinite]" />
      <canvas
        ref={canvasRef}
        className="z-10"
        width={400}
        height={400}
      />
    </div>
  );
}
