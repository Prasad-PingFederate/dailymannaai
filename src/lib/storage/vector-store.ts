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

// Use globalThis to persist the DB during Next.js hot-reloads
const globalForVectorDb = globalThis as unknown as { mockVectorDb: DocumentChunk[] };
if (!globalForVectorDb.mockVectorDb) {
    globalForVectorDb.mockVectorDb = [];
}

/**
 * Splits text into manageable "pages" or chunks for the AI
 */
export function chunkText(text: string, sourceId: string): DocumentChunk[] {
    const words = text.split(/\s+/);
    const chunks: DocumentChunk[] = [];
    const chunkSize = 150; // Smaller chunks for better precision

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
    // Check if source already exists to avoid duplicates on reload
    if (globalForVectorDb.mockVectorDb.some(c => c.sourceId === sourceId)) {
        console.log(`Source ${sourceId} already exists, skipping re-ingestion.`);
        return [];
    }

    const newChunks = chunkText(text, sourceId);
    globalForVectorDb.mockVectorDb = [...globalForVectorDb.mockVectorDb, ...newChunks];
    console.log(`[VectorStore] Ingested ${newChunks.length} chunks from: ${sourceId}`);
    return newChunks;
}

/**
 * Searches for the most relevant chunks based on a query
 */
/**
 * Searches for the most relevant chunks based on a query
 */
export function searchRelevantChunks(query: string, limit: number = 6): DocumentChunk[] {
    const q = query.toLowerCase();
    const searchTerms = q.split(/\W+/).filter(t => t.length > 2); // Ignore short words

    console.log(`[VectorStore] Searching for: "${q}" across ${globalForVectorDb.mockVectorDb.length} chunks`);

    // Improved scoring
    const scoredChunks = globalForVectorDb.mockVectorDb.map(chunk => {
        let score = 0;
        const contentLower = chunk.content.toLowerCase();

        // Exact phrase match (High score)
        if (contentLower.includes(q)) score += 10;

        // Individual term matches
        searchTerms.forEach(term => {
            if (contentLower.includes(term)) score += 2;
        });

        // Source name match (bonus if searching for a specific file)
        if (chunk.sourceId.toLowerCase().includes(q)) score += 5;

        return { ...chunk, score };
    });

    let results = scoredChunks
        .filter(chunk => chunk.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, limit);

    // --- SMART FALLBACK ---
    // If it's a generic command like "summarize" or "tell me more" 
    // and we found nothing, just return the most recently added chunks.
    if (results.length === 0 && (q.includes("summarize") || q.includes("more") || q.includes("everything") || q.includes("tell me about") || q.includes("details"))) {
        console.log(`[VectorStore] No direct match for generic query, falling back to latest 6 chunks.`);
        results = [...globalForVectorDb.mockVectorDb].reverse().slice(0, 6).map(chunk => ({ ...chunk, score: 0 }));
    }

    console.log(`[VectorStore] Found ${results.length} relevant chunks.`);
    return results;
}

// --- Initial Sample Data ---
ingestDocuments(`
    John Wesley (Methodist Founder): "Do all the good you can, by all the means you can, in all the ways you can, in all the places you can, at all the times you can, to all the people you can, as long as ever you can."
    Wesley's "Quadrilateral" for spiritual guidance includes: Scripture, Tradition, Reason, and Experience.
`, "John-Wesley-Teachings");

ingestDocuments(`
    Billy Graham (Evangelist): "God proved His love on the Cross. When Christ hung, and bled, and died, it was God saying to the world, 'I love you.'"
    Graham focused on the simplicity of the Gospel and the need for a personal relationship with Jesus Christ.
`, "Billy-Graham-Wisdom");

ingestDocuments(`
    Reinhard Bonnke (Evangelist): "Africa shall be saved!" He believed in the power of the Holy Spirit to transform lives and that "God's word is like a lion; you don't have to defend a lion. All you have to do is let the lion out!"
`, "Reinhard-Bonnke-Quotes");

ingestDocuments(`
    Spiritual Guidance for Anxiety: 
    Philippians 4:6-7: "Do not be anxious about anything, but in every situation, by prayer and petition, with thanksgiving, present your requests to God. And the peace of God, which transcends all understanding, will guard your hearts and your minds in Christ Jesus."
`, "Guidance-Source");
