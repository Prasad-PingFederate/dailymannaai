const { YoutubeTranscript } = require('youtube-transcript-plus');
const url = 'https://www.youtube.com/watch?v=YVHBOn-p2lE';

// Monkey-patch generic fetch if possible, but youtube-transcript uses node-fetch or internal.
// The goal is to simulate browser request
const originalFetch = global.fetch;
global.fetch = function (input, init) {
    if (typeof input === 'string' && input.includes('youtube.com')) {
        init = init || {};
        init.headers = init.headers || {};
        // Mimic Chrome headers
        init.headers['User-Agent'] = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36';
        init.headers['Accept-Language'] = 'en-US,en;q=0.9';
    }
    return originalFetch(input, init);
};

console.log('[Headers] Fetching with mocked User-Agent...');
YoutubeTranscript.fetchTranscript(url, { lang: 'en' })
    .then(res => console.log('Headers Success:', res.length))
    .catch(err => console.error('Headers Error:', err.message));
