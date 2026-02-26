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

                recognition.onerror = (e: any) => {
                    console.warn("Recognition error:", e);
                    // Silently fail recognition and rely on MediaRecorder
                };

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

                    const res = await fetch("/api/transcribe", { method: "POST", body: fd });
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
                    ${status === "transcribing" ? 'animate-pulse' : ''}`}
            >
                {status === "transcribing" ? (
                    <Loader2 className="w-5 h-5 animate-spin text-accent" />
                ) : status === "recording" ? (
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

            {/* Listening Overlay */}
            {status === "recording" && (
                <div className="fixed inset-0 bg-background/95 backdrop-blur-2xl z-[9999] overflow-y-auto animate-in fade-in duration-300">
                    <div className="min-h-full w-full flex flex-col items-center justify-center py-12 px-6">
                        <div className="max-w-2xl w-full flex flex-col items-center gap-8 md:gap-12">
                            {/* Status Brand */}
                            <div className="flex items-center gap-3 text-accent font-bold tracking-widest uppercase text-[10px] md:text-xs animate-pulse">
                                <Sparkles className="w-5 h-5" />
                                <span>Divine Voice Sync</span>
                            </div>

                            {/* Waveform Card */}
                            <div className="w-full max-w-md bg-accent/5 rounded-[40px] p-8 md:p-10 border border-accent/10 shadow-inner">
                                <WaveformVisualizer stream={stream} isRecording={true} color="#c8973a" />
                            </div>

                            {/* Interim Text Display - Dynamic scaling */}
                            <div className="w-full text-center px-4 max-w-lg">
                                <p className="text-2xl md:text-4xl lg:text-5xl font-serif italic text-foreground leading-tight min-h-[100px] flex items-center justify-center">
                                    <span className="opacity-90">
                                        {interimText || "Listening for your voice..."}
                                        <span className="inline-block w-1 h-8 md:h-12 bg-accent ml-2 animate-pulse align-middle" />
                                    </span>
                                </p>
                            </div>

                            {/* Refined Controls */}
                            <div className="flex items-center gap-10 mt-4">
                                <button
                                    onClick={() => stopRecording(true)}
                                    className="flex flex-col items-center gap-3 group"
                                >
                                    <div className="p-4 md:p-5 rounded-full bg-white/5 border border-white/10 group-hover:bg-red-500/10 group-hover:border-red-500/20 transition-all">
                                        <X className="w-6 h-6 md:w-8 md:h-8 text-foreground/40 group-hover:text-red-500" />
                                    </div>
                                    <span className="text-[9px] uppercase tracking-[0.2em] font-bold text-foreground/30 group-hover:text-red-500">Cancel</span>
                                </button>

                                <button
                                    onClick={() => stopRecording()}
                                    className="flex flex-col items-center gap-3 group"
                                >
                                    <div className="p-8 md:p-10 rounded-full bg-accent text-white shadow-[0_0_50px_rgba(200,151,58,0.3)] hover:shadow-accent/50 hover:scale-105 transition-all duration-300">
                                        <Square className="w-8 h-8 md:w-10 md:h-10 fill-white" />
                                    </div>
                                    <span className="text-[9px] uppercase tracking-[0.2em] font-bold text-accent">Process Revelation</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Error Toast */}
            {error && (
                <div
                    onClick={() => setError(null)}
                    className="fixed bottom-24 left-1/2 -translate-x-1/2 bg-red-600 text-white text-[11px] font-bold py-3 px-6 rounded-full shadow-2xl cursor-pointer z-[10000] animate-in slide-in-from-bottom-2"
                >
                    ⚠️ {error}
                </div>
            )}
        </div>
    );
}
