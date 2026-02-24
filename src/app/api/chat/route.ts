export const dynamic = 'force-dynamic';

import { NextResponse } from "next/server";
import { generateGroundedResponse, analyzeResearchIntent, generateGroundedStream, getProviderManager } from "@/lib/ai/gemini";
import { TrainingLogger } from "@/lib/ai/training-logger";
import { searchRelevantChunks } from "@/lib/storage/vector-store";
import { performWebSearch, formatSearchResults, performImageSearch } from "@/lib/tools/web-search";
import { resolvePortrait } from "@/lib/ai/image-resolver";
import { executeHybridSearch } from "@/lib/search/engine";
import { lookupBibleReference } from "@/lib/bible/lookup";
import { searchBible } from "@/lib/search/bible-search";
import { searchDocuments } from "@/lib/search/document-search";

export async function POST(req: Request) {
    try {
        const { query, history = [] } = await req.json();

        // 🧠 Catch-All MongoDB Logging: Entry Audit (NON-BLOCKING)
        const ip = req.headers.get('x-forwarded-for') || 'unknown';
        const userAgent = req.headers.get('user-agent') || 'unknown';
        const referer = req.headers.get('referer') || 'unknown';

        TrainingLogger.log({
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

        // 🚀 ORCHESTRATED PHASE 1: Intent Analysis & Truth Discovery (PARALLEL)
        const [intentResult, directVerse] = await Promise.all([
            analyzeResearchIntent(query, history),
            lookupBibleReference(query)
        ]);

        const standaloneQuery = intentResult.standaloneQuery;

        // Handle Direct Scripture Fast-Path
        if (directVerse && (intentResult.type === "VERSE_LOOKUP" || query.length < 25)) {
            console.log(`[TruthEngine] ⚡ Direct Scripture Match: ${query}`);
            return NextResponse.json({
                role: "assistant",
                content: directVerse,
                thought: `Direct matched verse "${query}" in the Rock-Solid KJV archives. Bypassing semantic synthesis for absolute scriptural precision.`,
                suggestions: [`Explain ${query} in depth.`, `Show me cross-references.`, `How does this apply to me?`],
                citations: [{ id: "kjv-direct", source: "KJV Bible (The Rock)", preview: directVerse.substring(0, 80) + "..." }],
                metadata: { search_mode: "DIRECT", intent: "SCRIPTURE_PRECISION" }
            });
        }

        // Handle Greetings
        if (intentResult.type === "GREETING" && query.split(" ").length <= 4) {
            const greetingPrompt = `The user said: "${query}". Reply with a warm Christian greeting. Keep it short.`;
            const { answer: greeting, thought: greetingThought } = await generateGroundedResponse(greetingPrompt, [], "", history);
            return NextResponse.json({
                role: "assistant",
                content: greeting,
                thought: greetingThought || "Generating a warm Christian greeting.",
                suggestions: ["Show me today's verse.", "Help me with Bible study.", "What is the Daily Manna?"],
                metadata: { search_mode: "GREETING" }
            });
        }

        // 🚀 PARALLEL PHASE 2: Deep Research (Everything at once)
        const [bibleResults, documentResults, webResults, relevantChunks] = await Promise.all([
            searchBible(intentResult.primaryKeywords),
            searchDocuments(intentResult.standaloneQuery || query),
            performWebSearch(standaloneQuery),
            Promise.resolve(searchRelevantChunks(standaloneQuery))
        ]);

        let groundingSources: string[] = [];
        bibleResults.forEach((res: any) => groundingSources.push(`[KJV Bible]: (${res.reference}) ${res.text}`));
        documentResults.forEach((res: any) => groundingSources.push(`[Expert Knowledge]: (${res.title}) ${res.snippet}`));

        console.log(`[ChatAPI-DNA] Research complete. Local: ${relevantChunks.length} | Web: ${webResults.length} | Bible: ${bibleResults.length}`);

        let finalChunks = relevantChunks;
        let finalWebResults = webResults;
        let finalStandalone = standaloneQuery;

        // Broaden query if absolutely no results found
        if (relevantChunks.length === 0 && webResults.length === 0 && bibleResults.length === 0) {
            console.log(`[ChatAPI-DNA] No results. Broadening...`);
            const words = standaloneQuery.split(" ");
            finalStandalone = words.length > 2 ? words.slice(-2).join(" ") : standaloneQuery;
            [finalWebResults, finalChunks] = await Promise.all([
                performWebSearch(`${finalStandalone} christian biography`),
                Promise.resolve(searchRelevantChunks(finalStandalone))
            ]);
        }

        const sourcesText = finalChunks.map((c: any) => `[${c.sourceId}] ${c.content}`);
        const webContext = formatSearchResults(finalWebResults);

        console.log(`[ChatAPI-DNA] Research complete. Sources: ${relevantChunks.length} | Web: ${webResults.length}`);

        // 3. Grounded Synthesis with Expert Persona (STREAMING)
        const combinedSources = [...groundingSources, ...sourcesText];

        const { stream, provider } = await generateGroundedStream(query, combinedSources, webContext, history, standaloneQuery, "");

        // Prepare metadata and research steps for the frontend
        const researchSteps = [
            `Distilled intent: "${finalStandalone}"`,
            `Found ${finalChunks.length} relevant context fragments`,
            finalWebResults.length > 0 ? `Integrated ${finalWebResults.length} external truth-points` : "Verified with internal canonical archives",
            "Sovereign Reasoning Mode Active"
        ];

        const citations = finalChunks.map((c: any) => ({
            id: c.id,
            source: c.sourceId,
            preview: c.content.substring(0, 80) + "..."
        }));

        const webLinks = finalWebResults.map((r: any) => ({ title: r.title, url: r.url }));

        console.log(`[ChatAPI-DNA] Synthesis initiating using ${combinedSources.length} total grounding fragments.`);

        return new Response(stream, {
            headers: {
                "Content-Type": "text/plain; charset=utf-8",
                "Cache-Control": "no-cache",
                "X-AI-Provider": provider,
                "X-Citations": Buffer.from(JSON.stringify(citations)).toString('base64'),
                "X-Web-Links": Buffer.from(JSON.stringify(webLinks)).toString('base64'),
                "X-Research-Steps": Buffer.from(JSON.stringify(researchSteps)).toString('base64')
            }
        });
    } catch (error: any) {
        console.error("Agentic Loop Error:", error);
        return NextResponse.json({
            error: "The spiritual wisdom centers are momentarily at capacity. Please take a moment to reflect and try again soon."
        }, { status: 500 });
    }
}
