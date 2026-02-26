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
  color = "#c8973a", // Default gold color from Daily Manna
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
      analyser.fftSize = 256;
      const source = audioCtx.createMediaStreamSource(stream);
      source.connect(analyser);
      analyserRef.current = analyser;

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      const draw = () => {
        animationRef.current = requestAnimationFrame(draw);
        analyser.getByteFrequencyData(dataArray);

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        const width = canvas.width;
        const height = canvas.height;
        const barWidth = (width / bufferLength) * 2.5;
        let barHeight;
        let x = 0;

        // Draw symmetric waveform from center
        for (let i = 0; i < bufferLength; i++) {
          barHeight = (dataArray[i] / 255) * (height * 0.8);

          // Gradient for a premium look
          const gradient = ctx.createLinearGradient(0, height / 2 - barHeight / 2, 0, height / 2 + barHeight / 2);
          gradient.addColorStop(0, `${color}00`);
          gradient.addColorStop(0.5, color);
          gradient.addColorStop(1, `${color}00`);

          ctx.fillStyle = gradient;
          
          // Draw top and bottom parts for a modern "pill" bar look
          const barX = x;
          const barY = (height - barHeight) / 2;
          
          // Rounded bars
          ctx.beginPath();
          ctx.roundRect(barX, barY, barWidth - 2, barHeight, 4);
          ctx.fill();

          x += barWidth;
        }
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
    <canvas
      ref={canvasRef}
      className="w-full h-16 opacity-80"
      width={300}
      height={64}
    />
  );
}
