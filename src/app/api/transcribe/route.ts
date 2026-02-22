import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

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
        const geminiKey = process.env.GEMINI_API_KEY;
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
                    console.warn(`[Transcribe] Groq failed (${res.status}): ${(await res.text()).substring(0, 200)}`);
                }
            } catch (e: any) {
                console.warn(`[Transcribe] Groq error: ${e.message}`);
            }
        }

        // ─── Provider 2: Gemini 2.0 Flash (already on Vercel!) ──
        if (!transcript && geminiKey) {
            try {
                console.log("[Transcribe] Using Gemini 2.0 Flash for transcription...");
                const arrayBuffer = await audioFile.arrayBuffer();
                const base64Audio = Buffer.from(arrayBuffer).toString("base64");

                // Determine MIME type
                let mimeType = audioFile.type || "audio/webm";
                // Gemini needs specific mime types
                if (mimeType.includes("webm")) mimeType = "audio/webm";
                else if (mimeType.includes("mp4")) mimeType = "audio/mp4";
                else if (mimeType.includes("wav")) mimeType = "audio/wav";
                else if (mimeType.includes("ogg")) mimeType = "audio/ogg";

                const langName = {
                    en: "English", te: "Telugu", hi: "Hindi", ta: "Tamil",
                    kn: "Kannada", ml: "Malayalam", es: "Spanish", fr: "French",
                    de: "German", pt: "Portuguese", zh: "Chinese", ja: "Japanese",
                    ko: "Korean", ar: "Arabic"
                }[language.split("-")[0]] || "English";

                const res = await fetch(
                    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiKey}`,
                    {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            contents: [{
                                parts: [
                                    {
                                        inlineData: {
                                            mimeType: mimeType,
                                            data: base64Audio,
                                        }
                                    },
                                    {
                                        text: `Transcribe this audio recording accurately. The speaker is likely speaking in ${langName}. Return ONLY the exact words spoken, nothing else. No explanations, no labels, no timestamps. If you cannot hear any clear speech, respond with exactly: NO_SPEECH_DETECTED`
                                    }
                                ]
                            }],
                            generationConfig: {
                                temperature: 0.1,
                                maxOutputTokens: 1024,
                            }
                        })
                    }
                );

                if (res.ok) {
                    const data = await res.json();
                    const text = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "";
                    if (text && text !== "NO_SPEECH_DETECTED" && !text.toLowerCase().includes("no speech") && !text.toLowerCase().includes("cannot hear")) {
                        transcript = text;
                        usedProvider = "Gemini";
                    } else {
                        console.warn("[Transcribe] Gemini: No speech detected");
                    }
                } else {
                    const errText = await res.text();
                    console.warn(`[Transcribe] Gemini failed (${res.status}): ${errText.substring(0, 200)}`);
                }
            } catch (e: any) {
                console.warn(`[Transcribe] Gemini error: ${e.message}`);
            }
        }

        // ─── Provider 3: HuggingFace Whisper (free backup) ──────
        if (!transcript && hfKey) {
            try {
                console.log("[Transcribe] Trying HuggingFace Whisper...");
                const arrayBuffer = await audioFile.arrayBuffer();

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
                    console.warn(`[Transcribe] HuggingFace failed (${res.status})`);

                    // Fallback to smaller model
                    if (res.status === 503) {
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
            console.error(`[Transcribe] All providers failed. Keys: Groq=${!!groqKey}, Gemini=${!!geminiKey}, HF=${!!hfKey}`);
            return NextResponse.json(
                { error: "Could not transcribe audio. Please try speaking more clearly or try again." },
                { status: 503 }
            );
        }

        // Clean Whisper artifacts
        transcript = transcript
            .replace(/\[BLANK_AUDIO\]/gi, "")
            .replace(/\(.*?\)/g, "")
            .replace(/\s+/g, " ")
            .trim();

        if (!transcript) {
            return NextResponse.json({ error: "No speech detected. Please speak clearly and try again." }, { status: 200 });
        }

        console.log(`[Transcribe] ✅ ${usedProvider}: "${transcript.substring(0, 100)}"`);
        return NextResponse.json({ text: transcript, provider: usedProvider });

    } catch (error: any) {
        console.error("[Transcribe] Error:", error);
        return NextResponse.json({ error: `Transcription error: ${error.message}` }, { status: 500 });
    }
}
