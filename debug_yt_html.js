const fs = require('fs');
const https = require('https');

const url = 'https://www.youtube.com/watch?v=_S7WEVLbQ-Y';

const options = {
    headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept-Language': 'en-US,en;q=0.9',
    }
};

https.get(url, options, (res) => {
    let data = '';
    res.on('data', (chunk) => { data += chunk; });
    res.on('end', () => {
        console.log('Finished fetching.');
        const match = data.match(/"captionTracks":(\[.*?\])/);
        if (match) {
            console.log("Found captionTracks!");
            console.log("Length of JSON:", match[1].length);
            const tracks = JSON.parse(match[1]);
            console.log("Available tracks:", tracks.map(t => t.name.simpleText || t.languageCode));
        } else {
            console.log("No captionTracks found in HTML.");
            // Save to file for inspection if needed, but not doing it here to save space
            // fs.writeFileSync('debug_yt.html', data);
        }
    });
}).on('error', (e) => {
    console.error(e);
});
