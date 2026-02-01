const { YoutubeTranscript } = require('youtube-transcript-plus');

async function run() {
    console.log("Testing youtube-transcript-plus (forcing English)...");
    try {
        const url = 'https://www.youtube.com/watch?v=_S7WEVLbQ-Y';
        // Force English
        const transcript = await YoutubeTranscript.fetchTranscript(url, { lang: 'en' });

        console.log("Success! Found " + transcript.length + " segments.");
        if (transcript.length > 0) {
            console.log("First segment:", transcript[0]);
            const text = transcript.map(t => t.text).join(' ');
            console.log("Text Preview:", text.substring(0, 100));
        }
    } catch (e) {
        console.error("Failed:", e);
    }
}

run();
