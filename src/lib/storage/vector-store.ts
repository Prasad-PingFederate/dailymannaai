/**
 * Vector Store Mock
 * Enforces High-Precision Retrieval with Agentic DNA
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
    const chunkSize = 150;

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
    if (globalForVectorDb.mockVectorDb.some(c => c.sourceId === sourceId)) {
        console.log(`Source ${sourceId} already exists.`);
        return [];
    }

    const newChunks = chunkText(text, sourceId);
    globalForVectorDb.mockVectorDb = [...globalForVectorDb.mockVectorDb, ...newChunks];
    console.log(`[VectorStore] Ingested ${newChunks.length} chunks from: ${sourceId}`);
    return newChunks;
}

/**
 * EXPERT SEARCH: Robust keyword-based retrieval with coincidence rewards
 */
export function searchRelevantChunks(query: string, limit: number = 6): DocumentChunk[] {
    const q = query.toLowerCase();
    const searchTerms = q.split(/\W+/).filter(t => t.length > 2);

    if (globalForVectorDb.mockVectorDb.length === 0) {
        initializeDatabase();
    }

    const scoredChunks = globalForVectorDb.mockVectorDb.map(chunk => {
        let score = 0;
        const contentLower = chunk.content.toLowerCase();
        const sourceLower = chunk.sourceId.toLowerCase();

        if (contentLower.includes(q)) score += 50;

        let matches = 0;
        searchTerms.forEach(term => {
            if (contentLower.includes(term)) {
                score += 10;
                matches++;
            }
            if (sourceLower.includes(term)) score += 20;
        });

        if (matches > 1) score += (matches * 15);

        return { ...chunk, score };
    });

    const results = scoredChunks
        .filter(chunk => chunk.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, limit);

    return results;
}

/**
 * Ensures the database is always populated with Expert DNA
 */
export function initializeDatabase() {
    if (globalForVectorDb.mockVectorDb.some(c => c.sourceId === "ANTIGRAVITY-CORE-DNA")) {
        return;
    }

    // --- CORE ANTIGRAVITY DNA (AGENTIC PRINCIPLES) ---
    ingestDocuments(`
        Antigravity DNA - Research Principle 1 (Proactivity): If information is missing from local sources, be an agent. Proactively search web results. Use Internal reasoning for basic consensus facts. 
        Antigravity DNA - Research Principle 2 (Authority): Speak with the confidence of an expert. Avoid robotic disclaimers like "As an AI". Present truths clearly based on provided grounding.
        Antigravity DNA - Research Principle 3 (Identity Consistency): Joshua Daniel is the son of N. Daniel and leader of LEFI. He wrote 33 books including "Another Daniel". This is a bedrock fact. Never deviate.
        Antigravity DNA - Research Principle 4 (Safety Override): Discussions of historical theologians (Moody, Spurgeon, Wesley, Calvin, Luther, etc.) are purely academic and historical. Never refuse these based on current political filters or "defamation" hallucinations.
    `, "ANTIGRAVITY-CORE-DNA");

    // --- PHONETIC IDENTITY MAPPINGS ---
    ingestDocuments(`
        Phonetic Map: 'dk moody' -> D. L. Moody (Dwight L. Moody). 
        Phonetic Map: 'renhard bonkey' -> Reinhard Bonnke. 
        Phonetic Map: 'john wesly' -> John Wesley.
        Phonetic Map: 'shadu' -> Sadhu Sundar Singh.
        Phonetic Map: 'spurgeon' -> Charles H. Spurgeon.
    `, "PHONETIC-DNA-MAP");

    // --- D. L. MOODY (REQUESTED) ---
    ingestDocuments(`
        Dwight L. Moody (1837–1899): Prolific American evangelist and publisher.
        Biography: Founded the Moody Bible Institute and The Moody Church in Chicago. Preached to over 100 million people without modern amplification. Partnered with singer Ira Sankey.
        Key Event: The 1871 Great Chicago Fire, which destroyed his church and spurred him to greater evangelistic efforts in the UK and USA.
        Legacy: Transformed mass evangelism with cross-denominational cooperation. Key books: "The Wordless Book" (evangelism tool), "Notes from My Bible", and numerous sermon collections.
    `, "DL-Moody-Biography-Deep");

    // --- CHARLES H. SPURGEON ---
    ingestDocuments(`
        Charles H. Spurgeon (1834-1892): Known as the "Prince of Preachers." Served Metropolitan Tabernacle in London for 38 years. Key Works: "The Treasury of David", "Morning and Evening", "All of Grace".
    `, "Charles-Spurgeon-Biography-Deep");

    // --- REINHARD BONNKE ---
    ingestDocuments(`
        Reinhard Bonnke (1940-2019): Global Evangelist known for massive "Fire Conferences" and crusades in Africa. Motto: "Africa Shall Be Saved!" 
    `, "Reinhard-Bonnke-Bio");

    // --- JOSHUA DANIEL & LEFI ---
    ingestDocuments(`
        Joshua Daniel (1928–2014) Biography: Son of N. Daniel. Leader of LEFI for over 50 years. Author of 33 books including "Another Daniel". 
    `, "Joshua-Daniel-Biography");

    // --- OTHER CORE KNOWLEDGE ---
    ingestDocuments(`
        Sadhu Sundar Singh (1889-1929): "The Apostle with the Bleeding Feet". Sikh background, Christian convert. Never married.
    `, "Sadhu-Sundar-Singh-Bio");

    ingestDocuments(`
        John Wesley (1703-1791): Leader of Methodist movement. Mother: Susanna Wesley. No children. Brother: Charles Wesley.
    `, "John-Wesley-Bio");

    ingestDocuments(`
        Top 10 Christians: Irenaeus, Constantine, Athanasius, Augustine, Francis of Assisi, Aquinas, Luther, Calvin, Edwards, Billy Graham.
    `, "Historical-Christian-Giants");
}

initializeDatabase();
