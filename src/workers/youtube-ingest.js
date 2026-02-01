
const { YoutubeTranscript } = require('youtube-transcript-plus');
const { YoutubeTranscript: YtStd } = require('youtube-transcript');

// 1. Patch Global Fetch for User-Agent (Bypass YouTube Bot Detection)
const originalFetch = global.fetch;
global.fetch = async (input, init) => {
    const urlStr = input.toString();
    if (urlStr.includes('youtube.com') || urlStr.includes('youtu.be')) {
        init = init || {};
        init.headers = init.headers || {};
        init.headers['User-Agent'] = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
        init.headers['Accept-Language'] = 'en-US,en;q=0.9';
    }
    return originalFetch(input, init);
};

const fetchWithTimeout = (promise, ms) => {
    return Promise.race([
        promise,
        new Promise((_, reject) => setTimeout(() => reject(new Error(`Timeout after ${ms}ms`)), ms))
    ]);
};

async function run() {
    const url = process.argv[2];
    if (!url) {
        console.error(JSON.stringify({ error: "No URL provided" }));
        process.exit(1);
    }

    let transcriptItems = null;

    // Strategy A: Try youtube-transcript-plus
    try {
        transcriptItems = await fetchWithTimeout(
            YoutubeTranscript.fetchTranscript(url, { lang: 'en' }),
            15000
        );
    } catch (errA) {
        // Silent fail to B
    }

    // Strategy B: Try youtube-transcript (Standard)
    if (!transcriptItems) {
        try {
            transcriptItems = await fetchWithTimeout(
                YtStd.fetchTranscript(url),
                15000
            );
        } catch (errB) {
            console.error(JSON.stringify({ error: errB.message || "All strategies failed" }));
            process.exit(1);
        }
    }

    if (transcriptItems && transcriptItems.length > 0) {
        const text = transcriptItems.map(t => t.text).join(' ');
        console.log(JSON.stringify({ text }));
        process.exit(0);
    } else {
        console.error(JSON.stringify({ error: "No transcript found" }));
        process.exit(1);
    }
}

run();
