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

        // Check for direct Bible Verse Lookup
        const bibleVerse = lookupBibleReference(query);
        if (bibleVerse) {
            console.log(`[ChatAPI-DNA] Direct Bible Verse Match found for: ${query}`);
            return NextResponse.json({
                role: "assistant",
                content: bibleVerse,
                suggestions: [
                    `What is the context of ${query}?`,
                    `Show me the next verse.`,
                    `Explain the meaning of this chapter.`
                ],
                citations: [],
                webResults: []
            });
        }

        // 1. Expert Rewriting (Phonetic Awareness)
        let standaloneQuery = await rewriteQuery(query, history);

        // 2. Pass 1: Primary Search
        let relevantChunks = searchRelevantChunks(standaloneQuery);
        let webResults = await performWebSearch(standaloneQuery);

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
