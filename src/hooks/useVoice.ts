"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { VoiceStatus } from "@/components/notebook/VoiceMode";

interface UseVoiceOptions {
    language?: string;
    voiceName?: string;
    speed?: number;
}

export function useVoice({
    language = "en-US",
    voiceName,
    speed = 1.0,
}: UseVoiceOptions = {}) {
    const [status, setStatus] = useState<VoiceStatus>("idle");
    const [transcript, setTranscript] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [analyserNode, setAnalyserNode] = useState<AnalyserNode | null>(null);

    const recognitionRef = useRef<any>(null);
    const audioCtxRef = useRef<AudioContext | null>(null);
    const streamRef = useRef<MediaStream | null>(null);

    // Setup audio analysis for visualizer
    const setupAnalyser = useCallback(async () => {
        try {
            if (audioCtxRef.current) return;

            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            streamRef.current = stream;

            const AC = window.AudioContext || (window as any).webkitAudioContext;
            const ctx = new AC();
            audioCtxRef.current = ctx;

            const analyser = ctx.createAnalyser();
            analyser.fftSize = 1024;
            analyser.smoothingTimeConstant = 0.8;

            const source = ctx.createMediaStreamSource(stream);
            source.connect(analyser);

            setAnalyserNode(analyser);
        } catch (err) {
            console.warn("Audio analyser setup failed", err);
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

    // Web Speech API - Recognition
    const startListening = useCallback(async () => {
        const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

        if (!SR) {
            setError("Speech recognition not supported in this browser.");
            setStatus("error");
            return;
        }

        try {
            await setupAnalyser();

            const recognition = new SR();
            recognitionRef.current = recognition;
            recognition.lang = language;
            recognition.interimResults = false;
            recognition.continuous = false;

            recognition.onstart = () => {
                setStatus("listening");
                setError(null);
                setTranscript("");
            };

            recognition.onresult = (event: any) => {
                const text = event.results[0][0].transcript;
                setTranscript(text);
                setStatus("processing");
            };

            recognition.onerror = (event: any) => {
                setError(event.error);
                setStatus("error");
                cleanupAudio();
            };

            recognition.onend = () => {
                if (status === "listening") setStatus("idle");
                cleanupAudio();
            };

            recognition.start();
        } catch (err) {
            setError("Microphone access denied.");
            setStatus("error");
        }
    }, [language, setupAnalyser, cleanupAudio, status]);

    const stopListening = useCallback(() => {
        recognitionRef.current?.stop();
    }, []);

    // Web Speech API - Synthesis (TTS)
    const speak = useCallback(
        async (text: string) => {
            if (!window.speechSynthesis) return;

            return new Promise<void>((resolve) => {
                window.speechSynthesis.cancel();
                const utterance = new SpeechSynthesisUtterance(text);
                utterance.lang = language;
                utterance.rate = speed;

                if (voiceName) {
                    const voices = window.speechSynthesis.getVoices();
                    const voice = voices.find((v) => v.name.includes(voiceName));
                    if (voice) utterance.voice = voice;
                }

                utterance.onstart = () => setStatus("speaking");
                utterance.onend = () => {
                    setStatus("idle");
                    resolve();
                };
                utterance.onerror = () => {
                    setStatus("idle");
                    resolve();
                };

                window.speechSynthesis.speak(utterance);
            });
        },
        [language, voiceName, speed]
    );

    const cancelSpeech = useCallback(() => {
        window.speechSynthesis?.cancel();
        setStatus("idle");
    }, []);

    useEffect(() => {
        return () => {
            cleanupAudio();
            window.speechSynthesis?.cancel();
        };
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
