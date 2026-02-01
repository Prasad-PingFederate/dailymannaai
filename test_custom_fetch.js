
const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

async function fetchTranscript(videoId) {
    try {
        const videoPageUrl = `https://www.youtube.com/watch?v=${videoId}`;
        console.log(`[CustomFetch] Fetching video page: ${videoPageUrl}`);

        const response = await fetch(videoPageUrl, {
            headers: {
                'User-Agent': USER_AGENT,
                'Accept-Language': 'en-US,en;q=0.9',
            }
        });

        const html = await response.text();

        // Robust extraction of player response
        let playerResponse;
        try {
            const split1 = html.split('var ytInitialPlayerResponse = ');
            if (split1.length > 1) {
                const split2 = split1[1].split('};')[0] + '}';
                playerResponse = JSON.parse(split2);
                console.log("[CustomFetch] Found ytInitialPlayerResponse variable.");
            }
        } catch (e) {
            console.log("Failed to parse ytInitialPlayerResponse variable");
        }

        if (!playerResponse) {
            // Try fetching "captions" regex broadly
            const match = html.match(/"captionTracks":(\[.*?\])/);
            if (match) {
                playerResponse = { captions: { playerCaptionsTracklistRenderer: { captionTracks: JSON.parse(match[1]) } } };
                console.log("[CustomFetch] Found captionTracks via regex.");
            }
        }

        if (!playerResponse || !playerResponse.captions || !playerResponse.captions.playerCaptionsTracklistRenderer) {
            console.log("[CustomFetch] Player response or captions not found.");
            // Debug - check for consent page or other redirects
            if (html.includes('consent.youtube.com')) console.log("Consent page detected");
            if (html.includes('class="g-recaptcha"')) console.log("CAPTCHA detected");

            throw new Error("Generic failure to find captions in page source. YouTube might be serving a different layout.");
        }

        const captionTracks = playerResponse.captions.playerCaptionsTracklistRenderer.captionTracks;

        // Find English track (auto-generated or manual)
        const englishTrack = captionTracks.find(t => t.languageCode === 'en') || captionTracks[0];

        if (!englishTrack) {
            throw new Error("No English caption track found.");
        }

        console.log(`[CustomFetch] Found track: ${englishTrack.name.simpleText} (${englishTrack.languageCode})`);

        const transcriptUrl = englishTrack.baseUrl;
        console.log(`[CustomFetch] Fetching transcript XML from: ${transcriptUrl}`);

        const transcriptResponse = await fetch(transcriptUrl, {
            headers: {
                'User-Agent': USER_AGENT
            }
        });

        const transcriptXml = await transcriptResponse.text();

        // Simple regex parse for XML (faster/easier than DOM parser in Node)
        // <text start="0.04" dur="2.909">Hello world</text>
        const matches = [...transcriptXml.matchAll(/<text start="([^"]*)" dur="([^"]*)">([^<]*)<\/text>/g)];

        const segments = matches.map(m => ({
            start: m[1],
            duration: m[2],
            text: m[3].replace(/&#39;/g, "'").replace(/&quot;/g, '"')
        }));

        return segments.map(s => s.text).join(' ');

    } catch (e) {
        console.error("Custom Fetch Error:", e.message);
        return null;
    }
}

// Test runner
(async () => {
    const text = await fetchTranscript('IECi74R8V8g'); // IECi74R8V8g or jNQXAC9IVRw
    if (text) {
        console.log("\n--- SUCCESS ---");
        console.log(text.substring(0, 500));
    } else {
        console.log("Failed.");
    }
})();
