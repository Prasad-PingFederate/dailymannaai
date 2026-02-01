const url = 'https://www.youtube.com/watch?v=_S7WEVLbQ-Y';

async function run() {
    console.log("Fetching video page...");

    // Mimic the headers used in route.ts
    const headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept-Language': 'en-US,en;q=0.9',
    };

    const response = await fetch(url, { headers });
    const html = await response.text();

    const captionMatch = html.match(/"captionTracks":(\[.*?\])/);
    if (!captionMatch) {
        console.error("No captions found.");
        return;
    }

    try {
        const tracks = JSON.parse(captionMatch[1]);
        const englishTrack = tracks.find(t => t.languageCode === 'en' && !t.kind)
            || tracks.find(t => t.languageCode === 'en')
            || tracks[0];

        if (!englishTrack) {
            console.error("No English track.");
            return;
        }

        let rawBaseUrl = englishTrack.baseUrl;
        // The Fix: Clean whitespace and unicode nonsense
        const cleanBaseUrl = rawBaseUrl.replace(/u0026/g, '&').replace(/\\u0026/g, '&').replace(/\s/g, '');

        // Try JSON format
        const jsonUrl = cleanBaseUrl + '&fmt=json3';
        console.log("Fetching JSON from clean URL: " + jsonUrl.substring(0, 50) + "...");

        const jsonResponse = await fetch(jsonUrl);

        if (!jsonResponse.ok) {
            console.error("JSON Fetch Failed:", jsonResponse.status);
            return;
        }

        const jsonText = await jsonResponse.text();

        console.log("JSON Response Length:", jsonText.length);
        if (jsonText.length > 50) {
            console.log("JSON Preview:", jsonText.substring(0, 200));
            // Try parsing
            const data = JSON.parse(jsonText);
            const events = data.events;
            const text = events.map(e => e.segs ? e.segs.map(s => s.utf8).join('') : '').join(' ');
            console.log("Extracted Text:", text.substring(0, 200));
        } else {
            console.log("JSON too short:", jsonText);
        }

    } catch (e) {
        console.error("Error:", e);
    }
}

run();
