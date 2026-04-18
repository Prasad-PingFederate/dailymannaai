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
            const astraDb = await getDatabase(); // Using primary MongoDB for latest news as well
            const newsCol = astraDb.collection('christian_news');
            const sermonsCol = astraDb.collection('sermons');

            const [news, sermons] = await Promise.all([
                newsCol.find({
                    $or: [
                        { title: { $regex: query, $options: 'i' } },
                        { content: { $regex: query, $options: 'i' } }
                    ]
                }).sort({ grace_rank: -1 }).limit(10).toArray(),
                sermonsCol.find({
                    $or: [
                        { title: { $regex: query, $options: 'i' } },
                        { content: { $regex: query, $options: 'i' } }
                    ]
                }).limit(5).toArray()
            ]);

            databaseResults = [
                ...news.map((n: any) => ({
                    title: n.title,
                    snippet: n.summary || (n.content?.substring(0, 500) + "..."),
                    sourceId: `news-${n._id}`,
                    score: (n.grace_rank || 1) * 100,
                    preacher: n.source_name || "Daily Manna News"
                })),
                ...sermons.map((s: any) => ({
                    title: s.title,
                    snippet: s.content?.substring(0, 500) + "...",
                    sourceId: `sermon-${s._id}`,
                    score: 90,
                    audioUrl: s.audioUrl,
                    preacher: s.preacher
                }))
            ];
            
            console.log(`[DocumentSearch] ☁️ Indexed ${news.length} news items and ${sermons.length} sermons.`);
        } catch (dbError) {
            console.error("[DocumentSearch] DB failed:", dbError);
        }

        // Merge and sort
        return [...databaseResults, ...vectorResults].sort((a, b) => b.score - a.score);
    } catch (error) {
        console.error("[DocumentSearch] Error:", error);
        return [];
    }
}
