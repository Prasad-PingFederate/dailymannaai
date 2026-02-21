import { searchRelevantChunks } from "../storage/vector-store";
import { getDatabase } from "../mongodb";

export interface DocSearchResult {
    title: string;
    snippet: string;
    sourceId: string;
    score: number;
    audioUrl?: string; // Support for the user's audio request
    preacher?: string;
}

/**
 * THE DOCUMENT SEARCH CORE
 * Searches through ingested sermons, biographies, and theology notes.
 */
export async function searchDocuments(query: string): Promise<DocSearchResult[]> {
    try {
        // 1. Search Local Vector Store (Fast Chunks)
        const vectorChunks = searchRelevantChunks(query, 5);
        const vectorResults: DocSearchResult[] = vectorChunks.map(chunk => ({
            title: chunk.sourceId.replace(/-/g, ' '),
            snippet: chunk.content,
            sourceId: chunk.sourceId,
            score: (chunk as any).score || 1.0,
            preacher: "Historical Profile"
        }));

        // 2. Search MongoDB Sermons (Full Transcripts/Summaries)
        const db = await getDatabase();
        const sermons = await db.collection('sermons').find({
            $or: [
                { title: { $regex: query, $options: 'i' } },
                { content: { $regex: query, $options: 'i' } },
                { preacher: { $regex: query, $options: 'i' } }
            ]
        }).limit(5).toArray();

        const databaseResults: DocSearchResult[] = sermons.map(s => ({
            title: s.title,
            snippet: s.content.substring(0, 500) + "...",
            sourceId: `db-sermon-${s._id}`,
            score: 100, // Boost database results
            audioUrl: s.audioUrl,
            preacher: s.preacher
        }));

        // Merge and sort
        return [...databaseResults, ...vectorResults].sort((a, b) => b.score - a.score);
    } catch (error) {
        console.error("[DocumentSearch] Error:", error);
        return [];
    }
}
