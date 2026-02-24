"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import { useVoice } from "@/hooks/useVoice";
import styles from "./VoiceMode.module.css";

export type VoiceStatus =
    | "idle"
    | "listening"
    | "processing"
    | "speaking"
    | "error";

interface VoiceModeProps {
    onTranscript?: (text: string) => void;
    onAIResponse?: (text: string) => void;
    getAIResponse: (userText: string) => Promise<string>;
    className?: string;
    language?: string;
    voiceName?: any;
}

const STATUS_LABELS: Record<VoiceStatus, string> = {
    idle: "Tap to speak",
    listening: "Listening...",
    processing: "Thinking...",
    speaking: "Speaking...",
    error: "Try again",
};

const STATUS_ICONS: Record<VoiceStatus, string> = {
    idle: "✝",
    listening: "🎙",
    processing: "✨",
    speaking: "🔊",
    error: "⚠",
};

export const VoiceMode: React.FC<VoiceModeProps> = ({
    onTranscript,
    onAIResponse,
    getAIResponse,
    className = "",
    language = "en",
    voiceName = "shimmer",
}) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const animFrameRef = useRef<number>(0);

    const {
        status,
        transcript,
        error,
        analyserNode,
        isPaused,
        startListening,
        stopListening,
        speak,
        pauseSpeech,
        resumeSpeech,
        cancelSpeech,
    } = useVoice({ language });

    const [lastResponse, setLastResponse] = useState<string>("");
    const [isExpanded, setIsExpanded] = useState(false);
    const processedTranscriptRef = useRef(""); // prevent double-processing
    const isCancelledRef = useRef(false);

    // Draw waveform on canvas
    const drawWaveform = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas || !analyserNode) return;

        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        const bufferLength = analyserNode.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);

        const draw = () => {
            animFrameRef.current = requestAnimationFrame(draw);
            analyserNode.getByteTimeDomainData(dataArray);

            ctx.clearRect(0, 0, canvas.width, canvas.height);

            const gradient = ctx.createLinearGradient(0, 0, canvas.width, 0);
            gradient.addColorStop(0, "rgba(139, 92, 246, 0.9)");
            gradient.addColorStop(0.5, "rgba(245, 158, 11, 0.9)");
            gradient.addColorStop(1, "rgba(139, 92, 246, 0.9)");

            ctx.lineWidth = 2.5;
            ctx.strokeStyle = gradient;
            ctx.beginPath();

            const sliceWidth = canvas.width / bufferLength;
            let x = 0;

            for (let i = 0; i < bufferLength; i++) {
                const v = dataArray[i] / 128.0;
                const y = (v * canvas.height) / 2;

                if (i === 0) {
                    ctx.moveTo(x, y);
                } else {
                    ctx.lineTo(x, y);
                }
                x += sliceWidth;
            }

            ctx.lineTo(canvas.width, canvas.height / 2);
            ctx.stroke();
        };

        draw();
    }, [analyserNode]);

    // Draw idle pulse when not listening
    const drawPulse = useCallback((status: VoiceStatus) => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        let start: number | null = null;

        const animate = (timestamp: number) => {
            if (!start) start = timestamp;
            const progress = (timestamp - start) / 2000;

            ctx.clearRect(0, 0, canvas.width, canvas.height);

            const cx = canvas.width / 2;
            const cy = canvas.height / 2;
            const maxR = Math.min(canvas.width, canvas.height) / 2 - 4;

            if (status === "speaking" && !isPaused) {
                for (let i = 3; i >= 0; i--) {
                    const phase = (progress + i * 0.25) % 1;
                    const r = phase * maxR;
                    const alpha = (1 - phase) * 0.4;
                    ctx.beginPath();
                    ctx.arc(cx, cy, r, 0, Math.PI * 2);
                    ctx.strokeStyle = `rgba(245, 158, 11, ${alpha})`;
                    ctx.lineWidth = 2;
                    ctx.stroke();
                }
            } else if (status === "processing") {
                const angle = progress * Math.PI * 4;
                ctx.beginPath();
                ctx.arc(cx, cy, maxR * 0.7, angle, angle + Math.PI * 1.5);
                ctx.strokeStyle = "rgba(139, 92, 246, 0.8)";
                ctx.lineWidth = 3;
                ctx.lineCap = "round";
                ctx.stroke();
            } else {
                const breathe = Math.sin(progress * Math.PI * 2) * 0.15 + 0.85;
                const r = maxR * breathe * 0.4;
                ctx.beginPath();
                ctx.arc(cx, cy, r, 0, Math.PI * 2);
                ctx.strokeStyle = `rgba(139, 92, 246, ${0.3 + breathe * 0.2})`;
                ctx.lineWidth = 2;
                ctx.stroke();
            }

            animFrameRef.current = requestAnimationFrame(animate);
        };

        animFrameRef.current = requestAnimationFrame(animate);
    }, [isPaused]);

    useEffect(() => {
        cancelAnimationFrame(animFrameRef.current);

        if (status === "listening" && analyserNode) {
            drawWaveform();
        } else {
            drawPulse(status);
        }

        return () => cancelAnimationFrame(animFrameRef.current);
    }, [status, analyserNode, drawWaveform, drawPulse]);

    // Auto-minimize panel when AI starts thinking/processing
    useEffect(() => {
        // If it's processing (Server Whisper) or idle (Browser STT finished), and we have a transcript
        const isDoneSpeaking = (status === "processing" || status === "idle") && transcript.length > 0;

        if (isDoneSpeaking) {
            const timer = setTimeout(() => {
                if (isExpanded) {
                    setIsExpanded(false);
                    console.log("[Voice] Auto-minimizing panel as requested.");
                }
            }, 1200); // 1.2s delay to show "Thinking/Done" feedback
            return () => clearTimeout(timer);
        }
    }, [status, transcript, isExpanded]);

    // When transcript is ready, get AI response
    useEffect(() => {
        if (!transcript || transcript === processedTranscriptRef.current) return;

        isCancelledRef.current = false;
        processedTranscriptRef.current = transcript;
        onTranscript?.(transcript);

        const handleResponse = async () => {
            try {
                // If the panel is still open, we might want to stay open during AI thinking,
                // but the user's specific request was to minimize after recording.
                const response = await getAIResponse(transcript);
                if (isCancelledRef.current) return;
                setLastResponse(response);
                onAIResponse?.(response);
                await speak(response);
            } catch (err) {
                if (!isCancelledRef.current) {
                    console.error("Voice AI response error:", err);
                }
            }
        };

        handleResponse();
    }, [transcript, getAIResponse, onAIResponse, onTranscript, speak]);

    const handleMicClick = () => {
        if (status === "listening") {
            stopListening();
            isCancelledRef.current = true;
            setIsExpanded(false); // CLOSE IMMEDIATELY ON STOP
        } else if (status === "processing" || status === "speaking") {
            cancelSpeech();
            isCancelledRef.current = true;
            setIsExpanded(false); // CLOSE IMMEDIATELY ON CANCEL
        } else if (status === "idle" || status === "error") {
            processedTranscriptRef.current = ""; // Reset for new session
            isCancelledRef.current = false;
            setIsExpanded(true);
            startListening();
        }
    };

    const handleClose = () => {
        cancelSpeech();
        stopListening();
        setIsExpanded(false);
        setLastResponse("");
        processedTranscriptRef.current = "";
    };

    return (
        <div className={`${styles.voiceContainer} ${className}`}>
            {!isExpanded && (
                <button
                    className={`${styles.floatingMic} ${styles[status]}`}
                    onClick={() => {
                        setIsExpanded(true);
                        startListening();
                    }}
                    aria-label="Open voice mode"
                    title="Daily Manna Voice"
                >
                    <span className={styles.micIcon}>🎙</span>
                    <span className={styles.micLabel}>Voice</span>
                </button>
            )}

            {isExpanded && (
                <div className={styles.voicePanel}>
                    <div className={styles.panelHeader}>
                        <span className={styles.panelTitle}>✝ Voice Mode</span>
                        <button
                            className={styles.closeBtn}
                            onClick={handleClose}
                            aria-label="Close voice mode"
                        >
                            ✕
                        </button>
                    </div>

                    <div className={styles.visualizerWrapper}>
                        <canvas
                            ref={canvasRef}
                            className={styles.waveCanvas}
                            width={320}
                            height={100}
                        />
                        <div className={`${styles.statusBadge} ${styles[status]}`}>
                            <span className={styles.statusIcon}>{STATUS_ICONS[status as VoiceStatus] || "✝"}</span>
                            <span className={styles.statusText}>{isPaused && status === "speaking" ? "Paused" : (STATUS_LABELS[status as VoiceStatus] || "Idle")}</span>
                        </div>
                    </div>

                    {transcript && (
                        <div className={styles.transcriptBox}>
                            <p className={styles.transcriptLabel}>You said:</p>
                            <p className={styles.transcriptText}>{transcript}</p>
                        </div>
                    )}

                    {lastResponse && (
                        <div className={styles.responseBox}>
                            <p className={styles.responseLabel}>Daily Manna AI:</p>
                            <p className={styles.responseText}>{lastResponse}</p>
                        </div>
                    )}

                    {error && (
                        <div className={styles.errorBox}>
                            <p>⚠ {error}</p>
                        </div>
                    )}

                    <div className={styles.controls}>
                        {status === "speaking" ? (
                            <div className={styles.speakingControls}>
                                <button
                                    className={styles.playPauseBtn}
                                    onClick={isPaused ? resumeSpeech : pauseSpeech}
                                    aria-label={isPaused ? "Resume" : "Pause"}
                                >
                                    <span className={styles.btnIcon}>{isPaused ? "▶" : "⏸"}</span>
                                    <span className={styles.btnLabel}>{isPaused ? "Resume" : "Pause"}</span>
                                </button>
                                <button
                                    className={styles.stopBtn}
                                    onClick={handleMicClick}
                                    aria-label="Stop"
                                >
                                    <span className={styles.btnIcon}>⏹</span>
                                    <span className={styles.btnLabel}>Stop</span>
                                </button>
                            </div>
                        ) : (
                            <button
                                className={`${styles.mainBtn} ${styles[status]}`}
                                onClick={handleMicClick}
                                aria-label={status === "listening" || status === "processing" ? "Stop" : "Speak"}
                            >
                                <span className={styles.btnIcon}>
                                    {status === "listening" || status === "processing" ? "⏹" : "🎙"}
                                </span>
                                <span className={styles.btnLabel}>
                                    {status === "listening" || status === "processing" ? "Stop" : "Speak"}
                                </span>
                            </button>
                        )}

                        {(status === "idle" || status === "error") && (
                            <button
                                className={styles.secondaryBtn}
                                onClick={handleMicClick}
                                aria-label="Ask again"
                            >
                                🔄 Ask Again
                            </button>
                        )}
                    </div>

                    <p className={styles.hint}>
                        Speak your Bible question or prayer request
                    </p>
                </div>
            )}
        </div>
    );
};

export default VoiceMode;
