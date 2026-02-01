const { YoutubeTranscript } = require('youtube-transcript-plus');
const url = 'https://www.youtube.com/watch?v=YVHBOn-p2lE';

console.log(`[Plus] Fetching ${url}...`);
YoutubeTranscript.fetchTranscript(url, { lang: 'en' })
    .then(res => console.log('Plus Success:', res.length))
    .catch(err => console.error('Plus Error:', err.message));

const { YoutubeTranscript: YtStd } = require('youtube-transcript');
console.log(`[Std] Fetching ${url}...`);
YtStd.fetchTranscript(url)
    .then(res => console.log('Std Success:', res.length))
    .catch(err => console.error('Std Error:', err.message));
