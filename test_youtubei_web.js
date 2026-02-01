const { Innertube, UniversalCache } = require('youtubei.js');

(async () => {
    try {
        console.log("Initializing Innertube (WEB Client)...");
        const yt = await Innertube.create({
            cache: new UniversalCache(false),
            generate_session_locally: true,
            location: 'US',
            retrieve_player: false
            // Default client is usually Android or Web. Let's try to be implicit or explicit.
        });

        const videoId = "IECi74R8V8g";
        console.log(`Fetching info for video: ${videoId}`);

        // Try getBasicInfo instead of getInfo which is lighter
        const info = await yt.getBasicInfo(videoId);
        console.log(`Video Title: ${info.basic_info.title}`);

        console.log("Fetching transcript...");
        const transcriptData = await info.getTranscript();

        if (transcriptData && transcriptData.transcript) {
            const segments = transcriptData.transcript.content.body.initial_segments;
            const text = segments.map(seg => seg.snippet.text).join(' ');
            console.log("\n--- SUCCESS ---");
            console.log(text.substring(0, 500));
        } else {
            console.log("No transcript data found.");
        }

    } catch (error) {
        console.error("Verification Failed:", error);
        if (error.info) console.log("Error Info:", JSON.stringify(error.info, null, 2));
    }
})();
