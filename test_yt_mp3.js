async function testResolvers(videoId) {
    const url = `https://www.youtube.com/watch?v=${videoId}`;
    const resolvers = [
        { name: "Vevioz", url: `https://api.vevioz.com/api/button/mp3/${videoId}` },
        { name: "DiceyTips", url: `https://api.diceytips.info/yt/download?id=${videoId}` },
        { name: "Cobalt RR", url: `https://cobalt.rr.media/api/json` }, // Some public cobalt mirrors
        { name: "Y2Mate Public", url: `https://www.y2mate.com/en/convert-mp3/${videoId}` }
    ];

    for (const resObj of resolvers) {
        console.log(`Testing ${resObj.name}: ${resObj.url}`);
        try {
            if (resObj.name === "Cobalt RR") {
                const res = await fetch(resObj.url, {
                    method: 'POST',
                    headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
                    body: JSON.stringify({ url, downloadMode: 'audio', audioFormat: 'mp3' })
                });
                const json = await res.json();
                console.log(`- Status: ${json.status || 'Unknown'}`);
                if (json.url) console.log(`- Found URL: ${json.url.substring(0, 50)}...`);
            } else {
                const res = await fetch(resObj.url);
                console.log(`- Status: ${res.status}`);
                const text = await res.text();
                if (text.includes("http") && (text.includes(".mp3") || text.includes(".m4a"))) {
                    console.log(`- Potential match found in text.`);
                }
            }
        } catch (e) {
            console.log(`- Failed: ${e.message}`);
        }
    }
}

testResolvers('DHBo7ka3YZQ');
