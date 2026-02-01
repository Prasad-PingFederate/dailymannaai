const videoId = "_3tUSPGhvPY";

async function testManualParse() {
    try {
        console.log(`[ManualTest] Fetching HTML for ${videoId}...`);
        const url = `https://www.youtube.com/watch?v=${videoId}`;
        const res = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            }
        });
        const html = await res.text();

        console.log(`[ManualTest] HTML Length: ${html.length}`);

        const regex = /"captionTracks":\s*(\[.*?\])/;
        const match = html.match(regex);

        if (match) {
            console.log("[ManualTest] Found captionTracks!");
            const tracks = JSON.parse(match[1]);
            const enTrack = tracks.find(t => t.languageCode === 'en') || tracks[0];
            console.log(`[ManualTest] Found track: ${enTrack.name.simpleText} at ${enTrack.baseUrl}`);

            const transRes = await fetch(enTrack.baseUrl);
            const xml = await transRes.text();
            console.log("[ManualTest] Transcript XML Sample:", xml.substring(0, 200));
            console.log("\n--- SUCCESS ---");
        } else {
            console.log("[ManualTest] Failed to find captionTracks in HTML.");
            // Check if it's a "Sign in" page
            if (html.includes("Google") && html.includes("Sign in")) {
                console.log("[ManualTest] YouTube returned a Sign-in wall.");
            }
        }
    } catch (e) {
        console.error("[ManualTest] Error:", e);
    }
}

testManualParse();
