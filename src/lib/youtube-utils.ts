// fetch-transcript.mjs
import { YoutubeTranscript } from 'youtube-transcript-plus';
import { Innertube } from 'youtubei.js';

export async function fetchYoutubeTranscript(url: string): Promise<string> {
  try {
    console.log(`[YT-Utils] Fetching transcript for: ${url}`);

    // Robust video ID extraction
    const extractVideoId = (url) => {
      const patterns = [
        /(?:youtube\.com\/(?:[^/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=))([^"&?/\s]{11})/i,
        /youtu\.be\/([^"&?/\s]{11})/i,
        /youtube\.com\/shorts\/([^"&?/\s]{11})/i,
      ];
      for (const pattern of patterns) {
        const match = url.match(pattern);
        if (match) return match[1];
      }
      // If already 11-char ID
      return url.trim().length === 11 ? url.trim() : null;
    };

    const videoId = extractVideoId(url);
    if (!videoId) throw new Error("Could not extract valid YouTube video ID");

    console.log(`[YT-Utils] Video ID: ${videoId}`);
    const normalizedUrl = `https://www.youtube.com/watch?v=${videoId}`;

    // 1. Innertube with cookies (best for restricted videos)
    const cookies = process.env.YT_COOKIES || "";
    if (cookies) {
      try {
        console.log("[YT-Utils] Trying Innertube with cookies...");
        const yt = await Innertube.create({
          cookie: cookies, // can be string or object – adjust if needed
          generate_session_locally: true,
        });
        const info = await yt.getInfo(videoId);
        const transcriptData = await info.getTranscript();
        if (transcriptData?.transcript?.content?.body?.initial_segments?.length) {
          const text = transcriptData.transcript.content.body.initial_segments
            .map(s => s.snippet?.text || '')
            .filter(Boolean)
            .join(' ');
          if (text.length > 50) {
            console.log(`[YT-Utils] Innertube success (${text.length} chars)`);
            return text;
          }
        }
      } catch (err) {
        console.warn(`[YT-Utils] Innertube failed: ${err.message}`);
      }
    }

    // Timeout helper
    const withTimeout = (promise, ms = 30000) =>
      Promise.race([
        promise,
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error(`Timeout after ${ms}ms`)), ms)
        ),
      ]);

    // 2. Library attempt (with retry feel)
    try {
      console.log("[YT-Utils] Trying youtube-transcript-plus...");
      const transcript = await withTimeout(
        YoutubeTranscript.fetchTranscript(videoId, { lang: 'en' })
      );
      if (transcript?.length > 0) {
        const fullText = transcript.map(t => t.text).join(' ').trim();
        console.log(`[YT-Utils] Library success (${fullText.length} chars)`);
        return fullText;
      }
    } catch (err) {
      console.warn(`[YT-Utils] Library failed: ${err.message}`);
    }

    // 3. Manual HTML parse (most reliable non-API method)
    try {
      console.log("[YT-Utils] Trying manual HTML parse...");
      const res = await fetch(normalizedUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36',
          'Accept-Language': 'en-US,en;q=0.9',
          'Cookie': 'CONSENT=YES+cb.20250101-01-0',
        },
      });
      const html = await res.text();

      const match = html.match(/ytInitialPlayerResponse\s*=\s*({.+?})\s*;\s*(?:var\s+meta|<\/script>)/s);
      if (!match) throw new Error("No player response found");

      const data = JSON.parse(match[1]);
      const tracks = data?.captions?.playerCaptionsTracklistRenderer?.captionTracks;
      if (!tracks?.length) throw new Error("No caption tracks available");

      const track = tracks.find(t => t.languageCode.startsWith('en')) || tracks[0];
      const url = `${track.baseUrl}&fmt=srv3`; // srv3 is usually clean XML

      const xmlRes = await fetch(url);
      const xml = await xmlRes.text();

      const texts = xml.match(/<text[^>]*>(.*?)<\/text>/gs) || [];
      const fullText = texts
        .map(t => t.replace(/<text[^>]*>|<\/text>/g, ''))
        .map(t => decodeURIComponent(t.replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'")))
        .join(' ')
        .replace(/\s+/g, ' ')
        .trim();

      if (fullText.length > 50) {
        console.log(`[YT-Utils] Manual parse success (${fullText.length} chars)`);
        return fullText;
      }
    } catch (err) {
      console.warn(`[YT-Utils] Manual fallback failed: ${err.message}`);
    }

    // 4. Piped fallback (public instances – rotate if one blocks)
    const pipedBases = [
      "https://pipedapi.kavin.rocks",
      "https://piped-api.lunar.icu",
      "https://pipedapi-libre.kavin.rocks",
      "https://api-piped-proxy.ashwin.run",
    ];

    for (const base of pipedBases) {
      try {
        console.log(`[YT-Utils] Trying Piped: ${base}`);
        const res = await withTimeout(fetch(`${base}/streams/${videoId}`), 12000);
        if (!res.ok) continue;
        const json = await res.json();
        if (json?.subtitles?.length) {
          const sub = json.subtitles.find(s => s.code?.startsWith('en') || s.name?.toLowerCase().includes('english')) || json.subtitles[0];
          const txt = await (await fetch(sub.url)).text();
          console.log(`[YT-Utils] Piped success via ${base} (${txt.length} chars)`);
          return txt.trim();
        }
      } catch {}
    }

    throw new Error("All methods failed. Video may have no captions, or YouTube blocked all requests.");
  } catch (error) {
    console.error("[YT-Utils] Final error:", error.message);
    throw error;
  }
}

// Quick test when running standalone
if (import.meta.url === `file://${process.argv[1]}`) {
  (async () => {
    try {
      const url = "https://www.youtube.com/watch?v=dQw4w9WgXcQ"; // Rickroll test – has CC
      const transcript = await fetchYoutubeTranscript(url);
      console.log("Success! First 300 chars:\n", transcript.slice(0, 300));
      console.log("\nTotal length:", transcript.length);
    } catch (e) {
      console.error("Test failed:", e);
    }
  })();
}
