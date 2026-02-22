import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
    try {
        const formData = await req.formData();
        const audioFile = formData.get("audio") as File;
        const language = (formData.get("language") as string) || "en";

        if (!audioFile) {
            return NextResponse.json({ error: "No audio file provided" }, { status: 400 });
        }

        const fileSizeKB = Math.round(audioFile.size / 1024);
        console.log(`[Transcribe] Received ${fileSizeKB}KB audio, lang: ${language}, type: ${audioFile.type}`);

        // Try all available Whisper providers
        const groqKey = process.env.GROQ_API_KEY || process.env.groqKey;
        const hfKey = process.env.HUGGINGFACE_API_KEY;
        const openRouterKey = process.env.OPENROUTER_API_KEY;

        let transcript = "";
        let usedProvider = "";

        // ─── Provider 1: Groq Whisper (fastest, ~1-2s) ──────────
        if (!transcript && groqKey) {
            try {
                const groqForm = new FormData();
                groqForm.append("file", audioFile, audioFile.name || "audio.webm");
                groqForm.append("model", "whisper-large-v3-turbo");
                groqForm.append("language", language.split("-")[0]);
                groqForm.append("response_format", "json");

                const res = await fetch("https://api.groq.com/openai/v1/audio/transcriptions", {
                    method: "POST",
                    headers: { Authorization: `Bearer ${groqKey}` },
                    body: groqForm,
                });

                if (res.ok) {
                    const data = await res.json();
                    transcript = data.text || "";
                    usedProvider = "Groq Whisper";
                } else {
                    const errText = await res.text();
                    console.warn(`[Transcribe] Groq failed (${res.status}): ${errText.substring(0, 200)}`);
                }
            } catch (e: any) {
                console.warn(`[Transcribe] Groq error: ${e.message}`);
            }
        }

        // ─── Provider 2: HuggingFace Whisper (free, slower) ─────
        if (!transcript && hfKey) {
            try {
                const arrayBuffer = await audioFile.arrayBuffer();
                const res = await fetch(
                    "https://api-inference.huggingface.co/models/openai/whisper-large-v3",
                    {
                        method: "POST",
                        headers: {
                            Authorization: `Bearer ${hfKey}`,
                            "Content-Type": audioFile.type || "audio/webm",
                        },
                        body: arrayBuffer,
                    }
                );

                if (res.ok) {
                    const data = await res.json();
                    transcript = data.text || "";
                    usedProvider = "HuggingFace Whisper";
                } else {
                    console.warn(`[Transcribe] HuggingFace failed (${res.status})`);
                }
            } catch (e: any) {
                console.warn(`[Transcribe] HuggingFace error: ${e.message}`);
            }
        }

        if (!transcript) {
            console.error("[Transcribe] All providers failed. Keys present:", {
                groq: !!groqKey,
                hf: !!hfKey,
                openRouter: !!openRouterKey,
            });
            return NextResponse.json(
                { error: "Could not transcribe audio. Please add GROQ_API_KEY to Vercel environment variables for voice input." },
                { status: 503 }
            );
        }

        console.log(`[Transcribe] ✅ ${usedProvider}: "${transcript.substring(0, 80)}${transcript.length > 80 ? '...' : ''}"`);
        return NextResponse.json({ text: transcript, provider: usedProvider });

    } catch (error: any) {
        console.error("[Transcribe] Error:", error);
        return NextResponse.json(
            { error: `Server error: ${error.message}` },
            { status: 500 }
        );
    }
}
