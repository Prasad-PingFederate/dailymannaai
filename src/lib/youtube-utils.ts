// src/lib/youtube-utils.ts
import { Innertube } from 'youtubei.js';

export async function fetchYoutubeTranscript(url: string): Promise<string> {
  try {
    console.log(`[YT-Utils] Fetching transcript for: ${url}`);

    // ─── Video ID extraction ────────────────────────────────────────
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
    if (!videoId) {
      throw new Error("Invalid YouTube URL or video ID");
    }

    console.log(`[YT-Utils] Video ID: ${videoId}`);
    const watchUrl = `https://www.youtube.com/watch?v=${videoId}`;

    // Headers to mimic real browser (very important in 2026)
    const headers = {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/132.0.0.0 Safari/537.36',
      'Accept-Language': 'en-US,en;q=0.9',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Cookie': 'CONSENT=YES+cb.20250101-01-0', // basic consent bypass
    };

    // ─── 1. Try Innertube with cookies (best for restricted videos) ──
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
          if (text.length > 50) {
            console.log(`[YT-Utils] Innertube success (${text.length} chars)`);
            return text;
          }
        }
      } catch (err: any) {
        console.warn(`[YT-Utils] Innertube failed: ${err.message || err}`);
      }
    }

    // Timeout helper
    const withTimeout = <T>(p: Promise<T>, ms = 20000): Promise<T> =>
      Promise.race([
        p,
        new Promise<T>((_, r) => setTimeout(() => r(new Error(`Timeout after ${ms}ms`)), ms)),
      ]);

    // ─── 2. Manual caption fetch (most reliable in 2026) ─────────────
    try {
      console.log("[YT-Utils] Fetching video page for captions...");
      const res = await withTimeout(fetch(watchUrl, { headers }));
      if (!res.ok) throw new Error(`YouTube page HTTP ${res.status}`);

      const html = await res.text();

      // More robust regex for ytInitialPlayerResponse (handles minified JS better)
      const match = html.match(/ytInitialPlayerResponse\s*=\s*({.+?})(?:\s*;\s*(?:var|<\/script>))/s);
      if (!match?.[1]) throw new Error("ytInitialPlayerResponse not found");

      const data = JSON.parse(match[1]) as any;
      const tracks = data.captions?.playerCaptionsTracklistRenderer?.captionTracks;

      if (!tracks?.length) throw new Error("No caption tracks available");

      // Prefer English, fallback to first available
      let track = tracks.find((t: any) => t.languageCode?.startsWith('en')) ||
                  tracks.find((t: any) => t.languageCode) ||
                  tracks[0];

      let captionUrl = track.baseUrl;
      // Try modern JSON format first (more reliable parsing)
      const jsonUrl = `${captionUrl}&fmt=json3`;
      console.log("[YT-Utils] Trying json3 format...");

      let text = '';
      try {
        const jsonRes = await fetch(jsonUrl, { headers });
        if (jsonRes.ok) {
          const json = await jsonRes.json();
          if (json.events) {
            text = json.events
              .map((e: any) => e.segs?.map((s: any) => s.utf8 || '').join('') || '')
              .filter(Boolean)
              .join(' ')
              .trim();
          }
        }
      } catch {}

      // Fallback to XML if json3 fails
      if (!text) {
        const xmlUrl = `${captionUrl}&fmt=ttml`; // or srv3/vtt
        const xmlRes = await fetch(xmlUrl, { headers });
        if (!xmlRes.ok) throw new Error(`Caption fetch failed ${xmlRes.status}`);

        const xml = await xmlRes.text();
        const segments = xml.match(/<p[^>]*>(.*?)<\/p>/gs) || [];
        text = segments
          .map(p => p.replace(/<[^>]+>/g, ''))
          .join(' ')
          .replace(/\s+/g, ' ')
          .trim();
      }

      if (text.length > 50) {
        console.log(`[YT-Utils] Manual caption success (${text.length} chars)`);
        return text;
      }
    } catch (err: any) {
      console.warn(`[YT-Utils] Manual caption failed: ${err.message}`);
    }

    // ─── 3. Piped fallback (expanded list 2026) ───────────────────────
    const pipedInstances = [
      "https://pipedapi.kavin.rocks",
      "https://api.piped.io",
      "https://piped-api.lunar.icu",
      "https://pipedapi-libre.kavin.rocks",
      "https://piped-api-proxy.ashwin.run",
      "https://piped.tor.hole",
    ];

    for (const base of pipedInstances) {
      try {
        console.log(`[YT-Utils] Piped try: ${base}`);
        const res = await withTimeout(fetch(`${base}/streams/${videoId}`), 15000);
        if (!res.ok) continue;

        const json = await res.json() as any;
        const subs = json?.subtitles || [];
        if (!subs.length) continue;

        const sub = subs.find((s: any) => s.code?.startsWith('en') || /english/i.test(s.name || '')) || subs[0];
        const txtRes = await fetch(sub.url);
        if (!txtRes.ok) continue;

        const text = (await txtRes.text()).trim();
        if (text.length > 50) {
          console.log(`[YT-Utils] Piped success (${text.length} chars via ${base})`);
          return text;
        }
      } catch {}
    }

    throw new Error(
      "All transcript methods failed. Video may lack captions, be age-restricted, or YouTube is blocking requests."
    );
  } catch (error: any) {
    console.error("[YT-Utils] Fatal:", error);
    throw new Error(`Failed to fetch transcript: ${error.message}`);
  }
}
