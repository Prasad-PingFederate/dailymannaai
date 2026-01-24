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

        // 2. Combine all base64 chunks into one single base64 string
        const combinedBase64 = results.map(r => r.base64).join('');

        return NextResponse.json({
            audio_base64: combinedBase64,
            chunks: results.length
        });

    } catch (error: any) {
        console.error("TTS Gen Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
