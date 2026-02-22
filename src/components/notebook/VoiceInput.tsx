"use client";

import React, { useState, useRef, useCallback, useEffect } from "react";

interface VoiceInputProps {
    onTranscript: (text: string) => void;
    onInterimTranscript?: (text: string) => void;
    onListeningChange?: (isListening: boolean) => void;
    disabled?: boolean;
    className?: string;
    size?: number;
    language?: string;
}

export default function VoiceInput({
    onTranscript,
    onInterimTranscript,
    onListeningChange,
    disabled = false,
    className = "",
    size = 20,
    language = "en",
}: VoiceInputProps) {
    const [status, setStatus] = useState<"idle" | "ready" | "recording" | "transcribing">("idle");
    const [audioLevel, setAudioLevel] = useState(0);
    const [error, setError] = useState<string | null>(null);

    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);
    const streamRef = useRef<MediaStream | null>(null);
    const audioCtxRef = useRef<AudioContext | null>(null);
    const analyserRef = useRef<AnalyserNode | null>(null);
    const animFrameRef = useRef<number>(0);

    // Initial check for mic support
    useEffect(() => {
        if (typeof window !== "undefined" && navigator.mediaDevices) setStatus("ready");
    }, []);

    const initAudio = async () => {
        if (!audioCtxRef.current) {
            const AC = window.AudioContext || (window as any).webkitAudioContext;
            audioCtxRef.current = new AC();
        }
        if (audioCtxRef.current.state === "suspended") await audioCtxRef.current.resume();
        return audioCtxRef.current;
    };

    const stopRecording = useCallback(() => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
            mediaRecorderRef.current.stop();
        }
    }, []);

    const startRecording = async () => {
        setError(null);
        audioChunksRef.current = [];

        try {
            const ctx = await initAudio();
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            streamRef.current = stream;

            // Visualizer
            const source = ctx.createMediaStreamSource(stream);
            const analyser = ctx.createAnalyser();
            analyser.fftSize = 256;
            source.connect(analyser);
            analyserRef.current = analyser;

            const updateLevel = () => {
                const data = new Uint8Array(256);
                if (analyserRef.current) {
                    analyserRef.current.getByteFrequencyData(data);
                    const avg = data.reduce((a, b) => a + b, 0) / 256;
                    setAudioLevel(avg);
                    animFrameRef.current = requestAnimationFrame(updateLevel);
                }
            };
            updateLevel();

            // Recorder - Use simple webm for broad support
            const recorder = new MediaRecorder(stream);
            mediaRecorderRef.current = recorder;

            recorder.ondataavailable = (e) => {
                if (e.data.size > 0) audioChunksRef.current.push(e.data);
            };

            recorder.onstop = async () => {
                if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
                streamRef.current?.getTracks().forEach(t => t.stop());

                const audioBlob = new Blob(audioChunksRef.current, { type: recorder.mimeType });
                console.log(`[Voice] Stopped. Blob size: ${audioBlob.size}, mime: ${recorder.mimeType}`);

                if (audioBlob.size < 500) {
                    setError("I didn't hear clear speech. Try speaking louder.");
                    setStatus("ready");
                    onListeningChange?.(false);
                    return;
                }

                setStatus("transcribing");
                onInterimTranscript?.("✨ Thinking...");

                try {
                    const fd = new FormData();
                    fd.append("audio", audioBlob);
                    fd.append("language", language);

                    console.log("[Voice] Calling transcription API...");
                    const res = await fetch("/api/transcribe", { method: "POST", body: fd });
                    console.log("[Voice] Server response status:", res.status);

                    if (!res.ok) {
                        const errData = await res.json().catch(() => ({ error: "Server error" }));
                        throw new Error(errData.error || `HTTP ${res.status}`);
                    }

                    const data = await res.json();
                    if (data.text) {
                        console.log("[Voice] Transcription successful:", data.text);
                        onTranscript(data.text);
                    } else {
                        console.warn("[Voice] Empty response from server.");
                        setError("Could not understand your voice. Try again.");
                    }
                } catch (e: any) {
                    console.error("[Voice] Transcription failed:", e);
                    setError(`Sync Error: ${e.message}`);
                } finally {
                    setStatus("ready");
                    onListeningChange?.(false);
                    onInterimTranscript?.("");
                }
            };

            recorder.start();
            setStatus("recording");
            onListeningChange?.(true);
            onInterimTranscript?.("🎙️ I am listening...");

        } catch (e: any) {
            console.error("[Voice] Start error:", e);
            setError("Could not access microphone.");
        }
    };

    if (status === "idle") return null;

    return (
        <div className={`relative flex items-center gap-2 ${className}`}>
            <button
                type="button"
                onMouseDown={() => initAudio()}
                onClick={() => status === "recording" ? stopRecording() : startRecording()}
                disabled={status === "transcribing"}
                className={`w-12 h-12 flex items-center justify-center rounded-full transition-all ${status === "recording" ? 'bg-red-500 scale-110 shadow-lg shadow-red-500/40' : 'bg-accent/10 border border-accent/20 text-accent hover:bg-accent hover:text-white'}`}
                title={status === "recording" ? "Stop Recording" : "Start Voice Input"}
            >
                {status === "transcribing" ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : status === "recording" ? (
                    <div className="w-4 h-4 bg-white rounded-sm" />
                ) : (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" /><path d="M19 10v2a7 7 0 0 1-14 0v-2" /><line x1="12" y1="19" x2="12" y2="22" /></svg>
                )}

                {/* Level Pulse Ring */}
                {status === "recording" && (
                    <div
                        className="absolute inset-0 rounded-full border-4 border-red-500/30 transition-transform duration-75 pointer-events-none"
                        style={{ transform: `scale(${1 + (audioLevel / 120)})` }}
                    />
                )}
            </button>

            {error && (
                <div
                    onClick={() => setError(null)}
                    className="absolute bottom-full right-0 mb-4 bg-red-950/95 border border-red-500/50 text-red-100 text-[11px] font-bold p-3 rounded-2xl shadow-2xl cursor-pointer whitespace-nowrap z-[110] animate-in slide-in-from-bottom-2"
                >
                    ⚠️ {error}
                </div>
            )}
        </div>
    );
}
