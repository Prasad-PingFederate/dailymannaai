import { NextResponse } from "next/server";
import { generateGroundedResponse, rewriteQuery } from "@/lib/ai/gemini";
import { searchRelevantChunks } from "@/lib/storage/vector-store";
import { performWebSearch, formatSearchResults } from "@/lib/tools/web-search";
import { lookupBibleReference } from "@/lib/bible/lookup";

export async function POST(req: Request) {
    try {
        const { query, history = [] } = await req.json();

        if (!query) {
            return NextResponse.json({ error: "Query is required" }, { status: 400 });
        }

        console.log(`[ChatAPI-DNA] Entry Query: "${query}"`);

        // Check for Bible Verse Lookup
        const bibleResult = lookupBibleReference(query);
        const parsed = bibleResult ? (query as any) : null; // This is a bit hacky, I'll fix it by returning the parsed object from lookup

        if (bibleResult) {
            // Check if it's a "Direct" lookup (show/read/lookup or just the reference)
            // I need to update lookupBibleReference to return more info. 
            // For now, let's assume if it matches, we can decide based on query length/content.
            const isDirect = /^(show|read|lookup|give me|find)?\s*([123]?\s*[a-z]+)\s*\d+([: ]\d+)?([-\s]\d+)?$/i.test(query.trim());

            if (isDirect) {
                console.log(`[ChatAPI-DNA] Direct Bible Verse Match found for: ${query}`);
                return NextResponse.json({
                    role: "assistant",
                    content: bibleResult,
                    suggestions: [
                        `What is the context of ${query}?`,
                        `Explain this chapter.`,
                        `Show me the next chapter.`
                    ],
                    citations: [],
                    webResults: []
                });
            }
        }

        // 1. Expert Rewriting (Phonetic Awareness)
        let standaloneQuery = await rewriteQuery(query, history);

        // 2. Pass 1: Primary Search
        let relevantChunks = searchRelevantChunks(standaloneQuery);
        let webResults = await performWebSearch(standaloneQuery);

        // Inject Bible Verse into context if found in query
        if (bibleResult) {
            relevantChunks.push({
                id: "kjv-verse",
                sourceId: "KJV Bible",
                content: bibleResult,
                score: 1.0
            } as any);
        }

        // 🧬 DNA LOGIC: Proactive Retry
        // If we find nothing local AND nothing on the web, broaden the query
        if (relevantChunks.length === 0 && webResults.length === 0) {
            console.log(`[ChatAPI-DNA] Pass 1 yielded 0 results. Broadening query...`);
            const words = standaloneQuery.split(" ");
            const broaderQuery = words.length > 2 ? words.slice(-2).join(" ") : standaloneQuery;

            relevantChunks = searchRelevantChunks(broaderQuery);
            webResults = await performWebSearch(`${broaderQuery} biography christian history`);
            standaloneQuery = broaderQuery; // Update for logging/ref
        }

        const sourcesText = relevantChunks.map(c => `[${c.sourceId}] ${c.content}`);
        const webContext = formatSearchResults(webResults);

        console.log(`[ChatAPI-DNA] Research complete. Sources: ${relevantChunks.length} | Web: ${webResults.length}`);

        // 3. Grounded Synthesis with Expert Persona
        const { answer, suggestions } = await generateGroundedResponse(query, sourcesText, webContext, history);

        return NextResponse.json({
            role: "assistant",
            content: answer,
            suggestions: suggestions,
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
