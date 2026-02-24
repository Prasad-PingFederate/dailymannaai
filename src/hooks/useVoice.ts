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
    useServerTranscribe?: boolean;
    silenceTimeout?: number;
    onTranscriptionComplete?: (text: string) => void;
}

export function useVoice({
    language = "en-US",
    silenceTimeout = 3000,
    useServerTranscribe = true,
    onTranscriptionComplete,
}: UseVoiceOptions = {}) {
    const [isFirefox, setIsFirefox] = useState(false);

    useEffect(() => {
        const ua = navigator.userAgent;
        setIsFirefox(ua.toLowerCase().includes("firefox"));
    }, []);

    const [status, setStatus] = useState<VoiceStatus>("idle");
    const statusRef = useRef<VoiceStatus>("idle");
    const syncStatus = (s: VoiceStatus) => {
        setStatus(s);
        statusRef.current = s;
    };

    const [transcript, setTranscript] = useState("");
    const [isLive, setIsLive] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const isTranscribingRef = useRef(false);
    const [analyserNode, setAnalyserNode] = useState<AnalyserNode | null>(null);
    const [isPaused, setIsPaused] = useState(false);
    const accumulatedTranscriptRef = useRef("");
    const lastSessionFinalTextRef = useRef("");

    const recognitionRef = useRef<any>(null);
    const audioCtxRef = useRef<AudioContext | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const silenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const chunksRef = useRef<Blob[]>([]);
    const audioRef = useRef<HTMLAudioElement | null>(null);

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
            console.warn("[Voice] Analyser setup failed:", e);
        }
    }, []);

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

                if (!res.ok) return null;
                const data = await res.json();
                return (data.text ?? data.transcript ?? "").trim() || null;
            } catch (e) {
                return null;
            }
        },
        [language]
    );

    const startBrowserSTT = useCallback(async () => {
        setError(null);
        setTranscript("");
        accumulatedTranscriptRef.current = "";
        lastSessionFinalTextRef.current = "";

        const SpeechRecognitionAPI = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (!SpeechRecognitionAPI) return false;

        let micStream: MediaStream;
        try {
            micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        } catch (e: any) {
            setError("Could not access microphone.");
            syncStatus("error");
            return false;
        }

        streamRef.current = micStream;
        await setupAnalyser(micStream);

        const recognition = new SpeechRecognitionAPI();
        recognitionRef.current = recognition;
        recognition.lang = language;
        recognition.interimResults = true;
        recognition.continuous = true;

        recognition.onstart = () => {
            syncStatus("listening");
            setIsLive(true);
        };
        recognition.onresult = (e: any) => {
            let sessionFinal = "";
            let sessionInterim = "";
            for (let i = 0; i < e.results.length; i++) {
                const text = e.results[i][0].transcript;
                if (e.results[i].isFinal) sessionFinal += text + " ";
                else sessionInterim += text;
            }
            lastSessionFinalTextRef.current = sessionFinal;
            const fullText = (accumulatedTranscriptRef.current + " " + sessionFinal + sessionInterim).trim();
            if (fullText) setTranscript(fullText);
        };
        recognition.onend = () => {
            accumulatedTranscriptRef.current = (accumulatedTranscriptRef.current + " " + lastSessionFinalTextRef.current).trim();
            lastSessionFinalTextRef.current = "";
            if (statusRef.current === "listening" && recognitionRef.current) {
                try { recognitionRef.current.start(); } catch { cleanupAudio(); syncStatus("idle"); }
            } else {
                cleanupAudio();
                syncStatus("idle");
            }
        };
        recognition.onerror = () => { cleanupAudio(); syncStatus("error"); };
        recognition.start();
        return true;
    }, [language, setupAnalyser]);

    const startMediaRecorder = useCallback(async () => {
        setError(null);
        setTranscript("");

        let micStream: MediaStream;
        try {
            micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        } catch (e: any) {
            setError("Could not access microphone.");
            syncStatus("error");
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
                setError("No audio captured.");
                syncStatus("error");
                return;
            }
            if (isTranscribingRef.current) return;
            isTranscribingRef.current = true;

            const text = await transcribeWithServer(blob);
            if (text) {
                setTranscript(text);
                onTranscriptionComplete?.(text);
                syncStatus("idle");
            } else {
                setError("Transcription failed.");
                syncStatus("error");
            }
            isTranscribingRef.current = false;
        };

        recorder.start(250);
        setStatus("listening");
        setIsLive(false);
        silenceTimerRef.current = setTimeout(() => { if (mediaRecorderRef.current?.state === "recording") mediaRecorderRef.current.stop(); }, 120000);
    }, [setupAnalyser, cleanupAudio, transcribeWithServer, onTranscriptionComplete]);

    const startListening = useCallback(async () => {
        if (status === "listening" || status === "processing") return;
        if (useServerTranscribe) {
            await startMediaRecorder();
        } else {
            const hasNative = !!((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition);
            if (hasNative && !isFirefox) await startBrowserSTT();
            else { syncStatus("error"); }
        }
    }, [status, startBrowserSTT, startMediaRecorder, useServerTranscribe, isFirefox]);

    const stopListening = useCallback(async (): Promise<void> => {
        if (recognitionRef.current) {
            recognitionRef.current.stop();
            recognitionRef.current = null;
            cleanupAudio();
            syncStatus("idle");
            return;
        }
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
            syncStatus("processing");
            mediaRecorderRef.current.stop();
        } else {
            cleanupAudio();
            syncStatus("idle");
        }
    }, [cleanupAudio]);

    const speak = useCallback(async (text: string): Promise<void> => {
        if (!text.trim()) return;
        syncStatus("speaking");
        const res = await fetch("/api/synthesize", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ text }) });
        if (res.ok) {
            const audioBlob = await res.blob();
            const url = URL.createObjectURL(audioBlob);
            const audio = new Audio(url);
            audioRef.current = audio;
            return new Promise((resolve) => {
                audio.onended = () => { URL.revokeObjectURL(url); audioRef.current = null; syncStatus("idle"); resolve(); };
                audio.onerror = () => { URL.revokeObjectURL(url); audioRef.current = null; syncStatus("idle"); resolve(); };
                audio.play();
            });
        }
    }, []);

    const cancelSpeech = useCallback(() => {
        if (audioRef.current) { audioRef.current.pause(); audioRef.current = null; }
        window.speechSynthesis?.cancel();
        syncStatus("idle");
    }, []);

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
        cancelSpeech,
    };
}
