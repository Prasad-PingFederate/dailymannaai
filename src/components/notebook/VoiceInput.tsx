"use client";

import React, { useState, useRef, useCallback, useEffect } from "react";
import { Mic, Square, X, Sparkles, Loader2 } from "lucide-react";

interface VoiceInputProps {
    onTranscript: (text: string) => void;
    onInterimTranscript?: (text: string) => void;
    onListeningChange?: (isListening: boolean) => void;
    disabled?: boolean;
    className?: string;
}

declare global {
    interface Window {
        webkitSpeechRecognition: any;
        SpeechRecognition: any;
    }
}

const SILENCE_MS = 1800;

type Status = "idle" | "ready" | "recording" | "transcribing";

export default function VoiceInput({
    onTranscript,
    onInterimTranscript,
    onListeningChange,
    disabled = false,
    className = "",
}: VoiceInputProps) {

    const [status, setStatus] = useState<Status>("idle");
    const [error, setError] = useState<string | null>(null);
    const [interimText, setInterimText] = useState("");
    const [finalText, setFinalText] = useState("");

    const statusRef = useRef<Status>("idle");
    const finalTextRef = useRef("");           // Web Speech accumulator (fallback)
    const recognitionRef = useRef<any>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const recorderRef = useRef<MediaRecorder | null>(null);
    const chunksRef = useRef<Blob[]>([]);
    const mimeTypeRef = useRef<string>("");
    const silenceTimerRef = useRef<NodeJS.Timeout | null>(null);
    const cancelledRef = useRef(false);

    const setStatusBoth = (s: Status) => { statusRef.current = s; setStatus(s); };

    // ── Init ─────────────────────────────────────────────────────────────────
    useEffect(() => { setStatusBoth("ready"); }, []);

    // ── Error auto-dismiss ────────────────────────────────────────────────────
    useEffect(() => {
        if (!error) return;
        const t = setTimeout(() => setError(null), 4500);
        return () => clearTimeout(t);
    }, [error]);

    // ── Helpers ───────────────────────────────────────────────────────────────
    const clearSilenceTimer = () => {
        if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
        silenceTimerRef.current = null;
    };

    const stopTracks = () => {
        streamRef.current?.getTracks().forEach(t => t.stop());
        streamRef.current = null;
    };

    const killRecognition = () => {
        const r = recognitionRef.current;
        if (!r) return;
        r.onresult = null; r.onerror = null; r.onend = null;
        try { r.stop(); } catch { }
        recognitionRef.current = null;
    };

    const resetDisplay = () => {
        setInterimText(""); setFinalText("");
        finalTextRef.current = ""; chunksRef.current = [];
    };

    // ── Deliver final result ──────────────────────────────────────────────────
    const deliver = useCallback((text: string, source: "api" | "browser") => {
        console.log(`[Voice] Delivered via ${source}`);
        onTranscript(text.trim());
        onInterimTranscript?.("");
        onListeningChange?.(false);
        resetDisplay();
        setStatusBoth("ready");
    }, [onTranscript, onInterimTranscript, onListeningChange]);

    // ── API waterfall (Deepgram → AssemblyAI → Whisper) ──────────────────────
    const sendToApi = useCallback(async (): Promise<string | null> => {
        const blob = new Blob(chunksRef.current, { type: mimeTypeRef.current || "audio/webm" });
        if (blob.size < 500) return null;

        const fd = new FormData();
        fd.append("audio", blob, "recording.webm");

        const controller = new AbortController();
        const tid = setTimeout(() => controller.abort(), 20_000);

        try {
            const res = await fetch("/api/transcribe", {
                method: "POST",
                body: fd,
                signal: controller.signal,
            });
            clearTimeout(tid);
            if (!res.ok) return null;
            const data = await res.json();
            return data?.text?.trim() || null;
        } catch {
            clearTimeout(tid);
            return null;
        }
    }, []);

    // ── Main stop (cancel = true means discard everything) ────────────────────
    const stopRecording = useCallback(async (cancel = false) => {
        if (statusRef.current !== "recording") return;
        cancelledRef.current = cancel;
        clearSilenceTimer();
        killRecognition();

        // Stop recorder — onstop will handle the rest
        if (recorderRef.current?.state === "recording") {
            recorderRef.current.stop();  // triggers onstop async flow
        } else {
            stopTracks();
            if (!cancel) {
                // Edge: recorder never started — use browser fallback directly
                const txt = finalTextRef.current.trim();
                if (txt) deliver(txt, "browser");
                else { setError("Nothing captured."); setStatusBoth("ready"); onListeningChange?.(false); }
            } else {
                resetDisplay();
                setStatusBoth("ready");
                onListeningChange?.(false);
            }
        }
    }, [deliver, onListeningChange]);

    // ── Start ─────────────────────────────────────────────────────────────────
    const startRecording = async () => {
        setError(null);
        resetDisplay();
        cancelledRef.current = false;

        let audioStream: MediaStream;
        try {
            audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
            streamRef.current = audioStream;
        } catch {
            setError("Microphone permission denied.");
            return;
        }

        // ── 1. MediaRecorder: captures audio for API submission ───────────────
        const recorder = new MediaRecorder(audioStream);
        recorderRef.current = recorder;
        mimeTypeRef.current = recorder.mimeType;

        recorder.ondataavailable = (e) => {
            if (e.data.size > 0) chunksRef.current.push(e.data);
        };

        recorder.onstop = async () => {
            stopTracks();

            if (cancelledRef.current) {
                resetDisplay();
                setStatusBoth("ready");
                onListeningChange?.(false);
                return;
            }

            setStatusBoth("transcribing");

            // ── PRIMARY: Try API waterfall ────────────────────────────────────
            const apiResult = await sendToApi();

            if (apiResult) {
                deliver(apiResult, "api");
                return;
            }

            // ── FALLBACK: Use browser Web Speech result ───────────────────────
            console.warn("[Voice] All APIs failed — using browser Web Speech fallback");
            const browserResult = finalTextRef.current.trim();
            if (browserResult) {
                deliver(browserResult, "browser");
            } else {
                setError("Could not transcribe. Please try again.");
                setStatusBoth("ready");
                onListeningChange?.(false);
            }
        };

        recorder.start(200); // chunk every 200ms

        // ── 2. Web Speech API: runs silently in parallel as fallback ──────────
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (SpeechRecognition) {
            const recognition = new SpeechRecognition();
            recognition.continuous = true;
            recognition.interimResults = true;
            recognition.lang = "en-US";

            recognition.onresult = (event: any) => {
                let interim = "";
                for (let i = event.resultIndex; i < event.results.length; i++) {
                    const t = event.results[i][0].transcript;
                    if (event.results[i].isFinal) {
                        finalTextRef.current += t + " ";
                        setFinalText(finalTextRef.current);
                    } else {
                        interim += t;
                    }
                }

                const display = finalTextRef.current + interim;
                setInterimText(display);
                onInterimTranscript?.(display);

                // Reset silence timer on every speech event
                if (display.trim()) {
                    clearSilenceTimer();
                    silenceTimerRef.current = setTimeout(
                        () => stopRecording(false),
                        SILENCE_MS
                    );
                }
            };

            recognition.onerror = (e: any) => {
                if (e.error !== "no-speech") console.warn("[Voice] Recognition:", e.error);
            };

            // Chrome kills recognition after ~60s — restart loop
            recognition.onend = () => {
                if (statusRef.current === "recording" && recognitionRef.current) {
                    try { recognition.start(); } catch { }
                }
            };

            recognition.start();
            recognitionRef.current = recognition;
        }

        setStatusBoth("recording");
        onListeningChange?.(true);

        // Initial silence guard (catches mic-open-then-nothing)
        silenceTimerRef.current = setTimeout(() => stopRecording(false), 10_000);

    }, [sendToApi, deliver, stopRecording, onListeningChange, onInterimTranscript]);

    // ─────────────────────────────────────────────────────────────────────────
    if (status === "idle") return null;

    const isRecording = status === "recording";
    const isTranscribing = status === "transcribing";

    return (
        <div className={`relative flex items-center ${className}`}>

            {/* ── Mic / Loader Button ──────────────────────────────────────── */}
            <button
                type="button"
                onClick={() => {
                    if (isRecording) stopRecording(false);
                    else if (!isTranscribing) startRecording();
                }}
                disabled={isTranscribing || disabled}
                aria-label={isRecording ? "Stop recording" : "Start voice input"}
                className={`
                    group relative w-11 h-11 flex items-center justify-center rounded-full
                    transition-all duration-200 z-50 focus-visible:ring-2 focus-visible:ring-accent
                    ${isRecording
                        ? "bg-red-500 shadow-[0_0_22px_rgba(239,68,68,0.45)] scale-110"
                        : isTranscribing
                            ? "bg-accent/20 opacity-60 cursor-wait"
                            : "bg-accent/10 hover:bg-accent/20 border border-accent/20 text-accent hover:scale-105"
                    }
                `}
            >
                {isTranscribing
                    ? <Loader2 className="w-4 h-4 animate-spin text-accent" />
                    : isRecording
                        ? <Square className="w-4 h-4 fill-white text-white" />
                        : <Mic className="w-5 h-5 group-hover:scale-110 transition-transform" />
                }
                {isRecording && (
                    <span className="absolute inset-0 rounded-full bg-red-400/25 animate-ping -z-10" />
                )}
            </button>

            {/* ── Recording Drawer ─────────────────────────────────────────── */}
            {isRecording && (
                <div
                    role="dialog"
                    aria-label="Voice recording"
                    className="fixed inset-x-0 bottom-0 z-[9999] flex flex-col items-center
                               animate-in slide-in-from-bottom duration-300 ease-out"
                >
                    {/* Backdrop */}
                    <div className="absolute inset-x-0 bottom-0 h-[44vh] bg-gradient-to-t
                                    from-background via-background/96 to-transparent
                                    backdrop-blur-2xl -z-10" />

                    <div className="w-full max-w-3xl mx-auto flex flex-col items-center
                                    px-6 pb-10 gap-5">

                        {/* Status pill */}
                        <div className="flex items-center gap-2 px-5 py-1.5 rounded-full
                                        bg-accent/8 border border-accent/12 shadow-sm">
                            <Sparkles className="w-3.5 h-3.5 text-accent animate-pulse" />
                            <span className="text-[10px] font-bold tracking-[0.18em] uppercase text-foreground/60">
                                Listening
                            </span>
                        </div>

                        {/* Live transcript */}
                        <div className="w-full text-center min-h-[3.5rem] max-h-[16vh]
                                        overflow-y-auto px-2 scrollbar-hide
                                        flex items-center justify-center">
                            {interimText ? (
                                <p className="text-2xl md:text-3xl font-serif italic
                                              text-foreground leading-snug tracking-[0.01em]">
                                    <span>{finalText}</span>
                                    <span className="opacity-45">
                                        {interimText.slice(finalText.length)}
                                    </span>
                                    <span className="inline-block w-[2px] h-7 md:h-9 bg-accent
                                                     ml-2 align-middle rounded-full
                                                     animate-[blink_1s_step-end_infinite]
                                                     shadow-[0_0_12px_rgba(200,151,58,0.5)]" />
                                </p>
                            ) : (
                                <p className="text-xl md:text-2xl font-serif italic text-foreground/25 select-none">
                                    Start speaking…
                                </p>
                            )}
                        </div>

                        {/* Animated waveform text */}
                        <div className="flex items-end gap-[3px] h-7" aria-hidden="true">
                            {Array.from({ length: 22 }).map((_, i) => (
                                <span
                                    key={i}
                                    className="w-[3px] rounded-full bg-accent/55"
                                    style={{
                                        height: `${35 + Math.sin(i * 0.9) * 22}%`,
                                        animation: `voiceBar ${0.55 + (i % 5) * 0.14}s ease-in-out infinite alternate`,
                                        animationDelay: `${i * 0.04}s`,
                                    }}
                                />
                            ))}
                        </div>

                        {/* Controls */}
                        <div className="w-full flex justify-center items-center gap-16 md:gap-28
                                        pt-3 border-t border-accent/10">

                            {/* Cancel */}
                            <button
                                onClick={() => stopRecording(true)}
                                className="flex flex-col items-center gap-1.5 group"
                                aria-label="Cancel"
                            >
                                <div className="p-3.5 rounded-full border border-accent/15 bg-accent/5
                                                group-hover:bg-red-500/10 group-hover:border-red-400/30
                                                transition-all duration-200">
                                    <X className="w-5 h-5 text-foreground/40
                                                  group-hover:text-red-400 transition-colors" />
                                </div>
                                <span className="text-[9px] uppercase tracking-[0.2em] font-bold
                                                 text-foreground/30 group-hover:text-red-400/70 transition-colors">
                                    Cancel
                                </span>
                            </button>

                            {/* Done */}
                            <button
                                onClick={() => stopRecording(false)}
                                className="flex flex-col items-center gap-1.5 group"
                                aria-label="Submit recording"
                            >
                                <div className="p-6 md:p-7 rounded-full bg-accent text-white
                                                shadow-[0_0_40px_rgba(200,151,58,0.35)]
                                                transition-all duration-200
                                                group-hover:scale-105 group-active:scale-95">
                                    <Square className="w-8 h-8 md:w-10 md:h-10 fill-white" />
                                </div>
                                <span className="text-[9px] md:text-[10px] uppercase tracking-[0.2em]
                                                 font-bold text-accent">
                                    Done
                                </span>
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Transcribing hint */}
            {isTranscribing && (
                <span className="ml-3 text-xs text-foreground/50 animate-pulse select-none">
                    Transcribing…
                </span>
            )}

            {/* Error toast */}
            {error && (
                <button
                    onClick={() => setError(null)}
                    aria-live="assertive"
                    className="fixed bottom-28 left-1/2 -translate-x-1/2 z-[10003]
                               bg-red-600 text-white text-[11px] font-bold py-2.5 px-5
                               rounded-full shadow-2xl cursor-pointer whitespace-nowrap
                               animate-in slide-in-from-bottom-2 duration-200
                               hover:bg-red-700 transition-colors"
                >
                    ⚠️ {error}
                </button>
            )}

            <style>{`
                @keyframes voiceBar {
                    from { transform: scaleY(0.35); opacity: 0.4; }
                    to   { transform: scaleY(1);    opacity: 1;   }
                }
                @keyframes blink {
                    0%, 100% { opacity: 1; }
                    50%      { opacity: 0; }
                }
            `}</style>
        </div>
    );
}
