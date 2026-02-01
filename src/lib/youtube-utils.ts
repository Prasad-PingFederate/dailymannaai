import { YoutubeTranscript } from 'youtube-transcript-plus';

// Direct implementation without child_process to avoid build issues.
// Running in 'nodejs' runtime in Next.js is sufficient for this library.
export async function fetchYoutubeTranscript(url: string): Promise<string> {
    try {
        console.log(`[YoutubeUtils] Fetching transcript for ${url}`);

        // Extract video ID (simple logic, library might handle url but safer to pass ID if possible, 
        // strictly the library takes videoId or expected format. Let's parse ID.)
        const videoIdMatch = url.match(/(?:youtu\.be\/|youtube\.com\/watch\?v=|youtube\.com\/embed\/|v\/)([^#\&\?]*).*/);
        const videoId = videoIdMatch ? videoIdMatch[1] : url;

        const transcript = await YoutubeTranscript.fetchTranscript(videoId);

        if (!transcript || transcript.length === 0) {
            throw new Error("No transcript found for this video.");
        }

        const fullText = transcript.map((t: any) => t.text).join(' ');
        return fullText;

    } catch (error: any) {
        console.error("Youtube Transcript Error:", error.message);

        // Elevate specific error messages
        if (error.message.includes("Sign in")) throw new Error("Video requires sign-in (age restricted).");
        if (error.message.includes("disabled")) throw new Error("Transcripts are disabled for this video.");

        throw error;
    }
}
