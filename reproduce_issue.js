const { YoutubeTranscript } = require('youtube-transcript-plus');

async function run() {
    const url = 'https://www.youtube.com/watch?v=RvEfqFP-R6c';
    console.log(`Testing URL: ${url}`);
    try {
        const transcript = await YoutubeTranscript.fetchTranscript(url, { lang: 'en' });
        console.log(`Success! Found ${transcript.length} items.`);
        console.log(transcript.slice(0, 3));
    } catch (e) {
        console.error('Failed with youtube-transcript-plus:', e.message);
    }
}

run();
