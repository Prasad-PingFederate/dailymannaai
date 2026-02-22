import { NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

export const runtime = "nodejs"; // TTS requires Node.js runtime for streaming

export async function POST(req: Request) {
    try {
        const { text, voice = "shimmer", speed = 1.0 } = await req.json();

        if (!text) {
            return NextResponse.json({ error: "Text is required" }, { status: 400 });
        }

        if (!process.env.OPENAI_API_KEY) {
            return NextResponse.json({ error: "OpenAI API key not configured" }, { status: 500 });
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
