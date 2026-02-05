const { Innertube, UniversalCache } = require('youtubei.js');
const fs = require('fs');

async function testAudioDownload(videoId) {
    console.log(`Testing Direct Audio Download for: ${videoId}`);
    try {
        const yt = await Innertube.create({
            cache: new UniversalCache(false),
            generate_session_locally: true,
            location: 'US',
            lang: 'en'
        });

        console.log("Innertube initialized. Starting download stream...");
        const stream = await yt.download(videoId, {
            type: 'audio',
            quality: 'best'
        });

        console.log("Stream received. Writing first 100KB to disk...");
        const file = fs.createWriteStream('test_audio_sample.m4a');

        let bytesRead = 0;
        for await (const chunk of stream) {
            file.write(chunk);
            bytesRead += chunk.length;
            if (bytesRead > 102400) break; // 100KB
        }
        file.end();

        console.log(`✅ SUCCESS: Received ${bytesRead} bytes from download stream!`);
        console.log("Audio sample saved to test_audio_sample.m4a");

    } catch (err) {
        console.error("Test failed:", err.message);
    }
}

testAudioDownload('DHBo7ka3YZQ');
