import { NextResponse } from "next/server";
export const runtime = "nodejs";

export async function POST(req: Request) {
    try {
        const apiKey = process.env.OPENAI_API_KEY || process.env.openaiKey;
        if (!apiKey) {
            return NextResponse.json({ error: "OpenAI API key not configured" }, { status: 500 });
        }

        const { default: OpenAI } = await import("openai");
        const openai = new OpenAI({ apiKey });
        const { text, voice = "shimmer", speed = 1.0 } = await req.json();

        if (!text) {
            return NextResponse.json({ error: "Text is required" }, { status: 400 });
        }

        const mp3 = await openai.audio.speech.create({
            model: "tts-1",
            voice: voice as any,
            input: text,
            speed: speed,
        });

        const buffer = Buffer.from(await mp3.arrayBuffer());

        return new Response(buffer, {
            headers: {
                "Content-Type": "audio/mpeg",
                "Content-Length": buffer.length.toString(),
            },
        });
    } catch (error: any) {
        console.error("[TTS Error]:", error);
        return NextResponse.json({ error: "Speech synthesis failed" }, { status: 500 });
    }
}
