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
            recognitionRef.current.stop();
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
            mediaRecorderRef.current.stop();
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

            // 1. Setup Browser Recognition (for interim results and silence detection)
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            if (SpeechRecognition) {
                const recognition = new SpeechRecognition();
                recognition.continuous = true;
                recognition.interimResults = true;
                recognition.lang = "en-US";

                recognition.onresult = (event: any) => {
                    let finalTranscript = "";
                    let interimTranscript = "";

                    for (let i = event.resultIndex; i < event.results.length; ++i) {
                        if (event.results[i].isFinal) {
                            finalTranscript += event.results[i][0].transcript;
                        } else {
                            interimTranscript += event.results[i][0].transcript;
                        }
                    }

                    const currentText = finalTranscript || interimTranscript;
                    if (currentText) {
                        setInterimText(currentText);
                        onInterimTranscript?.(currentText);

                        // Reset silence timer on speech
                        if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
                        silenceTimerRef.current = setTimeout(() => {
                            console.log("Auto-stopping due to silence");
                            stopRecording();
                        }, 3000);
                    }
                };

                recognition.onerror = (e: any) => console.warn("Recognition error:", e);
                recognition.start();
                recognitionRef.current = recognition;
            }

            // 2. Setup MediaRecorder (for high-accuracy server transcription)
            const recorder = new MediaRecorder(audioStream);
            mediaRecorderRef.current = recorder;

            recorder.ondataavailable = (e) => {
                if (e.data.size > 0) audioChunksRef.current.push(e.data);
            };

            recorder.onstop = async () => {
                if (statusRef.current === "idle" || statusRef.current === "ready") return; // Cancelled

                setStatus("transcribing");

                const audioBlob = new Blob(audioChunksRef.current, { type: recorder.mimeType });
                if (audioBlob.size < 1000) {
                    if (!interimText) {
                        setError("Silence detected.");
                        setStatus("ready");
                        onListeningChange?.(false);
                        return;
                    }
                    // If we have interim text but high-acc failed or was too short, use interim
                    onTranscript(interimText);
                    setStatus("ready");
                    onListeningChange?.(false);
                    return;
                }

                try {
                    const fd = new FormData();
                    fd.append("audio", audioBlob);

                    const res = await fetch("/api/transcribe", { method: "POST", body: fd });
                    if (!res.ok) throw new Error("Transcription server unavailable");

                    const data = await res.json();
                    if (data.text) {
                        onTranscript(data.text);
                    } else if (interimText) {
                        onTranscript(interimText); // Fallback to browser recognition
                    } else {
                        setError("I couldn't quite catch that.");
                    }
                } catch (e: any) {
                    if (interimText) {
                        onTranscript(interimText); // Fallback
                    } else {
                        setError("Network error. Please try again.");
                    }
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
            setError("Check microphone permissions.");
            console.error(e);
        }
    };

    if (status === "idle") return null;

    return (
        <div className={`relative flex items-center ${className}`}>
            {/* The Main Pulse Button */}
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

                {/* Animated Rings when recording */}
                {status === "recording" && (
                    <>
                        <div className="absolute inset-0 rounded-full bg-red-500/20 animate-ping -z-10" />
                        <div className="absolute inset-0 rounded-full border-2 border-red-500/30 animate-[ping_1.5s_infinite] -z-10" />
                    </>
                )}
            </button>

            {/* Premium "Listening" Overlay */}
            {status === "recording" && (
                <div className="fixed inset-0 bg-background/90 backdrop-blur-xl z-[9999] flex flex-col items-center justify-start overflow-y-auto py-12 md:py-20 animate-in fade-in duration-300">
                    <div className="max-w-2xl w-full px-6 flex flex-col items-center gap-10">
                        {/* Status Brand */}
                        <div className="flex items-center gap-3 text-accent font-bold tracking-widest uppercase text-[10px] md:text-xs">
                            <Sparkles className="w-5 h-5" />
                            <span>Divine Voice Sync</span>
                        </div>

                        {/* Waveform Card */}
                        <div className="w-full max-w-md bg-accent/5 rounded-[40px] p-10 border border-accent/10 shadow-inner">
                            <WaveformVisualizer stream={stream} isRecording={true} color="#c8973a" />
                        </div>

                        {/* Interim Text Display - Scaled for visibility */}
                        <div className="w-full text-center px-4">
                            <p className="text-3xl md:text-5xl font-serif italic text-foreground leading-tight min-h-[140px]">
                                {interimText || "Listening for your voice..."}
                                <span className="inline-block w-1 h-8 md:h-12 bg-accent ml-2 animate-pulse align-middle" />
                            </p>
                        </div>

                        {/* High-Impact Controls */}
                        <div className="flex items-center gap-10 mt-6 md:mt-10">
                            <button
                                onClick={() => stopRecording(true)}
                                className="flex flex-col items-center gap-3 group"
                            >
                                <div className="p-5 rounded-full bg-white/5 border border-white/10 group-hover:bg-red-500/10 group-hover:border-red-500/20 transition-all">
                                    <X className="w-8 h-8 text-foreground/40 group-hover:text-red-500" />
                                </div>
                                <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-foreground/40 group-hover:text-red-500">Cancel</span>
                            </button>

                            <button
                                onClick={() => stopRecording()}
                                className="flex flex-col items-center gap-3 group"
                            >
                                <div className="p-10 rounded-full bg-accent text-white shadow-[0_0_60px_rgba(200,151,58,0.4)] hover:shadow-accent/60 hover:scale-105 transition-all duration-300">
                                    <Square className="w-12 h-12 fill-white" />
                                </div>
                                <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-accent">Process Revelation</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Error Toast */}
            {error && (
                <div
                    onClick={() => setError(null)}
                    className="absolute bottom-full left-1/2 -translate-x-1/2 mb-4 bg-red-950/95 border border-red-500/50 text-red-100 text-[11px] font-bold py-2 px-4 rounded-full shadow-2xl cursor-pointer whitespace-nowrap z-[110] animate-in slide-in-from-bottom-2"
                >
                    ⚠️ {error}
                </div>
            )}
        </div>
    );
}
