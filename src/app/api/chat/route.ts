export const dynamic = 'force-dynamic';

import { NextResponse } from "next/server";
import { generateGroundedResponse, rewriteQuery } from "@/lib/ai/gemini";
import { TrainingLogger } from "@/lib/ai/training-logger";
import { searchRelevantChunks } from "@/lib/storage/vector-store";
import { performWebSearch, formatSearchResults, performImageSearch } from "@/lib/tools/web-search";
import { resolvePortrait } from "@/lib/ai/image-resolver";
import { executeHybridSearch } from "@/lib/search/engine"; // Added import

export async function POST(req: Request) {
    try {
        const { query, history = [] } = await req.json();

        // 🧠 Catch-All MongoDB Logging: Entry Audit
        const ip = req.headers.get('x-forwarded-for') || 'unknown';
        const userAgent = req.headers.get('user-agent') || 'unknown';
        const referer = req.headers.get('referer') || 'unknown';

        await TrainingLogger.log({
            timestamp: new Date().toISOString(),
            request: {
                query,
                provider: "Chat-Entry-Hook",
                model: "Audit-Only",
                historyContextCount: history.length,
                ip,
                userAgent,
                referer
            },
            response: { answer: "WAITING_FOR_SYNTHESIS", latency: 0, modelUsed: "N/A" },
            metadata: { route: "/api/chat", type: "entry_audit" }
        }).catch(e => console.error("[MongoDB] Entry audit failed:", e.message));

        if (!query) {
            return NextResponse.json({ error: "Query is required" }, { status: 400 });
        }

        console.log(`[ChatAPI-DNA] Entry Query: "${query}"`);

        // 🚀 THE TRUTH ENGINE: Perform Hybrid Search (Direct Lookup + Intent Search)
        const searchResult = await executeHybridSearch(query);
        let groundingSources: string[] = [];

        if (searchResult.mode === "DIRECT_LOOKUP" && searchResult.content) {
            const content = searchResult.content;
            console.log(`[TruthEngine] ⚡ Direct Scripture Match: ${query}`);
            groundingSources.push(`[KJV Bible Exact]: ${content}`);

            return NextResponse.json({
                role: "assistant",
                content: content,
                suggestions: [`Explain ${query} in depth.`, `Show me cross-references.`, `How does this apply to me?`],
                citations: [{ id: "kjv-direct", source: "KJV Bible (The Rock)", preview: content.substring(0, 80) + "..." }],
                metadata: { search_mode: "DIRECT", intent: "SCRIPTURE_PRECISION" }
            });
        } else if (searchResult.results && searchResult.results.length > 0) {
            const intentType = searchResult.intent?.type || "GENERAL";
            const keywords = searchResult.intent?.primaryKeywords.join(", ") || "none";

            console.log(`[TruthEngine] 🧠 Semantic Search Active | Intent: ${intentType} | Keywords: ${keywords}`);

            searchResult.results.forEach(res => {
                groundingSources.push(`[KJV Bible Result]: (${res.reference}) ${res.text}`);
            });
        }

        // 1. Expert Rewriting (Phonetic Awareness)
        let standaloneQuery = await rewriteQuery(query, history);

        // 2. Pass 1: Primary Search
        let relevantChunks = searchRelevantChunks(standaloneQuery);
        let webResults = await performWebSearch(standaloneQuery);

        console.log(`[ChatAPI-DNA] Research complete. Local Sources: ${relevantChunks.length} | Web: ${webResults.length} | Hybrid Bible Sources: ${groundingSources.length}`);

        // 🧬 DNA LOGIC: Proactive Retry
        if (relevantChunks.length === 0 && webResults.length === 0) {
            console.log(`[ChatAPI-DNA] Pass 1 yielded 0 results. Broadening query...`);
            const words = standaloneQuery.split(" ");
            const broaderQuery = words.length > 2 ? words.slice(-2).join(" ") : standaloneQuery;

            relevantChunks = searchRelevantChunks(broaderQuery);
            webResults = await performWebSearch(`${broaderQuery} biography christian history`);
            standaloneQuery = broaderQuery;
        }

        const sourcesText = relevantChunks.map(c => `[${c.sourceId}] ${c.content}`);
        const webContext = formatSearchResults(webResults);

        console.log(`[ChatAPI-DNA] Research complete. Sources: ${relevantChunks.length} | Web: ${webResults.length}`);

        // 3. Grounded Synthesis with Expert Persona
        const combinedSources = [...groundingSources, ...sourcesText]; // Fixed variable name from 'sources' to 'sourcesText'
        const { answer, suggestions, suggestedSubject } = await generateGroundedResponse(query, combinedSources, webContext, history, standaloneQuery);

        // 4. Resolve Portrait (Hardcoded or Dynamic)
        let portrait = resolvePortrait(answer);
        let dynamicImage = null;

        if (!portrait && suggestedSubject) {
            console.log(`[ChatAPI-DNA] No hardcoded portrait for "${suggestedSubject}". Searching Wikipedia/Wikimedia...`);
            const images = await performImageSearch(suggestedSubject);
            if (images.length > 0) {
                dynamicImage = {
                    name: suggestedSubject,
                    imageUrl: images[0].image,
                    description: `Encyclopedic portrait found for ${suggestedSubject}.`,
                    attribution: images[0].source,
                    sourceUrl: images[0].url
                };
            }
        }

        return NextResponse.json({
            role: "assistant",
            content: answer,
            suggestions: suggestions,
            portrait: portrait || dynamicImage,
            citations: relevantChunks.map(c => ({
                id: c.id,
                source: c.sourceId,
                preview: c.content.substring(0, 50) + "..."
            })),
            webResults: webResults.map(r => ({
                title: r.title,
                url: r.url
            }))
        });
    } catch (error: any) {
        console.error("Agentic Loop Error:", error);
        return NextResponse.json({ error: "High-level Persona Synthesis Failure: " + error.message }, { status: 500 });
    }
}
