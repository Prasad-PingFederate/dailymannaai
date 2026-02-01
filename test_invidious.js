const videoId = "MeaDrmNk4NE";
const instances = [
    "https://invidious.jing.rocks",
    "https://inv.tux.pizza",
    "https://invidious.nerdvpn.de",
    "https://invidious.drgns.space"
];

(async () => {
    console.log(`[InvidiousDebug] Testing fallback for video: ${videoId}`);
    for (const host of instances) {
        try {
            console.log(`Trying Invidious Host: ${host}...`);
            // Endpoint for captions list
            const res = await fetch(`${host}/api/v1/captions/${videoId}`);
            if (!res.ok) {
                if (res.status === 404) console.log("Video not found or no captions on this host.");
                else console.log(`Status ${res.status}: ${res.statusText}`);
                continue;
            }

            const captions = await res.json();
            const enSub = captions.find(s => s.language === 'en' || s.label.includes('English')) || captions[0];

            if (enSub) {
                console.log(`Found caption: ${enSub.label} (${enSub.language})`);
                const fullUrl = `${host}${enSub.url}`;
                console.log(`Fetching text from: ${fullUrl}`);

                const subRes = await fetch(fullUrl);
                const text = await subRes.text();

                console.log("\n--- CAPTION SAMPLE ---");
                console.log(text.substring(0, 200).replace(/\n/g, ' '));
                console.log("\n--- SUCCESS ---");
                return;
            } else {
                console.log("No English captions found.");
            }

        } catch (e) {
            console.log(`Failed ${host}: ${e.message}`);
        }
    }
    console.log("ALL INVIDIOUS INSTANCES FAILED");
})();
