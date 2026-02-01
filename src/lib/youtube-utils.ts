// src/lib/youtube-utils.ts
import { Innertube } from 'youtubei.js';

export async function fetchYoutubeTranscript(url: string): Promise<string> {
  try {
    console.log(`[YT-Utils] Fetching transcript for: ${url}`);

    // ─── 1. Extract video ID ───────────────────────────────────────────────
    const extractVideoId = (input: string): string | null => {
      const patterns = [
        /(?:youtube\.com\/(?:[^/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=))([^"&?/\s]{11})/i,
        /youtu\.be\/([^"&?/\s]{11})/i,
        /youtube\.com\/shorts\/([^"&?/\s]{11})/i,
      ];
      for (const p of patterns) {
        const m = input.match(p);
        if (m?.[1]) return m[1];
      }
      return /^[a-zA-Z0-9_-]{11}$/.test(input.trim()) ? input.trim() : null;
    };

    const videoId = extractVideoId(url);
    if (!videoId) throw new Error("Invalid YouTube URL or video ID");

    const watchUrl = `https://www.youtube.com/watch?v=${videoId}`;

    const headers = {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/132.0.0.0 Safari/537.36',
      'Accept-Language': 'en-US,en;q=0.9',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Cookie': 'CONSENT=YES+cb.20250101-01-0',
    };

    // ─── 2. Innertube (optional, only if cookies provided) ──────────────────
    const cookies = process.env.YT_COOKIES?.trim();
    if (cookies) {
      try {
        console.log("[YT-Utils] Trying Innertube with cookies...");
        const yt = await Innertube.create({
          cookie: cookies,
          generate_session_locally: true,
          retrieve_player: false,
        });
        const info = await yt.getInfo(videoId);
        const transcript = await info.getTranscript();
        if (transcript?.transcript?.content?.body?.initial_segments?.length) {
          const text = transcript.transcript.content.body.initial_segments
            .map((s: any) => s.snippet?.text || '')
            .filter(Boolean)
            .join(' ')
            .trim();
          if (text.length > 50) return text;
        }
      } catch (err: any) {
        console.warn(`[YT-Utils] Innertube failed: ${err.message || err}`);
      }
    }

    // Timeout wrapper
    const withTimeout = <T>(promise: Promise<T>, ms = 20000): Promise<T> =>
      Promise.race([
        promise,
        new Promise<T>((_, reject) =>
          setTimeout(() => reject(new Error(`Timeout after ${ms}ms`)), ms)
        ),
      ]);

    // ─── 3. Manual caption fetch (main strategy) ───────────────────────────
    console.log("[YT-Utils] Fetching video page HTML...");
    const pageRes = await withTimeout(fetch(watchUrl, { headers }));
    if (!pageRes.ok) throw new Error(`Video page failed: HTTP ${pageRes.status}`);

    const html = await pageRes.text();

    const match = html.match(/ytInitialPlayerResponse\s*=\s*({[\s\S]+?})(?:\s*;\s*(?:var|<\/script>))/);
    if (!match?.[1]) throw new Error("ytInitialPlayerResponse not found in HTML");

    const data = JSON.parse(match[1]) as any;
    const tracks = data.captions?.playerCaptionsTracklistRenderer?.captionTracks;

    if (!tracks?.length) throw new Error("No caption tracks found");

    const preferredTrack = tracks.find((t: any) => t.languageCode?.startsWith('en')) ||
                          tracks[0];

    const baseCaptionUrl = preferredTrack.baseUrl;

    let finalText = '';

    // Try JSON3 (preferred)
    try {
      const jsonUrl = `${baseCaptionUrl}&fmt=json3`;
      console.log("[YT-Utils] Trying JSON3 format...");
      const jsonRes = await fetch(jsonUrl, { headers, redirect: 'follow' });

      if (jsonRes.ok) {
        const json = await jsonRes.json();
        if (json?.events?.length) {
          const segments: string[] = [];
          for (const event of json.events) {
            if (event.segs?.length) {
              segments.push(event.segs.map((s: any) => s.utf8 || s.t || '').join(''));
            } else if (event.t || event.utf8) {
              segments.push(event.t || event.utf8);
            }
          }
          finalText = segments
            .join(' ')
            .replace(/\s+/g, ' ')
            .replace(/&amp;/g, '&')
            .replace(/&quot;/g, '"')
            .replace(/&#39;/g, "'")
            .trim();

          if (finalText.length > 30) {
            console.log(`[YT-Utils] JSON3 success (${finalText.length} chars)`);
            return finalText;
          }
        }
      }
    } catch (jsonErr: any) {
      console.warn(`[YT-Utils] JSON3 failed: ${jsonErr.message}`);
    }

    // Fallback to XML/TTML (only one clean block)
    try {
      const xmlUrl = `${baseCaptionUrl}&fmt=ttml`;
      console.log("[YT-Utils] Trying TTML/XML fallback...");
      const xmlRes = await fetch(xmlUrl, { headers });

      if (xmlRes.ok) {
        const xml = await xmlRes.text();
        // Safe regex without /s flag
        const matches = xml.match(/<p[^>]*>([\s\S]*?)<\/p>/g) || [];

        finalText = matches
          .map(p => p.replace(/<[^>]+>/g, '').trim())
          .filter(Boolean)
          .join(' ')
          .replace(/\s+/g, ' ')
          .trim();

        if (finalText.length > 30) {
          console.log(`[YT-Utils] TTML success (${finalText.length} chars)`);
          return finalText;
        }
      }
    } catch (xmlErr: any) {
      console.warn(`[YT-Utils] TTML failed: ${xmlErr.message}`);
    }

    // ─── 4. Piped fallback (last resort) ───────────────────────────────────
    const pipedBases = [
      "https://pipedapi.kavin.rocks",
      "https://api.piped.io",
      "https://piped-api.lunar.icu",
      "https://pipedapi-libre.kavin.rocks",
    ];

    for (const base of pipedBases) {
      try {
        const pipedUrl = `${base}/streams/${videoId}`;
        const pipedRes = await withTimeout(fetch(pipedUrl), 15000);

        if (pipedRes.ok) {
          const json = await pipedRes.json() as any;
          const subs = json?.subtitles || [];
          if (subs.length) {
            const sub = subs.find((s: any) => s.code?.startsWith('en') || /english/i.test(s.name || '')) || subs[0];
            const txtRes = await fetch(sub.url);

            if (txtRes.ok) {
              const text = (await txtRes.text()).trim();
              if (text.length > 30) {
                console.log(`[YT-Utils] Piped success via ${base} (${text.length} chars)`);
                return text;
              }
            }
          }
        }
      } catch {
        // silent fail → next instance
      }
    }

    throw new Error("All methods failed. Video may have no captions or YouTube blocked access.");
  } catch (error: any) {
    console.error("[YT-Utils] Fatal error:", error);
    throw new Error(`Transcript fetch failed: ${error.message || 'Unknown error'}`);
  }
}
