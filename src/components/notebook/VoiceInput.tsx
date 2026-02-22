"use client";

import React, { useState, useRef, useCallback, useEffect } from "react";

// ─── Types ───────────────────────────────────────────────────────
interface VoiceInputProps {
    onTranscript: (text: string) => void;      // Called with final transcript text
    onInterimTranscript?: (text: string) => void; // Called with live partial text
    onListeningChange?: (isListening: boolean) => void;
    disabled?: boolean;
    className?: string;
    size?: number;  // icon size
    language?: string; // default language code
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
export function isSpeechRecognitionSupported(): boolean {
    if (typeof window === "undefined") return false;
    return !!(window.SpeechRecognition || window.webkitSpeechRecognition);
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
    const [isSupported, setIsSupported] = useState(true);

    const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const analyserRef = useRef<AnalyserNode | null>(null);
    const animFrameRef = useRef<number>(0);
    const langPickerRef = useRef<HTMLDivElement>(null);
    const finalTranscriptRef = useRef("");

    // Check support on mount
    useEffect(() => {
        setIsSupported(isSpeechRecognitionSupported());
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

    // Audio level visualization
    const startAudioVisualization = useCallback(async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
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
                setAudioLevel(Math.min(avg / 128, 1)); // normalize 0-1
                animFrameRef.current = requestAnimationFrame(updateLevel);
            }
            updateLevel();
        } catch {
            // Microphone access denied or not available — visualization just won't show
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

    // Start Listening
    const startListening = useCallback(() => {
        if (!isSpeechRecognitionSupported()) {
            setError("Voice input not supported in this browser. Try Chrome or Edge.");
            return;
        }

        setError(null);
        finalTranscriptRef.current = "";

        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        const recognition = new SpeechRecognition();

        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = currentLang;
        recognition.maxAlternatives = 1;

        recognition.onstart = () => {
            setIsListening(true);
            onListeningChange?.(true);
            startAudioVisualization();
        };

        recognition.onresult = (event: SpeechRecognitionEvent) => {
            let interim = "";
            let final = "";

            for (let i = event.resultIndex; i < event.results.length; i++) {
                const result = event.results[i];
                const transcript = result[0].transcript;
                if (result.isFinal) {
                    final += transcript;
                } else {
                    interim += transcript;
                }
            }

            if (final) {
                finalTranscriptRef.current += final;
            }

            const fullInterim = finalTranscriptRef.current + interim;
            setInterimText(fullInterim);
            onInterimTranscript?.(fullInterim);
        };

        recognition.onerror = (event) => {
            console.error("[VoiceInput] Error:", event.error);
            if (event.error === "not-allowed") {
                setError("Microphone access denied. Please allow microphone in browser settings.");
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

            // Send final transcript
            const finalText = finalTranscriptRef.current.trim();
            if (finalText) {
                onTranscript(finalText);
            }
            setInterimText("");
            finalTranscriptRef.current = "";
        };

        recognitionRef.current = recognition;

        try {
            recognition.start();
        } catch (e: any) {
            setError("Could not start voice recognition. Try again.");
            console.error("[VoiceInput] Start error:", e);
        }
    }, [currentLang, onTranscript, onInterimTranscript, onListeningChange, startAudioVisualization, stopAudioVisualization]);

    // Stop Listening
    const stopListening = useCallback(() => {
        if (recognitionRef.current) {
            recognitionRef.current.stop();
            recognitionRef.current = null;
        }
        stopAudioVisualization();
        setIsListening(false);
        onListeningChange?.(false);
    }, [onListeningChange, stopAudioVisualization]);

    // Toggle
    const toggleListening = useCallback(() => {
        if (isListening) {
            stopListening();
        } else {
            startListening();
        }
    }, [isListening, startListening, stopListening]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (recognitionRef.current) {
                recognitionRef.current.abort();
            }
            stopAudioVisualization();
        };
    }, [stopAudioVisualization]);

    if (!isSupported) return null; // Don't render on unsupported browsers

    const currentLangData = VOICE_LANGUAGES.find(l => l.code === currentLang) || VOICE_LANGUAGES[0];

    return (
        <div className={`voice-input-container ${className}`} style={{ position: "relative", display: "inline-flex", alignItems: "center", gap: "4px" }}>
            {/* Language Selector (tiny flag button) */}
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

                {/* Language Dropdown */}
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
                disabled={disabled}
                title={isListening ? "Stop listening" : "Tap to speak"}
                style={{
                    position: "relative",
                    width: `${size + 20}px`,
                    height: `${size + 20}px`,
                    borderRadius: "50%",
                    border: "none",
                    cursor: disabled ? "not-allowed" : "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: isListening
                        ? "linear-gradient(135deg, #ef4444, #dc2626)"
                        : "transparent",
                    color: isListening ? "white" : "var(--muted, #888)",
                    transition: "all 0.3s ease",
                    outline: "none",
                    opacity: disabled ? 0.4 : 1,
                    zIndex: 1,
                }}
            >
                {/* Pulsing Ring Animation (when listening) */}
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

                {/* Mic Icon */}
                <svg
                    width={size}
                    height={size}
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                >
                    {isListening ? (
                        // Stop/Square icon when recording
                        <rect x="6" y="6" width="12" height="12" rx="2" fill="currentColor" stroke="none" />
                    ) : (
                        // Microphone icon
                        <>
                            <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
                            <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                            <line x1="12" y1="19" x2="12" y2="22" />
                            <line x1="8" y1="22" x2="16" y2="22" />
                        </>
                    )}
                </svg>
            </button>

            {/* Live Transcript Bubble (appears above when listening) */}
            {isListening && interimText && (
                <div style={{
                    position: "absolute",
                    bottom: "calc(100% + 12px)",
                    right: 0,
                    background: "var(--card-bg, #1a1a2e)",
                    border: "1px solid var(--accent, #4f46e5)",
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
                        color: "#ef4444",
                        fontWeight: 700,
                    }}>
                        <span style={{
                            width: "6px",
                            height: "6px",
                            borderRadius: "50%",
                            background: "#ef4444",
                            animation: "voice-blink 1s ease infinite",
                        }} />
                        Listening...
                    </div>
                    <div style={{ lineHeight: 1.5 }}>{interimText}</div>
                    {/* Arrow pointer */}
                    <div style={{
                        position: "absolute",
                        bottom: "-6px",
                        right: "20px",
                        width: "12px",
                        height: "12px",
                        background: "var(--card-bg, #1a1a2e)",
                        border: "1px solid var(--accent, #4f46e5)",
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
                }}
                    onClick={() => setError(null)}
                >
                    ⚠️ {error}
                </div>
            )}

            {/* CSS Animations */}
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
