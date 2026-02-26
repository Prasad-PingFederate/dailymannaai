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

        if (recognitionRef.current) {
            recognitionRef.current.onresult = null;
            recognitionRef.current.onend = null;
            try { recognitionRef.current.stop(); } catch (e) { }
        }

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

            const recorder = new MediaRecorder(audioStream);
            mediaRecorderRef.current = recorder;

            recorder.ondataavailable = (e) => {
                if (e.data.size > 0) audioChunksRef.current.push(e.data);
            };

            recorder.onstop = async () => {
                if (statusRef.current !== "recording") return;

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
                    }
                } catch (e: any) {
                    console.warn("Transcription failed:", e);
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
                className={`group relative w-10 h-10 flex items-center justify-center rounded-full transition-all duration-300 z-50
                    ${status === "recording" ? 'bg-red-500 scale-105 shadow-md' : 'hover:bg-accent/10 text-muted-foreground hover:text-accent'}`}
            >
                {status === "transcribing" ? (
                    <Loader2 className="w-5 h-5 animate-spin text-accent" />
                ) : status === "recording" ? (
                    <Square className="w-4 h-4 fill-white text-white" />
                ) : (
                    <Mic className="w-5 h-5 transition-transform" />
                )}
            </button>

            {/* INTEGRATED CHATGPT UI (No black overlay) */}
            {status === "recording" && (
                <div className="absolute bottom-full mb-4 left-1/2 -translate-x-1/2 bg-popover/95 backdrop-blur-xl border border-border/50 rounded-2xl p-4 shadow-2xl min-w-[280px] animate-in zoom-in-95 fade-in duration-200 pointer-events-none">
                    <div className="flex flex-col items-center gap-3">
                        <div className="h-12 w-full flex items-center justify-center overflow-hidden">
                            <WaveformVisualizer stream={stream} isRecording={true} color="#c8973a" />
                        </div>
                        <p className="text-[13px] font-medium text-foreground italic line-clamp-2 text-center opacity-80">
                            {interimText || "Listening..."}
                        </p>
                        <div className="flex items-center gap-2 text-[9px] uppercase tracking-widest font-bold text-accent/60">
                            <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
                            Live Transcription
                        </div>
                    </div>
                    {/* Tiny arrow pointing to the mic button */}
                    <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-popover/95 border-b border-r border-border/50 rotate-45" />
                </div>
            )}

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
