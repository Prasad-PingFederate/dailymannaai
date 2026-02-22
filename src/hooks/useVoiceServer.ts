"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { VoiceStatus } from "@/components/notebook/VoiceMode";
import type { VoiceName } from "@/services/voiceService";
import {
    cancelCurrentSpeech,
    playAudio,
    speakWithBrowser,
    startRecording,
    stopRecording,
    synthesizeWithServer,
    transcribeWithServer,
} from "@/services/voiceService";

interface UseVoiceServerOptions {
    voice?: VoiceName;
    speed?: number;
    language?: string;
    useServerTTS?: boolean;
    useServerSTT?: boolean;
}

export function useVoiceServer({
    voice = "shimmer",
    speed = 1.0,
    language = "en",
    useServerTTS = true,
    useServerSTT = true,
}: UseVoiceServerOptions = {}) {
    const [status, setStatus] = useState<VoiceStatus>("idle");
    const [transcript, setTranscript] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [analyserNode, setAnalyserNode] = useState<AnalyserNode | null>(null);

    const audioCtxRef = useRef<AudioContext | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const currentAudioRef = useRef<HTMLAudioElement | null>(null);

    const setupAnalyser = useCallback(async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            streamRef.current = stream;

            const AC = window.AudioContext || (window as any).webkitAudioContext;
            const ctx = new AC();
            audioCtxRef.current = ctx;

            const analyser = ctx.createAnalyser();
            analyser.fftSize = 1024;
            const src = ctx.createMediaStreamSource(stream);
            src.connect(analyser);

            setAnalyserNode(analyser);
        } catch {
            console.warn("Analyser setup failed");
        }
    }, []);

    const cleanupAudio = useCallback(() => {
        streamRef.current?.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
        if (audioCtxRef.current?.state !== "closed") {
            audioCtxRef.current?.close();
        }
        audioCtxRef.current = null;
        setAnalyserNode(null);
    }, []);

    const startListening = useCallback(async () => {
        setError(null);
        setTranscript("");
        setStatus("listening");

        try {
            await setupAnalyser();
            await startRecording();
        } catch (err) {
            setError("Mic access failed");
            setStatus("error");
        }
    }, [setupAnalyser]);

    const stopListening = useCallback(async () => {
        setStatus("processing");
        try {
            const audioBlob = await stopRecording();
            cleanupAudio();

            if (audioBlob.size < 1000) {
                setStatus("idle");
                setError("No audio detected.");
                return;
            }

            const result = await transcribeWithServer(audioBlob, language);
            if (result.transcript) {
                setTranscript(result.transcript);
            } else {
                setStatus("idle");
            }
        } catch (err) {
            setError("Transcription failed");
            setStatus("error");
            cleanupAudio();
        }
    }, [cleanupAudio, language]);

    const speak = useCallback(
        async (text: string) => {
            if (!text.trim()) return;
            setStatus("speaking");

            try {
                if (useServerTTS) {
                    const audioEl = await synthesizeWithServer(text, { voice, speed });
                    currentAudioRef.current = audioEl;
                    await playAudio(audioEl);
                } else {
                    await speakWithBrowser(text, { speed });
                }
                setStatus("idle");
            } catch {
                // Fallback to browser
                await speakWithBrowser(text, { speed });
                setStatus("idle");
            }
        },
        [useServerTTS, voice, speed]
    );

    const cancelSpeech = useCallback(() => {
        if (currentAudioRef.current) {
            currentAudioRef.current.pause();
            currentAudioRef.current = null;
        }
        cancelCurrentSpeech();
        setStatus("idle");
    }, []);

    useEffect(() => {
        return () => cleanupAudio();
    }, [cleanupAudio]);

    return {
        status,
        transcript,
        error,
        analyserNode,
        startListening,
        stopListening,
        speak,
        cancelSpeech,
    };
}
