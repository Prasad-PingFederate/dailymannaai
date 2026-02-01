const { Innertube, UniversalCache } = require('youtubei.js');

(async () => {
    try {
        console.log("Initializing Innertube...");
        const yt = await Innertube.create({
            cache: new UniversalCache(false),
            generate_session_locally: true,
            location: 'US', // Force US location
            retrieve_player: false // Skip player retrieval to be faster and maybe safer
        });

        const videoId = "jNQXAC9IVRw"; // Me at the zoo
        console.log(`Fetching info for video: ${videoId}`);

        const info = await yt.getInfo(videoId);
        console.log(`Video Title: ${info.basic_info.title}`);

        console.log("Fetching transcript...");
        const transcriptData = await info.getTranscript();

        if (transcriptData && transcriptData.transcript) {
            const segments = transcriptData.transcript.content.body.initial_segments;
            const text = segments.map(seg => seg.snippet.text).join(' ');
            console.log("\n--- TRANSCRIPT PEEK ---");
            console.log(text.substring(0, 500) + "...");
            console.log("--- SUCCESS ---");
        } else {
            console.log("No transcript data found.");
        }

    } catch (error) {
        console.error("Verification Failed:", error);
    }
})();
