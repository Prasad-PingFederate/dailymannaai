import { NextResponse } from 'next/server';
import * as googleTTS from 'google-tts-api';

export async function POST(req: Request) {
    try {
        const { text } = await req.json();

        if (!text) {
            return NextResponse.json({ error: 'Text is required' }, { status: 400 });
        }

        // Clean text for TTS: Remove markdown, citations, and phonetic guides
        let cleanText = text
            .replace(/\*\*/g, '')           // Bold
            .replace(/\*/g, '')            // Italic/Bullet
            .replace(/#+ /g, '')           // Headers
            .replace(/\[[\d\s,-]+\]/g, '')  // Citations [1] or [1-3] or [1, 2]
            .replace(/\(\/.*?\/\)/g, '')   // Phonetic guides (/.../)
            .replace(/(\r\n|\n|\r)/gm, " ") // Newlines to spaces
            .replace(/\s+/g, " ")          // Double spaces to single
            .trim();

        if (cleanText.length === 0) cleanText = "Empty text.";

        // 1. Get audio chunks (base64) for the full text
        const results = await googleTTS.getAllAudioBase64(cleanText, {
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
