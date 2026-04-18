import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// Per-provider timeout in milliseconds
const TIMEOUT_MS = {
    groq: 2_500,
    deepgram: 2_500,
    whisper: 3_000,
} as const;

// Helper: race a fetch against a timeout
async function fetchWithTimeout(url: string, init: RequestInit, ms: number): Promise<Response> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), ms);
    try {
        return await fetch(url, { ...init, signal: controller.signal });
    } finally {
        clearTimeout(timer);
    }
}

export async function POST(req: Request) {
    try {
        const formData = await req.formData();
        const audioFile = formData.get("audio") as File;
        const language = (formData.get("language") as string) || "en";

        if (!audioFile || audioFile.size < 500) {
            return NextResponse.json({ error: "Recording was too short or silent." }, { status: 400 });
        }

        const deepgramKey = process.env.DEEPGRAM_API_KEY || process.env.DEEPGRAM_API || process.env.deepgramKey;
        const groqKey = process.env.GROQ_API_KEY || process.env.groqKey || process.env.groqkey;
        const openAIKey = process.env.OPENAI_API_KEY || process.env.openaiKey;

        console.log("[Transcribe] Keys present:", {
            hasOpenAI: !!openAIKey,
            hasDeepgram: !!deepgramKey,
            hasGroq: !!groqKey
        });

        // Browser/Mime-type Robustness
        const ext = audioFile.type.includes("ogg") ? "ogg"
            : audioFile.type.includes("mp4") ? "m4a"
                : audioFile.type.includes("wav") ? "wav"
                    : "webm";
        const namedFile = new File([audioFile], `audio.${ext}`, { type: audioFile.type || "audio/webm" });

        let transcript = "";
        let usedProvider = "";

        // ─── 1. GROQ WHISPER (Ultra-Fast Priority) ────────────
        if (!transcript && groqKey && groqKey !== "false") {
            try {
                const groqForm = new FormData();
                groqForm.append("file", namedFile);
                groqForm.append("model", "whisper-large-v3-turbo");
                groqForm.append("language", language.split("-")[0]);

                const res = await fetchWithTimeout("https://api.groq.com/openai/v1/audio/transcriptions", {
                    method: "POST",
                    headers: { Authorization: `Bearer ${groqKey}` },
                    body: groqForm,
                }, TIMEOUT_MS.groq);

                if (res.ok) {
                    const data = await res.json();
                    if (data.text) {
                        transcript = data.text;
                        usedProvider = "Groq";
                    }
                }
            } catch (e) { console.warn("Groq missed timeout or failed"); }
        }

        // ─── 2. DEEPGRAM (Fastest Alternative) ────────────
        if (!transcript && deepgramKey && deepgramKey !== "false") {
            try {
                const arrayBuffer = await audioFile.arrayBuffer();
                const res = await fetchWithTimeout("https://api.deepgram.com/v1/listen?smart_format=true&model=nova-2&language=" + language, {
                    method: "POST",
                    headers: {
                        "Authorization": `Token ${deepgramKey}`,
                        "Content-Type": audioFile.type || "audio/webm"
                    },
                    body: arrayBuffer
                }, TIMEOUT_MS.deepgram);

                if (res.ok) {
                    const data = await res.json();
                    const txt = data.results?.channels[0]?.alternatives[0]?.transcript;
                    if (txt) {
                        transcript = txt;
                        usedProvider = "Deepgram";
                    }
                }
            } catch (e) { console.warn("Deepgram missed timeout or failed"); }
        }

        // ─── 3. OPENAI WHISPER (Most Reliable Fallback) ───────
        if (!transcript && openAIKey) {
            try {
                const form = new FormData();
                form.append("file", namedFile);
                form.append("model", "whisper-1");
                form.append("language", language.split("-")[0]);

                const res = await fetchWithTimeout("https://api.openai.com/v1/audio/transcriptions", {
                    method: "POST",
                    headers: { Authorization: `Bearer ${openAIKey}` },
                    body: form
                }, TIMEOUT_MS.whisper);

                if (res.ok) {
                    const data = await res.json();
                    if (data.text) {
                        transcript = data.text;
                        usedProvider = "OpenAI";
                    }
                }
            } catch (e) { console.warn("OpenAI missed timeout or failed"); }
        }

        // ─── Done ────────────
        if (!transcript) {
            return NextResponse.json({ error: "Transcription failed. Check your API keys.", fallback: true }, { status: 503 });
        }

        console.log(`[Transcribe] ✅ ${usedProvider}: "${transcript.substring(0, 100)}..."`);
        return NextResponse.json({ text: transcript.trim() });

    } catch (error: any) {
        console.error("[Transcribe] Global error:", error);
        return NextResponse.json({ error: "Transcription system error.", fallback: true }, { status: 503 });
    }
}
