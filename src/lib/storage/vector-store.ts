/**
 * Vector Store Mock
 * In a production app, we would use Pinecone, Weaviate, or pgvector.
 * For our "NotebookLM" clone, we will simulate this by chunking text 
 * and using simple keyword/semantic overlap for search.
 */

export interface DocumentChunk {
    id: string;
    sourceId: string;
    content: string;
    metadata: any;
}

let mockVectorDb: DocumentChunk[] = [];

/**
 * Splits text into manageable "pages" or chunks for the AI
 */
export function chunkText(text: string, sourceId: string): DocumentChunk[] {
    const words = text.split(" ");
    const chunks: DocumentChunk[] = [];
    const chunkSize = 200; // Words per chunk

    for (let i = 0; i < words.length; i += chunkSize) {
        const content = words.slice(i, i + chunkSize).join(" ");
        chunks.push({
            id: `${sourceId}-${i}`,
            sourceId,
            content,
            metadata: { page: Math.floor(i / chunkSize) + 1 }
        });
    }

    return chunks;
}

/**
 * Stores chunks in our simulated database
 */
export function ingestDocuments(text: string, sourceId: string) {
    const newChunks = chunkText(text, sourceId);
    mockVectorDb = [...mockVectorDb, ...newChunks];
    console.log(`Ingested ${newChunks.length} chunks from source: ${sourceId}`);
    return newChunks;
}

/**
 * Searches for the most relevant chunks based on a query
 */
export function searchRelevantChunks(query: string, limit: number = 3): DocumentChunk[] {
    const searchTerms = query.toLowerCase().split(" ");

    // Simple scoring based on term frequency
    const scoredChunks = mockVectorDb.map(chunk => {
        let score = 0;
        const contentLower = chunk.content.toLowerCase();
        searchTerms.forEach(term => {
            if (contentLower.includes(term)) score += 1;
        });
        return { ...chunk, score };
    });

    return scoredChunks
        .filter(chunk => chunk.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, limit);
}
