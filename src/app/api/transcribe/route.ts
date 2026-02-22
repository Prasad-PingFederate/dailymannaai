import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
    try {
        const formData = await req.formData();
        const audioFile = formData.get("audio") as File;
        const language = formData.get("language") as string || "en";

        if (!audioFile) {
            return NextResponse.json({ error: "No audio file provided" }, { status: 400 });
        }

        console.log(`[Whisper] Transcribing ${audioFile.size} bytes, lang: ${language}`);

        // Try Groq Whisper first (fastest), then OpenAI-compatible alternatives
        const groqKey = process.env.GROQ_API_KEY || process.env.groqKey;
        const geminiKey = process.env.GEMINI_API_KEY;

        let transcript = "";

        if (groqKey) {
            // Groq Whisper - extremely fast, free tier available
            const groqForm = new FormData();
            groqForm.append("file", audioFile, "audio.webm");
            groqForm.append("model", "whisper-large-v3-turbo");
            groqForm.append("language", language.split("-")[0]); // "en-US" -> "en"
            groqForm.append("response_format", "json");

            const res = await fetch("https://api.groq.com/openai/v1/audio/transcriptions", {
                method: "POST",
                headers: { "Authorization": `Bearer ${groqKey}` },
                body: groqForm,
            });

            if (res.ok) {
                const data = await res.json();
                transcript = data.text || "";
                console.log(`[Whisper] Groq transcription: "${transcript.substring(0, 80)}..."`);
            } else {
                const err = await res.text();
                console.error(`[Whisper] Groq failed: ${err}`);
            }
        }

        // Fallback: HuggingFace Whisper
        if (!transcript && process.env.HUGGINGFACE_API_KEY) {
            const arrayBuffer = await audioFile.arrayBuffer();
            const res = await fetch(
                "https://api-inference.huggingface.co/models/openai/whisper-large-v3",
                {
                    method: "POST",
                    headers: {
                        "Authorization": `Bearer ${process.env.HUGGINGFACE_API_KEY}`,
                        "Content-Type": "audio/webm",
                    },
                    body: arrayBuffer,
                }
            );

            if (res.ok) {
                const data = await res.json();
                transcript = data.text || "";
                console.log(`[Whisper] HuggingFace transcription: "${transcript.substring(0, 80)}..."`);
            } else {
                console.error(`[Whisper] HuggingFace failed: ${await res.text()}`);
            }
        }

        if (!transcript) {
            return NextResponse.json(
                { error: "Transcription failed. No speech-to-text provider available." },
                { status: 503 }
            );
        }

        return NextResponse.json({ text: transcript });
    } catch (error: any) {
        console.error("[Whisper] Error:", error);
        return NextResponse.json(
            { error: `Transcription error: ${error.message}` },
            { status: 500 }
        );
    }
}
