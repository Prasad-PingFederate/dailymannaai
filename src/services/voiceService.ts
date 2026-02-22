/**
 * voiceService.ts — DailyMannaAI Voice API Client
 *
 * Handles server-side STT (Whisper) and TTS (OpenAI).
 */

export interface TranscribeResult {
    transcript: string;
    language?: string;
    duration?: number;
}

export type VoiceName =
    | "shimmer"
    | "nova"
    | "alloy"
    | "echo"
    | "fable"
    | "onyx";

export interface VoiceInfo {
    id: VoiceName;
    description: string;
    recommended_for: string;
}

export interface SynthesizeOptions {
    voice?: VoiceName;
    speed?: number;
}

// ─── Recording helpers ─────────────────────────────────────────────────────

let mediaRecorder: MediaRecorder | null = null;
let recordedChunks: Blob[] = [];
let recordingStream: MediaStream | null = null;

export async function startRecording(): Promise<void> {
    if (mediaRecorder && mediaRecorder.state === "recording") return;

    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    recordingStream = stream;
    recordedChunks = [];

    const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : MediaRecorder.isTypeSupported("audio/webm")
            ? "audio/webm"
            : "";

    mediaRecorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);

    mediaRecorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
            recordedChunks.push(e.data);
        }
    };

    mediaRecorder.start(250);
}

export function stopRecording(): Promise<Blob> {
    return new Promise((resolve, reject) => {
        if (!mediaRecorder) {
            reject(new Error("No active recording"));
            return;
        }

        mediaRecorder.onstop = () => {
            const mimeType = mediaRecorder?.mimeType ?? "audio/webm";
            const blob = new Blob(recordedChunks, { type: mimeType });
            recordedChunks = [];

            recordingStream?.getTracks().forEach((t) => t.stop());
            recordingStream = null;
            mediaRecorder = null;

            resolve(blob);
        };

        mediaRecorder.onerror = (e) => reject(e);
        mediaRecorder.stop();
    });
}

// ─── STT (Whisper) ─────────────────────────────────────────────────────────

export async function transcribeWithServer(
    audioBlob: Blob,
    language = "en"
): Promise<TranscribeResult> {
    const formData = new FormData();
    formData.append("audio", audioBlob, "audio.webm");
    formData.append("language", language);

    const res = await fetch("/api/transcribe", {
        method: "POST",
        body: formData,
    });

    if (!res.ok) {
        const err = await res.json().catch(() => ({ error: res.statusText }));
        throw new Error(err.error || "Transcription failed");
    }

    const data = await res.json();
    return { transcript: data.text };
}

// ─── TTS (OpenAI) ──────────────────────────────────────────────────────────

export async function synthesizeWithServer(
    text: string,
    { voice = "shimmer", speed = 1.0 }: SynthesizeOptions = {}
): Promise<HTMLAudioElement> {
    const res = await fetch("/api/synthesize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, voice, speed }),
    });

    if (!res.ok) {
        throw new Error("TTS failed");
    }

    const audioBlob = await res.blob();
    const url = URL.createObjectURL(audioBlob);
    const audio = new Audio(url);

    audio.addEventListener("ended", () => URL.revokeObjectURL(url), { once: true });
    return audio;
}

export function playAudio(audio: HTMLAudioElement): Promise<void> {
    return new Promise((resolve, reject) => {
        audio.onended = () => resolve();
        audio.onerror = () => reject(new Error("Audio playback error"));
        audio.play().catch(reject);
    });
}

// ─── Browser Fallbacks ─────────────────────────────────────────────────────

let currentUtterance: SpeechSynthesisUtterance | null = null;

export function speakWithBrowser(
    text: string,
    { speed = 1.0 }: { speed?: number } = {}
): Promise<void> {
    return new Promise((resolve) => {
        if (!window.speechSynthesis) return resolve();

        window.speechSynthesis.cancel();
        currentUtterance = new SpeechSynthesisUtterance(text);
        currentUtterance.rate = speed;

        currentUtterance.onend = () => resolve();
        currentUtterance.onerror = () => resolve();

        window.speechSynthesis.speak(currentUtterance);
    });
}

export function cancelCurrentSpeech(): void {
    window.speechSynthesis?.cancel();
    currentUtterance = null;
}

export async function fetchAvailableVoices(): Promise<VoiceInfo[]> {
    return [
        { id: "shimmer", description: "Warm female", recommended_for: "Devotionals" },
        { id: "nova", description: "Bright female", recommended_for: "Prayers" },
        { id: "echo", description: "Calm male", recommended_for: "Teaching" },
        { id: "onyx", description: "Deep male", recommended_for: "Scripture" },
    ];
}
