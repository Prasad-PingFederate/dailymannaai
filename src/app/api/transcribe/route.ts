import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const maxDuration = 60; // Max out Vercel timeout for safety

export async function POST(req: Request) {
    try {
        const formData = await req.formData();
        const audioFile = formData.get("audio") as File;
        const language = (formData.get("language") as string) || "en";

        if (!audioFile || audioFile.size < 300) {
            return NextResponse.json({ error: "Recording was too short. Try again." }, { status: 400 });
        }

        const groqKey = process.env.GROQ_API_KEY || process.env.groqKey;
        const geminiKey = process.env.GEMINI_API_KEY;

        let transcript = "";
        let usedProvider = "";

        // ─── Provider 1: Gemini 2.0 Flash (Native Multimodal Hearing) ──
        // Using Gemini 2.0 because it's already active on your Vercel
        if (geminiKey) {
            try {
                const arrayBuffer = await audioFile.arrayBuffer();
                const base64Audio = Buffer.from(arrayBuffer).toString("base64");

                const langMap: Record<string, string> = {
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
                                    { inlineData: { mimeType: audioFile.type || "audio/webm", data: base64Audio } },
                                    {
                                        text: `TASK: Listen to this audio and transcribe it perfectly.
                                             LANGUAGE: ${langMap[language] || "English"}.
                                             CONTEXT: Biblical/Scriptural study.
                                             RULE: Return ONLY the raw transcript. No labels. No metadata.
                                             If silence, return EMPTY_RESULT.` }
                                ]
                            }],
                            generationConfig: { temperature: 0, topP: 1 }
                        })
                    }
                );

                if (res.ok) {
                    const data = await res.json();
                    const text = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "";
                    if (text && text !== "EMPTY_RESULT") {
                        transcript = text;
                        usedProvider = "Gemini";
                    }
                }
            } catch (e: any) { console.error("[Transcribe] Gemini error:", e.message); }
        }

        // ─── Provider 2: Groq Whisper (Ultra Fast Fallback) ──────
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
            return NextResponse.json({ error: "The AI couldn't hear clearly. Please try again!" }, { status: 503 });
        }

        // Clean up noise
        transcript = transcript.replace(/\[.*?\]/g, "").replace(/\(.*?\)/g, "").trim();

        console.log(`[Transcribe] ✅ ${usedProvider}: "${transcript.substring(0, 100)}..."`);
        return NextResponse.json({ text: transcript });

    } catch (error: any) {
        console.error("[Transcribe] Global Error:", error);
        return NextResponse.json({ error: "Transcription engine is reloading. Try in 10s." }, { status: 500 });
    }
}
