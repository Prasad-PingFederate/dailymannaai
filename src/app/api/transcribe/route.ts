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
        const hfKey = process.env.HUGGINGFACE_API_KEY;
        const geminiKey = process.env.GEMINI_API_KEY;

        let transcript = "";
        let usedProvider = "";

        // ─── Provider 1: Deepgram (Fastest & Most Precise) ─────
        if (deepgramKey && deepgramKey !== "false") {
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
            } catch (e) {
                console.warn("Deepgram failed, falling back...");
            }
        }

        // ─── Provider 2: Groq Whisper ──────────────────────────
        if (!transcript && groqKey && groqKey !== "false") {
            try {
                const groqForm = new FormData();
                groqForm.append("file", audioFile, "audio.webm");
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
                                    { text: "Transcribe the audio accurately. Focus on spiritual/scriptural context if applicable. Output ONLY the text." }
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

        // ─── Provider 4: Hugging Face Whisper ──────────────────
        if (!transcript && hfKey) {
            try {
                const arrayBuffer = await audioFile.arrayBuffer();
                const res = await fetch(
                    "https://api-inference.huggingface.co/models/openai/whisper-large-v3-turbo",
                    {
                        method: "POST",
                        headers: {
                            Authorization: `Bearer ${hfKey}`,
                            "Content-Type": "audio/webm",
                        },
                        body: arrayBuffer,
                    }
                );

                if (res.ok) {
                    const data = await res.json();
                    transcript = data.text;
                    usedProvider = "HuggingFace";
                }
            } catch (e) { console.error("HF Error:", e); }
        }

        if (!transcript) {
            return NextResponse.json({ error: "All transcription providers failed. Check API keys and audio quality." }, { status: 503 });
        }

        console.log(`[Transcribe] ✅ ${usedProvider}: "${transcript.substring(0, 100)}..."`);
        return NextResponse.json({ text: transcript.trim() });

    } catch (error: any) {
        console.error("[Transcribe] Global error:", error);
        return NextResponse.json({ error: "Transcription system error." }, { status: 500 });
    }
}
