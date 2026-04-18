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
export async function executeHybridSearch(query: string, preAnalyzedIntent?: any): Promise<UnifiedSearchResult> {
    console.log(`[TruthEngine] 🔍 Deep Analysis: "${query}"`);

    // 1 & 2. PARALLEL START: Direct Lookup + Intent Analysis (if not pre-analyzed)
    const [directVerse, intent] = await Promise.all([
        lookupBibleReference(query),
        preAnalyzedIntent ? Promise.resolve(preAnalyzedIntent) : analyzeSearchIntent(query)
    ]);

    // Handle Direct Fast-Path (only if user intent is clearly just looking up a verse)
    if (directVerse && (intent.type === "VERSE_LOOKUP" || query.length < 25)) {
        console.log(`[TruthEngine] ⚡ Direct Scripture Fast-Path: "${query}"`);
        return {
            mode: "DIRECT_LOOKUP",
            content: directVerse,
            bibleResults: [],
            documentResults: []
        };
    }

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

    // 4. TRUTH FILTER: Audit the findings (Guarded with timeout for speed)
    let truthAssessment: TruthAssessment = { isSound: true, integrityScore: 100, warnings: [] };
    try {
        const allText = [
            ...bibleResults.map(r => r.text),
            ...documentResults.map(r => r.snippet)
        ];

        truthAssessment = await Promise.race([
            assessTruthIntegrity(query, allText),
            new Promise<TruthAssessment>((resolve) =>
                setTimeout(() => resolve({ isSound: true, integrityScore: 100, warnings: ["Audit timeout"] }), 3000)
            )
        ]);
        console.log(`[TruthEngine] 🛡️ Integrity Audit: ${truthAssessment.isSound ? 'PASSED' : 'FLAGGED'} (${truthAssessment.integrityScore}%)`);
    } catch (e) {
        console.error("[TruthEngine] Audit failed:", e);
    }

    return {
        mode: "SEMANTIC_SEARCH",
        intent,
        bibleResults,
        documentResults,
        truthAssessment
    };
}
