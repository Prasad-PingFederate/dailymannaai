const { YoutubeTranscript } = require('youtube-transcript-plus');

(async () => {
    try {
        const videoId = "_3tUSPGhvPY"; // Video from user screenshot
        console.log(`[Plus] Fetching transcript for: ${videoId}`);

        const transcript = await YoutubeTranscript.fetchTranscript(videoId);

        if (transcript && transcript.length > 0) {
            console.log("\n--- SUCCESS ---");
            console.log(transcript.map(t => t.text).join(' ').substring(0, 500));
        } else {
            console.log("No transcript data found.");
        }

    } catch (error) {
        console.error("Plus Verification Failed:", error);
    }
})();
