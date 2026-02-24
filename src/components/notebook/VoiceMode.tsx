"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { useVoice } from "@/hooks/useVoice";
import styles from "./VoiceMode.module.css";

/**
 * ─── COMPONENTS ─────────────────────────────────────────────────────────────
 */

const BARS = 28;

function WaveformBars({ isActive }: { isActive: boolean }) {
    return (
        <div className={styles.waveContainer}>
            {Array.from({ length: BARS }).map((_, i) => (
                <span
                    key={i}
                    className={styles.waveBar}
                    style={{
                        animationDelay: isActive ? `${(i * 40) % 600}ms` : "0ms",
                        animationPlayState: isActive ? "running" : "paused",
                        height: isActive ? undefined : "3px",
                    }}
                />
            ))}
        </div>
    );
}

function Spinner() {
    return <div className={styles.spinner} />;
}

/**
 * ─── MAIN COMPONENT ─────────────────────────────────────────────────────────
 */

export type VoicePhase = "idle" | "recording" | "processing";

interface VoiceModeProps {
    onTranscript?: (text: string) => void;
    onAIResponse?: (text: string) => void;
    getAIResponse: (userText: string) => Promise<string>;
    className?: string;
    language?: string;
}

export const VoiceMode: React.FC<VoiceModeProps> = ({
    onTranscript,
    onAIResponse,
    getAIResponse,
    className = "",
    language = "en",
}) => {
    const [phase, setPhase] = useState<VoicePhase>("idle");
    const [error, setError] = useState("");

    const {
        status,
        transcript,
        error: voiceError,
        startListening,
        stopListening,
        speak,
        cancelSpeech,
    } = useVoice({ language });

    const finalRef = useRef("");
    const processedTranscriptRef = useRef("");
    const isCancelledRef = useRef(false);

    // Sync phase with useVoice status if not manually overridden by "processing"
    useEffect(() => {
        if (phase === "processing") return;
        if (status === "listening") setPhase("recording");
        else if (status === "idle") setPhase("idle");
        else if (status === "error") setPhase("idle");
    }, [status, phase]);

    useEffect(() => {
        if (voiceError) setError(voiceError);
    }, [voiceError]);

    // ── Handlers ─────────────────────────────────────────────────────────────

    const handleStart = useCallback(() => {
        setError("");
        finalRef.current = "";
        isCancelledRef.current = false;
        processedTranscriptRef.current = "";
        startListening();
        setPhase("recording");
    }, [startListening]);

    const handleCancel = useCallback(() => {
        isCancelledRef.current = true;
        stopListening();
        cancelSpeech();
        setPhase("idle");
        finalRef.current = "";
    }, [stopListening, cancelSpeech]);

    const handleConfirm = useCallback(async () => {
        stopListening();
        setPhase("processing");

        // Use current transcript
        const textToSubmit = transcript.trim();
        if (!textToSubmit) {
            handleCancel();
            return;
        }

        onTranscript?.(textToSubmit);

        try {
            const response = await getAIResponse(textToSubmit);
            if (isCancelledRef.current) return;

            onAIResponse?.(response);
            setPhase("idle");
            await speak(response);
        } catch (err) {
            console.error("Voice AI Error:", err);
            setError("Failed to get answer.");
            setPhase("idle");
        }
    }, [transcript, stopListening, getAIResponse, onTranscript, onAIResponse, speak, handleCancel]);

    // ── Keyboard Shortcuts ───────────────────────────────────────────────────
    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

            if (e.code === "Space" && phase === "idle") {
                e.preventDefault();
                handleStart();
            }
            if (e.code === "Enter" && phase === "recording") {
                e.preventDefault();
                handleConfirm();
            }
            if (e.code === "Escape" && phase === "recording") {
                handleCancel();
            }
        };
        window.addEventListener("keydown", handler);
        return () => window.removeEventListener("keydown", handler);
    }, [phase, handleStart, handleConfirm, handleCancel]);

    return (
        <div className={`${styles.voiceWrapper} ${className} ${phase !== "idle" ? styles.isActive : ""}`}>

            {/* Recording Transcript Preview (Top Float) */}
            {phase === "recording" && transcript && (
                <div className={styles.transcriptPreview}>
                    {transcript}
                </div>
            )}

            {/* Main Integrated Control */}
            <div className={styles.integratedBar}>

                {phase === "idle" && (
                    <button
                        className={styles.micBtn}
                        onClick={handleStart}
                        title="Voice Input (Space)"
                    >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 1a4 4 0 0 1 4 4v6a4 4 0 0 1-8 0V5a4 4 0 0 1 4-4zm0 2a2 2 0 0 0-2 2v6a2 2 0 0 0 4 0V5a2 2 0 0 0-2-2zm-7 9h2a5 5 0 0 0 10 0h2a7 7 0 0 1-6 6.92V21h3v2H8v-2h3v-2.08A7 7 0 0 1 5 12z" />
                        </svg>
                    </button>
                )}

                {phase === "recording" && (
                    <>
                        <button className={styles.cancelBtn} onClick={handleCancel} title="Cancel (Esc)">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                            </svg>
                        </button>

                        <div className={styles.centerArea}>
                            <WaveformBars isActive />
                        </div>

                        <button className={styles.confirmBtn} onClick={handleConfirm} title="Send (Enter)">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="20 6 9 17 4 12" />
                            </svg>
                        </button>
                    </>
                )}

                {phase === "processing" && (
                    <>
                        <div className={styles.centerArea}>
                            <WaveformBars isActive={false} />
                        </div>
                        <Spinner />
                    </>
                )}
            </div>

            {error && <div className={styles.errorMessage}>{error}</div>}

            {/* Hint text moved to title or shown on hover in the main UI if needed */}
        </div>
    );
};

export default VoiceMode;
