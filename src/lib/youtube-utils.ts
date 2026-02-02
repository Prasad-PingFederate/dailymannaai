// src/lib/youtube-utils.ts

import { YoutubeTranscript as YtPlus } from 'youtube-transcript-plus';
import { YoutubeTranscript as YtStd } from 'youtube-transcript';
import { Innertube, UniversalCache } from 'youtubei.js';
import { performWebSearch } from './tools/web-search';
import { getProviderManager } from './ai/gemini';

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

  const normalizedUrl = `https://www.youtube.com/watch?v=${videoId}`;

  const fetchWithTimeout = async <T>(promise: Promise<T>, ms: number = 15000): Promise<T> => {
    return Promise.race([
      promise,
      new Promise<T>((_, reject) => setTimeout(() => reject(new Error(`Timeout after ${ms}ms`)), ms)),
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

  const errors: string[] = [];

  // --- Strategy 1: AI-based Multimodal Transcription (PRIMARY Strategy) ---
  try {
    console.log('[YT-Utils] Strategy 1: AI-based Transcription (Primary)');
    const transcript = await getProviderManager().transcribeVideo(normalizedUrl);
    if (transcript && transcript.length > 50) {
      console.log(`[YT-Utils] Strategy 1 success (${transcript.length} chars)`);
      return transcript;
    }
    errors.push(`AI Primary: Response too short (${transcript?.length || 0} chars)`);
  } catch (err: any) {
    const msg = `AI Primary failed: ${err.message}`;
    console.warn(`[YT-Utils] ${msg}`);
    errors.push(msg);
  }

  // --- Strategy 2: Tactiq-Style TimedText Extraction (High Reliability) ---
  try {
    console.log('[YT-Utils] Strategy 2: Tactiq-Style extraction (Official TimedText)');
    const headers = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
      'Accept-Language': 'en-US,en;q=0.9',
      'Cookie': YT_COOKIES,
    };
    const res = await fetch(normalizedUrl, { headers });
    const html = await res.text();

    let transcriptUrl = '';
    const playerResMatch = html.match(/ytInitialPlayerResponse\s*=\s*(\{[\s\S]*?\});/);
    if (playerResMatch) {
      const playerRes = JSON.parse(playerResMatch[1].trim());
      const captionTracks = playerRes.captions?.playerCaptionsTracklistRenderer?.captionTracks || [];
      const enTrack = captionTracks.find((t: any) => t.languageCode?.startsWith('en')) || captionTracks[0];
      if (enTrack?.baseUrl) {
        transcriptUrl = enTrack.baseUrl.includes('fmt=json3') ? enTrack.baseUrl : `${enTrack.baseUrl}&fmt=json3`;
      }
    }

    if (transcriptUrl) {
      const transRes = await fetch(transcriptUrl, { headers });
      const json = await transRes.json();
      if (json.events) {
        const text = formatTranscript(json.events.map((e: any) => ({ text: e.segs?.map((s: any) => s.utf8).join('') || '' })));
        if (text && text.length > 50) {
          console.log(`[YT-Utils] Strategy 2 success (${text.length} chars)`);
          return text;
        }
      }
    }
    errors.push("Tactiq-Style: No transcript found in player response");
  } catch (err: any) {
    errors.push(`Tactiq-Style failed: ${err.message}`);
  }

  // --- Strategy 3: Innertube (youtubei.js) with Client Rotation ---
  const clientTypes = ['TV', 'IOS', 'MWEB', 'WEB', 'ANDROID'];
  for (const client of clientTypes) {
    try {
      console.log(`[YT-Utils] Strategy 3: Innertube (${client})`);
      const yt = await Innertube.create({
        cookie: YT_COOKIES,
        cache: new UniversalCache(false),
        generate_session_locally: true,
        location: 'US',
        lang: 'en',
        client_type: client as any,
      });

      console.log(`[YT-Utils] Innertube (${client}) initialized, fetching info...`);
      const info = await fetchWithTimeout(yt.getBasicInfo(videoId), 20000);

      try {
        const transcriptData = await info.getTranscript();
        if (transcriptData?.transcript?.content?.body?.initial_segments) {
          const text = formatTranscript(transcriptData.transcript.content.body.initial_segments);
          if (text) {
            console.log(`[YT-Utils] Innertube success with ${client} (${text.length} chars)`);
            return text;
          }
        } else {
          errors.push(`Innertube (${client}): No segments in transcript data`);
        }
      } catch (transcriptErr: any) {
        const msg = `Innertube (${client}) getTranscript failed: ${transcriptErr.message}`;
        console.warn(`[YT-Utils] ${msg}`);
        errors.push(msg);
      }
    } catch (err: any) {
      const msg = `Innertube (${client}) init failed: ${err.message}`;
      console.warn(`[YT-Utils] ${msg}`);
      errors.push(msg);
    }
  }

  // --- Strategy 4: youtube-transcript-plus ---
  try {
    console.log('[YT-Utils] Strategy 4: youtube-transcript-plus');
    const segments = await fetchWithTimeout(YtPlus.fetchTranscript(normalizedUrl, { lang: 'en' }));
    const text = formatTranscript(segments);
    if (text) return text;
    errors.push("Plus: Returned empty text");
  } catch (err: any) {
    const msg = `Plus failed: ${err.message}`;
    console.warn(`[YT-Utils] ${msg}`);
    errors.push(msg);
  }

  // --- Strategy 5: Standard youtube-transcript ---
  try {
    console.log('[YT-Utils] Strategy 5: Standard youtube-transcript');
    const segments = (await fetchWithTimeout(YtStd.fetchTranscript(normalizedUrl) as any)) as any[];
    const text = formatTranscript(segments);
    if (text) return text;
    errors.push("Standard: Returned empty text");
  } catch (err: any) {
    const msg = `Standard failed: ${err.message}`;
    console.warn(`[YT-Utils] ${msg}`);
    errors.push(msg);
  }

  // --- Strategy 6: Manual HTML Parse (Extended) ---
  try {
    console.log('[YT-Utils] Strategy 6: Manual HTML parse');
    const headers = {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept-Language': 'en-US,en;q=0.9',
      'Cookie': YT_COOKIES,
    };
    const res = await fetch(normalizedUrl, { headers });
    const html = await res.text();

    let tracks: any[] = [];
    const captionMatch = html.match(/"captionTracks":(\[.*?\])/);
    if (captionMatch) {
      tracks = JSON.parse(captionMatch[1]);
    }

    if (tracks.length > 0) {
      const enTrack = tracks.find((t: any) => t.languageCode === 'en' || t.languageCode?.startsWith('en')) || tracks[0];
      if (enTrack) {
        const transcriptUrl = enTrack.baseUrl.includes('fmt=json3') ? enTrack.baseUrl : `${enTrack.baseUrl}&fmt=json3`;
        const transcriptRes = await fetch(transcriptUrl, { headers });
        const json = await transcriptRes.json();
        if (json.events) {
          const text = formatTranscript(json.events.map((e: any) => ({ text: e.segs?.map((s: any) => s.utf8).join('') || '' })));
          if (text) return text;
        }
      }
    }
    errors.push("Manual HTML: No tracks found");
  } catch (err: any) {
    errors.push(`Manual failed: ${err.message}`);
  }

  // --- Strategy 7: Piped API Proxies ---
  const pipedInstances = [
    'https://pipedapi.kavin.rocks',
    'https://api.piped.io',
    'https://pipedapi.tokhmi.xyz',
    'https://pipedapi.moomoo.me',
    'https://pipedapi.leptons.xyz'
  ];
  for (const base of pipedInstances) {
    try {
      console.log(`[YT-Utils] Strategy 7: Piped (${base})`);
      const res = await fetch(`${base}/streams/${videoId}`);
      if (!res.ok) continue;
      const json = await res.json();
      const subtitles = json.subtitles || [];
      const enSub = subtitles.find((s: any) => s.code?.startsWith('en')) || subtitles[0];
      if (enSub) {
        const subRes = await fetch(enSub.url);
        const text = (await subRes.text()).replace(/[\n\r]+/g, ' ').trim();
        if (text && text.length > 20) return text;
      }
    } catch (e: any) {
      errors.push(`Piped (${base}): ${e.message}`);
    }
  }

  // --- Strategy 8: Invidious API Proxies ---
  const invidiousInstances = [
    'https://invidious.jing.rocks',
    'https://inv.tux.pizza',
    'https://yewtu.be'
  ];
  for (const base of invidiousInstances) {
    try {
      console.log(`[YT-Utils] Strategy 8: Invidious (${base})`);
      const res = await fetch(`${base}/api/v1/captions/${videoId}`);
      if (!res.ok) continue;
      const json = await res.json();
      const captions = Array.isArray(json) ? json : json.captionTracks || [];
      const enCap = captions.find((c: any) => c.languageCode?.startsWith('en')) || captions[0];
      if (enCap) {
        const fullUrl = enCap.url.startsWith('http') ? enCap.url : new URL(enCap.url, base).href;
        const capRes = await fetch(fullUrl);
        const text = (await capRes.text()).replace(/[\n\r]+/g, ' ').trim();
        if (text && text.length > 20) return text;
      }
    } catch (e: any) {
      errors.push(`Invidious (${base}): ${e.message}`);
    }
  }

  // --- Strategy 9: Direct Player API (POST) ---
  try {
    console.log('[YT-Utils] Strategy 9: Direct Player API (POST)');
    const playerUrl = 'https://www.youtube.com/youtubei/v1/player?key=AIzaSyAO_FJ2Sl_6VpUvTkvmId4T5uJ_tC1B57k';
    const payload = {
      videoId,
      context: { client: { clientName: 'WEB_REMIX', clientVersion: '0.1.20240125.01.00', hl: 'en', gl: 'US' } },
    };
    const res = await fetch(playerUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (res.ok) {
      const data = await res.json();
      const tracks = data.captions?.playerCaptionsTracklistRenderer?.captionTracks || [];
      const enTrack = tracks.find((t: any) => t.languageCode?.startsWith('en')) || tracks[0];
      if (enTrack) {
        const transRes = await fetch(enTrack.baseUrl + '&fmt=json3');
        const json = await transRes.json();
        if (json.events) {
          const text = formatTranscript(json.events.map((e: any) => ({ text: e.segs?.map((s: any) => s.utf8).join('') || '' })));
          if (text) return text;
        }
      }
    }
  } catch (err: any) {
    errors.push(`Player API failed: ${err.message}`);
  }

  // --- Strategy 10: Search-based Fallback ---
  try {
    console.log('[YT-Utils] Strategy 10: Search-based Fallback');
    const searchResults = await performWebSearch(`${videoId} transcript verbatim`);
    for (const result of searchResults) {
      if (result.url.includes('youtube.com')) continue;
      try {
        const res = await fetch(result.url);
        const text = await res.text();
        if (text.length > 1000 && !text.includes('<!DOCTYPE html>')) return text.substring(0, 50000);
      } catch (e) { }
    }
  } catch (err: any) { }

  const detailedError = `All ultra-robust strategies failed. YouTube is blocking all known extraction paths from this server. 
  
  --- DEBUG LOG (TOP 5 FAILURES) ---
  ${errors.slice(0, 5).join("\n")}
  
  TIP: If you just generated this URL, YouTube might take a moment to index the transcript. Please try again in 1 minute. Our systems are working overtime to bypass this block!`;

  throw new Error(detailedError);
}
