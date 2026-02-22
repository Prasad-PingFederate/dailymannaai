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
    { code: "ml", label: "മലയാളം", flag: "🇮🇳" },
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

    // ─── Wake up Audio Engine ─────────────────────────────────────
    const initAudioContext = useCallback(async () => {
        if (!audioCtxRef.current) {
            const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
            audioCtxRef.current = new AudioContextClass();
        }
        if (audioCtxRef.current.state === "suspended") {
            await audioCtxRef.current.resume();
        }
        return audioCtxRef.current;
    }, []);

    // ─── Visualization ────────────────────────────────────────────
    const stopAudio = useCallback(() => {
        if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
        if (timerRef.current) clearInterval(timerRef.current);
        streamRef.current?.getTracks().forEach(t => t.stop());
        streamRef.current = null;
        setAudioLevel(0);
    }, []);

    const startRecording = useCallback(async () => {
        setError(null);
        audioChunksRef.current = [];
        setDuration(0);

        try {
            // 1. Wake up context immediately
            const ctx = await initAudioContext();

            // 2. Get Mic
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true
                }
            });
            streamRef.current = stream;

            // 3. Connect Visualizer
            const source = ctx.createMediaStreamSource(stream);
            const analyser = ctx.createAnalyser();
            analyser.fftSize = 256;
            source.connect(analyser);
            analyserRef.current = analyser;
            const dataArray = new Uint8Array(analyser.frequencyBinCount);

            const draw = () => {
                if (!analyserRef.current) return;
                analyserRef.current.getByteFrequencyData(dataArray);
                const avg = dataArray.reduce((p, c) => p + c, 0) / dataArray.length;
                setAudioLevel(avg);
                animFrameRef.current = requestAnimationFrame(draw);
            };
            draw();

            // 4. Start Recorder
            const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus") ? "audio/webm;codecs=opus" : "audio/webm";
            const recorder = new MediaRecorder(stream, { mimeType });
            mediaRecorderRef.current = recorder;

            recorder.ondataavailable = (e) => {
                if (e.data.size > 0) audioChunksRef.current.push(e.data);
            };

            recorder.start(100);
            setStatus("recording");
            onListeningChange?.(true);
            onInterimTranscript?.("🎙️ I am listening...");

            const start = Date.now();
            timerRef.current = setInterval(() => {
                setDuration(Math.floor((Date.now() - start) / 1000));
            }, 1000);

        } catch (e: any) {
            console.error("[Voice] Start Error:", e);
            setError(e.name === "NotAllowedError" ? "Please check your mic permissions." : "Mic is asleep or not found.");
        }
    }, [initAudioContext, onListeningChange, onInterimTranscript]);

    const stopRecording = useCallback(async () => {
        const recorder = mediaRecorderRef.current;
        if (!recorder || recorder.state !== "recording") {
            stopAudio();
            setStatus("idle");
            onListeningChange?.(false);
            return;
        }

        setStatus("transcribing");
        onInterimTranscript?.("✨ Thinking...");

        return new Promise<void>((resolve) => {
            recorder.onstop = async () => {
                stopAudio();
                const audioBlob = new Blob(audioChunksRef.current, { type: recorder.mimeType });

                if (audioBlob.size < 500) {
                    setError("I didn't hear anything. Try again!");
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

                    const res = await fetch("/api/transcribe", { method: "POST", body: fd });
                    const data = await res.json();

                    if (data.text) {
                        onTranscript(data.text);
                    } else if (data.error) {
                        setError(data.error);
                    }
                } catch {
                    setError("Communication failed. Try again.");
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

    const handleToggle = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (status === "recording") stopRecording();
        else if (status === "idle") startRecording();
    };

    const langData = VOICE_LANGUAGES.find(l => l.code === currentLang) || VOICE_LANGUAGES[0];

    return (
        <div className={`flex items-center gap-2 ${className}`}>
            {/* Language Switcher */}
            <button
                type="button"
                className={`text-lg p-1 transition-opacity ${status !== "idle" ? "opacity-10 pointer-events-none" : "opacity-80 hover:opacity-100"}`}
                onClick={() => setShowLangPicker(!showLangPicker)}
            >
                {langData.flag}
            </button>

            {showLangPicker && (
                <div className="absolute bottom-full right-0 mb-4 grid grid-cols-2 gap-1 bg-card-bg border border-border p-2 rounded-2xl shadow-2xl z-[100] w-48 animate-in zoom-in-95 duration-200">
                    {VOICE_LANGUAGES.map(l => (
                        <button
                            key={l.code}
                            onClick={() => { setCurrentLang(l.code); setShowLangPicker(false); }}
                            className={`flex items-center gap-2 p-2 rounded-xl text-[10px] font-black uppercase tracking-wider ${currentLang === l.code ? 'bg-accent text-white' : 'hover:bg-accent/10 text-muted'}`}
                        >
                            <span>{l.flag}</span> <span>{l.label}</span>
                        </button>
                    ))}
                </div>
            )}

            {/* The Mic Button */}
            <button
                type="button"
                onMouseDown={initAudioContext} // Pre-wake on mouse down
                onClick={handleToggle}
                disabled={status === "transcribing" || disabled}
                className={`group relative w-12 h-12 flex items-center justify-center rounded-full transition-all duration-300 ${status === "recording" ? 'bg-red-500 scale-110' : status === "transcribing" ? 'bg-amber-500' : 'bg-accent/10 border border-accent/20 text-accent hover:bg-accent hover:text-white'}`}
            >
                {/* Level Rings */}
                {status === "recording" && (
                    <div
                        className="absolute inset-0 rounded-full border-4 border-red-500/30 transition-transform duration-75"
                        style={{ transform: `scale(${1 + (audioLevel / 100)})` }}
                    />
                )}

                {status === "transcribing" ? (
                    <div className="w-6 h-6 border-[3px] border-white/30 border-t-white rounded-full animate-spin" />
                ) : status === "recording" ? (
                    <div className="flex items-center gap-1">
                        <div className="w-1.5 h-4 bg-white rounded-full animate-bounce [animation-delay:-0.3s]" />
                        <div className="w-1.5 h-6 bg-white rounded-full animate-bounce [animation-delay:-0.15s]" />
                        <div className="w-1.5 h-4 bg-white rounded-full animate-bounce" />
                    </div>
                ) : (
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
                        <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                        <line x1="12" y1="19" x2="12" y2="22" />
                    </svg>
                )}

                {/* Duration */}
                {status === "recording" && (
                    <div className="absolute -top-1 -right-4 bg-red-600 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full ring-2 ring-card-bg">
                        {duration}s
                    </div>
                )}
            </button>

            {/* Error Message */}
            {error && (
                <div
                    onClick={() => setError(null)}
                    className="absolute bottom-full right-0 mb-4 bg-red-950/95 border border-red-500/50 text-red-100 text-[11px] font-bold p-3 rounded-2xl shadow-2xl cursor-pointer max-w-[200px] animate-in slide-in-from-bottom-2"
                >
                    {error}
                </div>
            )}
        </div>
    );
}
