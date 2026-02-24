"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type VoiceStatus =
    | "idle"
    | "listening"
    | "processing"
    | "speaking"
    | "error";

interface UseVoiceOptions {
    language?: string;
    silenceTimeout?: number;
    useServerTranscribe?: boolean; // try server Whisper, fall back to browser if it fails
}

export function useVoice({
    language = "en-US",
    silenceTimeout = 3000,
    useServerTranscribe = true,
}: UseVoiceOptions = {}) {
    // Detect mobile to prefer server-side transcription (Whisper is much better on mobile than flaky browser STT)
    const [isMobileDevice, setIsMobileDevice] = useState(false);
    const [isFirefox, setIsFirefox] = useState(false);

    useEffect(() => {
        const ua = navigator.userAgent;
        setIsMobileDevice(/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua));
        setIsFirefox(ua.toLowerCase().includes("firefox"));
    }, []);
    const [status, setStatus] = useState<VoiceStatus>("idle");
    const [transcript, setTranscript] = useState("");
    const [isLive, setIsLive] = useState(false); // True for Browser STT, False for MediaRecorder fallback
    const [error, setError] = useState<string | null>(null);
    const [analyserNode, setAnalyserNode] = useState<AnalyserNode | null>(null);
    const [isPaused, setIsPaused] = useState(false);

    const recognitionRef = useRef<any>(null);
    const audioCtxRef = useRef<AudioContext | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const silenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const chunksRef = useRef<Blob[]>([]);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    // ─── Cleanup ──────────────────────────────────────────────────────────────
    const cleanupAudio = useCallback(() => {
        streamRef.current?.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
        if (audioCtxRef.current?.state !== "closed") {
            audioCtxRef.current?.close().catch(() => { });
        }
        audioCtxRef.current = null;
        setAnalyserNode(null);
        if (silenceTimerRef.current) {
            clearTimeout(silenceTimerRef.current);
            silenceTimerRef.current = null;
        }
    }, []);

    // ─── Analyser for waveform visualizer ────────────────────────────────────
    const setupAnalyser = useCallback(async (stream: MediaStream) => {
        try {
            const AC = window.AudioContext || (window as any).webkitAudioContext;
            const ctx = new AC();
            audioCtxRef.current = ctx;
            const src = ctx.createMediaStreamSource(stream);
            const analyser = ctx.createAnalyser();
            analyser.fftSize = 1024;
            analyser.smoothingTimeConstant = 0.8;
            src.connect(analyser);
            setAnalyserNode(analyser);
        } catch (e) {
            console.warn("[Voice] Analyser setup failed (non-fatal):", e);
        }
    }, []);

    // ─── Server-side Whisper transcription ───────────────────────────────────
    const transcribeWithServer = useCallback(
        async (audioBlob: Blob): Promise<string | null> => {
            try {
                const formData = new FormData();
                const ext = audioBlob.type.includes("ogg") ? "ogg" : audioBlob.type.includes("mp4") ? "m4a" : "webm";
                formData.append("audio", audioBlob, `recording.${ext}`);
                formData.append("language", language.split("-")[0]);

                const res = await fetch("/api/transcribe", {
                    method: "POST",
                    body: formData,
                });

                if (!res.ok) {
                    const err = await res.json().catch(() => ({}));
                    console.error("[Voice] Server transcription error:", err);
                    return null;
                }

                const data = await res.json();
                return (data.text ?? data.transcript ?? "").trim() || null;
            } catch (e) {
                console.error("[Voice] Server transcription failed:", e);
                return null;
            }
        },
        [language]
    );

    // ─── METHOD 1: Browser Web Speech API ────────────────────────────────────
    const startBrowserSTT = useCallback(async () => {
        setError(null);
        setTranscript("");

        const SpeechRecognitionAPI = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (!SpeechRecognitionAPI) return false;

        let micStream: MediaStream;
        try {
            micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        } catch (e: any) {
            console.error("[Voice] Mic access error:", e);
            setError(e?.name === "NotAllowedError" ? "Microphone access denied. Please allow mic in browser settings." : "Could not access microphone.");
            setStatus("error");
            return false; // Return false so startListening can try Method 2
        }

        streamRef.current = micStream;
        await setupAnalyser(micStream);

        const recognition = new SpeechRecognitionAPI();
        recognitionRef.current = recognition;
        recognition.lang = language;
        recognition.interimResults = true;
        recognition.continuous = true;

        recognition.onstart = () => {
            setStatus("listening");
            setIsLive(true);
        };
        recognition.onresult = (e: any) => {
            let finalText = "";
            let interimText = "";
            for (let i = 0; i < e.results.length; i++) {
                if (e.results[i].isFinal) finalText += e.results[i][0].transcript;
                else interimText += e.results[i][0].transcript;
            }

            // Update state so UI can show it
            const currentTranscript = finalText || interimText;
            if (currentTranscript) setTranscript(currentTranscript);

            // AUTO-STOP DISABLED: We wait for the user to click the Tick mark manually.
            /*
            if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
            silenceTimerRef.current = setTimeout(() => {
                recognition.stop();
            }, silenceTimeout);
            */
        };

        recognition.onend = () => {
            cleanupAudio();
            setStatus("idle");
        };

        recognition.onerror = () => {
            cleanupAudio();
            setStatus("error");
        };

        recognition.start();
        return true;
    }, [language, setupAnalyser, silenceTimeout]);

    // ─── METHOD 2: MediaRecorder + Server Whisper ────────────────────────────
    const startMediaRecorder = useCallback(async () => {
        setError(null);
        setTranscript("");

        let micStream: MediaStream;
        try {
            micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        } catch (e: any) {
            setError(e?.name === "NotAllowedError" ? "Microphone access denied. Please allow mic in browser settings." : "Could not access microphone.");
            setStatus("error");
            return;
        }

        streamRef.current = micStream;
        await setupAnalyser(micStream);

        const mimeType = ["audio/webm;codecs=opus", "audio/ogg;codecs=opus", "audio/webm", "audio/ogg", "audio/mp4", ""].find((t) => !t || MediaRecorder.isTypeSupported(t)) ?? "";
        const recorder = new MediaRecorder(micStream, mimeType ? { mimeType } : undefined);
        mediaRecorderRef.current = recorder;
        chunksRef.current = [];

        recorder.ondataavailable = (e) => { if (e.data?.size > 0) chunksRef.current.push(e.data); };
        recorder.onstop = async () => {
            cleanupAudio();
            const blob = new Blob(chunksRef.current, { type: mimeType || "audio/webm" });
            chunksRef.current = [];
            if (blob.size < 500) {
                setError("No audio captured. Please speak clearly.");
                setStatus("error");
                return;
            }
            const text = await transcribeWithServer(blob);
            if (text) {
                setTranscript(text);
                setStatus("idle");
            } else {
                setError("Transcription failed. Please try again.");
                setStatus("error");
            }
        };

        recorder.start(250);
        setStatus("listening");
        setIsLive(false);
        // Increased timeout to 2 minutes to ensure it waits for manual "Tick" click
        silenceTimerRef.current = setTimeout(() => { if (mediaRecorderRef.current?.state === "recording") mediaRecorderRef.current.stop(); }, 120000);
    }, [setupAnalyser, cleanupAudio, transcribeWithServer]);

    const startListening = useCallback(async () => {
        if (status === "listening" || status === "processing") return;

        // Detect native support
        const hasNative = !!((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition);

        // Firefox Desktop usually has no native recognition support enabled by default
        // Chrome and Safari (including Mobile) DO support it.
        const useNative = hasNative && !isFirefox;

        if (useNative) {
            const handled = await startBrowserSTT();
            if (!handled && useServerTranscribe) {
                await startMediaRecorder();
            }
        } else if (useServerTranscribe) {
            await startMediaRecorder();
        } else {
            setError("Voice recognition not supported in this browser.");
            setStatus("error");
        }
    }, [status, startBrowserSTT, startMediaRecorder, useServerTranscribe]);

    const stopListening = useCallback(async (): Promise<void> => {
        if (recognitionRef.current) {
            recognitionRef.current.stop();
            recognitionRef.current = null;
            cleanupAudio();
            setStatus("idle");
            return;
        }

        if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
            setStatus("processing");
            mediaRecorderRef.current.stop();
            // We do NOT call cleanupAudio here; the onstop handler does it
            // after the blob is processed to avoid cutting off the end.
        }
        else {
            cleanupAudio();
            setStatus("idle");
        }
    }, [cleanupAudio]);

    // ─── TTS ─────────────────────────────────────────────────────────────────
    const speak = useCallback(async (text: string): Promise<void> => {
        if (!text.trim()) return;
        setStatus("speaking");
        setIsPaused(false);

        try {
            const res = await fetch("/api/synthesize", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ text }),
            });
            if (!res.ok) throw new Error("Server TTS failed");

            const audioBlob = await res.blob();
            const url = URL.createObjectURL(audioBlob);
            const audio = new Audio(url);
            audioRef.current = audio;

            return new Promise((resolve) => {
                audio.onended = () => {
                    URL.revokeObjectURL(url);
                    audioRef.current = null;
                    setStatus("idle");
                    resolve();
                };
                audio.onerror = () => {
                    URL.revokeObjectURL(url);
                    audioRef.current = null;
                    speakWithBrowser(text).then(resolve);
                };
                audio.play().catch(() => speakWithBrowser(text).then(resolve));
            });
        } catch (e) {
            await speakWithBrowser(text);
            setStatus("idle");
        }
    }, []);

    const speakWithBrowser = (text: string): Promise<void> => {
        return new Promise((resolve) => {
            if (!window.speechSynthesis) return resolve();
            window.speechSynthesis.cancel();
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.onend = () => resolve();
            utterance.onerror = () => resolve();
            window.speechSynthesis.speak(utterance);
        });
    };

    const pauseSpeech = useCallback(() => {
        if (audioRef.current) {
            audioRef.current.pause();
            setIsPaused(true);
        } else if (window.speechSynthesis.speaking) {
            window.speechSynthesis.pause();
            setIsPaused(true);
        }
    }, []);

    const resumeSpeech = useCallback(() => {
        if (audioRef.current) {
            audioRef.current.play();
            setIsPaused(false);
        } else if (window.speechSynthesis.paused) {
            window.speechSynthesis.resume();
            setIsPaused(false);
        }
    }, []);

    const cancelSpeech = useCallback(() => {
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current = null;
        }
        window.speechSynthesis?.cancel();
        setStatus("idle");
        setIsPaused(false);
    }, []);

    useEffect(() => {
        return () => {
            cleanupAudio();
            if (audioRef.current) audioRef.current.pause();
            window.speechSynthesis?.cancel();
        };
    }, [cleanupAudio]);

    return {
        status,
        transcript,
        isLive,
        error,
        analyserNode,
        isPaused,
        startListening,
        stopListening,
        speak,
        pauseSpeech,
        resumeSpeech,
        cancelSpeech,
    };
}
