import { analyzeSearchIntent } from "./intent-analyzer";
import { searchBible } from "./bible-search";
import { lookupBibleReference } from "../bible/lookup";

/**
 * THE DAILY MANNA TRUTH ENGINE (V1)
 * This is the main entry point for all search queries.
 */
export async function executeHybridSearch(query: string) {
    console.log(`[TruthEngine] Analyzing: "${query}"`);

    // 1. FAST PATH: Check if it's a direct reference (e.g. John 3:16)
    const directVerse = await lookupBibleReference(query);
    if (directVerse) {
        return {
            mode: "DIRECT_LOOKUP",
            content: directVerse,
            results: []
        };
    }

    // 2. INTELLIGENCE PATH: Analyze what the user really wants
    const intent = await analyzeSearchIntent(query);
    console.log(`[TruthEngine] Intent detected: ${intent.type} (${intent.primaryKeywords.join(", ")})`);

    // GREETING FAST PATH: If it's just a greeting, don't trigger Bible searches
    if (intent.type === "GREETING") {
        return {
            mode: "GREETING",
            intent: intent,
            results: []
        };
    }

    // 3. RETRIEVAL: Get relevant verses based on the intent
    const results = await searchBible(intent.primaryKeywords);

    // 4. FUTURE: Add sermon search / historical notes here

    return {
        mode: "SEMANTIC_SEARCH",
        intent: intent,
        results: results
    };
}
