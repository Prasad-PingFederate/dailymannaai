const { YoutubeTranscript } = require('youtube-transcript');

async function testYouTube(url) {
    console.log(`Testing URL: ${url}`);
    try {
        // Try forcing English
        const transcript = await YoutubeTranscript.fetchTranscript(url, { lang: 'en' });
        console.log("Success! Found " + transcript.length + " segments.");
        if (transcript.length > 0) {
            console.log("First segment:", transcript[0]);
        }
    } catch (e) {
        console.error("Failed:", e.message);

        // Try retrieving available languages
        try {
            console.log("Attempting to list available languages...");
            // YoutubeTranscript.fetchTranscriptUrl acts differently, but let's see errors.
        } catch (e2) {
            console.log(e2);
        }
    }
}

testYouTube('https://www.youtube.com/watch?v=_S7WEVLbQ-Y'); 
