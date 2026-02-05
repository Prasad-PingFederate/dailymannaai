const { Innertube, UniversalCache } = require('youtubei.js');

async function testVideo(videoId) {
    console.log(`Testing Video: ${videoId}`);
    try {
        const yt = await Innertube.create({
            cache: new UniversalCache(false),
            generate_session_locally: true,
            location: 'US',
            lang: 'en'
        });

        console.log("Innertube initialized. Fetching Basic Info...");
        const info = await yt.getBasicInfo(videoId);
        console.log("Title:", info.basic_info.title);

        // Testing Strategy 2: Absolute Proxy Chain
        const target = `https://www.youtube.com/watch?v=${videoId}`;
        console.log(`\n--- Proxy Layer Testing: ${target} ---`);

        const proxies = [
            `https://api.allorigins.win/raw?url=${encodeURIComponent(target)}`,
            `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(target)}`
        ];

        for (const p of proxies) {
            try {
                console.log(`Testing Proxy: ${p.substring(0, 30)}...`);
                const pr = await fetch(p, { cache: 'no-store' });
                console.log(`Status: ${pr.status}`);
                const text = await pr.text();
                console.log(`Length: ${text.length}`);

                // SAVE RAW HTML FOR AUDIT
                const fs = require('fs');
                fs.writeFileSync(`proxy_dump_${proxies.indexOf(p)}.html`, text);
                console.log(`Saved dump to proxy_dump_${proxies.indexOf(p)}.html`);

                const match = text.match(/"captionTracks":(\[.*?\])/);
                if (match) {
                    console.log("✅ SUCCESS: Found captionTracks string in HTML!");
                    const tracks = JSON.parse(match[1]);
                    console.log("First track sample:", JSON.stringify(tracks[0], null, 2));
                    tracks.forEach(t => console.log(`  - ${t.name?.simpleText || t.name?.text || 'Untitled'} (${t.languageCode}) [${t.vssId}]`));
                    break;
                } else {
                    console.log("❌ FAIL: No captionTracks in proxy response.");
                    if (text.includes("Cloudflare") || text.includes("blocked")) {
                        console.log("!!! Proxy is blocked by Cloudflare/Bot-detection.");
                    }
                }
            } catch (e) {
                console.log(`Proxy Error: ${e.message}`);
            }
        }

        // Testing Strategy 6/Tactiq approach: Raw Fetch
        console.log("Fetching Raw HTML...");
        const res = await fetch(`https://www.youtube.com/watch?v=${videoId}`, {
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36' }
        });
        const html = await res.text();
        const captionMatch = html.match(/"captionTracks":(\[.*?\])/);
        if (captionMatch) {
            console.log("Found captionTracks string in HTML!");
            const tracks = JSON.parse(captionMatch[1]);
            tracks.forEach(t => console.log(`- ${t.name.simpleText} (${t.languageCode}) [${t.vssId}]`));
        } else {
            console.log("No captionTracks string found in HTML.");
        }

        const captions = info.captions?.player_captions_tracklist_renderer?.caption_tracks || [];
        console.log("Available Caption Tracks:", captions.length);
        captions.forEach(c => console.log(`- ${c.name.text} (${c.language_code})`));

        try {
            const transcript = await info.getTranscript();
            console.log("Transcript fetched! Segments:", transcript.transcript.content.body.initial_segments.length);
            console.log("First segment:", transcript.transcript.content.body.initial_segments[0].snippet.text);
        } catch (e) {
            console.error("getTranscript failed:", e.message);
        }
    } catch (err) {
        console.error("Test failed:", err.message);
        if (err.response) {
            console.error("Response data:", await err.response.text());
        }
    }
}

testVideo('DHBo7ka3YZQ');
