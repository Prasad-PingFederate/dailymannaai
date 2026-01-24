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
    Billy Graham's "Steps to Peace with God": 
    1. God's Purpose: Peace and Life. 
    2. Our Problem: Separation from God. 
    3. God's Remedy: The Cross. 
    4. Our Response: Receive Jesus Christ.
`, "Billy-Graham-Peace-Steps");

ingestDocuments(`
    John Wesley on Prayer: "God does nothing but in answer to prayer." 
    Wesley emphasized that prayer is the primary means of receiving grace and should be conversational and constant.
`, "Wesley-On-Prayer");

ingestDocuments(`
    Handling Fear and Uncertainty:
    Joshua 1:9: "Have I not commanded you? Be strong and courageous. Do not be afraid; do not be discouraged, for the Lord your God will be with you wherever you go."
    Psalm 23:4: "Even though I walk through the darkest valley, I will fear no evil, for you are with me; your rod and your staff, they comfort me."
`, "Scripture-Comfort-Source");
ingestDocuments(`
    Hudson Taylor (1832–1905): A British missionary who spent 51 years in China. He founded the China Inland Mission (CIM), which brought over 800 missionaries to the region.
    David Livingstone (1813–1873): A Scottish medical missionary and explorer who spent most of his life in Africa. He is famous for mapping southern Africa and advocating for the abolition of the slave trade.
    Adoniram Judson (1788–1850): The first American missionary to Burma (now Myanmar). He served there for 40 years, translated the Bible into Burmese, and founded over 100 churches.
    Amy Carmichael (1867–1951): An Irish missionary who served in India for 56 years. She is best known for her work rescuing children from temple prostitution and founding the Dohnavur Fellowship.
    Mary Slessor (1848–1915): A Scottish missionary in Nigeria who fought for women's rights and stopped the traditional practice of infanticide of twins.
`, "Historical-Missionaries-Pioneers");

ingestDocuments(`
    George Whitefield (1714–1770): A contemporary of John Wesley and a fellow leader of the Methodist movement. He was a powerful open-air preacher who played a central role in the First Great Awakening in Britain and the American colonies.
    Billy Graham (1918–2018): One of the most influential evangelists of the 20th century, he preached to millions through massive "crusades" and television broadcasts.
    Jim Elliot (1927–1956): An American missionary martyred in Ecuador while attempting to evangelize the Huaorani people. His life and death inspired a new generation of missionary efforts.
    Brother Andrew (1928–2022): A Dutch missionary known for smuggling Bibles into communist countries during the Cold War and founding the organization Open Doors.
    George Müller (1805–1898): Known for his extensive work with orphans in Bristol, England, and for promoting "faith missions," where missionaries trust God for financial support without direct appeals for funds.
`, "Modern-Evangelists-Missionaries");

ingestDocuments(`
    Joshua Daniel's Teaching on Doing God's Will (John 6:38):
    Core Principle: True conversion is marked by the abandonment of self-will. "Self will destroy you" unless the cross is at the center of your life.
    "A Speaking God": God is not silent; He wants to direct our footsteps and lead us through the Holy Spirit.
    Saviors vs Seductors: Young people are challenged to be "saviors" who lift others up, rather than "seductors" who corrupt.
    Marriage: Marriage requires a servant's heart and is a commitment to serving one's spouse as unto God.
    Global Focus: A burden for reaching the lost in Nepal, Sri Lanka, Delhi, and Europe (specifically France).
    Historical Examples: The Puritans and Pilgrim Fathers were nonconformists who sacrificed comfort to follow God's will.
`, "Joshua-Daniel-Doing-Gods-Will");
