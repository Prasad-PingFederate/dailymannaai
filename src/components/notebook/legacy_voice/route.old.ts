// app/api/transcribe/route.ts
// ─────────────────────────────────────────────────────────────────────────────
// Transcription waterfall:  Deepgram → AssemblyAI → OpenAI Whisper
// Each provider is tried in order, skipped if key is absent, timed-out
// independently. First successful response wins and is returned immediately.
// If ALL fail, returns 503 so the frontend falls back to browser Web Speech.
// ─────────────────────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from "next/server";

// Per-provider timeout in milliseconds
const TIMEOUT_MS = {
    deepgram: 8_000,
    assemblyai: 12_000,
    whisper: 15_000,
} as const;

// ─────────────────────────────────────────────────────────────────────────────
// Helper: race a fetch against a timeout
// ─────────────────────────────────────────────────────────────────────────────
async function fetchWithTimeout(
    url: string,
    init: RequestInit,
    ms: number
): Promise<Response> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), ms);
    try {
        return await fetch(url, { ...init, signal: controller.signal });
    } finally {
        clearTimeout(timer);
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// Provider 1 — Deepgram (fastest, ~1–2 s)
// Docs: https://developers.deepgram.com/reference/listen-file
// ─────────────────────────────────────────────────────────────────────────────
async function tryDeepgram(audio: Blob): Promise<string | null> {
    const key = process.env.DEEPGRAM_API_KEY;
    if (!key) { console.log("[transcribe] Deepgram: no key, skipping"); return null; }

    try {
        const res = await fetchWithTimeout(
            "https://api.deepgram.com/v1/listen?model=nova-2&smart_format=true&language=en",
            {
                method: "POST",
                headers: {
                    Authorization: `Token ${key}`,
                    "Content-Type": audio.type || "audio/webm",
                },
                body: audio,
            },
            TIMEOUT_MS.deepgram
        );

        if (!res.ok) {
            console.warn("[transcribe] Deepgram error:", res.status, await res.text());
            return null;
        }

        const data = await res.json();
        const text = data?.results?.channels?.[0]?.alternatives?.[0]?.transcript?.trim();
        if (text) { console.log("[transcribe] Deepgram ✓"); return text; }
        return null;
    } catch (e: any) {
        console.warn("[transcribe] Deepgram failed:", e.message);
        return null;
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// Provider 2 — AssemblyAI (excellent accuracy, ~3–6 s)
// Uses synchronous nano model for speed
// Docs: https://www.assemblyai.com/docs/api-reference/transcripts
// ─────────────────────────────────────────────────────────────────────────────
async function tryAssemblyAI(audio: Blob): Promise<string | null> {
    const key = process.env.ASSEMBLYAI_API_KEY;
    if (!key) { console.log("[transcribe] AssemblyAI: no key, skipping"); return null; }

    try {
        // Step 1: Upload audio
        const uploadRes = await fetchWithTimeout(
            "https://api.assemblyai.com/v2/upload",
            {
                method: "POST",
                headers: { Authorization: key },
                body: audio,
            },
            TIMEOUT_MS.assemblyai / 2
        );

        if (!uploadRes.ok) {
            console.warn("[transcribe] AssemblyAI upload error:", uploadRes.status);
            return null;
        }

        const { upload_url } = await uploadRes.json();

        // Step 2: Request transcription (nano = fast)
        const transcriptRes = await fetchWithTimeout(
            "https://api.assemblyai.com/v2/transcript",
            {
                method: "POST",
                headers: {
                    Authorization: key,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    audio_url: upload_url,
                    speech_model: "nano",
                    language_code: "en",
                }),
            },
            TIMEOUT_MS.assemblyai / 2
        );

        if (!transcriptRes.ok) {
            console.warn("[transcribe] AssemblyAI transcript request error:", transcriptRes.status);
            return null;
        }

        const { id } = await transcriptRes.json();

        // Step 3: Poll until complete (within remaining budget)
        const deadline = Date.now() + TIMEOUT_MS.assemblyai;
        while (Date.now() < deadline) {
            await new Promise(r => setTimeout(r, 800));

            const pollRes = await fetch(`https://api.assemblyai.com/v2/transcript/${id}`, {
                headers: { Authorization: key },
            });

            if (!pollRes.ok) continue;
            const result = await pollRes.json();

            if (result.status === "completed") {
                const text = result.text?.trim();
                if (text) { console.log("[transcribe] AssemblyAI ✓"); return text; }
                return null;
            }
            if (result.status === "error") {
                console.warn("[transcribe] AssemblyAI transcription error:", result.error);
                return null;
            }
            // status === "processing" | "queued" — keep polling
        }

        console.warn("[transcribe] AssemblyAI: polling timeout");
        return null;
    } catch (e: any) {
        console.warn("[transcribe] AssemblyAI failed:", e.message);
        return null;
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// Provider 3 — OpenAI Whisper (most widely available fallback)
// Docs: https://platform.openai.com/docs/api-reference/audio/createTranscription
// ─────────────────────────────────────────────────────────────────────────────
async function tryWhisper(audio: Blob): Promise<string | null> {
    const key = process.env.OPENAI_API_KEY;
    if (!key) { console.log("[transcribe] Whisper: no key, skipping"); return null; }

    try {
        const fd = new FormData();
        fd.append("file", audio, "audio.webm");
        fd.append("model", "whisper-1");
        fd.append("language", "en");
        fd.append("response_format", "text");

        const res = await fetchWithTimeout(
            "https://api.openai.com/v1/audio/transcriptions",
            {
                method: "POST",
                headers: { Authorization: `Bearer ${key}` },
                body: fd,
            },
            TIMEOUT_MS.whisper
        );

        if (!res.ok) {
            console.warn("[transcribe] Whisper error:", res.status, await res.text());
            return null;
        }

        // response_format=text returns plain string
        const text = (await res.text()).trim();
        if (text) { console.log("[transcribe] Whisper ✓"); return text; }
        return null;
    } catch (e: any) {
        console.warn("[transcribe] Whisper failed:", e.message);
        return null;
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// Route handler
// ─────────────────────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
    let audioBlob: Blob;

    try {
        const form = await req.formData();
        const file = form.get("audio");
        if (!file || typeof file === "string") {
            return NextResponse.json({ error: "No audio file provided" }, { status: 400 });
        }
        audioBlob = file as Blob;
    } catch {
        return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    if (audioBlob.size < 500) {
        return NextResponse.json({ error: "Audio too short" }, { status: 422 });
    }

    // ── Try each provider in order ──────────────────────────────────────────
    const providers = [
        { name: "deepgram", fn: () => tryDeepgram(audioBlob) },
        { name: "assemblyai", fn: () => tryAssemblyAI(audioBlob) },
        { name: "whisper", fn: () => tryWhisper(audioBlob) },
    ];

    for (const { name, fn } of providers) {
        const result = await fn();
        if (result) {
            return NextResponse.json({ text: result, provider: name });
        }
    }

    // ── All APIs exhausted ──────────────────────────────────────────────────
    // Return 503 → frontend falls back to browser Web Speech result
    console.error("[transcribe] All providers failed — signalling browser fallback");
    return NextResponse.json(
        { error: "All transcription providers failed", fallback: true },
        { status: 503 }
    );
}
