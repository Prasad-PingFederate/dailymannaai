import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const maxDuration = 45; // Generous timeout for audio

export async function POST(req: Request) {
    try {
        const formData = await req.formData();
        const audioFile = formData.get("audio") as File;
        const language = (formData.get("language") as string) || "en";

        if (!audioFile || audioFile.size < 500) {
            return NextResponse.json({ error: "Audio capture was too short. Please try again." }, { status: 400 });
        }

        const fileSizeKB = Math.round(audioFile.size / 1024);
        console.log(`[Transcribe] Processing ${fileSizeKB}KB audio, lang: ${language}`);

        const groqKey = process.env.GROQ_API_KEY || process.env.groqKey;
        const geminiKey = process.env.GEMINI_API_KEY;

        let transcript = "";
        let usedProvider = "";

        // ─── Provider 1: Groq Whisper (Ultra Fast) ─────────────
        if (!transcript && groqKey && groqKey !== "false") {
            try {
                const groqForm = new FormData();
                groqForm.append("file", audioFile, "audio.webm");
                groqForm.append("model", "whisper-large-v3-turbo");
                groqForm.append("language", language);
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
                }
            } catch (e: any) { console.warn("[Transcribe] Groq error:", e.message); }
        }

        // ─── Provider 2: Gemini 2.0 Flash (Multimodal Hearing) ─
        if (!transcript && geminiKey) {
            try {
                console.log("[Transcribe] Engaging Gemini Multimodal Hearing...");
                const arrayBuffer = await audioFile.arrayBuffer();
                const base64Audio = Buffer.from(arrayBuffer).toString("base64");

                const langPrompt = {
                    en: "English", te: "Telugu (తెలుగు)", hi: "Hindi (हिन्दी)",
                    ta: "Tamil (தமிழ்)", kn: "Kannada (ಕನ್ನಡ)", ml: "Malayalam (മലയാളം)"
                }[language] || "English";

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
                                        text: `Precisely transcribe this audio message.
                                             Context: Christian inquiry / Bible study. 
                                             Detected Language: ${langPrompt}.
                                             IMPORTANT: Return ONLY the transcript text. Do not include labels like 'Speaker 1:' or 'Transcript:'. If no human speech is heard, return '---NO_SPEECH---'.` }
                                ]
                            }],
                            generationConfig: { temperature: 0, maxOutputTokens: 200 }
                        })
                    }
                );

                if (res.ok) {
                    const data = await res.json();
                    const text = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "";
                    if (text && text !== "---NO_SPEECH---") {
                        transcript = text;
                        usedProvider = "Gemini";
                    }
                }
            } catch (e: any) { console.warn("[Transcribe] Gemini error:", e.message); }
        }

        if (!transcript) {
            return NextResponse.json({ error: "Voice synthesis failed. Please try speaking more clearly or add GROQ_API_KEY to Vercel." }, { status: 503 });
        }

        // Final cleanup
        transcript = transcript.replace(/\[.*?\]/g, "").replace(/\(.*?\)/g, "").trim();

        console.log(`[Transcribe] ✅ ${usedProvider}: "${transcript.substring(0, 100)}..."`);
        return NextResponse.json({ text: transcript, provider: usedProvider });

    } catch (error: any) {
        console.error("[Transcribe] Server Error:", error);
        return NextResponse.json({ error: "System encountered an error processing audio." }, { status: 500 });
    }
}
