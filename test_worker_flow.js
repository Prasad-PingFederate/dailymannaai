
const { execFile } = require('child_process');
const path = require('path');

const url = 'https://www.youtube.com/watch?v=0bLwAwYM9o0';
const workerScript = path.join(process.cwd(), 'src', 'workers', 'youtube-ingest.js');

console.log(`[Test] Spawning worker for ${url}...`);

execFile('node', [workerScript, url], { timeout: 45000 }, (error, stdout, stderr) => {
    if (error) {
        console.error(`[Error] Worker failed: ${error.message}`);
        if (stderr) console.error(`[Stderr] ${stderr}`);
        return;
    }

    try {
        const result = JSON.parse(stdout);
        console.log(`[Success] Fetched ${result.text.length} characters.`);
        // console.log(`[Preview] ${result.text.substring(0, 100)}...`);
    } catch (e) {
        console.error(`[Error] Failed to parse output: ${e.message}`);
        console.log(`[Raw Output] ${stdout}`);
    }
});
