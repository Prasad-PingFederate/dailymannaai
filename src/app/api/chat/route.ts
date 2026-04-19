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
import { searchRSSFeeds, getLatestChristianNews, RSSArticle } from "@/lib/rss-fetcher";

// ── NEWS INTENT DETECTION ──────────────────────────────────────────────────────
const NEWS_KEYWORDS = [
    "news", "latest", "current", "today", "happening", "update", "updates",
    "recent", "right now", "what's going on", "whats going on", "breaking",
    "headline", "headlines", "event", "events", "world news", "christian news",
    "tell me about", "what happened", "anything new", "new developments",
    "this week", "this month", "trending", "hot topic"
];

// ── CONFLICT / PROPHECY INTENT DETECTION ───────────────────────────────────────
const CONFLICT_KEYWORDS = [
    // War & conflict
    "war", "conflict", "battle", "attack", "missile", "bomb", "strike", "military",
    "ceasefire", "invasion", "troops", "army", "nuclear", "weapon", "airstrike",
    "refugee", "casualties", "sanctions", "terrorism", "terrorist",
    // Israel & Middle East
    "israel", "gaza", "palestine", "hamas", "hezbollah", "jerusalem", "tel aviv",
    "west bank", "iran", "lebanon", "syria", "iraq", "yemen", "middle east",
    "holy land", "netanyahu", "idf",
    // End times / prophecy
    "prophecy", "end times", "apocalypse", "armageddon", "antichrist",
    "tribulation", "rapture", "judgment",
    // Global upheaval
    "earthquake", "tsunami", "famine", "pandemic", "plague", "disaster",
    "ukraine", "russia", "china", "north korea", "nato"
];

// Prophetic Bible connections database — pre-seeded for instant matching
const PROPHECY_SEED = `
KEY PROPHETIC SCRIPTURES FOR WORLD EVENTS:
- Israel/Middle East: Ezekiel 38-39 (Gog & Magog), Zechariah 12:1-3 (Jerusalem a cup of trembling), Isaiah 17:1 (Damascus), Joel 3:1-2 (nations gathered against Israel), Luke 21:20-24 (Jerusalem surrounded by armies)
- Wars & Rumours of War: Matthew 24:6-7 ("ye shall hear of wars and rumours of wars"), Mark 13:7-8, Revelation 6:3-4 (red horse of war)
- Peace & Sudden Destruction: 1 Thessalonians 5:3 ("when they shall say peace and safety then sudden destruction")
- Earthquakes/Disasters: Matthew 24:7 (famines, pestilences, earthquakes), Revelation 6:12, Haggai 2:6-7
- Russia/North: Ezekiel 38:2-3,15 ("from the north... Magog"), Daniel 11:40-44
- End of Days Signs: Daniel 12:4 (knowledge shall increase), 2 Timothy 3:1-5 (perilous times), Revelation 13 (global system)
- Hope & Comfort: Romans 8:28, Isaiah 41:10, Psalm 46:1-3, Revelation 21:4 (no more tears)
`;

function detectNewsIntent(query: string): boolean {
    const q = query.toLowerCase();
    return NEWS_KEYWORDS.some(kw => q.includes(kw));
}

function detectConflictIntent(query: string, articles: RSSArticle[]): boolean {
    const q = query.toLowerCase();
    if (CONFLICT_KEYWORDS.some(kw => q.includes(kw))) return true;
    // Also check if any fetched articles are conflict-related
    const combined = articles.map(a => `${a.title} ${a.description}`).join(" ").toLowerCase();
    return CONFLICT_KEYWORDS.some(kw => combined.includes(kw));
}

export async function POST(req: Request) {
    try {
        const { query, history = [], language = "en-US" } = await req.json();

        const langMap: Record<string, string> = {
            'en-US': 'English',
            'en-GB': 'English',
            'en-IN': 'English',
            'hi-IN': 'Hindi (हिंदी)',
            'te-IN': 'Telugu (తెలుగు)',
            'ta-IN': 'Tamil (தமிழ்)',
            'kn-IN': 'Kannada (కన్నడ)',
            'ml-IN': 'Malayalam (മലയാളം)',
            'es-ES': 'Spanish',
            'fr-FR': 'French',
            'de-DE': 'German',
            'it-IT': 'Italian',
        };
        const selectedLangName = langMap[language] || 'English';

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

        // 🌐 DETECT NEWS INTENT
        const isNewsMode = detectNewsIntent(query);

        // 🚀 PARALLEL PHASE 2: Deep Research (Everything at once)
        const [bibleResults, documentResults, webResults, relevantChunks, newsArticles] = await Promise.all([
            searchBible(intentResult.primaryKeywords),
            searchDocuments(intentResult.standaloneQuery || query),
            performWebSearch(standaloneQuery),
            Promise.resolve(searchRelevantChunks(standaloneQuery)),
            isNewsMode
                ? searchRSSFeeds(query, { limit: 6 }).then(arts =>
                    arts.length > 0 ? arts : getLatestChristianNews(6)
                ).catch(() => [] as RSSArticle[])
                : Promise.resolve([] as RSSArticle[])
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

        console.log(`[ChatAPI-DNA] Research complete. Sources: ${relevantChunks.length} | Web: ${webResults.length} | News: ${newsArticles.length}`);

        // 3. Build news context if in news mode
        const isConflictMode = isNewsMode && detectConflictIntent(query, newsArticles);

        let newsContext = "";
        if (isNewsMode && newsArticles.length > 0) {
            newsContext = `\n\nCURRENT NEWS HEADLINES (fetched live for context):\n` +
                newsArticles.map((a, i) => `${i + 1}. [${a.source}] ${a.title} — ${a.description}`).join("\n");
        }

        if (isConflictMode) {
            newsContext += `\n\n${PROPHECY_SEED}`;
        }

        // Enhance the query with news mode instruction
        let enhancedQuery: string;

        if (isConflictMode && newsArticles.length > 0) {
            enhancedQuery = `${query}

[INSTRUCTION — PROPHETIC SENTINEL STUDY]: DO NOT write this as one continuous essay. You MUST provide two strictly separated sections with a physical line (---) between them.

**PART 1: THE SENTINEL WORLD BRIEFING**
Summarize the current global conflicts and news headlines provided above in 3-4 factual, sharp sentences. Finish this section COMPLETELY.

---

**PART 2: BIBLICAL CONTEXT & THE SECOND COMING**
After the divider, explain how these global events relate to Bible Prophecy and the promised Second Coming of Jesus Christ. Speak with authority, clarity, and hope.

**BIBLE CONNECTIONS (MANDATORY)**
At the end, output this EXACT block:

---BIBLE_CONNECTIONS---
REF: [Book Chapter:Verse]
VERSE: [Quote the KJV verse exactly]
CONNECTION: [1-2 sentences explaining how this verse connects specifically to today's news and the second coming]
---
REF: [Book Chapter:Verse]
VERSE: [Quote the KJV verse exactly]
CONNECTION: [1-2 sentences explaining how this verse connects specifically to today's news and the second coming]
---
REF: [Book Chapter:Verse]
VERSE: [Quote the KJV verse exactly]
CONNECTION: [1-2 sentences explaining how this verse connects specifically to today's news and the second coming]
---BIBLE_CONNECTIONS_END---

Provide exactly 3 Bible connections using Ezekiel, Zechariah, Matthew 24, Daniel, or Revelation.`;
        } else if (isNewsMode && newsArticles.length > 0) {
            enhancedQuery = `${query}\n\n[USER WANTS NEWS]: Briefly acknowledge the current news happening in the world, then offer a spiritual/biblical perspective on what these events mean for believers. Speak prophetically and with hope.`;
        } else {
            enhancedQuery = query;
        }

        // Add Language Instruction
        if (selectedLangName !== 'English') {
            enhancedQuery = `[SYSTEM INSTRUCTION: You must respond to the user ENTIRELY in ${selectedLangName}. Maintain your biblical assistant persona.]\n\n${enhancedQuery}`;
        }

        // 3. Grounded Synthesis with Expert Persona (STREAMING)
        const combinedSources = [...groundingSources, ...sourcesText];

        const { stream, provider } = await generateGroundedStream(enhancedQuery, combinedSources, webContext + newsContext, history, standaloneQuery, "");

        // Prepare metadata and research steps for the frontend
        const researchSteps = [
            `Distilled intent: "${finalStandalone}"`,
            `Found ${finalChunks.length} relevant context fragments`,
            finalWebResults.length > 0 ? `Integrated ${finalWebResults.length} external truth-points` : "Verified with internal canonical archives",
            isNewsMode ? "Prophetic News Sentinel Active" : "Sovereign Reasoning Mode Active"
        ];

        const citations = finalChunks.map((c: any) => ({
            id: c.id,
            source: c.sourceId,
            preview: c.content.substring(0, 80) + "..."
        }));

        const webLinks = finalWebResults.map((r: any) => ({ title: r.title, url: r.url }));
        const newsData = isNewsMode ? newsArticles.map(a => ({
            title: a.title,
            description: a.description,
            link: a.link,
            source: a.source,
            pubDate: a.pubDate,
            imageUrl: a.imageUrl,
            category: a.category,
        })) : [];

        console.log(`[ChatAPI-DNA] Synthesis initiating using ${combinedSources.length} total grounding fragments.`);

        return new Response(stream, {
            headers: {
                "Content-Type": "text/plain; charset=utf-8",
                "Cache-Control": "no-cache",
                "X-AI-Provider": provider,
                "X-Is-News-Mode": isNewsMode ? "true" : "false",
                "X-Is-Conflict-Mode": isConflictMode ? "true" : "false",
                "X-News-Articles": Buffer.from(JSON.stringify(newsData)).toString('base64'),
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
