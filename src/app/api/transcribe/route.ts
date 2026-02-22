import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(req: Request) {
    try {
        const formData = await req.formData();
        const audioFile = formData.get("audio") as File;
        const language = (formData.get("language") as string) || "en";

        if (!audioFile || audioFile.size < 500) {
            return NextResponse.json({ error: "Recording was too short or silent." }, { status: 400 });
        }

        const deepgramKey = process.env.DEEPGRAM_API_KEY || process.env.DEEPGRAM_API;
        const groqKey = process.env.GROQ_API_KEY || process.env.groqKey;
        const geminiKey = process.env.GEMINI_API_KEY;
        const openAIKey = process.env.OPENAI_API_KEY;

        let transcript = "";
        let usedProvider = "";

        // ─── Browser/Mime-type Robustness ─────────────────────
        const ext = audioFile.type.includes("ogg") ? "ogg"
            : audioFile.type.includes("mp4") ? "m4a"
                : audioFile.type.includes("wav") ? "wav"
                    : "webm";
        const namedFile = new File([audioFile], `audio.${ext}`, { type: audioFile.type || "audio/webm" });

        // ─── Provider 0: OpenAI Whisper (Most Reliable) ───────
        if (!transcript && openAIKey) {
            try {
                const { default: OpenAI } = await import("openai");
                const openai = new OpenAI({ apiKey: openAIKey });
                const res = await openai.audio.transcriptions.create({
                    model: "whisper-1",
                    file: namedFile,
                    language: language.split("-")[0] as any,
                });
                transcript = res.text;
                if (transcript) usedProvider = "OpenAI";
            } catch (e) { console.warn("OpenAI failed..."); }
        }

        // ─── Provider 1: Deepgram (Fastest) ────────────────────
        if (!transcript && deepgramKey && deepgramKey !== "false") {
            try {
                const arrayBuffer = await audioFile.arrayBuffer();
                const res = await fetch("https://api.deepgram.com/v1/listen?smart_format=true&model=nova-2&language=" + language, {
                    method: "POST",
                    headers: {
                        "Authorization": `Token ${deepgramKey}`,
                        "Content-Type": audioFile.type || "audio/webm"
                    },
                    body: arrayBuffer
                });

                if (res.ok) {
                    const data = await res.json();
                    transcript = data.results?.channels[0]?.alternatives[0]?.transcript;
                    if (transcript) usedProvider = "Deepgram";
                }
            } catch (e) { console.warn("Deepgram failed..."); }
        }

        // ─── Provider 2: Groq Whisper (Ultra-Fast) ────────────
        if (!transcript && groqKey && groqKey !== "false") {
            try {
                const groqForm = new FormData();
                groqForm.append("file", namedFile);
                groqForm.append("model", "whisper-large-v3-turbo");
                groqForm.append("language", language.split("-")[0]);

                const res = await fetch("https://api.groq.com/openai/v1/audio/transcriptions", {
                    method: "POST",
                    headers: { Authorization: `Bearer ${groqKey}` },
                    body: groqForm,
                });

                if (res.ok) {
                    const data = await res.json();
                    transcript = data.text;
                    usedProvider = "Groq";
                }
            } catch (e) { console.warn("Groq failed..."); }
        }

        // ─── Provider 3: Gemini 2.0 Flash ─────────────────────
        if (!transcript && geminiKey) {
            try {
                const arrayBuffer = await audioFile.arrayBuffer();
                const base64Audio = Buffer.from(arrayBuffer).toString("base64");
                let mimeType = audioFile.type.split(';')[0];
                if (!mimeType || mimeType.includes("octet")) mimeType = "audio/webm";

                const res = await fetch(
                    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiKey}`,
                    {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            contents: [{
                                parts: [
                                    { inlineData: { mimeType, data: base64Audio } },
                                    { text: "Transcribe the audio accurately. Focus on spiritual/scriptural context. Output ONLY the text." }
                                ]
                            }],
                            generationConfig: { temperature: 0 }
                        })
                    }
                );

                if (res.ok) {
                    const data = await res.json();
                    transcript = data.candidates?.[0]?.content?.parts?.[0]?.text;
                    usedProvider = "Gemini";
                }
            } catch (e) { console.warn("Gemini failed..."); }
        }

        if (!transcript) {
            return NextResponse.json({ error: "Transcription failed. Check your microphone and API keys." }, { status: 503 });
        }

        console.log(`[Transcribe] ✅ ${usedProvider}: "${transcript.substring(0, 100)}..."`);
        return NextResponse.json({ text: transcript.trim() });

    } catch (error: any) {
        console.error("[Transcribe] Global error:", error);
        return NextResponse.json({ error: "Transcription system error." }, { status: 500 });
    }
}
