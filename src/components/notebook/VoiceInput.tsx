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

// ─── Supported Languages ─────────────────────────────────────────
export const VOICE_LANGUAGES = [
    { code: "en-US", label: "English (US)", flag: "🇺🇸" },
    { code: "en-IN", label: "English (India)", flag: "🇮🇳" },
    { code: "te-IN", label: "తెలుగు (Telugu)", flag: "🇮🇳" },
    { code: "hi-IN", label: "हिन्दी (Hindi)", flag: "🇮🇳" },
    { code: "ta-IN", label: "தமிழ் (Tamil)", flag: "🇮🇳" },
    { code: "kn-IN", label: "ಕನ್ನಡ (Kannada)", flag: "🇮🇳" },
    { code: "ml-IN", label: "മലയാളം (Malayalam)", flag: "🇮🇳" },
    { code: "es-ES", label: "Español", flag: "🇪🇸" },
    { code: "fr-FR", label: "Français", flag: "🇫🇷" },
    { code: "de-DE", label: "Deutsch", flag: "🇩🇪" },
    { code: "pt-BR", label: "Português", flag: "🇧🇷" },
    { code: "zh-CN", label: "中文", flag: "🇨🇳" },
    { code: "ja-JP", label: "日本語", flag: "🇯🇵" },
    { code: "ko-KR", label: "한국어", flag: "🇰🇷" },
    { code: "ar-SA", label: "العربية", flag: "🇸🇦" },
];

// ─── Speech Recognition Types ────────────────────────────────────
interface SpeechRecognitionEvent {
    results: SpeechRecognitionResultList;
    resultIndex: number;
}
interface SpeechRecognitionResultList {
    length: number;
    [index: number]: SpeechRecognitionResult;
}
interface SpeechRecognitionResult {
    isFinal: boolean;
    [index: number]: SpeechRecognitionAlternative;
}
interface SpeechRecognitionAlternative {
    transcript: string;
    confidence: number;
}
interface SpeechRecognitionInstance extends EventTarget {
    continuous: boolean;
    interimResults: boolean;
    lang: string;
    maxAlternatives: number;
    start: () => void;
    stop: () => void;
    abort: () => void;
    onresult: ((event: SpeechRecognitionEvent) => void) | null;
    onerror: ((event: { error: string; message?: string }) => void) | null;
    onend: (() => void) | null;
    onstart: (() => void) | null;
    onspeechstart: (() => void) | null;
    onspeechend: (() => void) | null;
}

declare global {
    interface Window {
        SpeechRecognition: new () => SpeechRecognitionInstance;
        webkitSpeechRecognition: new () => SpeechRecognitionInstance;
    }
}

// ─── Check Browser Support ───────────────────────────────────────
function hasNativeSpeechRecognition(): boolean {
    if (typeof window === "undefined") return false;
    return !!(window.SpeechRecognition || window.webkitSpeechRecognition);
}

function hasMediaRecorder(): boolean {
    if (typeof window === "undefined") return false;
    return typeof MediaRecorder !== "undefined";
}

// ─── Main Component ──────────────────────────────────────────────
export default function VoiceInput({
    onTranscript,
    onInterimTranscript,
    onListeningChange,
    disabled = false,
    className = "",
    size = 20,
    language = "en-US",
}: VoiceInputProps) {
    const [isListening, setIsListening] = useState(false);
    const [interimText, setInterimText] = useState("");
    const [currentLang, setCurrentLang] = useState(language);
    const [showLangPicker, setShowLangPicker] = useState(false);
    const [audioLevel, setAudioLevel] = useState(0);
    const [error, setError] = useState<string | null>(null);
    const [mode, setMode] = useState<"native" | "whisper" | "none">("none");
    const [isTranscribing, setIsTranscribing] = useState(false);

    const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);
    const audioContextRef = useRef<AudioContext | null>(null);
    const analyserRef = useRef<AnalyserNode | null>(null);
    const animFrameRef = useRef<number>(0);
    const streamRef = useRef<MediaStream | null>(null);
    const langPickerRef = useRef<HTMLDivElement>(null);
    const finalTranscriptRef = useRef("");

    // Detect mode on mount
    useEffect(() => {
        if (hasNativeSpeechRecognition()) {
            setMode("native");
        } else if (hasMediaRecorder()) {
            setMode("whisper");
        } else {
            setMode("none");
        }
    }, []);

    // Close language picker on outside click
    useEffect(() => {
        function handleClickOutside(e: MouseEvent) {
            if (langPickerRef.current && !langPickerRef.current.contains(e.target as Node)) {
                setShowLangPicker(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // ─── Audio Level Visualization ──────────────────────────────
    const startAudioVisualization = useCallback((stream: MediaStream) => {
        try {
            const audioContext = new AudioContext();
            const source = audioContext.createMediaStreamSource(stream);
            const analyser = audioContext.createAnalyser();
            analyser.fftSize = 256;
            source.connect(analyser);
            audioContextRef.current = audioContext;
            analyserRef.current = analyser;
            const dataArray = new Uint8Array(analyser.frequencyBinCount);

            function updateLevel() {
                if (!analyserRef.current) return;
                analyserRef.current.getByteFrequencyData(dataArray);
                const avg = dataArray.reduce((sum, val) => sum + val, 0) / dataArray.length;
                setAudioLevel(Math.min(avg / 128, 1));
                animFrameRef.current = requestAnimationFrame(updateLevel);
            }
            updateLevel();
        } catch {
            console.warn("[VoiceInput] Audio visualization unavailable");
        }
    }, []);

    const stopAudioVisualization = useCallback(() => {
        if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
        if (audioContextRef.current) {
            audioContextRef.current.close();
            audioContextRef.current = null;
        }
        analyserRef.current = null;
        setAudioLevel(0);
    }, []);

    const stopMediaStream = useCallback(() => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
    }, []);

    // ─── MODE 1: Native Web Speech API (Chrome/Edge) ────────────
    const startNative = useCallback(() => {
        setError(null);
        finalTranscriptRef.current = "";

        const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
        const recognition = new SR();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = currentLang;
        recognition.maxAlternatives = 1;

        recognition.onstart = () => {
            setIsListening(true);
            onListeningChange?.(true);
            navigator.mediaDevices.getUserMedia({ audio: true })
                .then(stream => {
                    streamRef.current = stream;
                    startAudioVisualization(stream);
                })
                .catch(() => { });
        };

        recognition.onresult = (event: SpeechRecognitionEvent) => {
            let interim = "";
            let final = "";
            for (let i = event.resultIndex; i < event.results.length; i++) {
                const result = event.results[i];
                const transcript = result[0].transcript;
                if (result.isFinal) final += transcript;
                else interim += transcript;
            }
            if (final) finalTranscriptRef.current += final;
            const fullInterim = finalTranscriptRef.current + interim;
            setInterimText(fullInterim);
            onInterimTranscript?.(fullInterim);
        };

        recognition.onerror = (event) => {
            console.error("[VoiceInput] Native error:", event.error);
            if (event.error === "not-allowed") {
                setError("Microphone blocked. Please allow microphone access.");
            } else if (event.error === "no-speech") {
                setError("No speech detected. Please try again.");
            } else if (event.error !== "aborted") {
                setError(`Voice error: ${event.error}`);
            }
            stopListening();
        };

        recognition.onend = () => {
            setIsListening(false);
            onListeningChange?.(false);
            stopAudioVisualization();
            stopMediaStream();
            const finalText = finalTranscriptRef.current.trim();
            if (finalText) onTranscript(finalText);
            setInterimText("");
            finalTranscriptRef.current = "";
        };

        recognitionRef.current = recognition;
        try { recognition.start(); }
        catch { setError("Could not start voice recognition. Try again."); }
    }, [currentLang, onTranscript, onInterimTranscript, onListeningChange, startAudioVisualization, stopAudioVisualization, stopMediaStream]);

    // ─── MODE 2: MediaRecorder + Whisper API (Firefox/Safari) ───
    const startWhisper = useCallback(async () => {
        setError(null);
        audioChunksRef.current = [];

        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            streamRef.current = stream;

            // Determine MIME type (Safari prefers mp4, Firefox prefers webm)
            const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
                ? "audio/webm;codecs=opus"
                : MediaRecorder.isTypeSupported("audio/mp4")
                    ? "audio/mp4"
                    : "audio/webm";

            const recorder = new MediaRecorder(stream, { mimeType });
            mediaRecorderRef.current = recorder;

            recorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    audioChunksRef.current.push(event.data);
                }
            };

            recorder.onstop = async () => {
                stopAudioVisualization();
                stopMediaStream();

                const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
                if (audioBlob.size < 1000) {
                    setError("Recording too short. Please try again.");
                    setIsListening(false);
                    onListeningChange?.(false);
                    return;
                }

                // Send to server for Whisper transcription
                setIsTranscribing(true);
                setInterimText("Transcribing your voice...");

                try {
                    const formData = new FormData();
                    const ext = mimeType.includes("mp4") ? "mp4" : "webm";
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
                            setError("No speech detected. Please try again.");
                        }
                    } else {
                        const errData = await res.json().catch(() => ({}));
                        setError(errData.error || "Transcription failed. Try Chrome for best results.");
                    }
                } catch (e: any) {
                    setError("Could not transcribe. Check your connection.");
                    console.error("[VoiceInput] Whisper error:", e);
                } finally {
                    setIsTranscribing(false);
                    setInterimText("");
                    setIsListening(false);
                    onListeningChange?.(false);
                }
            };

            recorder.start(250); // collect chunks every 250ms
            setIsListening(true);
            onListeningChange?.(true);
            startAudioVisualization(stream);
            setInterimText("🎙️ Recording... tap stop when done");

        } catch (e: any) {
            if (e.name === "NotAllowedError") {
                setError("Microphone blocked. Please allow microphone access.");
            } else {
                setError("Could not access microphone.");
            }
            console.error("[VoiceInput] Mic error:", e);
        }
    }, [currentLang, onTranscript, onListeningChange, startAudioVisualization, stopAudioVisualization, stopMediaStream]);

    // ─── Stop Listening ─────────────────────────────────────────
    const stopListening = useCallback(() => {
        if (recognitionRef.current) {
            recognitionRef.current.stop();
            recognitionRef.current = null;
        }
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
            mediaRecorderRef.current.stop();
            mediaRecorderRef.current = null;
            return; // onstop handler will process
        }
        stopAudioVisualization();
        stopMediaStream();
        setIsListening(false);
        onListeningChange?.(false);
    }, [onListeningChange, stopAudioVisualization, stopMediaStream]);

    // ─── Toggle ─────────────────────────────────────────────────
    const toggleListening = useCallback(() => {
        if (isListening) {
            stopListening();
        } else if (mode === "native") {
            startNative();
        } else if (mode === "whisper") {
            startWhisper();
        } else {
            setError("Voice input not supported in this browser.");
        }
    }, [isListening, mode, startNative, startWhisper, stopListening]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (recognitionRef.current) recognitionRef.current.abort();
            if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
                mediaRecorderRef.current.stop();
            }
            stopAudioVisualization();
            stopMediaStream();
        };
    }, [stopAudioVisualization, stopMediaStream]);

    // Don't render if no support at all
    if (mode === "none") return null;

    const currentLangData = VOICE_LANGUAGES.find(l => l.code === currentLang) || VOICE_LANGUAGES[0];
    const showBadge = mode === "whisper";

    return (
        <div className={`voice-input-container ${className}`} style={{ position: "relative", display: "inline-flex", alignItems: "center", gap: "4px" }}>
            {/* Language Selector */}
            <div ref={langPickerRef} style={{ position: "relative" }}>
                <button
                    type="button"
                    onClick={(e) => { e.preventDefault(); setShowLangPicker(!showLangPicker); }}
                    disabled={isListening || disabled}
                    title={`Voice language: ${currentLangData.label}`}
                    style={{
                        background: "transparent",
                        border: "none",
                        cursor: "pointer",
                        fontSize: "14px",
                        padding: "4px",
                        borderRadius: "6px",
                        opacity: isListening || disabled ? 0.4 : 0.7,
                        transition: "opacity 0.2s",
                    }}
                    onMouseEnter={(e) => { (e.target as HTMLElement).style.opacity = "1"; }}
                    onMouseLeave={(e) => { (e.target as HTMLElement).style.opacity = isListening || disabled ? "0.4" : "0.7"; }}
                >
                    {currentLangData.flag}
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
                        padding: "8px 4px",
                        maxHeight: "280px",
                        overflowY: "auto",
                        width: "200px",
                        zIndex: 1000,
                        boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
                        backdropFilter: "blur(20px)",
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
                                    padding: "8px 12px",
                                    border: "none",
                                    background: currentLang === lang.code ? "var(--accent, #4f46e5)" : "transparent",
                                    color: currentLang === lang.code ? "white" : "var(--foreground, #e0e0e0)",
                                    borderRadius: "8px",
                                    cursor: "pointer",
                                    fontSize: "13px",
                                    textAlign: "left",
                                    transition: "background 0.2s",
                                }}
                                onMouseEnter={(e) => {
                                    if (currentLang !== lang.code) (e.target as HTMLElement).style.background = "var(--border, #333)";
                                }}
                                onMouseLeave={(e) => {
                                    if (currentLang !== lang.code) (e.target as HTMLElement).style.background = "transparent";
                                }}
                            >
                                <span>{lang.flag}</span>
                                <span style={{ flex: 1 }}>{lang.label}</span>
                                {currentLang === lang.code && <span>✓</span>}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* Mic Button */}
            <button
                type="button"
                onClick={toggleListening}
                disabled={disabled || isTranscribing}
                title={isListening ? "Stop listening" : isTranscribing ? "Transcribing..." : "Tap to speak"}
                style={{
                    position: "relative",
                    width: `${size + 20}px`,
                    height: `${size + 20}px`,
                    borderRadius: "50%",
                    border: "none",
                    cursor: disabled || isTranscribing ? "not-allowed" : "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: isListening
                        ? "linear-gradient(135deg, #ef4444, #dc2626)"
                        : isTranscribing
                            ? "linear-gradient(135deg, #f59e0b, #d97706)"
                            : "transparent",
                    color: isListening || isTranscribing ? "white" : "var(--muted, #888)",
                    transition: "all 0.3s ease",
                    outline: "none",
                    opacity: disabled ? 0.4 : 1,
                    zIndex: 1,
                }}
            >
                {/* Pulsing Ring */}
                {isListening && (
                    <>
                        <span style={{
                            position: "absolute",
                            inset: `-${4 + audioLevel * 8}px`,
                            borderRadius: "50%",
                            border: "2px solid #ef4444",
                            opacity: 0.6 - audioLevel * 0.3,
                            animation: "voice-pulse 1.5s ease-in-out infinite",
                            transition: "inset 0.1s ease",
                        }} />
                        <span style={{
                            position: "absolute",
                            inset: `-${8 + audioLevel * 14}px`,
                            borderRadius: "50%",
                            border: "1.5px solid #ef4444",
                            opacity: 0.3 - audioLevel * 0.15,
                            animation: "voice-pulse 1.5s ease-in-out infinite 0.3s",
                            transition: "inset 0.1s ease",
                        }} />
                    </>
                )}

                {/* Icon */}
                <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    {isTranscribing ? (
                        // Spinner dots
                        <>
                            <circle cx="12" cy="12" r="1" fill="currentColor" stroke="none"><animate attributeName="opacity" values="1;0.3;1" dur="1s" repeatCount="indefinite" /></circle>
                            <circle cx="7" cy="12" r="1" fill="currentColor" stroke="none"><animate attributeName="opacity" values="0.3;1;0.3" dur="1s" repeatCount="indefinite" /></circle>
                            <circle cx="17" cy="12" r="1" fill="currentColor" stroke="none"><animate attributeName="opacity" values="0.3;0.3;1" dur="1s" repeatCount="indefinite" /></circle>
                        </>
                    ) : isListening ? (
                        <rect x="6" y="6" width="12" height="12" rx="2" fill="currentColor" stroke="none" />
                    ) : (
                        <>
                            <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
                            <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                            <line x1="12" y1="19" x2="12" y2="22" />
                            <line x1="8" y1="22" x2="16" y2="22" />
                        </>
                    )}
                </svg>

                {/* Whisper badge for Firefox/Safari */}
                {showBadge && !isListening && !isTranscribing && (
                    <span style={{
                        position: "absolute",
                        bottom: "-2px",
                        right: "-2px",
                        fontSize: "7px",
                        background: "#f59e0b",
                        color: "white",
                        borderRadius: "4px",
                        padding: "1px 3px",
                        fontWeight: 800,
                        lineHeight: 1,
                        letterSpacing: "0.5px",
                    }}>AI</span>
                )}
            </button>

            {/* Live Transcript Bubble */}
            {(isListening || isTranscribing) && interimText && (
                <div style={{
                    position: "absolute",
                    bottom: "calc(100% + 12px)",
                    right: 0,
                    background: "var(--card-bg, #1a1a2e)",
                    border: `1px solid ${isTranscribing ? "#f59e0b" : "var(--accent, #4f46e5)"}`,
                    borderRadius: "12px",
                    padding: "10px 14px",
                    maxWidth: "320px",
                    minWidth: "180px",
                    fontSize: "13px",
                    color: "var(--foreground, #e0e0e0)",
                    boxShadow: "0 4px 20px rgba(0,0,0,0.3)",
                    zIndex: 100,
                    animation: "voice-fadeIn 0.2s ease",
                }}>
                    <div style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                        marginBottom: "6px",
                        fontSize: "10px",
                        textTransform: "uppercase",
                        letterSpacing: "1px",
                        color: isTranscribing ? "#f59e0b" : "#ef4444",
                        fontWeight: 700,
                    }}>
                        <span style={{
                            width: "6px",
                            height: "6px",
                            borderRadius: "50%",
                            background: isTranscribing ? "#f59e0b" : "#ef4444",
                            animation: "voice-blink 1s ease infinite",
                        }} />
                        {isTranscribing ? "Transcribing..." : "Listening..."}
                    </div>
                    <div style={{ lineHeight: 1.5 }}>{interimText}</div>
                    <div style={{
                        position: "absolute",
                        bottom: "-6px",
                        right: "20px",
                        width: "12px",
                        height: "12px",
                        background: "var(--card-bg, #1a1a2e)",
                        border: `1px solid ${isTranscribing ? "#f59e0b" : "var(--accent, #4f46e5)"}`,
                        borderTop: "none",
                        borderLeft: "none",
                        transform: "rotate(45deg)",
                    }} />
                </div>
            )}

            {/* Error Toast */}
            {error && (
                <div style={{
                    position: "absolute",
                    bottom: "calc(100% + 12px)",
                    right: 0,
                    background: "#7f1d1d",
                    border: "1px solid #ef4444",
                    borderRadius: "10px",
                    padding: "8px 12px",
                    fontSize: "12px",
                    color: "#fca5a5",
                    maxWidth: "260px",
                    zIndex: 100,
                    animation: "voice-fadeIn 0.2s ease",
                    cursor: "pointer",
                }} onClick={() => setError(null)}>
                    ⚠️ {error}
                </div>
            )}

            <style>{`
                @keyframes voice-pulse {
                    0%, 100% { transform: scale(1); opacity: 0.6; }
                    50% { transform: scale(1.15); opacity: 0.2; }
                }
                @keyframes voice-blink {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.3; }
                }
                @keyframes voice-fadeIn {
                    from { opacity: 0; transform: translateY(4px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `}</style>
        </div>
    );
}
