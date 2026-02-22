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

export const VOICE_LANGUAGES = [
    { code: "en", label: "English", flag: "🇺🇸" },
    { code: "te", label: "తెలుగు", flag: "🇮🇳" },
    { code: "hi", label: "हिन्दी", flag: "🇮🇳" },
    { code: "ta", label: "தமிழ்", flag: "🇮🇳" },
    { code: "kn", label: "ಕನ್ನಡ", flag: "🇮🇳" },
    { code: "ml", label: "മലയാളం", flag: "🇮🇳" },
];

export default function VoiceInput({
    onTranscript,
    onInterimTranscript,
    onListeningChange,
    disabled = false,
    className = "",
    size = 20,
    language = "en",
}: VoiceInputProps) {
    const [isRecording, setIsRecording] = useState(false);
    const [isTranscribing, setIsTranscribing] = useState(false);
    const [currentLang, setCurrentLang] = useState(language);
    const [showLangPicker, setShowLangPicker] = useState(false);
    const [audioLevel, setAudioLevel] = useState(0);
    const [error, setError] = useState<string | null>(null);
    const [recordDuration, setRecordDuration] = useState(0);

    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);
    const streamRef = useRef<MediaStream | null>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const analyserRef = useRef<AnalyserNode | null>(null);
    const animFrameRef = useRef<number>(0);
    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const langPickerRef = useRef<HTMLDivElement>(null);

    // ─── Browser Compatibility Check ──────────────────────────────
    const [isSupported, setIsSupported] = useState(true);
    useEffect(() => {
        setIsSupported(!!(window.navigator.mediaDevices && window.MediaRecorder));
    }, []);

    // ─── Audio Visualization (Fixed for Safari/Firefox) ───────────
    const startVisualization = useCallback(async (stream: MediaStream) => {
        try {
            const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
            const src = ctx.createMediaStreamSource(stream);
            const analyser = ctx.createAnalyser();
            analyser.fftSize = 256;
            src.connect(analyser);

            // CRITICAL: Resume context if suspended (common in Safari)
            if (ctx.state === "suspended") await ctx.resume();

            audioContextRef.current = ctx;
            analyserRef.current = analyser;
            const data = new Uint8Array(analyser.frequencyBinCount);

            const update = () => {
                if (!analyserRef.current) return;
                analyserRef.current.getByteFrequencyData(data);
                const avg = data.reduce((a, b) => a + b, 0) / data.length;
                setAudioLevel(Math.min(avg / 150, 1)); // Sensitive level
                animFrameRef.current = requestAnimationFrame(update);
            };
            update();
        } catch (e) {
            console.warn("[Voice] Visualization failed:", e);
        }
    }, []);

    const stopVisualization = useCallback(() => {
        if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
        audioContextRef.current?.close();
        audioContextRef.current = null;
        analyserRef.current = null;
        setAudioLevel(0);
    }, []);

    const cleanUp = useCallback(() => {
        if (timerRef.current) clearInterval(timerRef.current);
        stopVisualization();
        streamRef.current?.getTracks().forEach(t => t.stop());
        streamRef.current = null;
    }, [stopVisualization]);

    // ─── Start Recording ─────────────────────────────────────────
    const startRecording = useCallback(async () => {
        setError(null);
        audioChunksRef.current = [];
        setRecordDuration(0);

        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            streamRef.current = stream;

            // Pick the best supported format
            const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
                ? "audio/webm;codecs=opus"
                : MediaRecorder.isTypeSupported("audio/mp4")
                    ? "audio/mp4"
                    : "audio/webm";

            console.log(`[Voice] Starting recording with mimeType: ${mimeType}`);
            const recorder = new MediaRecorder(stream, { mimeType });
            mediaRecorderRef.current = recorder;

            recorder.ondataavailable = (e) => {
                if (e.data.size > 0) audioChunksRef.current.push(e.data);
            };

            recorder.start(100); // CRITICAL: Small slices provide more stable data
            setIsRecording(true);
            onListeningChange?.(true);
            onInterimTranscript?.("🎙️ Listening...");
            startVisualization(stream);

            const start = Date.now();
            timerRef.current = setInterval(() => {
                setRecordDuration(Math.floor((Date.now() - start) / 1000));
            }, 1000);

        } catch (e: any) {
            console.error("[Voice] Start error:", e);
            setError(e.name === "NotAllowedError" ? "Microphone access denied." : "Could not open microphone.");
        }
    }, [onListeningChange, onInterimTranscript, startVisualization]);

    // ─── Stop & Transcribe ───────────────────────────────────────
    const stopRecording = useCallback(async () => {
        const recorder = mediaRecorderRef.current;
        if (!recorder || recorder.state !== "recording") {
            cleanUp();
            setIsRecording(false);
            onListeningChange?.(false);
            return;
        }

        // Wait for final chunks
        return new Promise<void>((resolve) => {
            recorder.onstop = async () => {
                cleanUp();
                setIsRecording(false);

                const audioBlob = new Blob(audioChunksRef.current, { type: recorder.mimeType });
                console.log(`[Voice] Recording stopped. Blob size: ${audioBlob.size} bytes`);

                if (audioBlob.size < 2000) {
                    setError("No clear audio captured. Please speak louder.");
                    onListeningChange?.(false);
                    onInterimTranscript?.("");
                    resolve();
                    return;
                }

                setIsTranscribing(true);
                onInterimTranscript?.("✨ Divine Synthesis...");

                try {
                    const formData = new FormData();
                    formData.append("audio", audioBlob, "recording.webm");
                    formData.append("language", currentLang);

                    const res = await fetch("/api/transcribe", {
                        method: "POST",
                        body: formData,
                    });

                    if (res.ok) {
                        const data = await res.json();
                        if (data.text) {
                            onTranscript(data.text);
                        } else {
                            setError("Could not understand the speech. Try again.");
                        }
                    } else {
                        const err = await res.json().catch(() => ({}));
                        setError(err.error || "AI service is currently busy.");
                    }
                } catch {
                    setError("Connection error. Try again.");
                } finally {
                    setIsTranscribing(false);
                    onInterimTranscript?.("");
                    onListeningChange?.(false);
                    setRecordDuration(0);
                    resolve();
                }
            };
            recorder.stop();
        });
    }, [currentLang, onTranscript, onInterimTranscript, onListeningChange, cleanUp]);

    const toggle = useCallback(() => {
        if (isRecording) stopRecording();
        else startRecording();
    }, [isRecording, startRecording, stopRecording]);

    if (!isSupported) return null;

    const langData = VOICE_LANGUAGES.find(l => l.code === currentLang) || VOICE_LANGUAGES[0];

    return (
        <div className={`flex items-center gap-1 ${className}`}>
            {/* Lang Button */}
            <button
                type="button"
                onClick={() => setShowLangPicker(!showLangPicker)}
                className={`p-2 rounded-lg hover:bg-accent/10 transition-all ${isRecording || isTranscribing ? 'opacity-20 pointer-events-none' : 'opacity-60'}`}
                title="Select Voice Language"
            >
                {langData.flag}
            </button>

            {/* Language Picker Dropdown */}
            {showLangPicker && (
                <div className="absolute bottom-full right-0 mb-4 bg-card-bg border border-border rounded-2xl p-2 shadow-2xl z-50 w-40">
                    {VOICE_LANGUAGES.map(l => (
                        <button
                            key={l.code}
                            onClick={() => { setCurrentLang(l.code); setShowLangPicker(false); }}
                            className={`flex items-center gap-3 w-full p-2.5 rounded-xl text-xs font-bold transition-all ${currentLang === l.code ? 'bg-accent text-white' : 'hover:bg-accent/10'}`}
                        >
                            <span>{l.flag}</span> <span>{l.label}</span>
                        </button>
                    ))}
                </div>
            )}

            {/* Main Mic Button */}
            <button
                type="button"
                onClick={toggle}
                disabled={disabled || isTranscribing}
                className={`relative w-11 h-11 rounded-full flex items-center justify-center transition-all ${isRecording ? 'bg-red-500 scale-110 shadow-lg shadow-red-500/40' : preservesTextColor(isTranscribing) ? 'bg-amber-500 animate-pulse' : 'bg-accent/10 text-muted hover:bg-accent/20 hover:text-accent'}`}
            >
                {isRecording && (
                    <div
                        className="absolute inset-0 rounded-full border-2 border-red-500/40 animate-ping"
                        style={{ animationDuration: '1.5s' }}
                    />
                )}

                {isTranscribing ? (
                    <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                ) : isRecording ? (
                    <div className="w-4 h-4 bg-white rounded-sm" />
                ) : (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
                        <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                        <line x1="12" y1="19" x2="12" y2="22" />
                        <line x1="8" y1="22" x2="16" y2="22" />
                    </svg>
                )}

                {/* Duration Badge */}
                {isRecording && recordDuration > 0 && (
                    <div className="absolute -top-1 -right-4 bg-red-600 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full shadow-lg">
                        {recordDuration}s
                    </div>
                )}
            </button>

            {/* Error Message */}
            {error && (
                <div
                    onClick={() => setError(null)}
                    className="absolute bottom-full right-0 mb-4 bg-red-950/90 border border-red-500/50 text-red-200 text-xs p-3 rounded-2xl shadow-2xl cursor-pointer animate-in fade-in slide-in-from-bottom-2"
                >
                    ⚠️ {error}
                </div>
            )}
        </div>
    );
}

function preservesTextColor(isTranscribing: boolean) {
    return isTranscribing;
}
