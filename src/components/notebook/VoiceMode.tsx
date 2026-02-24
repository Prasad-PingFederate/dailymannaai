"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { useVoice } from "@/hooks/useVoice";
import styles from "./VoiceMode.module.css";

/**
 * ─── COMPONENTS ─────────────────────────────────────────────────────────────
 */

const VoicePhaseOrb = ({ phase, status }: { phase: string, status: string }) => {
    // state: idle | listening | thinking | speaking
    const isActive = phase !== "idle";
    const isThinking = phase === "processing";
    const isListening = status === "listening" && phase === "recording";
    const isSpeaking = status === "speaking";

    return (
        <div className={styles.orbContainer}>
            <div className={`${styles.orb} ${isListening ? styles.listening : ""} ${isThinking ? styles.thinking : ""} ${isSpeaking ? styles.speaking : ""}`}>
                {isListening && (
                    <div className={styles.innerBars}>
                        {[0, 1, 2, 3, 4].map(i => <div key={i} className={styles.soundBar} style={{ animationDelay: `${i * 0.1}s` }} />)}
                    </div>
                )}
                {isThinking && (
                    <div className={styles.innerDots}>
                        {[0, 1, 2].map(i => <div key={i} className={styles.thinkDot} style={{ animationDelay: `${i * 0.2}s` }} />)}
                    </div>
                )}
                {!isListening && !isThinking && (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
                        <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                        <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                        <line x1="12" y1="19" x2="12" y2="23" />
                        <line x1="8" y1="23" x2="16" y2="23" />
                    </svg>
                )}
            </div>
        </div>
    );
};

function Spinner() {
    return <div className={styles.spinner} />;
}

/**
 * ─── MAIN COMPONENT ─────────────────────────────────────────────────────────
 */

export type VoiceStatus =
    | "idle"
    | "listening"
    | "processing"
    | "speaking"
    | "error";

export type VoicePhase = "idle" | "recording" | "processing";

interface VoiceModeProps {
    onTranscript?: (text: string) => void;
    onAIResponse?: (text: string) => void;
    onActive?: (active: boolean) => void;
    getAIResponse: (userText: string) => Promise<string>;
    className?: string;
    language?: string;
}

export const VoiceMode: React.FC<VoiceModeProps> = ({
    onTranscript,
    onAIResponse,
    onActive,
    getAIResponse,
    className = "",
    language = "en",
}) => {
    const [phase, setPhase] = useState<VoicePhase>("idle");
    const [error, setError] = useState("");
    const submissionIdRef = useRef<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const isSubmittingRef = useRef(false);
    const isCancelledRef = useRef(false);
    const transcriptRef = useRef("");

    const onTranscriptRef = useRef<((text: string) => void) | undefined>(undefined);

    const {
        status,
        transcript,
        isLive,
        error: voiceError,
        startListening,
        stopListening,
        speak: speakAudio,
        cancelSpeech,
    } = useVoice({
        language,
        onTranscriptionComplete: (text) => onTranscriptRef.current?.(text)
    });

    const processSubmission = useCallback(async (text: string) => {
        if (!text.trim() || isSubmittingRef.current || isCancelledRef.current) return;

        isSubmittingRef.current = true;
        setIsSubmitting(true);
        setPhase("processing");
        onTranscript?.(text.trim());

        try {
            const response = await getAIResponse(text.trim());
            if (!isCancelledRef.current) {
                onAIResponse?.(response);
                setPhase("idle");
                await speakAudio(response);
            }
        } catch (err) {
            setError("Failed to get answer.");
            setPhase("idle");
        } finally {
            isSubmittingRef.current = false;
            setIsSubmitting(false);
        }
    }, [getAIResponse, onTranscript, onAIResponse, speakAudio]);

    useEffect(() => {
        onTranscriptRef.current = (text) => {
            if (phase === "recording" || phase === "processing") {
                processSubmission(text);
            }
        };
    }, [phase, processSubmission]);


    // Handle standard browser recognition completion (Chrome/Safari)
    useEffect(() => {
        if (isLive && status === "idle" && phase === "processing" && transcript && !isSubmitting) {
            processSubmission(transcript);
        }
    }, [isLive, status, phase, transcript, isSubmitting, processSubmission]);

    // Sync phase - STAY in recording phase until manual confirm/cancel
    useEffect(() => {
        if (phase === "processing" || isSubmitting) return;
        if (status === "listening") setPhase("recording");
        // We do NOT set idle here if status becomes idle naturally.
        // We wait for user action.
    }, [status, phase, isSubmitting]);

    // Update main input live as the user speaks
    useEffect(() => {
        transcriptRef.current = transcript;
        if (phase === "recording" && transcript.trim()) {
            onTranscript?.(transcript.trim());
        }
    }, [phase, transcript, onTranscript]);

    useEffect(() => {
        onActive?.(phase !== "idle");
    }, [phase, onActive]);

    useEffect(() => {
        if (voiceError) setError(voiceError);
    }, [voiceError]);

    // ── Handlers ─────────────────────────────────────────────────────────────

    const handleStart = useCallback(() => {
        setError("");
        isCancelledRef.current = false;
        isSubmittingRef.current = false;
        setIsSubmitting(false);
        submissionIdRef.current = null;
        startListening();
        setPhase("recording");
    }, [startListening]);

    const handleCancel = useCallback(() => {
        isCancelledRef.current = true;
        stopListening();
        cancelSpeech();
        setPhase("idle");
    }, [stopListening, cancelSpeech]);

    const handleConfirm = useCallback(async () => {
        if (isLive && transcript.trim()) {
            // ✅ Snapshot BEFORE stopListening() can potentially reset state
            const snapshotText = transcript.trim();
            transcriptRef.current = snapshotText; // Pin ref immediately

            await stopListening();

            // ✅ Wait briefly for browser STT to fire its final onresult
            setTimeout(() => {
                // transcriptRef.current might have updated with more words during the 400ms period
                // Fall back to snapshot if ref was wiped or is empty
                const finalText = transcriptRef.current?.trim() || snapshotText;
                processSubmission(finalText);
            }, 400);
        } else {
            // Fallback (Firefox): wait for onTranscriptionComplete
            setPhase("processing");
            await stopListening();
        }
    }, [isLive, transcript, stopListening, processSubmission]);

    // ── Keyboard Shortcuts ───────────────────────────────────────────────────
    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if (e.code === "Space" && phase === "idle" && document.activeElement?.tagName !== "TEXTAREA") {
                e.preventDefault();
                handleStart();
            } else if (e.key === "Enter" && phase === "recording") {
                e.preventDefault();
                handleConfirm();
            } else if (e.key === "Escape" && phase !== "idle") {
                handleCancel();
            }
        };
        window.addEventListener("keydown", handler);
        return () => window.removeEventListener("keydown", handler);
    }, [phase, handleStart, handleConfirm, handleCancel]);

    return (
        <div className={`${styles.voiceWrapper} ${className} ${phase !== "idle" ? styles.isActive : ""}`}>

            {/* Recording Transcript Preview (Top Float) */}
            {(phase === "recording" || phase === "processing") && (
                <div className={styles.transcriptPreview}>
                    <p className={styles.liveLabel}>
                        <span className={styles.pulseDot}></span>
                        {phase === "processing" ? "Finalized Transcript" : (isLive ? "Listening..." : "Capturing audio...")}
                    </p>
                    {transcript ? (
                        <p className={styles.transcriptText}>{transcript}</p>
                    ) : (
                        <p className={styles.placeholderText}>
                            {isLive ? "Speak now..." : "Audio is being recorded. Click the tick to transcribe."}
                        </p>
                    )}
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
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                            <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                            <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                            <line x1="12" y1="19" x2="12" y2="23" />
                            <line x1="8" y1="23" x2="16" y2="23" />
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
                            <VoicePhaseOrb phase={phase} status={status} />
                        </div>

                        <button
                            className={`${styles.confirmBtn} ${(isLive && !transcript) ? styles.disabled : ""}`}
                            onClick={handleConfirm}
                            disabled={isLive && !transcript}
                            title="Confirm (Enter)"
                        >
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="20 6 9 17 4 12" />
                            </svg>
                        </button>
                    </>
                )}

                {phase === "processing" && (
                    <>
                        <button className={styles.cancelBtn} onClick={handleCancel}>
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                            </svg>
                        </button>
                        <div className={styles.centerArea}>
                            <VoicePhaseOrb phase={phase} status={status} />
                        </div>
                        <div className={styles.spinnerWrap}>
                            <Spinner />
                        </div>
                    </>
                )}
            </div>

            {error && <div className={styles.errorMessage}>⚠️ {error}</div>}
        </div>
    );
};

export default VoiceMode;
