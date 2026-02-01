
// Simulation of the robust logic in route.ts with Fetch Patch
async function run() {
    const url = 'https://www.youtube.com/watch?v=YVHBOn-p2lE';

    // Patch Global Fetch for User-Agent
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

    console.log(`[Test] Attempting to fetch transcript for ${url}...`);

    let transcriptItems = null;

    // Strategy A: Try youtube-transcript-plus
    try {
        console.log("[Test] Strategy A: youtube-transcript-plus");
        const { YoutubeTranscript: YtPlus } = await import('youtube-transcript-plus');
        transcriptItems = await fetchWithTimeout(
            YtPlus.fetchTranscript(url, { lang: 'en' }),
            15000
        );
        console.log("[Test] Strategy A Success!");
    } catch (errA) {
        console.warn(`[Test] Strategy A failed: ${errA.message}. Switching to Strategy B...`);
    }

    // Strategy B: Try youtube-transcript (Standard)
    if (!transcriptItems) {
        try {
            console.log("[Test] Strategy B: youtube-transcript (Standard)");
            const { YoutubeTranscript: YtStd } = await import('youtube-transcript');
            transcriptItems = await fetchWithTimeout(
                YtStd.fetchTranscript(url),
                15000
            );
            console.log("[Test] Strategy B Success!");
        } catch (errB) {
            console.warn(`[Test] Strategy B failed: ${errB.message}`);
        }
    }

    if (transcriptItems) {
        console.log(`[Test] Final Result: Fetched ${transcriptItems.length} items`);
    } else {
        console.error("[Test] All strategies failed.");
    }
}

run();
