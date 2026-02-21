import { getProviderManager } from "../ai/gemini";

export interface SearchIntent {
    type: "VERSE_LOOKUP" | "TOPICAL_SEARCH" | "HISTORICAL_QUERY" | "PERSONAL_GUIDANCE" | "GREETING";
    primaryKeywords: string[];
    suggestedVerses?: string[]; // AI might suggest specific verses to check DB for
    simplifiedQuery: string;
}

/**
 * THE INTENT ANALYZER
 * This is the "Ear" of your search engine. It translates human feelings into Database queries.
 */
export async function analyzeSearchIntent(query: string): Promise<SearchIntent> {
    const analyzerPrompt = `
    Identity: CHRISTIAN SEARCH ANALYZER.
    Task: Deconstruct the user's intent to find the best scriptural answers.
    
    CRITICAL RULES:
    1. GREETING: Use ONLY for "hello", "hi", "hey", "good morning", "how are you", "praise the lord" etc.
    2. Any query asking about a Bible verse, Jesus, God, faith, salvation, or history is NOT a greeting.
    3. If the query is "Who is Jesus?", it is TOPICAL_SEARCH, NOT GREETING.
    
    USER QUERY: "${query}"
    
    RESPONSE FORMAT (JSON ONLY):
    {
        "type": "VERSE_LOOKUP | TOPICAL_SEARCH | HISTORICAL_QUERY | PERSONAL_GUIDANCE | GREETING",
        "primaryKeywords": ["word1", "word2"],
        "suggestedVerses": ["Book Chapter:Verse"],
        "simplifiedQuery": "Cleaned version for DB search"
    }
    `;

    try {
        const { response } = await getProviderManager().generateResponse(analyzerPrompt);
        // Basic cleanup of JSON response
        const cleanJson = response.replace(/```json|```/g, "").trim();
        const parsed = JSON.parse(cleanJson) as SearchIntent;
        return parsed;
    } catch (error) {
        console.error("[IntentAnalyzer] Error:", error);
        return {
            type: "TOPICAL_SEARCH",
            primaryKeywords: query.split(" "),
            simplifiedQuery: query
        };
    }
}
