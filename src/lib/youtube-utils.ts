// src/lib/youtube-utils.js
import { YoutubeTranscript as YtPlus } from 'youtube-transcript-plus';
import { YoutubeTranscript as YtStd } from 'youtube-transcript';
import { Innertube, UniversalCache } from 'youtubei.js';

const YT_COOKIES = process.env.YT_COOKIES || ''; // From .env.local – refresh if failing

export async function fetchYoutubeTranscript(url) {
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
  if (!videoId) throw new Error("Invalid YouTube URL or video ID");

  console.log(`[YT-Utils] Extracted Video ID: ${videoId}`);
  const normalizedUrl = `https://www.youtube.com/watch?v=${videoId}`;

  const fetchWithTimeout = (promise, ms = 15000) => {
    return Promise.race([
      promise,
      new Promise((_, reject) => setTimeout(() => reject(new Error(`Timeout after ${ms}ms`)), ms)),
    ]);
  };

  // Helper to clean and join transcript segments into plain text
  const formatTranscript = (segments) => {
    if (!segments || segments.length === 0) return '';
    return segments.map((s) => (s.text || s.snippet?.text || '')).join(' ').trim().replace(/\s+/g, ' ');
  };

  // Strategy 1: youtubei.js (Innertube) with cookies (good for restricted videos)
  try {
    console.log('[YT-Utils] Strategy 1: Innertube with cookies');
    let cookieObj = [];
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
      client_type: 'WEB', // Try WEB first, fallback to ANDROID if needed
    });
    const info = await fetchWithTimeout(yt.getBasicInfo(videoId));
    const transcriptData = await info.getTranscript();
    if (transcriptData?.transcript?.content?.body?.initial_segments) {
      const text = formatTranscript(transcriptData.transcript.content.body.initial_segments);
      console.log(`[YT-Utils] Innertube success (${text.length} chars)`);
      return text;
    }
  } catch (err) {
    console.warn(`[YT-Utils] Innertube failed: ${err.message}. Falling back...`);
    // Optional: Retry with ANDROID client
    try {
      const ytAndroid = await Innertube.create({ client_type: 'ANDROID' });
      const infoAndroid = await ytAndroid.getBasicInfo(videoId);
      const transcriptAndroid = await infoAndroid.getTranscript();
      const text = formatTranscript(transcriptAndroid.transcript.content.body.initial_segments);
      if (text) return text;
    } catch {}
  }

  // Strategy 2: youtube-transcript-plus (forces English, handles CAPTCHA better in some cases)
  try {
    console.log('[YT-Utils] Strategy 2: youtube-transcript-plus');
    const segments = await fetchWithTimeout(YtPlus.fetchTranscript(normalizedUrl, { lang: 'en' }));
    const text = formatTranscript(segments);
    if (text) {
      console.log(`[YT-Utils] Plus success (${text.length} chars)`);
      return text;
    }
  } catch (err) {
    console.warn(`[YT-Utils] Plus failed: ${err.message}. Falling back...`);
  }

  // Strategy 3: Standard youtube-transcript
  try {
    console.log('[YT-Utils] Strategy 3: youtube-transcript standard');
    const segments = await fetchWithTimeout(YtStd.fetchTranscript(normalizedUrl));
    const text = formatTranscript(segments);
    if (text) {
      console.log(`[YT-Utils] Standard success (${text.length} chars)`);
      return text;
    }
  } catch (err) {
    console.warn(`[YT-Utils] Standard failed: ${err.message}. Falling back...`);
  }

  // Strategy 4: Manual HTML parse (direct fetch with browser-like headers)
  try {
    console.log('[YT-Utils] Strategy 4: Manual HTML parse');
    const headers = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept-Language': 'en-US,en;q=0.9',
      'Cookie': YT_COOKIES, // Use cookies here too
    };
    const res = await fetch(normalizedUrl, { headers });
    const html = await res.text();
    const match = html.match(/"captionTracks":(\[.*?\])/);
    if (match) {
      const tracks = JSON.parse(match[1]);
      const enTrack = tracks.find((t) => t.languageCode === 'en') || tracks[0];
      if (enTrack) {
        const transcriptUrl = `${enTrack.baseUrl}&fmt=json3`; // JSON format for easier parsing
        const transcriptRes = await fetch(transcriptUrl, { headers });
        const json = await transcriptRes.json();
        const text = formatTranscript(json.events.map((e) => ({ text: e.segs?.map((s) => s.utf8).join('') || '' })));
        if (text) {
          console.log(`[YT-Utils] Manual success (${text.length} chars)`);
          return text;
        }
      }
    }
  } catch (err) {
    console.warn(`[YT-Utils] Manual failed: ${err.message}. Falling back to proxies...`);
  }

  // Strategy 5: Piped proxies (multiple endpoints to avoid blocks)
  const pipedEndpoints = ['https://pipedapi.kavin.rocks', 'https://api.piped.io', 'https://pipedapi.tokhmi.xyz'];
  for (const base of pipedEndpoints) {
    try {
      console.log(`[YT-Utils] Strategy 5: Piped proxy (${base})`);
      const res = await fetch(`${base}/streams/${videoId}`);
      const json = await res.json();
      const subtitles = json.subtitles || [];
      const enSub = subtitles.find((s) => s.code?.startsWith('en') || s.name?.toLowerCase().includes('english')) || subtitles[0];
      if (enSub) {
        const subRes = await fetch(enSub.url);
        const text = (await subRes.text()).replace(/[\n\r]+/g, ' ').trim(); // Clean SRT/VTT
        if (text) {
          console.log(`[YT-Utils] Piped success via ${base} (${text.length} chars)`);
          return text;
        }
      }
    } catch (err) {
      console.warn(`[YT-Utils] Piped ${base} failed: ${err.message}`);
    }
  }

  // Strategy 6: Invidious proxies (additional public instances)
  const invidiousInstances = ['https://invidious.jing.rocks', 'https://inv.tux.pizza', 'https://invidious.nerdvpn.de', 'https://invidious.drgns.space'];
  for (const base of invidiousInstances) {
    try {
      console.log(`[YT-Utils] Strategy 6: Invidious proxy (${base})`);
      const res = await fetch(`${base}/api/v1/captions/${videoId}`);
      const json = await res.json();
      const captions = json.captionTracks || json; // Varies by instance
      const enCap = captions.find((c) => c.languageCode?.startsWith('en') || c.label?.toLowerCase().includes('english')) || captions[0];
      if (enCap) {
        const fullUrl = new URL(enCap.url, base).href; // Handle relative URLs
        const capRes = await fetch(fullUrl);
        const text = (await capRes.text()).replace(/[\n\r]+/g, ' ').trim();
        if (text) {
          console.log(`[YT-Utils] Invidious success via ${base} (${text.length} chars)`);
          return text;
        }
      }
    } catch (err) {
      console.warn(`[YT-Utils] Invidious ${base} failed: ${err.message}`);
    }
  }

  throw new Error('All strategies failed. Video may lack captions, or YouTube/proxy blocks are active. Try refreshing cookies or a VPN.');
}
