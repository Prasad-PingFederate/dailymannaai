const { Innertube } = require('youtubei.js');
const fs = require('fs');

async function run() {
    try {
        console.log('Initializing Innertube (ANDROID)...');
        const yt = await Innertube.create({
            lang: 'en',
            location: 'US',
            client_type: 'ANDROID'
        });
        const vid = 'YVHBOn-p2lE';
        console.log('Fetching info for', vid);

        // Try getInfo first
        try {
            const info = await yt.getInfo(vid);
            console.log('Title:', info.basic_info.title);
            const transcript = await info.getTranscript();
            console.log('Transcript found via getInfo:', transcript?.transcript?.content?.body?.initial_segments?.length);
        } catch (infoError) {
            console.error('getInfo failed:', infoError.message);
            // Fallback: try raw basic info if parser fails
            // const basic = await yt.getBasicInfo(vid);
            // console.log('Basic Info Title:', basic.basic_info.title);
        }

    } catch (e) {
        console.error('YTI Error:', e.message);
        fs.writeFileSync('yti_error.log', e.stack);
    }
}
run();
