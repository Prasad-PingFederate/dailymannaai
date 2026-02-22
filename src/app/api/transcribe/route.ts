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

        const groqKey = process.env.GROQ_API_KEY || process.env.groqKey;
        const geminiKey = process.env.GEMINI_API_KEY;

        let transcript = "";
        let usedProvider = "";

        // ─── Provider: Gemini 2.0 Flash ─────────────────────────
        if (geminiKey) {
            try {
                const arrayBuffer = await audioFile.arrayBuffer();
                const base64Audio = Buffer.from(arrayBuffer).toString("base64");

                // CRITICAL: Gemini expects clean MIME types without codec extensions
                let mimeType = audioFile.type.split(';')[0];
                if (!mimeType || mimeType === "application/octet-stream") {
                    mimeType = "audio/webm";
                }

                const langNames: Record<string, string> = {
                    en: "English", te: "Telugu", hi: "Hindi", ta: "Tamil", kn: "Kannada", ml: "Malayalam"
                };

                const res = await fetch(
                    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiKey}`,
                    {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            contents: [{
                                parts: [
                                    { inlineData: { mimeType, data: base64Audio } },
                                    {
                                        text: `Transcribe this audio precisely. 
                                             Detected language: ${langNames[language] || "English"}.
                                             The speaker is discussing Christian faith and Biblical studies.
                                             Return ONLY the transcription text. No metadata.` }
                                ]
                            }],
                            generationConfig: { temperature: 0, topP: 1 }
                        })
                    }
                );

                if (res.ok) {
                    const data = await res.json();
                    const text = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
                    if (text && !text.toLowerCase().includes("empty_result")) {
                        transcript = text;
                        usedProvider = "Gemini";
                    }
                } else {
                    console.error(`[Transcribe] Gemini API failed: ${res.status} ${await res.text()}`);
                }
            } catch (e: any) {
                console.error("[Transcribe] Gemini error:", e.message);
            }
        }

        if (!transcript && groqKey && groqKey !== "false") {
            try {
                const groqForm = new FormData();
                groqForm.append("file", audioFile, "audio.webm");
                groqForm.append("model", "whisper-large-v3-turbo");
                groqForm.append("language", language);

                const res = await fetch("https://api.groq.com/openai/v1/audio/transcriptions", {
                    method: "POST",
                    headers: { Authorization: `Bearer ${groqKey}` },
                    body: groqForm,
                });

                if (res.ok) {
                    const data = await res.json();
                    transcript = data.text || "";
                    usedProvider = "Groq";
                }
            } catch (e: any) { console.error("[Transcribe] Groq error:", e.message); }
        }

        if (!transcript) {
            return NextResponse.json({ error: "Voice transcription unavailable. Please speak clearly or try a different browser." }, { status: 503 });
        }

        console.log(`[Transcribe] ✅ ${usedProvider}: "${transcript.substring(0, 100)}..."`);
        return NextResponse.json({ text: transcript });

    } catch (error: any) {
        console.error("[Transcribe] Global server error:", error);
        return NextResponse.json({ error: "System audio processing failed." }, { status: 500 });
    }
}
