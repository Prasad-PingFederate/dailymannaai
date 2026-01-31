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

        // --- ADVANCED: SENTENCE-AWARE SEGMENTATION ---
        // We split at natural pauses (., !, ?, ;) to ensure joins happen at natural breath points
        const segments = cleanText.match(/[^\.!\?;\n]+[\.!\?;\n]*/g) || [cleanText];

        // Group segments into chunks that are under 200 characters (Google TTS limit)
        const chunks: string[] = [];
        let currentChunk = "";

        for (const segment of segments) {
            if ((currentChunk + segment).length < 200) {
                currentChunk += segment;
            } else {
                if (currentChunk) chunks.push(currentChunk.trim());
                currentChunk = segment;

                // If a single segment is > 200, we must force split it
                while (currentChunk.length >= 200) {
                    chunks.push(currentChunk.substring(0, 190).trim());
                    currentChunk = currentChunk.substring(190);
                }
            }
        }
        if (currentChunk) chunks.push(currentChunk.trim());

        // 1. Get audio for each smart chunk
        const allAudioBase64: string[] = [];
        for (const chunk of chunks) {
            const results = await googleTTS.getAllAudioBase64(chunk, {
                lang: 'en',
                slow: false,
                host: 'https://translate.google.com',
                timeout: 5000,
            });
            allAudioBase64.push(...results.map(r => r.base64));
        }

        // 2. Combine all base64 chunks into one single buffer
        const buffers = allAudioBase64.map(b => Buffer.from(b, 'base64'));
        const combinedBuffer = Buffer.concat(buffers);
        const finalBase64 = combinedBuffer.toString('base64');

        return NextResponse.json({
            audio_base64: finalBase64,
            chunks: allAudioBase64.length
        });

    } catch (error: any) {
        console.error("TTS Gen Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
