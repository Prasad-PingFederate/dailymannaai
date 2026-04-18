"use client";

import React, { useState, useRef, useCallback, useEffect } from "react";
import WaveformVisualizer from "./WaveformVisualizer";
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

export default function VoiceInput({
    onTranscript,
    onInterimTranscript,
    onListeningChange,
    disabled = false,
    className = "",
}: VoiceInputProps) {
    const [status, setStatus] = useState<"idle" | "ready" | "recording" | "transcribing">("idle");
    const statusRef = useRef(status);
    useEffect(() => { statusRef.current = status; }, [status]);

    const [error, setError] = useState<string | null>(null);
    const [interimText, setInterimText] = useState("");
    const [stream, setStream] = useState<MediaStream | null>(null);

    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);
    const recognitionRef = useRef<any>(null);
    const silenceTimerRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        if (typeof window !== "undefined") {
            setStatus("ready");
        }
    }, []);

    const stopRecording = useCallback((isCancel = false) => {
        if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);

        // Stop recognition
        if (recognitionRef.current) {
            recognitionRef.current.onresult = null;
            recognitionRef.current.onend = null;
            try { recognitionRef.current.stop(); } catch (e) { }
        }

        // Stop media recorder
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
            try { mediaRecorderRef.current.stop(); } catch (e) { }
        }

        // Cleanup tracks
        stream?.getTracks().forEach(t => t.stop());

        if (isCancel) {
            setStream(null);
            setStatus("ready");
            onListeningChange?.(false);
            onInterimTranscript?.("");
            setInterimText("");
        } else {
            // Immediately transition to transcribing to close the drawer
            setStatus("transcribing");
        }
    }, [stream, onListeningChange, onInterimTranscript]);

    const startRecording = async () => {
        setError(null);
        setInterimText("");
        audioChunksRef.current = [];

        try {
            const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
            setStream(audioStream);

            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            if (SpeechRecognition) {
                const recognition = new SpeechRecognition();
                recognition.continuous = true;
                recognition.interimResults = true;
                recognition.lang = "en-US";

                recognition.onresult = (event: any) => {
                    let fullTranscript = "";
                    for (let i = 0; i < event.results.length; ++i) {
                        fullTranscript += event.results[i][0].transcript;
                    }
                    if (fullTranscript) {
                        setInterimText(fullTranscript);
                        onInterimTranscript?.(fullTranscript);
                        if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
                        silenceTimerRef.current = setTimeout(() => stopRecording(), 5000);
                    }
                };
                recognition.onerror = (e: any) => console.warn("Recognition error:", e);
                recognition.start();
                recognitionRef.current = recognition;
            }

            const recorder = new MediaRecorder(audioStream);
            mediaRecorderRef.current = recorder;
            recorder.ondataavailable = (e) => {
                if (e.data.size > 0) audioChunksRef.current.push(e.data);
            };

            recorder.onstop = async () => {
                if (statusRef.current === "idle" || statusRef.current === "ready") return;

                const audioBlob = new Blob(audioChunksRef.current, { type: recorder.mimeType });
                if (audioBlob.size < 500 && !interimText) {
                    setError("Silence detected.");
                    setStatus("ready");
                    onListeningChange?.(false);
                    return;
                }

                try {
                    const fd = new FormData();
                    fd.append("audio", audioBlob);

                    // 15s timeout
                    const controller = new AbortController();
                    const timeoutId = setTimeout(() => controller.abort(), 15000);

                    const res = await fetch("/api/transcribe", {
                        method: "POST",
                        body: fd,
                        signal: controller.signal
                    });

                    clearTimeout(timeoutId);
                    if (!res.ok) throw new Error("Sync failure");

                    const data = await res.json();
                    if (data.text) {
                        onTranscript(data.text);
                    } else if (interimText) {
                        onTranscript(interimText);
                    } else {
                        setError("Could not catch that.");
                    }
                } catch (e: any) {
                    if (interimText) onTranscript(interimText);
                    else if (e.name === 'AbortError') setError("Sync timed out.");
                    else setError("Network error.");
                } finally {
                    setStatus("ready");
                    onListeningChange?.(false);
                    onInterimTranscript?.("");
                    setInterimText("");
                    setStream(null);
                }
            };

            recorder.start();
            setStatus("recording");
            onListeningChange?.(true);

        } catch (e: any) {
            setError("Check mic permissions.");
        }
    };

    if (status === "idle") return null;

    return (
        <div className={`relative flex items-center ${className}`}>
            <button
                type="button"
                onClick={() => status === "recording" ? stopRecording() : startRecording()}
                disabled={status === "transcribing" || disabled}
                className={`group relative w-12 h-12 flex items-center justify-center rounded-full transition-all duration-300 z-50 
                    ${status === "recording"
                        ? 'bg-red-500 shadow-[0_0_20px_rgba(239,68,68,0.5)] scale-110'
                        : 'bg-accent/10 hover:bg-accent/20 border border-accent/20 text-accent'}
                    ${status === "transcribing" ? 'opacity-50 cursor-wait' : ''}`}
            >
                {status === "recording" ? (
                    <Square className="w-4 h-4 fill-white text-white" />
                ) : (
                    <Mic className="w-5 h-5 group-hover:scale-110 transition-transform" />
                )}

                {status === "recording" && (
                    <>
                        <div className="absolute inset-0 rounded-full bg-red-500/20 animate-ping -z-10" />
                    </>
                )}
            </button>

            {/* GPT-Style Bottom Drawer Voice UI (Perfect for all zoom levels) */}
            {status === "recording" && (
                <div className="fixed inset-x-0 bottom-0 z-[9999] flex flex-col items-center animate-in slide-in-from-bottom duration-500">

                    {/* Glassy Backdrop Gradient */}
                    <div className="absolute inset-x-0 bottom-0 h-[45vh] bg-gradient-to-t from-background via-background/95 to-transparent backdrop-blur-3xl -z-10" />

                    <div className="w-full max-w-4xl mx-auto flex flex-col items-center px-6 pb-12 gap-8">

                        {/* Status Label */}
                        <div className="flex items-center gap-3 px-6 py-2 rounded-full bg-accent/5 border border-accent/10 backdrop-blur-sm shadow-sm scale-90 md:scale-100">
                            <Sparkles className="w-4 h-4 text-accent animate-pulse" />
                            <span className="text-[10px] md:text-xs font-bold tracking-[0.2em] uppercase text-foreground/70">
                                Divine Voice Sync
                            </span>
                        </div>

                        {/* Real-time Transcript Drawer */}
                        <div className="w-full text-center max-h-[15vh] overflow-y-auto px-4 scrollbar-hide">
                            <p className="text-xl md:text-4xl font-serif italic text-foreground leading-tight tracking-[0.01em] drop-shadow-sm">
                                {interimText || (
                                    <span className="opacity-30">Listening to your prayer...</span>
                                )}
                                <span className="inline-block w-1.5 h-8 md:h-12 bg-accent ml-3 animate-[pulse_1s_infinite] align-middle rounded-full shadow-[0_0_15px_rgba(200,151,58,0.4)]" />
                            </p>
                        </div>

                        {/* Centered Controls - Simplified Layout */}
                        <div className="w-full flex justify-center items-center gap-12 md:gap-24 pt-4 mt-8 border-t border-accent/10">
                            {/* Abort */}
                            <button
                                onClick={() => stopRecording(true)}
                                className="flex flex-col items-center gap-2 group"
                            >
                                <div className="p-4 md:p-5 rounded-full bg-accent/5 border border-accent/10 group-hover:bg-red-500/10 group-hover:border-red-500/30 transition-all">
                                    <X className="w-6 h-6 md:w-8 md:h-8 text-foreground/30 group-hover:text-red-500" />
                                </div>
                                <span className="text-[9px] md:text-[10px] uppercase tracking-[0.2em] font-bold text-foreground/30">Abort</span>
                            </button>

                            {/* Finish */}
                            <button
                                onClick={() => stopRecording()}
                                className="flex flex-col items-center gap-2 group"
                            >
                                <div className="p-6 md:p-8 rounded-full bg-accent text-white shadow-[0_0_50px_rgba(200,151,58,0.3)] transition-all group-hover:scale-110 group-active:scale-90">
                                    <Square className="w-10 h-10 md:w-12 md:h-12 fill-white" />
                                </div>
                                <span className="text-[10px] md:text-[11px] uppercase tracking-[0.2em] font-bold text-accent animate-pulse">Save & Submit</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Error Toast */}
            {error && (
                <div
                    onClick={() => setError(null)}
                    className="fixed bottom-24 left-1/2 -track-x-1/2 bg-red-600 text-white text-[11px] font-bold py-3 px-6 rounded-full shadow-2xl cursor-pointer z-[10003] animate-in slide-in-from-bottom-2"
                >
                    ⚠️ {error}
                </div>
            )}
        </div>
    );
}
