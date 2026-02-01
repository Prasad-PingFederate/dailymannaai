const { Innertube } = require('youtubei.js');

async function run() {
    console.log("Initializing Innertube...");
    try {
        const youtube = await Innertube.create({
            lang: 'en',
            location: 'US',
            client_type: 'ANDROID'
        });

        const videoId = 'RvEfqFP-R6c'; // Value of a Soul
        console.log(`Fetching info for ${videoId}...`);

        const info = await youtube.getInfo(videoId);
        console.log("Video Title:", info.basic_info.title);
        console.log("Video Duration:", info.basic_info.duration);

        try {
            console.log("Fetching transcript...");
            const transcriptData = await info.getTranscript();

            // Inspect the structure
            console.log("Transcript Data Keys:", Object.keys(transcriptData));
            if (transcriptData.transcript) {
                console.log("transcript keys", Object.keys(transcriptData.transcript));
                if (transcriptData.transcript.content) {
                    console.log("content keys", Object.keys(transcriptData.transcript.content));
                    const body = transcriptData.transcript.content.body;
                    if (body) {
                        console.log("body keys", Object.keys(body));
                        // console.log("Body JSON:", JSON.stringify(body, null, 2).substring(0, 1000));

                        // Try to extract text from initial_segments if available
                        if (body.initial_segments) {
                            const text = body.initial_segments.map(s => s.snippet.text).join(' ');
                            console.log("Extracted Text Length:", text.length);
                        }
                    }
                }
            } else {
                console.log("No transcript data found.");
            }

        } catch (e) {
            console.error("Transcript fetch failed:", e.message);
        }

    } catch (e) {
        console.error("Innertube Error:", e);
        require('fs').writeFileSync('error_log.txt', JSON.stringify(e, null, 2) + "\n" + e.stack);
    }
}

run();
