import { YoutubeTranscript } from 'youtube-transcript-plus';

// Direct implementation without child_process to avoid build issues.
// Running in 'nodejs' runtime in Next.js is sufficient for this library.
export async function fetchYoutubeTranscript(url: string): Promise<string> {
    try {
        console.log(`[YoutubeUtils] Initializing fetch for ${url}`);

        // Robust video ID extraction (handles 'walch', 'watch', 'embed', 'youtu.be', etc.)
        const videoIdMatch = url.match(/(?:[?&]v=|youtu\.be\/|youtube\.com\/embed\/|v\/|walch\?v=)([^#\&\?]*)/);
        const videoId = videoIdMatch ? videoIdMatch[1] : url.trim();
        const normalizedUrl = `https://www.youtube.com/watch?v=${videoId}`;

        console.log(`[YoutubeUtils] Normalized ID: ${videoId}`);

        // Wrap in timeout to prevent hanging indefinitely
        const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error("YouTube ingestion timed out after 30 seconds")), 30000)
        );

        // Attempt 1: Standard Library Fetch
        const transcriptPromise = YoutubeTranscript.fetchTranscript(videoId, { lang: 'en' });

        try {
            const transcript: any = await Promise.race([transcriptPromise, timeoutPromise]);
            if (transcript && transcript.length > 0) {
                const fullText = transcript.map((t: any) => t.text).join(' ');
                console.log(`[YoutubeUtils] Library Success: ${fullText.length} chars.`);
                return fullText;
            }
        } catch (libErr: any) {
            console.log(`[YoutubeUtils] Library failed: ${libErr.message}. Trying Manual Fallback...`);
        }

        // FALLBACK: Manual HTML Parsing (Bypasses library/Bot limitations)
        try {
            console.log(`[YoutubeUtils] Starting Manual HTML Fallback for ${normalizedUrl}...`);
            const res = await fetch(normalizedUrl, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
                    'Accept-Language': 'en-US,en;q=0.9',
                    'Cookie': 'CONSENT=YES+cb.20210328-17-p0.en+FX+430' // Bypass consent wall
                }
            });
            const html = await res.text();

            // Broad capture for transcript list
            const regex = /"captionTracks":\s*(\[.*?\])/;
            const match = html.match(regex);

            if (match) {
                const tracks = JSON.parse(match[1]);
                // Prioritize English, then any
                const enTrack = tracks.find((t: any) => t.languageCode === 'en' || t.languageCode?.startsWith('en')) || tracks[0];
                console.log(`[YoutubeUtils] Found Manual Track: ${enTrack.baseUrl}`);

                const transRes = await fetch(enTrack.baseUrl);
                const xml = await transRes.text();

                // Simple XML to Plain Text conversion
                const textMatch = xml.match(/<text.*?>([\s\S]*?)<\/text>/g);
                if (textMatch) {
                    const fullText = textMatch
                        .map(t => t.replace(/<text.*?>|<\/text>/g, ''))
                        .map(t => t.replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>'))
                        .join(' ')
                        .replace(/\s+/g, ' ')
                        .trim();
                    console.log(`[YoutubeUtils] Manual Parse Success: ${fullText.length} chars.`);
                    return fullText;
                }
            } else {
                console.log("[YoutubeUtils] No captionTracks found in HTML. Checking Bot wall...");
                if (html.includes("Robot") || html.includes("captcha")) {
                    throw new Error("YouTube blocked the server with a CAPTCHA. Please try again later.");
                }
            }
        } catch (fallbackErr: any) {
            console.error("Youtube Manual Fallback Error:", fallbackErr.message);
            throw fallbackErr;
        }

        // FALLBACK 2: Piped API (Reliable third-party instance)
        try {
            console.log(`[YoutubeUtils] Starting Piped Fallback for ${videoId}...`);
            const pipedEndpoints = ["https://pipedapi.kavin.rocks", "https://api.piped.io", "https://pipedapi.tokhmi.xyz"];
            for (const api of pipedEndpoints) {
                try {
                    const res = await fetch(`${api}/streams/${videoId}`);
                    if (!res.ok) continue;
                    const data: any = await res.json();
                    if (data.subtitles && data.subtitles.length > 0) {
                        const enSub = data.subtitles.find((s: any) => s.code === 'en' || s.name === 'English') || data.subtitles[0];
                        const subRes = await fetch(enSub.url);
                        const text = await subRes.text();
                        console.log(`[YoutubeUtils] Piped Success via ${api}: ${text.length} chars.`);
                        return text;
                    }
                } catch (e) { continue; }
            }
        } catch (pipedErr) { console.error("Piped Fallback Error:", pipedErr); }

        // FALLBACK 3: Invidious API
        try {
            console.log(`[YoutubeUtils] Starting Invidious Fallback for ${videoId}...`);
            const invidiousEndpoints = ["https://yewtu.be", "https://inv.vern.cc", "https://invidious.snopyta.org"];
            for (const api of invidiousEndpoints) {
                try {
                    const res = await fetch(`${api}/api/v1/captions/${videoId}?label=English`);
                    if (res.ok) {
                        const text = await res.text();
                        console.log(`[YoutubeUtils] Invidious Success via ${api}: ${text.length} chars.`);
                        return text;
                    }
                } catch (e) { continue; }
            }
        } catch (invErr) { console.error("Invidious Fallback Error:", invErr); }

        throw new Error("No transcripts are available for this video. YouTube blocked all bypass layers or 'CC' is disabled.");

    } catch (error: any) {
        console.error("Youtube Ingestion Final Failure:", error.message);
        throw error;
    }
}
