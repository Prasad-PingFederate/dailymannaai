import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const maxDuration = 30; // Allow up to 30s for transcription

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

        const groqKey = process.env.GROQ_API_KEY || process.env.groqKey;
        const hfKey = process.env.HUGGINGFACE_API_KEY;

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
                    usedProvider = "Groq";
                } else {
                    const errText = await res.text();
                    console.warn(`[Transcribe] Groq failed (${res.status}): ${errText.substring(0, 200)}`);
                }
            } catch (e: any) {
                console.warn(`[Transcribe] Groq error: ${e.message}`);
            }
        }

        // ─── Provider 2: HuggingFace Whisper ────────────────────
        if (!transcript && hfKey) {
            try {
                console.log("[Transcribe] Trying HuggingFace Whisper...");
                const arrayBuffer = await audioFile.arrayBuffer();

                // Try with wait_for_model to handle cold starts
                const res = await fetch(
                    "https://api-inference.huggingface.co/models/openai/whisper-large-v3-turbo",
                    {
                        method: "POST",
                        headers: {
                            Authorization: `Bearer ${hfKey}`,
                            "Content-Type": audioFile.type || "audio/webm",
                            "x-wait-for-model": "true",
                        },
                        body: arrayBuffer,
                    }
                );

                if (res.ok) {
                    const data = await res.json();
                    transcript = data.text || (data.chunks ? data.chunks.map((c: any) => c.text).join(" ") : "");
                    usedProvider = "HuggingFace";
                } else {
                    const statusText = await res.text();
                    console.warn(`[Transcribe] HuggingFace failed (${res.status}): ${statusText.substring(0, 200)}`);

                    // If model is loading, try smaller model
                    if (res.status === 503) {
                        console.log("[Transcribe] Trying smaller HF model...");
                        const res2 = await fetch(
                            "https://api-inference.huggingface.co/models/openai/whisper-small",
                            {
                                method: "POST",
                                headers: {
                                    Authorization: `Bearer ${hfKey}`,
                                    "Content-Type": audioFile.type || "audio/webm",
                                    "x-wait-for-model": "true",
                                },
                                body: arrayBuffer,
                            }
                        );
                        if (res2.ok) {
                            const data2 = await res2.json();
                            transcript = data2.text || "";
                            usedProvider = "HuggingFace-Small";
                        }
                    }
                }
            } catch (e: any) {
                console.warn(`[Transcribe] HuggingFace error: ${e.message}`);
            }
        }

        if (!transcript) {
            const availableKeys = [
                groqKey ? "Groq" : null,
                hfKey ? "HuggingFace" : null,
            ].filter(Boolean);

            console.error(`[Transcribe] All providers failed. Available keys: ${availableKeys.join(", ") || "NONE"}`);

            if (!groqKey && !hfKey) {
                return NextResponse.json(
                    { error: "Voice transcription needs GROQ_API_KEY. Please add it in Vercel Settings → Environment Variables." },
                    { status: 503 }
                );
            }

            return NextResponse.json(
                { error: "Could not transcribe. The AI speech service is temporarily unavailable. Please try again." },
                { status: 503 }
            );
        }

        // Clean up common Whisper artifacts
        transcript = transcript
            .replace(/\[BLANK_AUDIO\]/gi, "")
            .replace(/\(.*?\)/g, "") // Remove (music), (silence), etc.
            .replace(/\s+/g, " ")
            .trim();

        if (!transcript) {
            return NextResponse.json(
                { error: "No speech detected. Please speak clearly and try again." },
                { status: 200 }
            );
        }

        console.log(`[Transcribe] ✅ ${usedProvider}: "${transcript.substring(0, 100)}"`);
        return NextResponse.json({ text: transcript, provider: usedProvider });

    } catch (error: any) {
        console.error("[Transcribe] Error:", error);
        return NextResponse.json(
            { error: `Transcription error: ${error.message}` },
            { status: 500 }
        );
    }
}
