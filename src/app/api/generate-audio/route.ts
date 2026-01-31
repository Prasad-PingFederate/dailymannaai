import { NextResponse } from 'next/server';
import * as googleTTS from 'google-tts-api';

export async function POST(req: Request) {
    try {
        const { text } = await req.json();

        if (!text) {
            return NextResponse.json({ error: 'Text is required' }, { status: 400 });
        }

        // 1. Get audio chunks (base64) for the full text (automatically splits long text)
        const results = await googleTTS.getAllAudioBase64(text, {
            lang: 'en',
            slow: false,
            host: 'https://translate.google.com',
            timeout: 10000,
        });

        // 2. Combine all base64 chunks into one single buffer then back to base64
        const buffers = results.map(r => Buffer.from(r.base64, 'base64'));
        const combinedBuffer = Buffer.concat(buffers);
        const finalBase64 = combinedBuffer.toString('base64');

        return NextResponse.json({
            audio_base64: finalBase64,
            chunks: results.length
        });

    } catch (error: any) {
        console.error("TTS Gen Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
