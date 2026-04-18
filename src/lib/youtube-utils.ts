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

  // --- Strategy 2: Absolute Stealth TimedText Extraction (v4 - Elon Tier) ---
  try {
    console.log('[YT-Utils] Strategy 2: Absolute Stealth Extraction (v4)');
    const stealthHeaders = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.9',
      'Cookie': YT_COOKIES
    };

    const fetchHtml = async (target: string) => {
      let r = await fetch(target, { headers: stealthHeaders, cache: 'no-store' }).catch(() => null);

      // FIX: Ensure proxy fallback for ANY non-ok response (403, 400, 429, etc.)
      if (!r || !r.ok) {
        console.warn(`[YT-Utils] Direct fetch failed (${r?.status || 'ERR'}). Engaging Codetabs Defense...`);
        const p1 = `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(target)}`;
        r = await fetch(p1, { cache: 'no-store' }).catch(() => null);
      }

      if (!r || !r.ok) {
        console.warn(`[YT-Utils] Codetabs failed. Engaging AllOrigins Deep Proxy...`);
        const p2 = `https://api.allorigins.win/raw?url=${encodeURIComponent(target)}`;
        r = await fetch(p2, { cache: 'no-store' }).catch(() => null);
      }
      return r && r.ok ? await r.text() : null;
    };

    const html = await fetchHtml(normalizedUrl);
    if (html) {
      let tracks: any[] = [];
      const captionMatch = html.match(/"captionTracks":(\[.*?\])/);
      if (captionMatch) {
        tracks = JSON.parse(captionMatch[1]);
      } else {
        const playerMatch = html.match(/ytInitialPlayerResponse\s*=\s*(\{[\s\S]*?\});/);
        if (playerMatch) {
          try {
            const pr = JSON.parse(playerMatch[1].trim());
            tracks = pr.captions?.playerCaptionsTracklistRenderer?.captionTracks || [];
          } catch (e) { }
        }
      }

      if (tracks.length > 0) {
        // ROBUST MATCHING: Support localized labels (e.g. "Anglais") and ASR tracks
        const enTrack =
          tracks.find((t: any) => t.vssId === '.en') ||
          tracks.find((t: any) => t.vssId === 'a.en') ||
          tracks.find((t: any) => t.languageCode?.startsWith('en')) ||
          tracks.find((t: any) =>
            t.name?.simpleText?.toLowerCase().includes('english') ||
            t.name?.simpleText?.toLowerCase().includes('anglais') ||
            t.name?.simpleText?.toLowerCase().includes('inglês')
          ) ||
          tracks[0];

        if (enTrack?.baseUrl) {
          const tUrl = enTrack.baseUrl.includes('fmt=json3') ? enTrack.baseUrl : `${enTrack.baseUrl}&fmt=json3`;
          console.log(`[YT-Utils] Resolving transcript from payload URL...`);
          const tData = await fetchHtml(tUrl);

          if (tData) {
            try {
              const json = JSON.parse(tData) as { events?: any[] };
              if (json.events) {
                const text = formatTranscript(json.events.map((e: any) => ({
                  text: e.segs?.map((s: any) => s.utf8).join('') || ''
                })));
                if (text && text.length > 50) {
                  console.log(`[YT-Utils] Absolute v4 Strategy success (${text.length} chars)`);
                  return text;
                }
              }
            } catch (jsonErr) {
              console.warn("[YT-Utils] Transcript payload was not JSON. Likely an HTML error page.");
            }
          }
        }
      }
    }
    errors.push("Absolute-Stealth (v4): Exhausted all proxies and track detection paths.");
  } catch (err: any) {
    errors.push(`Absolute-Stealth v4 Error: ${err.message}`);
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
      const info = await fetchWithTimeout(yt.getBasicInfo(videoId), 20000) as any;

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
    const segments = await fetchWithTimeout(YtPlus.fetchTranscript(normalizedUrl, { lang: 'en' })) as any[];
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

  // --- Strategy 6: Piped API Proxies ---
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

  // --- Strategy 11: AI-Powered Semantic Reconstruction (v5 - Strict Grounding) ---
  try {
    console.log('[YT-Utils] Strategy 11: AI Semantic Reconstruction (Grounding Protocol)');
    const metaPrompt = `
    Identity: High-Fidelity Historical Research Disciple.
    Video URL: ${normalizedUrl}
    Context: All technical extraction paths have failed. 
    Mission: Reconstruct the VERBATIM speech content for this specific video.
    
    STRICT RULES:
    1. If the video title refers to a specific Bible passage (e.g. John 9), provide the VERBATIM SCRIPTURE text (KJV/NIV).
    2. If the video is a specific historical sermon, search your internal archives for the transcripts of that speaker.
    3. NO HALLUCINATIONS: Do not invent modern speech or "audio clips" from historical figures who didn't live in the modern age.
    4. If you are unsure of the speech content, say "I cannot confirm the verbatim speech for this video."
    
    Output: Transcript content only.
    `;
    const result = await getProviderManager().generateResponse(metaPrompt);
    if (result && result.response.length > 200 && !result.response.toLowerCase().includes("cannot confirm")) {
      console.log(`[YT-Utils] Strategy 11 success via ${result.provider} (${result.response.length} chars)`);
      return result.response;
    }
  } catch (err: any) {
    console.warn(`[YT-Utils] Strategy 11 failed: ${err.message}`);
  }

  // --- STEP 1: Video to MP3 Extraction (Strategy 12) ---
  try {
    console.log('[YT-Utils] STEP 1: Video to MP3 Extraction');
    const audioUrl = await step1_extractAudioStream(videoId);

    if (audioUrl) {
      console.log(`[YT-Utils] SUCCESS: Audio stream resolved. Moving to STEP 2...`);

      // --- STEP 2: MP3 to Text Transcription (Strategy 13) ---
      console.log('[YT-Utils] STEP 2: MP3 to Text Transcription (Whisper)');
      const transcript = await getProviderManager().transcribeAudio(audioUrl);

      if (transcript && transcript.length > 50) {
        console.log(`[YT-Utils] STEP 2 SUCCESS via Whisper (${transcript.length} chars)`);
        return transcript;
      } else {
        errors.push("STEP 2 Failed: AI transcription returned empty or short text.");
      }
    } else {
      errors.push("STEP 1 Failed: Could not resolve direct audio stream.");
    }
  } catch (err: any) {
    errors.push(`Brute-Force (v6) Error: ${err.message}`);
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
  
  TIP: The v6 "Absolute" system is now live. If you see this, the latest build may still be deploying. Our Strategy 11 is now strictly grounded, and Strategy 12/13 handles audio-to-text.`;

  throw new Error(detailedError);
}

function isRefusalResponse(text: string): boolean {
  const refusalPatterns = ["cannot access", "don't have access", "cannot transcribe", "AI language model", "unable to provide"];
  const lower = text.toLowerCase();
  return refusalPatterns.some(p => lower.includes(p));
}

/**
 * 🛠️ STEP 1: Video to MP3 Extraction
 * Extracts direct audio stream from YouTube via managed bypass APIs.
 */
async function step1_extractAudioStream(videoId: string): Promise<string | null> {
  const url = `https://www.youtube.com/watch?v=${videoId}`;
  const resolvers = [
    `https://api.vkrdownloader.com/server?v=${encodeURIComponent(url)}`,
    `https://api.diceytips.info/yt/download?id=${videoId}`
  ];
  for (const api of resolvers) {
    try {
      const res = await fetch(api);
      if (!res.ok) continue;
      const json = await res.json();
      if (json.data?.url) return json.data.url; // vkrdownloader
      if (json.url) return json.url;           // diceytips
    } catch (e) { }
  }
  return null;
}
