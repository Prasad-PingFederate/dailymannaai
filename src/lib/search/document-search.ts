import { searchRelevantChunks } from "../storage/vector-store";
import { getDatabase } from "../mongodb";
import { getCollection } from "../astra";

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

        // 2. Search Cloud Storage (Astra DB - 80GB Primary)
        let databaseResults: DocSearchResult[] = [];
        try {
            const astraCol = await getCollection('sermons_archive');
            const cloudSermons = await astraCol.find({}).limit(5).toArray();

            databaseResults = cloudSermons.map(s => ({
                title: s.title,
                snippet: s.content?.substring(0, 500) + "...",
                sourceId: `astra-${s._id}`,
                score: 100,
                audioUrl: s.audioUrl,
                preacher: s.preacher
            }));
            console.log(`[DocumentSearch] ☁️ Retrieved ${databaseResults.length} items from Astra DB.`);
        } catch (astraError) {
            console.error("[DocumentSearch] Astra DB failed, falling back to MongoDB:", astraError);

            // 3. Fallback to MongoDB (Backup)
            const db = await getDatabase();
            const sermons = await db.collection('sermons').find({
                $or: [
                    { title: { $regex: query, $options: 'i' } },
                    { content: { $regex: query, $options: 'i' } },
                    { preacher: { $regex: query, $options: 'i' } }
                ]
            }).limit(5).toArray();

            databaseResults = sermons.map(s => ({
                title: s.title,
                snippet: s.content.substring(0, 500) + "...",
                sourceId: `db-sermon-${s._id}`,
                score: 100,
                audioUrl: s.audioUrl,
                preacher: s.preacher
            }));
        }

        // Merge and sort
        return [...databaseResults, ...vectorResults].sort((a, b) => b.score - a.score);
    } catch (error) {
        console.error("[DocumentSearch] Error:", error);
        return [];
    }
}
