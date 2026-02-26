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
            if (isCancel) {
                mediaRecorderRef.current.onstop = () => {
                    setStream(null);
                    setStatus("ready");
                    onListeningChange?.(false);
                };
            }
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
        }
    }, [stream, onListeningChange, onInterimTranscript]);

    const startRecording = async () => {
        setError(null);
        setInterimText("");
        audioChunksRef.current = [];

        try {
            const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
            setStream(audioStream);

            // 1. Setup Browser Recognition
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
                        silenceTimerRef.current = setTimeout(() => stopRecording(), 4000);
                    }
                };

                recognition.onerror = (e: any) => console.warn("Recognition error:", e);
                recognition.start();
                recognitionRef.current = recognition;
            }

            // 2. Setup MediaRecorder
            const recorder = new MediaRecorder(audioStream);
            mediaRecorderRef.current = recorder;

            recorder.ondataavailable = (e) => {
                if (e.data.size > 0) audioChunksRef.current.push(e.data);
            };

            recorder.onstop = async () => {
                if (statusRef.current === "idle" || statusRef.current === "ready") return;

                setStatus("transcribing");

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

                    // Add a 15-second timeout to the transcription fetch
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
                disabled={disabled}
                className={`group relative w-12 h-12 flex items-center justify-center rounded-full transition-all duration-300 z-50 
                    ${status === "recording"
                        ? 'bg-red-500 shadow-[0_0_20px_rgba(239,68,68,0.5)] scale-110'
                        : 'bg-accent/10 hover:bg-accent/20 border border-accent/20 text-accent'}`}
            >
                {status === "recording" ? (
                    <Square className="w-4 h-4 fill-white text-white" />
                ) : (
                    <Mic className="w-5 h-5 group-hover:scale-110 transition-transform" />
                )}

                {status === "recording" && (
                    <>
                        <div className="absolute inset-0 rounded-full bg-red-500/20 animate-ping -z-10" />
                        <div className="absolute inset-0 rounded-full border-2 border-red-500/30 animate-[ping_1.5s_infinite] -z-10" />
                    </>
                )}
            </button>

            {/* Premium Voice Overlay - Restored from Orb build with Light Background */}
            {status === "recording" && (
                <div className="fixed inset-0 bg-background/90 backdrop-blur-3xl z-[9999] flex flex-col overflow-hidden animate-in fade-in duration-500">

                    {/* Header: Branding */}
                    <div className="absolute top-10 left-0 right-0 flex justify-center z-[10001]">
                        <div className="flex items-center gap-3 px-6 py-2.5 rounded-full bg-accent/5 border border-accent/10 backdrop-blur-md shadow-lg">
                            <Sparkles className="w-4 h-4 text-accent animate-pulse" />
                            <span className="text-[10px] md:text-xs font-bold tracking-[0.3em] uppercase text-foreground/80">
                                Divine Voice Sync
                            </span>
                        </div>
                    </div>

                    {/* Middle: Focus Area (Orb Visualizer) */}
                    <div className="flex-1 flex flex-col items-center justify-center relative px-6">
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-accent/5 rounded-full blur-[120px] -z-10 animate-pulse" />

                        <div className="w-full max-w-lg scale-110 md:scale-125">
                            <WaveformVisualizer
                                stream={stream}
                                isRecording={true}
                                color="#c8973a"
                            />
                        </div>
                    </div>

                    {/* Bottom Section: Transcript & Fixed Controls */}
                    <div className="w-full max-w-3xl mx-auto flex flex-col items-center gap-10 p-8 pb-14 md:pb-20 z-[10001]">

                        {/* Enhanced Transcript Display: Limited height, own scrollbar */}
                        <div className="w-full text-center max-h-40 overflow-y-auto px-4 group scrollbar-hide hover:scrollbar-default transition-all">
                            <p className="text-2xl md:text-4xl font-serif italic text-foreground/90 leading-tight tracking-[0.01em] selection:bg-accent/30">
                                {interimText || (
                                    <span className="opacity-40 flex items-center justify-center gap-3">
                                        <Loader2 className="w-6 h-6 animate-spin" />
                                        Listening...
                                    </span>
                                )}
                                <span className="inline-block w-1.5 h-8 md:h-12 bg-accent ml-3 animate-[pulse_1s_infinite] align-middle rounded-full shadow-[0_0_15px_rgba(200,151,58,0.5)]" />
                            </p>
                        </div>

                        {/* High-Impact Sticky Controls: Always visible, never moves */}
                        <div className="flex items-center gap-12 md:gap-16">
                            {/* Cancel Button */}
                            <button
                                onClick={() => stopRecording(true)}
                                className="flex flex-col items-center gap-3 group outline-none"
                            >
                                <div className="p-5 md:p-6 rounded-full bg-accent/5 border border-accent/10 group-hover:bg-red-500/10 group-hover:border-red-500/30 transition-all duration-300 group-active:scale-90">
                                    <X className="w-8 h-8 md:w-10 md:h-10 text-foreground/20 group-hover:text-red-500" />
                                </div>
                                <span className="text-[10px] md:text-[11px] uppercase tracking-[0.25em] font-bold text-foreground/20 group-hover:text-red-500/80 transition-colors">Abort</span>
                            </button>

                            {/* Main Finish Button */}
                            <button
                                onClick={() => stopRecording()}
                                className="flex flex-col items-center gap-4 group outline-none"
                            >
                                <div className="relative">
                                    <div className="absolute inset-0 rounded-full border-2 border-accent/10 border-t-accent animate-spin duration-[3s]" />
                                    <div className="p-10 md:p-12 rounded-full bg-accent text-white shadow-[0_0_80px_rgba(200,151,58,0.2)] transition-all duration-500 group-hover:scale-110 group-hover:shadow-accent/40 group-active:scale-95">
                                        <Square className="w-12 h-12 md:w-14 md:h-14 fill-white" />
                                    </div>
                                </div>
                                <span className="text-[11px] md:text-[12px] uppercase tracking-[0.3em] font-bold text-accent drop-shadow-[0_0_10px_rgba(200,151,58,0.2)] animate-pulse">Save Revelation</span>
                            </button>
                        </div>
                    </div>

                    {/* Gradient Layer */}
                    <div className="absolute inset-0 bg-gradient-to-b from-background/10 via-background/40 to-background pointer-events-none" />
                </div>
            )}

            {/* Error Toast */}
            {error && (
                <div
                    onClick={() => setError(null)}
                    className="fixed bottom-24 left-1/2 -translate-x-1/2 bg-red-600 text-white text-[11px] font-bold py-3 px-6 rounded-full shadow-2xl cursor-pointer z-[10003] animate-in slide-in-from-bottom-2"
                >
                    ⚠️ {error}
                </div>
            )}
        </div>
    );
}
