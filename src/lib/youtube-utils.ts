// src/lib/youtube-utils.ts

import { YoutubeTranscript as YtPlus } from 'youtube-transcript-plus';
import { YoutubeTranscript as YtStd } from 'youtube-transcript';
import { Innertube, UniversalCache } from 'youtubei.js';

const YT_COOKIES = process.env.YT_COOKIES || '';

export async function fetchYoutubeTranscript(url: string): Promise<string> {
  console.log(`[YT-Utils] Fetching transcript for: ${url}`);

  const extractVideoId = (input: string): string | null => {
    const patterns = [
      /(?:youtube\.com\/(?:[^/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=))([^"&?/\s]{11})/i,
      /youtu\.be\/([^"&?/\s]{11})/i,
      /youtube\.com\/shorts\/([^"&?/\s]{11})/i,
    ];
    for (const pattern of patterns) {
      const match = input.match(pattern);
      if (match) return match[1];
    }
    return input.trim().length === 11 ? input.trim() : null;
  };

  const videoId = extractVideoId(url);
  if (!videoId) throw new Error("Could not extract valid YouTube video ID");

  console.log(`[YT-Utils] Video ID: ${videoId}`);
  const normalizedUrl = `https://www.youtube.com/watch?v=${videoId}`;

  const fetchWithTimeout = async <T>(
    promise: Promise<T>,
    ms: number = 15000
  ): Promise<T> => {
    return Promise.race([
      promise,
      new Promise<T>((_, reject) =>
        setTimeout(() => reject(new Error(`Timeout after ${ms}ms`)), ms)
      ),
    ]);
  };

  const formatTranscript = (segments: any[]): string => {
    if (!segments || segments.length === 0) return '';
    return segments
      .map((s) => s.text || s.snippet?.text || '')
      .join(' ')
      .trim()
      .replace(/\s+/g, ' ');
  };

  // Strategy 1: Innertube (youtubei.js) ───────────────────────────────────────
  try {
    console.log('[YT-Utils] Strategy 1: Innertube with cookies');
    let cookieObj: { name: string; value: string }[] = [];
    if (YT_COOKIES) {
      cookieObj = YT_COOKIES.split('; ').map((c) => {
        const [name, value] = c.split('=');
        return { name, value };
      });
    }

    const yt = await Innertube.create({
      cookie: cookieObj,
      cache: new UniversalCache(false),
      generate_session_locally: true,
      location: 'US',
      lang: 'en',
      client_type: 'WEB',
    });

    const info = await fetchWithTimeout(yt.getBasicInfo(videoId));
    const transcriptData = await info.getTranscript();

    if (transcriptData?.transcript?.content?.body?.initial_segments) {
      const text = formatTranscript(transcriptData.transcript.content.body.initial_segments);
      if (text) {
        console.log(`[YT-Utils] Innertube success (${text.length} chars)`);
        return text;
      }
    }
  } catch (err: any) {
    console.warn(`[YT-Utils] Innertube failed: ${err.message}`);
  }

  // ... (keep all other strategies exactly as before) ...

  throw new Error(
    'All strategies failed. Video may lack captions, or YouTube/proxy blocked requests.'
  );
}
