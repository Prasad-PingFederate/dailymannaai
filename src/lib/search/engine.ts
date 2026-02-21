import { analyzeSearchIntent } from "./intent-analyzer";
import { searchBible, SearchResult as BibleResult } from "./bible-search";
import { lookupBibleReference } from "../bible/lookup";
import { searchDocuments, DocSearchResult } from "./document-search";
import { assessTruthIntegrity, TruthAssessment } from "./truth-filter";

export interface UnifiedSearchResult {
    mode: "DIRECT_LOOKUP" | "SEMANTIC_SEARCH" | "GREETING";
    intent?: any;
    bibleResults: BibleResult[];
    documentResults: DocSearchResult[];
    truthAssessment?: TruthAssessment;
    content?: string; // For direct lookup
}

/**
 * THE DAILY MANNA TRUTH ENGINE (V3 - Guarded)
 * This is the main entry point for all search queries.
 * It combines Scripture, Sermon, and Historical knowledge with a Doctrine Filter.
 */
export async function executeHybridSearch(query: string): Promise<UnifiedSearchResult> {
    console.log(`[TruthEngine] 🔍 Deep Analysis: "${query}"`);

    // 1. FAST PATH: Check if it's a direct reference
    const directVerse = await lookupBibleReference(query);
    if (directVerse) {
        return {
            mode: "DIRECT_LOOKUP",
            content: directVerse,
            bibleResults: [],
            documentResults: []
        };
    }

    // 2. INTELLIGENCE PATH: Analyze intent
    const intent = await analyzeSearchIntent(query);
    console.log(`[TruthEngine] 🧠 Intent: ${intent.type} | Keywords: ${intent.primaryKeywords.join(", ")}`);

    if (intent.type === "GREETING") {
        return {
            mode: "GREETING",
            intent: intent,
            bibleResults: [],
            documentResults: []
        };
    }

    // 3. UNIFIED RETRIEVAL
    const [bibleResults, documentResults] = await Promise.all([
        searchBible(intent.primaryKeywords),
        searchDocuments(intent.simplifiedQuery || query)
    ]);

    // 4. TRUTH FILTER: Audit the findings
    const allText = [
        ...bibleResults.map(r => r.text),
        ...documentResults.map(r => r.snippet)
    ];

    const truthAssessment = await assessTruthIntegrity(query, allText);
    console.log(`[TruthEngine] 🛡️ Integrity Audit: ${truthAssessment.isSound ? 'PASSED' : 'FLAGGED'} (${truthAssessment.integrityScore}%)`);

    return {
        mode: "SEMANTIC_SEARCH",
        intent,
        bibleResults,
        documentResults,
        truthAssessment
    };
}
