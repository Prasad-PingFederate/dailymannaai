import { searchRelevantChunks, DocumentChunk } from "../storage/vector-store";

export interface DocSearchResult {
    title: string;
    snippet: string;
    sourceId: string;
    score: number;
}

/**
 * THE DOCUMENT SEARCH CORE
 * Searches through ingested sermons, biographies, and theology notes.
 */
export async function searchDocuments(query: string): Promise<DocSearchResult[]> {
    try {
        const chunks = searchRelevantChunks(query, 10);

        return chunks.map(chunk => ({
            title: chunk.sourceId.replace(/-/g, ' '),
            snippet: chunk.content,
            sourceId: chunk.sourceId,
            score: (chunk as any).score || 1.0
        }));
    } catch (error) {
        console.error("[DocumentSearch] Error:", error);
        return [];
    }
}
