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
    const [status, setStatus] = useState<"idle" | "recording" | "transcribing">("idle");
    const [currentLang, setCurrentLang] = useState(language);
    const [showLangPicker, setShowLangPicker] = useState(false);
    const [audioLevel, setAudioLevel] = useState(0);
    const [error, setError] = useState<string | null>(null);
    const [duration, setDuration] = useState(0);

    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);
    const streamRef = useRef<MediaStream | null>(null);
    const audioCtxRef = useRef<AudioContext | null>(null);
    const analyserRef = useRef<AnalyserNode | null>(null);
    const animFrameRef = useRef<number>(0);
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    // Auto-Stop state
    const silenceStartRef = useRef<number | null>(null);
    const SILENCE_THRESHOLD = 15; // Noise floor
    const SILENCE_DURATION = 1500; // 1.5 seconds

    // ─── Wake up Audio Engine ─────────────────────────────────────
    const initAudioContext = useCallback(async () => {
        try {
            if (!audioCtxRef.current) {
                const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
                audioCtxRef.current = new AudioContextClass();
            }
            if (audioCtxRef.current.state === "suspended") {
                await audioCtxRef.current.resume();
            }
            return audioCtxRef.current;
        } catch (e) {
            console.error("[Voice] AudioContext Init Error:", e);
            return null;
        }
    }, []);

    // ─── Visualization & Silence Detection ────────────────────────
    const stopAudio = useCallback(() => {
        if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
        if (timerRef.current) clearInterval(timerRef.current);
        streamRef.current?.getTracks().forEach(t => t.stop());
        streamRef.current = null;
        setAudioLevel(0);
        silenceStartRef.current = null;
    }, []);

    // ─── Stop & Transcribe (Declared first for use in startRecording) 
    const stopRecording = useCallback(async () => {
        const recorder = mediaRecorderRef.current;
        if (!recorder || recorder.state !== "recording") {
            stopAudio();
            setStatus("idle");
            onListeningChange?.(false);
            return;
        }

        setStatus("transcribing");
        onInterimTranscript?.("✨ Synthesizing voice...");

        return new Promise<void>((resolve) => {
            recorder.onstop = async () => {
                stopAudio();
                const audioBlob = new Blob(audioChunksRef.current, { type: recorder.mimeType });

                console.log(`[Voice] Send audioBlob size: ${audioBlob.size}, type: ${audioBlob.type}`);

                if (audioBlob.size < 1000) {
                    setError("I didn't hear clear speech. Try speaking louder.");
                    setStatus("idle");
                    onListeningChange?.(false);
                    onInterimTranscript?.("");
                    resolve();
                    return;
                }

                try {
                    const fd = new FormData();
                    fd.append("audio", audioBlob);
                    fd.append("language", currentLang);

                    const res = await fetch("/api/transcribe", {
                        method: "POST",
                        body: fd
                    });

                    if (!res.ok) {
                        const errData = await res.json().catch(() => ({}));
                        throw new Error(errData.error || "Network error");
                    }

                    const data = await res.json();

                    if (data.text) {
                        console.log(`[Voice] Transcript received: ${data.text}`);
                        onTranscript(data.text);
                    } else {
                        setError("I couldn't hear any speech. Try again!");
                    }
                } catch (err: any) {
                    console.error("[Voice] Transcription fetch error:", err);
                    setError(err.message || "Communication failed.");
                } finally {
                    setStatus("idle");
                    onListeningChange?.(false);
                    onInterimTranscript?.("");
                    resolve();
                }
            };
            recorder.stop();
        });
    }, [currentLang, onTranscript, onInterimTranscript, onListeningChange, stopAudio]);

    // ─── Start Recording ─────────────────────────────────────────
    const startRecording = useCallback(async () => {
        setError(null);
        audioChunksRef.current = [];
        setDuration(0);
        silenceStartRef.current = null;

        try {
            const ctx = await initAudioContext();
            if (!ctx) throw new Error("Audio system failed to initialize.");

            const stream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true
                }
            });
            streamRef.current = stream;

            const source = ctx.createMediaStreamSource(stream);
            const analyser = ctx.createAnalyser();
            analyser.fftSize = 256;
            source.connect(analyser);
            analyserRef.current = analyser;
            const dataArray = new Uint8Array(analyser.frequencyBinCount);

            const checkAudio = () => {
                if (!analyserRef.current) return;
                analyserRef.current.getByteFrequencyData(dataArray);
                const avg = dataArray.reduce((p, c) => p + c, 0) / dataArray.length;

                // Visual level (smooth)
                setAudioLevel(prev => (prev * 0.7) + (avg * 0.3));

                // Silence Detection (Auto-Stop)
                if (avg < SILENCE_THRESHOLD) {
                    if (!silenceStartRef.current) silenceStartRef.current = Date.now();
                    else if (Date.now() - silenceStartRef.current > SILENCE_DURATION) {
                        console.log("[Voice] Auto-stopping due to silence...");
                        stopRecording();
                        return;
                    }
                } else {
                    silenceStartRef.current = null;
                }

                animFrameRef.current = requestAnimationFrame(checkAudio);
            };
            checkAudio();

            const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus") ? "audio/webm;codecs=opus" : "audio/webm";
            const recorder = new MediaRecorder(stream, { mimeType });
            mediaRecorderRef.current = recorder;

            recorder.ondataavailable = (e) => {
                if (e.data.size > 0) audioChunksRef.current.push(e.data);
            };

            recorder.start(200);
            setStatus("recording");
            onListeningChange?.(true);
            onInterimTranscript?.("🎙️ Listening...");

            const start = Date.now();
            timerRef.current = setInterval(() => {
                setDuration(Math.floor((Date.now() - start) / 1000));
            }, 1000);

        } catch (e: any) {
            console.error("[Voice] Start Error:", e);
            setError(e.name === "NotAllowedError" ? "Please allow microphone access in your browser." : "Could not wake up the mic.");
        }
    }, [initAudioContext, onListeningChange, onInterimTranscript, stopRecording]);

    const handleToggle = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (status === "recording") stopRecording();
        else if (status === "idle") startRecording();
    };

    const langData = VOICE_LANGUAGES.find(l => l.code === currentLang) || VOICE_LANGUAGES[0];

    return (
        <div className={`flex items-center gap-2 ${className} select-none`}>
            {/* Lang Dropdown */}
            <div className="relative">
                <button
                    type="button"
                    className={`text-lg p-2 rounded-xl hover:bg-accent/10 transition-all ${status !== "idle" ? "opacity-20 bg-transparent" : "opacity-80"}`}
                    onClick={() => setShowLangPicker(!showLangPicker)}
                >
                    {langData.flag}
                </button>

                {showLangPicker && (
                    <div className="absolute bottom-full left-0 mb-4 bg-card-bg border border-border p-2 rounded-2xl shadow-2xl z-[100] w-40 flex flex-col gap-1 anim-in-slide-up">
                        {VOICE_LANGUAGES.map(l => (
                            <button
                                key={l.code}
                                onClick={() => { setCurrentLang(l.code); setShowLangPicker(false); }}
                                className={`flex items-center gap-3 w-full p-2.5 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all ${currentLang === l.code ? 'bg-accent text-white' : 'hover:bg-accent/10 text-muted'}`}
                            >
                                <span>{l.flag}</span> <span>{l.label}</span>
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* Visual Meter (Desktop Only) */}
            {status === "recording" && (
                <div className="hidden md:flex items-center gap-1 h-8 px-2 bg-accent/5 rounded-full border border-accent/10">
                    {[1, 2, 3, 4, 5].map(i => (
                        <div
                            key={i}
                            className="w-1 rounded-full bg-accent transition-all duration-75"
                            style={{
                                height: `${Math.max(15, Math.min(100, (audioLevel / 50) * 100 * (1 - Math.abs(3 - i) * 0.2)))}%`,
                                opacity: 0.3 + (audioLevel / 100)
                            }}
                        />
                    ))}
                </div>
            )}

            {/* Mic Button */}
            <button
                type="button"
                onMouseDown={() => initAudioContext()}
                onClick={handleToggle}
                disabled={status === "transcribing" || disabled}
                className={`group relative w-12 h-12 flex items-center justify-center rounded-full transition-all duration-300 ${status === "recording" ? 'bg-red-500 scale-105 shadow-[0_0_20px_rgba(239,68,68,0.4)]' : status === "transcribing" ? 'bg-amber-500' : 'bg-accent/10 border border-accent/20 text-accent hover:bg-accent hover:text-white'}`}
            >
                {/* Visual Glow Ring */}
                {status === "recording" && (
                    <div
                        className="absolute inset-0 rounded-full border-2 border-red-400 opacity-60 pointer-events-none"
                        style={{
                            transform: `scale(${1.2 + (audioLevel / 100)})`,
                            transition: 'transform 0.1s ease-out'
                        }}
                    />
                )}

                {status === "transcribing" ? (
                    <div className="w-6 h-6 border-[3px] border-white/20 border-t-white rounded-full animate-spin" />
                ) : status === "recording" ? (
                    <div className="w-5 h-5 bg-white rounded-md animate-pulse shadow-sm" />
                ) : (
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
                        <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                        <line x1="12" y1="19" x2="12" y2="22" />
                    </svg>
                )}

                {/* Duration Badge */}
                {status === "recording" && (
                    <div className="absolute -top-2 -right-2 bg-red-600 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full ring-2 ring-card-bg shadow-lg">
                        {duration}s
                    </div>
                )}
            </button>

            {/* Floating Error */}
            {error && (
                <div
                    onClick={() => setError(null)}
                    className="fixed bottom-32 right-10 bg-red-950/95 border border-red-500/50 text-red-50 text-[12px] font-black uppercase tracking-wider p-4 rounded-3xl shadow-2xl cursor-pointer max-w-[280px] z-[200] animate-in slide-in-from-right-4"
                >
                    <div className="flex items-center gap-3">
                        <span className="text-xl">⚠️</span>
                        <span>{error}</span>
                    </div>
                </div>
            )}

            <style jsx>{`
                .anim-in-slide-up {
                    animation: slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
                }
                @keyframes slideUp {
                    from { opacity: 0; transform: translateY(10px) scale(0.95); }
                    to { opacity: 1; transform: translateY(0) scale(1); }
                }
            `}</style>
        </div>
    );
}
