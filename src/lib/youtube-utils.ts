import { createRequire } from "module";
import path from 'path';

export async function runYoutubeWorker(url: string): Promise<string> {
    // const require = createRequire(import.meta.url);
    // const cpModule = 'child_process';
    // const { execFile } = require(cpModule);

    // We need to resolve the worker script path. 
    // process.cwd() in Next.js usually points to the root of the project.
    // const workerScript = path.join(process.cwd(), 'src', 'workers', 'youtube-ingest.js');

    /*
    const result: string = await new Promise((resolve, reject) => {
        execFile('node', [workerScript, url], { timeout: 45000, encoding: 'utf8' }, (error: any, stdout: string, stderr: string) => {
            if (error) {
                // Try to extract error json from stderr if possible
                try {
                    const errObj = JSON.parse(stderr as string);
                    reject(new Error(errObj.error || error.message));
                } catch {
                    reject(error);
                }
                return;
            }
            if (stderr) console.error(`[Worker Error] ${stderr}`);
            resolve(stdout as string);
        });
    });

    return result;
    */
    throw new Error("YouTube ingestion is temporarily disabled due to Vercel/Next.js build constraints with child_process.");
}
