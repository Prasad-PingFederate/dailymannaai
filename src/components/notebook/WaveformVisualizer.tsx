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
  color = "#c8973a",
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
        const centerX = width / 2;
        const centerY = height / 2;

        // ChatGPT-Style Minimalist Waveform (Symmetric lines)
        const barWidth = 3;
        const gap = 2;
        const totalBars = Math.floor(width / (barWidth + gap));

        for (let i = 0; i < totalBars; i++) {
          const dataIndex = Math.floor((i / totalBars) * bufferLength);
          const value = dataArray[dataIndex] / 255.0;
          const barHeight = 2 + (value * (height - 4));

          // Mirror from center
          const x = i * (barWidth + gap);
          const y = (height - barHeight) / 2;

          // Premium Gradient
          const grad = ctx.createLinearGradient(0, y, 0, y + barHeight);
          grad.addColorStop(0, `${color}00`);
          grad.addColorStop(0.5, color);
          grad.addColorStop(1, `${color}00`);

          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.roundRect(x, y, barWidth, barHeight, 2);
          ctx.fill();
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
      className="w-full h-full opacity-60"
      width={300}
      height={60}
    />
  );
}
