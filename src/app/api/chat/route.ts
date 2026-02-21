export const dynamic = 'force-dynamic';

import { NextResponse } from "next/server";
import { generateGroundedResponse, rewriteQuery, generateGroundedStream, getProviderManager } from "@/lib/ai/gemini";
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
                thought: `Direct matched verse "${query}" in the Rock-Solid KJV archives. Bypassing semantic synthesis for absolute scriptural precision.`,
                suggestions: [`Explain ${query} in depth.`, `Show me cross-references.`, `How does this apply to me?`],
                citations: [{ id: "kjv-direct", source: "KJV Bible (The Rock)", preview: content.substring(0, 80) + "..." }],
                metadata: { search_mode: "DIRECT", intent: "SCRIPTURE_PRECISION" }
            });
        } else if (searchResult.mode === "SEMANTIC_SEARCH") {
            const intentType = searchResult.intent?.type || "GENERAL";
            const keywords = searchResult.intent?.primaryKeywords.join(", ") || "none";

            console.log(`[TruthEngine] 🧠 UNIFIED Search | Intent: ${intentType} | Keywords: ${keywords}`);

            // Add Bible Results
            searchResult.bibleResults.forEach((res: any) => {
                groundingSources.push(`[KJV Bible Result]: (${res.reference}) ${res.text}`);
            });

            // Add Document Results (Sermons, History)
            searchResult.documentResults.forEach((res: any) => {
                groundingSources.push(`[Expert Knowledge]: (${res.title}) ${res.snippet}`);
            });
        } else if (searchResult.mode === "GREETING") {
            // Guard: If query is long, it's likely a complex question starting with a greeting (e.g. "Hello, who is Jesus?")
            if (query.split(" ").length <= 4) {
                const greetingPrompt = `The user said: "${query}". Reply with a warm Christian greeting. Do not use "Praise the Lord!" unless the user said it first. Use "Greetings in Jesus' name" or "Good morning/evening". Keep it short.`;
                const { answer: greeting, thought: greetingThought } = await generateGroundedResponse(greetingPrompt, [], "", history);

                return NextResponse.json({
                    role: "assistant",
                    content: greeting,
                    thought: greetingThought || "Generating a warm Christian greeting based on established spiritual protocol.",
                    suggestions: ["Show me today's verse.", "Help me with Bible study.", "What is the Daily Manna?"],
                    metadata: { search_mode: "GREETING" }
                });
            }
            console.log(`[TruthEngine] 🧐 Greeting detected but query has depth. Proceeding to Deep Analysis.`);
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

        // 3. Grounded Synthesis with Expert Persona (STREAMING)
        const combinedSources = [...groundingSources, ...sourcesText];

        const truthSummary = searchResult.truthAssessment
            ? `Integrity Score: ${searchResult.truthAssessment.integrityScore}%. ${searchResult.truthAssessment.isSound ? 'Status: Sound.' : 'Status: Warnings Found: ' + searchResult.truthAssessment.warnings.join(", ")}`
            : "";

        const { stream, provider } = await generateGroundedStream(query, combinedSources, webContext, history, standaloneQuery, truthSummary);

        // Prepare metadata for the frontend to read via headers
        const citations = relevantChunks.map(c => ({
            id: c.id,
            source: c.sourceId,
            preview: c.content.substring(0, 80) + "..."
        }));

        const webLinks = webResults.map(r => ({ title: r.title, url: r.url }));

        return new Response(stream, {
            headers: {
                "Content-Type": "text/plain; charset=utf-8",
                "Cache-Control": "no-cache",
                "X-AI-Provider": provider,
                "X-Citations": JSON.stringify(citations).substring(0, 4000), // Safety cap
                "X-Web-Links": JSON.stringify(webLinks).substring(0, 2000)
            }
        });
    } catch (error: any) {
        console.error("Agentic Loop Error:", error);
        return NextResponse.json({ error: "High-level Persona Synthesis Failure: " + error.message }, { status: 500 });
    }
}
