const videoId = "MeaDrmNk4NE";
const endpoints = ["https://pipedapi.kavin.rocks", "https://api.piped.io", "https://pipedapi.tokhmi.xyz"];

(async () => {
    console.log(`[PipedDebug] Testing fallback for video: ${videoId}`);
    for (const api of endpoints) {
        try {
            console.log(`Trying Piped Endpoint: ${api}...`);
            const res = await fetch(`${api}/streams/${videoId}`);
            if (!res.ok) throw new Error(`Status ${res.status}: ${res.statusText}`);

            const data = await res.json();
            const subtitles = data.subtitles;

            if (subtitles && subtitles.length > 0) {
                const enSub = subtitles.find(s => s.code === 'en' || s.name === 'English') || subtitles[0];
                console.log(`Found subtitle track: ${enSub.name} (${enSub.format})`);
                console.log(`Fetching from: ${enSub.url}`);

                const subRes = await fetch(enSub.url);
                const text = await subRes.text();

                console.log("\n--- CAPTION SAMPLE ---");
                console.log(text.substring(0, 200).replace(/\n/g, ' '));
                console.log("\n--- SUCCESS ---");
                return;
            } else {
                console.log("No subtitles found in this endpoint response.");
            }
        } catch (e) {
            console.log(`Failed ${api}: ${e.message}`);
        }
    }
    console.log("ALL PIPED ENDPOINTS FAILED");
})();
