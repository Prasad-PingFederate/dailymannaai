const { YoutubeTranscript } = require('youtube-transcript');

(async () => {
    try {
        const videoId = "IECi74R8V8g"; // Vercel Ship Keynote (definitely good captions)
        console.log(`Fetching transcript for: ${videoId}`);

        const transcript = await YoutubeTranscript.fetchTranscript(videoId);

        if (transcript && transcript.length > 0) {
            const text = transcript.map(t => t.text).join(' ');
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
