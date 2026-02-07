export const dynamic = 'force-dynamic';

import { NextResponse } from "next/server";
import { generateGroundedResponse, rewriteQuery } from "@/lib/ai/gemini";
import { TrainingLogger } from "@/lib/ai/training-logger";
import { searchRelevantChunks } from "@/lib/storage/vector-store";
import { performWebSearch, formatSearchResults, performImageSearch } from "@/lib/tools/web-search";
import { lookupBibleReference } from "@/lib/bible/lookup";
import { resolvePortrait } from "@/lib/ai/image-resolver";

export async function POST(req: Request) {
    try {
        const { query, history = [] } = await req.json();

        // 🧠 Catch-All MongoDB Logging: Entry Audit
        await TrainingLogger.log({
            timestamp: new Date().toISOString(),
            request: {
                query,
                provider: "Chat-Entry-Hook",
                model: "Audit-Only",
                historyContextCount: history.length
            },
            response: { answer: "WAITING_FOR_SYNTHESIS", latency: 0, modelUsed: "N/A" },
            metadata: { route: "/api/chat", type: "entry_audit" }
        }).catch(e => console.error("[MongoDB] Entry audit failed:", e.message));

        if (!query) {
            return NextResponse.json({ error: "Query is required" }, { status: 400 });
        }

        console.log(`[ChatAPI-DNA] Entry Query: "${query}"`);

        // Check for Bible Verse Lookup
        const bibleResult = lookupBibleReference(query);

        if (bibleResult) {
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
        const { answer, suggestions, suggestedSubject } = await generateGroundedResponse(query, sourcesText, webContext, history);

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
