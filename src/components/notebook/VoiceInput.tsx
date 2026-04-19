"use client";

import React, { useState, useRef, useCallback, useEffect } from "react";
import { Mic, Square, X, Sparkles, Loader2, Settings2, RotateCcw, Download, Trash2, Globe, Volume2 } from "lucide-react";

interface VoiceInputProps {
    onTranscript: (text: string) => void;
    onInterimTranscript?: (text: string) => void;
    onListeningChange?: (isListening: boolean) => void;
    disabled?: boolean;
    className?: string;
    variant?: "default" | "minimal";
    language?: string;
    onLanguageChange?: (lang: string) => void;
    rate?: number;
    onRateChange?: (rate: number) => void;
    pitch?: number;
    onPitchChange?: (pitch: number) => void;
}

declare global {
    interface Window {
        webkitSpeechRecognition: any;
        SpeechRecognition: any;
    }
}

const SILENCE_MS = 1800;

type Status = "idle" | "ready" | "recording" | "transcribing";

export default function VoiceInput({
    onTranscript,
    onInterimTranscript,
    onListeningChange,
    disabled = false,
    className = "",
    variant = "default",
    language = "en-US",
    onLanguageChange,
    rate = 1.0,
    onRateChange,
    pitch = 1.0,
    onPitchChange,
}: VoiceInputProps) {
    const [status, setStatus] = useState<Status>("idle");
    const [error, setError] = useState<string | null>(null);
    const [interimText, setInterimText] = useState("");
    const [finalText, setFinalText] = useState("");
    const [audioLevel, setAudioLevel] = useState(0);
    const [showSettings, setShowSettings] = useState(false);
    const analyserRef = useRef<AnalyserNode | null>(null);
    const audioCtxRef = useRef<AudioContext | null>(null);

    // Audio analysis for waveform
    useEffect(() => {
        let animationFrame: number;
        const dataArray = new Uint8Array(128);

        const updateLevel = () => {
            if (status === "recording" && analyserRef.current) {
                analyserRef.current.getByteFrequencyData(dataArray);
                let sum = 0;
                for (let i = 0; i < dataArray.length; i++) sum += dataArray[i];
                setAudioLevel(sum / dataArray.length);
                animationFrame = requestAnimationFrame(updateLevel);
            } else {
                setAudioLevel(0);
            }
        };

        if (status === "recording") {
            updateLevel();
        }
        return () => cancelAnimationFrame(animationFrame);
    }, [status]);

    const statusRef = useRef<Status>("idle");
    const finalTextRef = useRef("");           // Web Speech accumulator (fallback)
    const recognitionRef = useRef<any>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const recorderRef = useRef<MediaRecorder | null>(null);
    const chunksRef = useRef<Blob[]>([]);
    const mimeTypeRef = useRef<string>("");
    const silenceTimerRef = useRef<NodeJS.Timeout | null>(null);
    const cancelledRef = useRef(false);

    const setStatusBoth = (s: Status) => { statusRef.current = s; setStatus(s); };

    // ── Init ─────────────────────────────────────────────────────────────────
    useEffect(() => { setStatusBoth("ready"); }, []);

    // ── Error auto-dismiss ────────────────────────────────────────────────────
    useEffect(() => {
        if (!error) return;
        const t = setTimeout(() => setError(null), 4500);
        return () => clearTimeout(t);
    }, [error]);

    // ── Helpers ───────────────────────────────────────────────────────────────
    const clearSilenceTimer = () => {
        if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
        silenceTimerRef.current = null;
    };

    const stopTracks = () => {
        streamRef.current?.getTracks().forEach(t => t.stop());
        streamRef.current = null;
        if (audioCtxRef.current?.state !== "closed") {
            audioCtxRef.current?.close();
        }
        audioCtxRef.current = null;
        analyserRef.current = null;
    };

    const killRecognition = () => {
        const r = recognitionRef.current;
        if (!r) return;
        r.onresult = null; r.onerror = null; r.onend = null;
        try { r.stop(); } catch { }
        recognitionRef.current = null;
    };

    const resetDisplay = () => {
        setInterimText(""); setFinalText("");
        finalTextRef.current = ""; chunksRef.current = [];
    };

    // ── Deliver final result ──────────────────────────────────────────────────
    const deliver = useCallback((text: string, source: "api" | "browser") => {
        console.log(`[Voice] Delivered via ${source}`);
        onTranscript(text.trim());
        onInterimTranscript?.("");
        onListeningChange?.(false);
        resetDisplay();
        setStatusBoth("ready");
    }, [onTranscript, onInterimTranscript, onListeningChange]);

    // ── API waterfall (Deepgram → AssemblyAI → Whisper) ──────────────────────
    const sendToApi = useCallback(async (): Promise<string | null> => {
        const mime = mimeTypeRef.current || "audio/webm";
        const blob = new Blob(chunksRef.current, { type: mime });
        if (blob.size < 500) return null;

        const fd = new FormData();
        const ext = mime.includes("mp4") ? "m4a" : mime.includes("ogg") ? "ogg" : "webm";
        fd.append("audio", blob, `recording.${ext}`);

        const controller = new AbortController();
        const tid = setTimeout(() => controller.abort(), 20_000);

        try {
            const res = await fetch("/api/transcribe", {
                method: "POST",
                body: fd,
                signal: controller.signal,
            });
            clearTimeout(tid);
            if (!res.ok) return null;
            const data = await res.json();
            return data?.text?.trim() || null;
        } catch {
            clearTimeout(tid);
            return null;
        }
    }, []);

    // ── Main stop (cancel = true means discard everything) ────────────────────
    const stopRecording = useCallback(async (cancel = false) => {
        if (statusRef.current !== "recording") return;
        cancelledRef.current = cancel;
        clearSilenceTimer();
        killRecognition();

        // Stop recorder — onstop will handle the rest
        if (recorderRef.current?.state === "recording") {
            recorderRef.current.stop();  // triggers onstop async flow
        } else {
            stopTracks();
            if (!cancel) {
                // Edge: recorder never started — use browser fallback directly
                const txt = finalTextRef.current.trim();
                if (txt) deliver(txt, "browser");
                else { setError("Nothing captured."); setStatusBoth("ready"); onListeningChange?.(false); }
            } else {
                resetDisplay();
                setStatusBoth("ready");
                onListeningChange?.(false);
            }
        }
    }, [deliver, onListeningChange]);

    // ── Start ─────────────────────────────────────────────────────────────────
    const startRecording = async () => {
        setError(null);
        resetDisplay();
        cancelledRef.current = false;

        // ── 0. Secure Context & Support Check ────────────────────────────────
        if (typeof window !== 'undefined' && !window.isSecureContext && window.location && window.location.hostname !== "localhost") {
            setError("Voice input requires a secure (HTTPS) connection.");
            console.error("[Voice] Not a secure context. Mic access will be denied.");
            return;
        }

        if (!navigator?.mediaDevices?.getUserMedia) {
            setError("Mic access is not supported in this browser.");
            console.error("[Voice] navigator.mediaDevices.getUserMedia is undefined.");
            return;
        }

        let audioStream: MediaStream;
        try {
            console.log("[Voice] Requesting microphone access...");
            audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
            streamRef.current = audioStream;
            console.log("[Voice] Microphone access granted.");

            // Setup Analyser
            const AC = window.AudioContext || (window as any).webkitAudioContext;
            const ctx = new AC();
            audioCtxRef.current = ctx;
            const src = ctx.createMediaStreamSource(audioStream);
            const analyser = ctx.createAnalyser();
            analyser.fftSize = 256;
            src.connect(analyser);
            analyserRef.current = analyser;

        } catch (err: any) {
            console.error("[Voice] Microhone Error:", err);
            if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
                setError("Microphone permission denied.");
            } else if (err.name === "NotFoundError" || err.name === "DevicesNotFoundError") {
                setError("No microphone found.");
            } else {
                setError("Could not access microphone.");
            }
            return;
        }

        // ── 1. MediaRecorder: captures audio for API submission ───────────────
        const supportedTypes = [
            "audio/webm;codecs=opus", 
            "audio/ogg;codecs=opus", 
            "audio/webm", 
            "audio/ogg", 
            "audio/mp4",
            ""
        ];
        const bestType = supportedTypes.find(t => !t || MediaRecorder.isTypeSupported(t)) ?? "";
        
        let recorder: MediaRecorder;
        try {
            recorder = new MediaRecorder(audioStream, bestType ? { mimeType: bestType } : undefined);
        } catch (err) {
            console.warn("[Voice] MediaRecorder fallback init", err);
            recorder = new MediaRecorder(audioStream);
        }
        
        recorderRef.current = recorder;
        mimeTypeRef.current = recorder.mimeType || bestType;

        recorder.ondataavailable = (e) => {
            if (e.data.size > 0) chunksRef.current.push(e.data);
        };

        recorder.onstop = async () => {
            stopTracks();

            if (cancelledRef.current) {
                resetDisplay();
                setStatusBoth("ready");
                onListeningChange?.(false);
                return;
            }

            setStatusBoth("transcribing");

            // ── PRIMARY: Try API waterfall ────────────────────────────────────
            const apiResult = await sendToApi();

            if (apiResult) {
                deliver(apiResult, "api");
                return;
            }

            // ── FALLBACK: Use browser Web Speech result ───────────────────────
            console.warn("[Voice] All APIs failed — using browser Web Speech fallback");
            const browserResult = finalTextRef.current.trim();
            if (browserResult) {
                deliver(browserResult, "browser");
            } else {
                setError("Could not transcribe. Please try again.");
                setStatusBoth("ready");
                onListeningChange?.(false);
            }
        };

        recorder.start(200); // chunk every 200ms

        // ── 2. Web Speech API: runs silently in parallel as fallback ──────────
        const SpeechRecognition = typeof window !== 'undefined' ? ((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition) : null;
        if (SpeechRecognition) {
            const recognition = new SpeechRecognition();
            recognition.continuous = true;
            recognition.interimResults = true;
            recognition.lang = language;

            recognition.onresult = (event: any) => {
                let interim = "";
                for (let i = event.resultIndex; i < event.results.length; i++) {
                    const t = event.results[i][0].transcript;
                    if (event.results[i].isFinal) {
                        finalTextRef.current += t + " ";
                        setFinalText(finalTextRef.current);
                    } else {
                        interim += t;
                    }
                }

                const display = finalTextRef.current + interim;
                setInterimText(display);
                onInterimTranscript?.(display);

                // Reset silence timer on every speech event
                if (display.trim()) {
                    clearSilenceTimer();
                    silenceTimerRef.current = setTimeout(
                        () => stopRecording(false),
                        SILENCE_MS
                    );
                }
            };

            recognition.onerror = (e: any) => {
                if (e.error !== "no-speech") console.warn("[Voice] Recognition:", e.error);
            };

            // Chrome kills recognition after ~60s — restart loop
            recognition.onend = () => {
                if (statusRef.current === "recording" && recognitionRef.current) {
                    try { recognition.start(); } catch { }
                }
            };

            recognition.start();
            recognitionRef.current = recognition;
        }

        setStatusBoth("recording");
        onListeningChange?.(true);

        // Initial silence guard (catches mic-open-then-nothing)
        silenceTimerRef.current = setTimeout(() => stopRecording(false), 10_000);

    };

    // ─────────────────────────────────────────────────────────────────────────
    if (status === "idle") return null;

    const isRecording = status === "recording";
    const isTranscribing = status === "transcribing";

    return (
        <div className={`relative flex items-center ${className}`}>

            {/* ── Mic / Loader Button ──────────────────────────────────────── */}
            <button
                type="button"
                onClick={() => {
                    if (isRecording) stopRecording(false);
                    else if (!isTranscribing) startRecording();
                }}
                disabled={isTranscribing || disabled}
                aria-label={isRecording ? "Stop recording" : "Start voice input"}
                className={`
                    group relative flex items-center justify-center rounded-full
                    transition-all duration-200 z-50 focus-visible:ring-2 focus-visible:ring-teal
                    ${variant === "minimal" ? "w-8 h-8" : "w-11 h-11"}
                    ${isRecording
                        ? "bg-red-500 shadow-[0_0_22px_rgba(239,68,68,0.45)] scale-110"
                        : isTranscribing
                            ? "bg-teal-500/20 opacity-60 cursor-wait"
                            : variant === "minimal" 
                                ? "text-teal-600 hover:text-teal-700 bg-transparent hover:bg-teal-500/5 shadow-none border-none" 
                                : "bg-teal-500/10 hover:bg-teal-500/20 border border-teal-500/20 text-teal-600 hover:scale-105"
                    }
                `}
            >
                {isTranscribing
                    ? <Loader2 className={variant === "minimal" ? "w-3.5 h-3.5 animate-spin text-teal-600" : "w-4 h-4 animate-spin text-teal-600"} />
                    : isRecording
                        ? <Square className={variant === "minimal" ? "w-3 h-3 fill-white text-white" : "w-4 h-4 fill-white text-white"} />
                        : <Mic className={variant === "minimal" ? "w-4 h-4 group-hover:scale-110 transition-transform" : "w-5 h-5 group-hover:scale-110 transition-transform"} />
                }
                {isRecording && (
                    <span className="absolute inset-0 rounded-full bg-red-400/25 animate-ping -z-10" />
                )}
            </button>

            {/* ── Recording Drawer ─────────────────────────────────────────── */}
            {isRecording && (
                <div
                    role="dialog"
                    aria-label="Voice recording"
                    className="fixed inset-x-0 bottom-0 z-[9999] flex flex-col items-center
                               animate-in slide-in-from-bottom duration-300 ease-out"
                >
                    {/* Backdrop - World-class glassmorphism */}
                    <div className="absolute inset-x-0 bottom-0 h-[48vh] bg-slate-900/90 md:bg-black/85
                                    backdrop-blur-3xl -z-10 shadow-[0_-20px_80px_rgba(0,0,0,0.5)] border-t border-white/5" />

                    <div className="w-full max-w-3xl mx-auto flex flex-col items-center
                                    px-6 pb-10 gap-5">

                        {/* Status pill */}
                        <div className="flex items-center gap-2 px-5 py-1.5 rounded-full
                                        bg-accent/8 border border-accent/12 shadow-sm">
                            <Sparkles className="w-3.5 h-3.5 text-accent animate-pulse" />
                            <span className="text-[10px] font-bold tracking-[0.18em] uppercase text-foreground/60">
                                Listening
                            </span>
                        </div>

                        {/* Live transcript - World-class visibility container */}
                        <div className="w-full min-h-[110px] max-h-[180px] overflow-y-auto 
                                        bg-white/[0.04] border border-white/[0.09] rounded-2xl
                                        p-5 md:p-6 flex items-center justify-center
                                        scrollbar-thin scrollbar-thumb-amber-500/40 scrollbar-track-transparent">
                            {interimText ? (
                                <p className="font-serif text-xl md:text-2xl leading-relaxed text-center text-[#f0ede5]">
                                    <span className="drop-shadow-[0_0_12px_rgba(240,237,229,0.3)]">
                                        {finalText}
                                    </span>
                                    {interimText && (
                                        <span className="text-[#c8960ab3] italic ml-1">
                                            {interimText.slice(finalText.length)}
                                        </span>
                                    )}
                                    <span className="inline-block w-[2px] h-6 md:h-7 bg-[#c8960a]
                                                     ml-2 align-middle rounded-full
                                                     animate-[blink_1s_step-end_infinite]
                                                     shadow-[0_0_12px_rgba(200,150,10,0.5)]" />
                                </p>
                            ) : (
                                <p className="text-base md:text-lg font-serif italic text-white/25 select-none animate-pulse text-center">
                                    Start speaking…
                                </p>
                            )}
                        </div>

                        {/* Animated waveform text - World-class reactive animation */}
                        <div className="flex items-center gap-[5px] h-[52px]" aria-hidden="true">
                            {Array.from({ length: 24 }).map((_, i) => {
                                // Real volume reactiveness + some variation
                                const h = isRecording 
                                    ? 6 + (audioLevel * 0.8) + (Math.sin(i * 0.8) * 12 * (audioLevel / 20))
                                    : 4;
                                return (
                                    <div
                                        key={i}
                                        className="w-1 rounded-full transition-all duration-[40ms]"
                                        style={{
                                            height: `${Math.min(48, Math.max(4, h))}px`,
                                            background: isRecording
                                                ? `hsl(${38 + i * 4}, 92%, ${52 + Math.min(20, audioLevel/5)}%)`
                                                : "rgba(255,255,255,0.2)",
                                            boxShadow: isRecording && audioLevel > 10 ? `0 0 15px hsl(${38 + i * 4}, 92%, 52%, 0.4)` : "none"
                                        }}
                                    />
                                );
                            })}
                        </div>

                        {/* Controls */}
                        <div className="w-full flex justify-center items-center gap-16 md:gap-28
                                        pt-3 border-t border-accent/10">

                            {/* Cancel */}
                            <button
                                onClick={() => stopRecording(true)}
                                className="flex flex-col items-center gap-1.5 group"
                                aria-label="Cancel"
                            >
                                <div className="p-3.5 rounded-full border border-accent/15 bg-accent/5
                                                group-hover:bg-red-500/10 group-hover:border-red-400/30
                                                transition-all duration-200">
                                    <X className="w-5 h-5 text-foreground/40
                                                  group-hover:text-red-400 transition-colors" />
                                </div>
                                <span className="text-[9px] uppercase tracking-[0.2em] font-bold
                                                 text-foreground/30 group-hover:text-red-400/70 transition-colors">
                                    Cancel
                                </span>
                            </button>

                            {/* Settings Toggle */}
                            <button
                                onClick={() => setShowSettings(!showSettings)}
                                className="flex flex-col items-center gap-1.5 group"
                                aria-label="Voice settings"
                            >
                                <div className={`p-3.5 rounded-full border transition-all duration-200 ${showSettings ? 'bg-accent/20 border-accent/40' : 'border-accent/15 bg-accent/5 hover:bg-accent/10'}`}>
                                    <Settings2 className={`w-5 h-5 ${showSettings ? 'text-accent' : 'text-foreground/40 group-hover:text-accent'} transition-colors`} />
                                </div>
                                <span className={`text-[9px] uppercase tracking-[0.2em] font-bold transition-colors ${showSettings ? 'text-accent' : 'text-foreground/30 group-hover:text-accent'}`}>
                                    Settings
                                </span>
                            </button>

                            {/* Done */}
                            <button
                                onClick={() => stopRecording(false)}
                                className="flex flex-col items-center gap-1.5 group"
                                aria-label="Submit recording"
                            >
                                <div className="p-6 md:p-7 rounded-full bg-accent text-white
                                                shadow-[0_0_40px_rgba(200,151,58,0.35)]
                                                transition-all duration-200
                                                group-hover:scale-105 group-active:scale-95">
                                    <Square className="w-8 h-8 md:w-10 md:h-10 fill-white" />
                                </div>
                                <span className="text-[9px] md:text-[10px] uppercase tracking-[0.2em]
                                                 font-bold text-accent">
                                    Done
                                </span>
                            </button>
                        </div>

                        {/* Settings Overlay - Slide down */}
                        {showSettings && (
                            <div className="w-full max-w-sm mt-4 p-5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md animate-in slide-in-from-top-2 duration-200">
                                <div className="grid grid-cols-1 gap-5">
                                    {/* Language */}
                                    <div className="flex flex-col gap-2">
                                        <label className="flex items-center gap-2 text-[10px] uppercase tracking-wider font-bold text-accent">
                                            <Globe className="w-3 h-3" /> Language
                                        </label>
                                        <select 
                                            value={language}
                                            onChange={(e) => onLanguageChange?.(e.target.value)}
                                            className="bg-black/40 border border-white/10 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-accent"
                                        >
                                            <option value="en-US">English (US)</option>
                                            <option value="en-GB">English (UK)</option>
                                            <option value="en-IN">English (India)</option>
                                            <option value="hi-IN">Hindi (हिंदी)</option>
                                            <option value="te-IN">Telugu (తెలుగు)</option>
                                            <option value="ta-IN">Tamil (தமிழ்)</option>
                                            <option value="kn-IN">Kannada (ಕನ್ನಡ)</option>
                                            <option value="ml-IN">Malayalam (മലയാളം)</option>
                                            <option value="es-ES">Spanish</option>
                                            <option value="fr-FR">French</option>
                                            <option value="de-DE">German</option>
                                            <option value="it-IT">Italian</option>
                                        </select>
                                    </div>

                                    {/* Rate */}
                                    <div className="flex flex-col gap-2">
                                        <label className="flex items-center justify-between text-[10px] uppercase tracking-wider font-bold text-accent">
                                            <span className="flex items-center gap-2"><Volume2 className="w-3 h-3" /> Speech Rate</span>
                                            <span>{rate.toFixed(1)}x</span>
                                        </label>
                                        <input 
                                            type="range" min="0.5" max="2.0" step="0.1" value={rate}
                                            onChange={(e) => onRateChange?.(parseFloat(e.target.value))}
                                            className="accent-accent"
                                        />
                                    </div>
                                    
                                    {/* Pitch */}
                                    <div className="flex flex-col gap-2">
                                        <label className="flex items-center justify-between text-[10px] uppercase tracking-wider font-bold text-accent">
                                            <span className="flex items-center gap-2"><Sparkles className="w-3 h-3" /> Pitch</span>
                                            <span>{pitch.toFixed(1)}</span>
                                        </label>
                                        <input 
                                            type="range" min="0.5" max="2.0" step="0.1" value={pitch}
                                            onChange={(e) => onPitchChange?.(parseFloat(e.target.value))}
                                            className="accent-accent"
                                        />
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Transcribing hint */}
            {isTranscribing && (
                <span className="ml-3 text-xs text-foreground/50 animate-pulse select-none">
                    Transcribing…
                </span>
            )}

            {/* Error toast */}
            {error && (
                <button
                    onClick={() => setError(null)}
                    aria-live="assertive"
                    className="fixed bottom-28 left-1/2 -translate-x-1/2 z-[10003]
                               bg-red-600 text-white text-[11px] font-bold py-2.5 px-5
                               rounded-full shadow-2xl cursor-pointer whitespace-nowrap
                               animate-in slide-in-from-bottom-2 duration-200
                               hover:bg-red-700 transition-colors"
                >
                    ⚠️ {error}
                </button>
            )}

            <style>{`
                @keyframes voiceBar {
                    from { transform: scaleY(0.35); opacity: 0.4; }
                    to   { transform: scaleY(1);    opacity: 1;   }
                }
                @keyframes blink {
                    0%, 100% { opacity: 1; }
                    50%      { opacity: 0; }
                }
            `}</style>
        </div>
    );
}
