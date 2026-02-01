import { YoutubeTranscript } from 'youtube-transcript-plus';

// Direct implementation without child_process to avoid build issues.
// Running in 'nodejs' runtime in Next.js is sufficient for this library.
export async function fetchYoutubeTranscript(url: string): Promise<string> {
    try {
        console.log(`[YoutubeUtils] Fetching transcript for ${url}`);

        // Extract video ID (simple logic, library might handle url but safer to pass ID if possible, 
        // strictly the library takes videoId or expected format. Let's parse ID.)
        const videoIdMatch = url.match(/(?:youtu\.be\/|youtube\.com\/watch\?v=|youtube\.com\/embed\/|v\/)([^#\&\?]*).*/);
        const videoId = videoIdMatch ? videoIdMatch[1] : url;

        // Wrap in timeout to prevent hanging indefinitely
        const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error("YouTube ingestion timed out after 30 seconds")), 30000)
        );

        const transcriptPromise = YoutubeTranscript.fetchTranscript(videoId);

        const transcript: any = await Promise.race([transcriptPromise, timeoutPromise]);

        if (!transcript || transcript.length === 0) {
            console.log("[YoutubeUtils] First attempt empty. Retrying with lang='en'...");
            const transcriptRetry = await YoutubeTranscript.fetchTranscript(videoId, { lang: 'en' });
            if (transcriptRetry && transcriptRetry.length > 0) {
                const fullText = transcriptRetry.map((t: any) => t.text).join(' ');
                return fullText;
            }
            throw new Error("No transcript found for this video.");
        }

        const fullText = transcript.map((t: any) => t.text).join(' ');
        return fullText;

    } catch (error: any) {
        console.error("Youtube Library Error:", error.message);

        // FALLBACK: Manual HTML Parsing (Bypasses library limitations)
        try {
            console.log(`[YoutubeUtils] Attempting Manual HTML Fallback for ${url}...`);
            const res = await fetch(url, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
                }
            });
            const html = await res.text();

            const regex = /"captionTracks":\s*(\[.*?\])/;
            const match = html.match(regex);

            if (match) {
                const tracks = JSON.parse(match[1]);
                const enTrack = tracks.find((t: any) => t.languageCode === 'en') || tracks[0];
                console.log(`[YoutubeUtils] Found Manual Track: ${enTrack.baseUrl}`);

                const transRes = await fetch(enTrack.baseUrl);
                const xml = await transRes.text();

                // Simple XML to Plain Text conversion
                const textMatch = xml.match(/<text.*?>([\s\S]*?)<\/text>/g);
                if (textMatch) {
                    const fullText = textMatch
                        .map(t => t.replace(/<text.*?>|<\/text>/g, ''))
                        .map(t => t.replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'"))
                        .join(' ');
                    console.log(`[YoutubeUtils] Manual Parse Success: ${fullText.length} chars.`);
                    return fullText;
                }
            }
        } catch (fallbackErr: any) {
            console.error("Youtube Manual Fallback Error:", fallbackErr.message);
        }

        // Elevate specific error messages if fallback also fails
        if (error.message.includes("Sign in")) throw new Error("Video requires sign-in (age restricted).");
        if (error.message.includes("disabled")) throw new Error("Transcripts are disabled for this video.");

        throw error;
    }
}
