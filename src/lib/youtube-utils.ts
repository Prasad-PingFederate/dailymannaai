// src/lib/youtube-utils.ts
import { YoutubeTranscript } from 'youtube-transcript-plus';
import { Innertube } from 'youtubei.js';

export async function fetchYoutubeTranscript(url: string): Promise<string> {
  try {
    console.log(`[YT-Utils] Fetching transcript for: ${url}`);

    // Robust video ID extraction
    const extractVideoId = (inputUrl: string): string | null => {
      const patterns = [
        /(?:youtube\.com\/(?:[^/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=))([^"&?/\s]{11})/i,
        /youtu\.be\/([^"&?/\s]{11})/i,
        /youtube\.com\/shorts\/([^"&?/\s]{11})/i,
      ];

      for (const pattern of patterns) {
        const match = inputUrl.match(pattern);
        if (match && match[1]) return match[1];
      }

      // If the input is already an 11-char ID
      if (/^[a-zA-Z0-9_-]{11}$/.test(inputUrl.trim())) {
        return inputUrl.trim();
      }

      return null;
    };

    const videoId: string | null = extractVideoId(url);
    if (!videoId) {
      throw new Error("Could not extract valid YouTube video ID from the provided URL");
    }

    console.log(`[YT-Utils] Video ID: ${videoId}`);
    const normalizedUrl = `https://www.youtube.com/watch?v=${videoId}`;

    // 1. Innertube with cookies (best for restricted/age-gated videos)
    const cookies: string = process.env.YT_COOKIES || "";
    if (cookies) {
      try {
        console.log("[YT-Utils] Trying Innertube with session cookies...");
        const yt = await Innertube.create({
          cookie: cookies,
          generate_session_locally: true,
        });

        const info = await yt.getInfo(videoId);
        const transcriptData = await info.getTranscript();

        if (transcriptData?.transcript?.content?.body?.initial_segments?.length) {
          const text = transcriptData.transcript.content.body.initial_segments
            .map((s: { snippet?: { text?: string } }) => s.snippet?.text || '')
            .filter(Boolean)
            .join(' ')
            .trim();

          if (text.length > 50) {
            console.log(`[YT-Utils] Innertube success (${text.length} chars)`);
            return text;
          }
        }
      } catch (err: unknown) {
        console.warn(`[YT-Utils] Innertube failed: ${(err as Error).message || String(err)}`);
      }
    }

    // Timeout wrapper
    const withTimeout = <T>(promise: Promise<T>, ms: number = 30000): Promise<T> =>
      Promise.race([
        promise,
        new Promise<T>((_, reject) =>
          setTimeout(() => reject(new Error(`Operation timed out after ${ms}ms`)), ms)
        ),
      ]);

    // 2. Official-ish library attempt
    try {
      console.log("[YT-Utils] Trying youtube-transcript-plus library...");
      const transcriptItems = await withTimeout(
        YoutubeTranscript.fetchTranscript(videoId, { lang: 'en' })
      );

      if (Array.isArray(transcriptItems) && transcriptItems.length > 0) {
        const fullText = transcriptItems
          .map(item => (item as { text: string }).text)
          .join(' ')
          .trim();

        console.log(`[YT-Utils] Library success (${fullText.length} chars)`);
        return fullText;
      }
    } catch (err: unknown) {
      console.warn(`[YT-Utils] Library failed: ${(err as Error).message || String(err)}`);
    }

    // 3. Manual HTML + captionTracks parsing (usually most reliable)
    try {
      console.log("[YT-Utils] Trying manual HTML fallback...");
      const res = await fetch(normalizedUrl, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36',
          'Accept-Language': 'en-US,en;q=0.9',
          'Cookie': 'CONSENT=YES+cb.20250101-01-0',
        },
      });

      if (!res.ok) throw new Error(`HTTP ${res.status} from YouTube page`);

      const html: string = await res.text();

      const match = html.match(/ytInitialPlayerResponse\s*=\s*({.+?})\s*;\s*(?:var\s+meta|<\/script>)/s);
      if (!match || !match[1]) throw new Error("Could not find ytInitialPlayerResponse in HTML");

      interface CaptionTrack {
        baseUrl: string;
        languageCode: string;
        name?: { simpleText: string };
      }

      const data = JSON.parse(match[1]) as {
        captions?: {
          playerCaptionsTracklistRenderer?: {
            captionTracks: CaptionTrack[];
          };
        };
      };

      const tracks = data.captions?.playerCaptionsTracklistRenderer?.captionTracks;
      if (!tracks || tracks.length === 0) {
        throw new Error("No caption tracks found in player response");
      }

      const preferredTrack = tracks.find(t => t.languageCode.startsWith('en')) || tracks[0];
      const captionUrl = `${preferredTrack.baseUrl}&fmt=srv3`; // srv3 = clean XML

      const xmlRes = await fetch(captionUrl);
      if (!xmlRes.ok) throw new Error(`Caption fetch failed: HTTP ${xmlRes.status}`);

      const xml = await xmlRes.text();

      const textSegments = xml.match(/<text[^>]*>(.*?)<\/text>/gs) || [];
      const fullText = textSegments
        .map(t => t.replace(/<text[^>]*>|<\/text>/g, ''))
        .map(t => decodeURIComponent(t.replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'")))
        .join(' ')
        .replace(/\s+/g, ' ')
        .trim();

      if (fullText.length > 50) {
        console.log(`[YT-Utils] Manual HTML parse success (${fullText.length} chars)`);
        return fullText;
      }
    } catch (err: unknown) {
      console.warn(`[YT-Utils] Manual fallback failed: ${(err as Error).message || String(err)}`);
    }

    // 4. Piped fallback (public instances)
    const pipedBases: string[] = [
      "https://pipedapi.kavin.rocks",
      "https://piped-api.lunar.icu",
      "https://pipedapi-libre.kavin.rocks",
      "https://api-piped-proxy.ashwin.run",
    ];

    for (const base of pipedBases) {
      try {
        console.log(`[YT-Utils] Trying Piped instance: ${base}`);
        const res = await withTimeout(fetch(`${base}/streams/${videoId}`), 12000);

        if (!res.ok) continue;

        const json = await res.json() as { subtitles?: Array<{ code: string; name: string; url: string }> };

        if (json.subtitles && json.subtitles.length > 0) {
          const sub = json.subtitles.find(s => s.code?.startsWith('en') || s.name?.toLowerCase().includes('english')) || json.subtitles[0];
          const txtRes = await fetch(sub.url);
          const text = await txtRes.text();

          console.log(`[YT-Utils] Piped success via ${base} (${text.length} chars)`);
          return text.trim();
        }
      } catch {
        // silent continue to next instance
      }
    }

    throw new Error(
      "All transcript methods failed. The video may have no captions enabled, or YouTube blocked all requests."
    );
  } catch (error: unknown) {
    console.error("[YT-Utils] Final error:", error);
    const message = error instanceof Error ? error.message : "Unknown error during transcript fetch";
    throw new Error(`Transcript fetch failed: ${message}`);
  }
}
