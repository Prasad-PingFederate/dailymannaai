"use client";

import React, { useState, useRef, useCallback, useEffect } from "react";

// ─── Types ───────────────────────────────────────────────────────
interface VoiceInputProps {
    onTranscript: (text: string) => void;
    onInterimTranscript?: (text: string) => void;
    onListeningChange?: (isListening: boolean) => void;
    disabled?: boolean;
    className?: string;
    size?: number;
    language?: string;
}

// ─── Language list ───────────────────────────────────────────────
export const VOICE_LANGUAGES = [
    { code: "en", label: "English", flag: "🇺🇸" },
    { code: "te", label: "తెలుగు", flag: "🇮🇳" },
    { code: "hi", label: "हिन्दी", flag: "🇮🇳" },
    { code: "ta", label: "தமிழ்", flag: "🇮🇳" },
    { code: "kn", label: "ಕನ್ನಡ", flag: "🇮🇳" },
    { code: "ml", label: "മലയാളം", flag: "🇮🇳" },
    { code: "es", label: "Español", flag: "🇪🇸" },
    { code: "fr", label: "Français", flag: "🇫🇷" },
    { code: "de", label: "Deutsch", flag: "🇩🇪" },
    { code: "pt", label: "Português", flag: "🇧🇷" },
    { code: "zh", label: "中文", flag: "🇨🇳" },
    { code: "ja", label: "日本語", flag: "🇯🇵" },
    { code: "ko", label: "한국어", flag: "🇰🇷" },
    { code: "ar", label: "العربية", flag: "🇸🇦" },
];

// ─── Component ───────────────────────────────────────────────────
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
    const [isSupported, setIsSupported] = useState(false);

    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);
    const streamRef = useRef<MediaStream | null>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const analyserRef = useRef<AnalyserNode | null>(null);
    const animFrameRef = useRef<number>(0);
    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const langPickerRef = useRef<HTMLDivElement>(null);

    // Check support
    useEffect(() => {
        setIsSupported(typeof MediaRecorder !== "undefined");
    }, []);

    // Close lang picker on outside click
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (langPickerRef.current && !langPickerRef.current.contains(e.target as Node)) {
                setShowLangPicker(false);
            }
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    // ─── Audio Visualization ─────────────────────────────────────
    const startVisualization = useCallback((stream: MediaStream) => {
        try {
            const ctx = new AudioContext();
            const src = ctx.createMediaStreamSource(stream);
            const analyser = ctx.createAnalyser();
            analyser.fftSize = 256;
            src.connect(analyser);
            audioContextRef.current = ctx;
            analyserRef.current = analyser;
            const data = new Uint8Array(analyser.frequencyBinCount);

            const update = () => {
                if (!analyserRef.current) return;
                analyserRef.current.getByteFrequencyData(data);
                const avg = data.reduce((a, b) => a + b, 0) / data.length;
                setAudioLevel(Math.min(avg / 128, 1));
                animFrameRef.current = requestAnimationFrame(update);
            };
            update();
        } catch { /* visualization optional */ }
    }, []);

    const stopVisualization = useCallback(() => {
        if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
        audioContextRef.current?.close();
        audioContextRef.current = null;
        analyserRef.current = null;
        setAudioLevel(0);
    }, []);

    const stopStream = useCallback(() => {
        streamRef.current?.getTracks().forEach(t => t.stop());
        streamRef.current = null;
    }, []);

    // ─── Start Recording ─────────────────────────────────────────
    const startRecording = useCallback(async () => {
        setError(null);
        audioChunksRef.current = [];
        setRecordDuration(0);

        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            streamRef.current = stream;

            // Choose best format
            const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
                ? "audio/webm;codecs=opus"
                : MediaRecorder.isTypeSupported("audio/mp4")
                    ? "audio/mp4"
                    : "audio/webm";

            const recorder = new MediaRecorder(stream, { mimeType });
            mediaRecorderRef.current = recorder;

            recorder.ondataavailable = (e) => {
                if (e.data.size > 0) audioChunksRef.current.push(e.data);
            };

            recorder.onstop = () => {
                // Handled by stopRecording
            };

            recorder.start(250);
            setIsRecording(true);
            onListeningChange?.(true);
            onInterimTranscript?.("🎙️ Listening...");
            startVisualization(stream);

            // Duration timer
            const start = Date.now();
            timerRef.current = setInterval(() => {
                setRecordDuration(Math.floor((Date.now() - start) / 1000));
            }, 1000);

            // Auto-stop after 60 seconds
            setTimeout(() => {
                if (mediaRecorderRef.current?.state === "recording") {
                    stopRecording();
                }
            }, 60000);

        } catch (e: any) {
            if (e.name === "NotAllowedError") {
                setError("Microphone blocked. Allow access in browser settings.");
            } else {
                setError("Could not access microphone.");
            }
        }
    }, [onListeningChange, onInterimTranscript, startVisualization]);

    // ─── Stop Recording & Transcribe ─────────────────────────────
    const stopRecording = useCallback(async () => {
        if (timerRef.current) clearInterval(timerRef.current);
        stopVisualization();

        const recorder = mediaRecorderRef.current;
        if (!recorder || recorder.state !== "recording") {
            stopStream();
            setIsRecording(false);
            onListeningChange?.(false);
            return;
        }

        // Wait for final data
        await new Promise<void>((resolve) => {
            recorder.onstop = () => resolve();
            recorder.stop();
        });

        setIsRecording(false);
        stopStream();

        const chunks = audioChunksRef.current;
        if (chunks.length === 0) {
            setError("No audio recorded. Try again.");
            onListeningChange?.(false);
            return;
        }

        const audioBlob = new Blob(chunks, { type: recorder.mimeType });
        if (audioBlob.size < 1000) {
            setError("Recording too short. Hold the mic button longer.");
            onListeningChange?.(false);
            return;
        }

        // Transcribe
        setIsTranscribing(true);
        onInterimTranscript?.("✨ Transcribing...");

        try {
            const formData = new FormData();
            const ext = recorder.mimeType.includes("mp4") ? "mp4" : "webm";
            formData.append("audio", audioBlob, `recording.${ext}`);
            formData.append("language", currentLang);

            const res = await fetch("/api/transcribe", {
                method: "POST",
                body: formData,
            });

            if (res.ok) {
                const data = await res.json();
                const text = data.text?.trim();
                if (text) {
                    onTranscript(text);
                } else {
                    setError("No speech detected. Speak clearly and try again.");
                }
            } else {
                const errData = await res.json().catch(() => ({}));
                setError(errData.error || "Transcription failed.");
            }
        } catch {
            setError("Network error. Check your connection.");
        } finally {
            setIsTranscribing(false);
            onInterimTranscript?.("");
            onListeningChange?.(false);
            setRecordDuration(0);
        }
    }, [currentLang, onTranscript, onInterimTranscript, onListeningChange, stopVisualization, stopStream]);

    // ─── Toggle ──────────────────────────────────────────────────
    const toggle = useCallback(() => {
        if (isRecording) {
            stopRecording();
        } else {
            startRecording();
        }
    }, [isRecording, startRecording, stopRecording]);

    // Cleanup
    useEffect(() => {
        return () => {
            if (mediaRecorderRef.current?.state === "recording") {
                mediaRecorderRef.current.stop();
            }
            if (timerRef.current) clearInterval(timerRef.current);
            stopVisualization();
            stopStream();
        };
    }, [stopVisualization, stopStream]);

    if (!isSupported) return null;

    const langData = VOICE_LANGUAGES.find(l => l.code === currentLang) || VOICE_LANGUAGES[0];
    const formatTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;
    const busy = isRecording || isTranscribing;

    return (
        <div className={`voice-input-wrap ${className}`} style={{ position: "relative", display: "inline-flex", alignItems: "center", gap: "2px" }}>

            {/* Language Picker */}
            <div ref={langPickerRef} style={{ position: "relative" }}>
                <button
                    type="button"
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShowLangPicker(!showLangPicker); }}
                    disabled={busy || disabled}
                    title={`Language: ${langData.label}`}
                    style={{
                        background: "transparent",
                        border: "none",
                        cursor: busy || disabled ? "not-allowed" : "pointer",
                        fontSize: "13px",
                        padding: "4px 2px",
                        borderRadius: "6px",
                        opacity: busy || disabled ? 0.3 : 0.6,
                        transition: "all 0.2s",
                        lineHeight: 1,
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.opacity = "1")}
                    onMouseLeave={(e) => (e.currentTarget.style.opacity = busy || disabled ? "0.3" : "0.6")}
                >
                    {langData.flag}
                </button>

                {showLangPicker && (
                    <div style={{
                        position: "absolute",
                        bottom: "100%",
                        right: 0,
                        marginBottom: "8px",
                        background: "var(--card-bg, #1a1a2e)",
                        border: "1px solid var(--border, #333)",
                        borderRadius: "12px",
                        padding: "6px",
                        maxHeight: "260px",
                        overflowY: "auto",
                        width: "160px",
                        zIndex: 1000,
                        boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
                    }}>
                        {VOICE_LANGUAGES.map(lang => (
                            <button
                                key={lang.code}
                                type="button"
                                onClick={() => { setCurrentLang(lang.code); setShowLangPicker(false); }}
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "8px",
                                    width: "100%",
                                    padding: "7px 10px",
                                    border: "none",
                                    background: currentLang === lang.code ? "var(--accent, #4f46e5)" : "transparent",
                                    color: currentLang === lang.code ? "white" : "var(--foreground, #ccc)",
                                    borderRadius: "8px",
                                    cursor: "pointer",
                                    fontSize: "12px",
                                    textAlign: "left",
                                    transition: "background 0.15s",
                                }}
                                onMouseEnter={(e) => { if (currentLang !== lang.code) e.currentTarget.style.background = "rgba(255,255,255,0.05)"; }}
                                onMouseLeave={(e) => { if (currentLang !== lang.code) e.currentTarget.style.background = "transparent"; }}
                            >
                                <span>{lang.flag}</span>
                                <span style={{ flex: 1 }}>{lang.label}</span>
                                {currentLang === lang.code && <span style={{ fontSize: "10px" }}>✓</span>}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* Mic Button */}
            <button
                type="button"
                onClick={toggle}
                disabled={disabled || isTranscribing}
                title={isRecording ? `Recording ${formatTime(recordDuration)} — tap to stop` : isTranscribing ? "Transcribing..." : "Tap to speak"}
                className="voice-mic-btn"
                style={{
                    position: "relative",
                    width: `${size + 18}px`,
                    height: `${size + 18}px`,
                    borderRadius: "50%",
                    border: "none",
                    cursor: disabled || isTranscribing ? "not-allowed" : "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: isRecording
                        ? "#ef4444"
                        : isTranscribing
                            ? "#f59e0b"
                            : "transparent",
                    color: isRecording || isTranscribing ? "white" : "var(--muted, #888)",
                    transition: "all 0.2s ease",
                    outline: "none",
                    opacity: disabled ? 0.3 : 1,
                    zIndex: 1,
                    flexShrink: 0,
                }}
            >
                {/* Pulse rings while recording */}
                {isRecording && (
                    <>
                        <span style={{
                            position: "absolute",
                            inset: `-${3 + audioLevel * 6}px`,
                            borderRadius: "50%",
                            border: "2px solid #ef4444",
                            opacity: 0.5,
                            animation: "vpulse 1.4s ease-in-out infinite",
                        }} />
                        <span style={{
                            position: "absolute",
                            inset: `-${7 + audioLevel * 12}px`,
                            borderRadius: "50%",
                            border: "1.5px solid #ef4444",
                            opacity: 0.25,
                            animation: "vpulse 1.4s ease-in-out infinite 0.2s",
                        }} />
                    </>
                )}

                {/* Icon */}
                <svg width={size - 2} height={size - 2} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    {isTranscribing ? (
                        <g>
                            <circle cx="6" cy="12" r="1.5" fill="currentColor" stroke="none"><animate attributeName="opacity" values="1;0.2;1" dur="0.8s" repeatCount="indefinite" /></circle>
                            <circle cx="12" cy="12" r="1.5" fill="currentColor" stroke="none"><animate attributeName="opacity" values="0.2;1;0.2" dur="0.8s" repeatCount="indefinite" /></circle>
                            <circle cx="18" cy="12" r="1.5" fill="currentColor" stroke="none"><animate attributeName="opacity" values="0.2;0.2;1" dur="0.8s" repeatCount="indefinite" /></circle>
                        </g>
                    ) : isRecording ? (
                        <rect x="6" y="6" width="12" height="12" rx="2" fill="currentColor" stroke="none" />
                    ) : (
                        <g>
                            <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
                            <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                            <line x1="12" y1="19" x2="12" y2="22" />
                            <line x1="8" y1="22" x2="16" y2="22" />
                        </g>
                    )}
                </svg>

                {/* Duration badge */}
                {isRecording && recordDuration > 0 && (
                    <span style={{
                        position: "absolute",
                        top: "-8px",
                        right: "-12px",
                        fontSize: "9px",
                        background: "#ef4444",
                        color: "white",
                        borderRadius: "10px",
                        padding: "1px 5px",
                        fontWeight: 800,
                        fontFamily: "monospace",
                        whiteSpace: "nowrap",
                        boxShadow: "0 2px 8px rgba(239,68,68,0.4)",
                    }}>
                        {formatTime(recordDuration)}
                    </span>
                )}
            </button>

            {/* Status bubble */}
            {isTranscribing && (
                <div style={{
                    position: "absolute",
                    bottom: "calc(100% + 10px)",
                    right: 0,
                    background: "var(--card-bg, #1a1a2e)",
                    border: "1px solid #f59e0b44",
                    borderRadius: "10px",
                    padding: "8px 14px",
                    fontSize: "12px",
                    color: "#fbbf24",
                    zIndex: 100,
                    animation: "vfade 0.2s ease",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    boxShadow: "0 4px 20px rgba(0,0,0,0.3)",
                }}>
                    <span style={{ animation: "vblink 0.6s ease infinite" }}>✨</span>
                    Transcribing with AI...
                </div>
            )}

            {/* Error toast */}
            {error && (
                <div
                    style={{
                        position: "absolute",
                        bottom: "calc(100% + 10px)",
                        right: 0,
                        background: "#7f1d1d",
                        border: "1px solid #ef4444",
                        borderRadius: "10px",
                        padding: "8px 12px",
                        fontSize: "11px",
                        color: "#fca5a5",
                        maxWidth: "240px",
                        zIndex: 100,
                        animation: "vfade 0.2s ease",
                        cursor: "pointer",
                    }}
                    onClick={() => setError(null)}
                >
                    ⚠️ {error}
                </div>
            )}

            <style>{`
                @keyframes vpulse {
                    0%, 100% { transform: scale(1); opacity: 0.5; }
                    50% { transform: scale(1.12); opacity: 0.15; }
                }
                @keyframes vblink {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.3; }
                }
                @keyframes vfade {
                    from { opacity: 0; transform: translateY(4px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .voice-mic-btn:hover:not(:disabled) {
                    transform: scale(1.08);
                    color: var(--accent, #4f46e5) !important;
                }
                .voice-mic-btn:active:not(:disabled) {
                    transform: scale(0.95);
                }
            `}</style>
        </div>
    );
}
