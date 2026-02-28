// app/api/search/route.ts
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// DailyMannaAI — Integrated Search API (Merged with 80GB Astra DB Support)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

import { NextResponse } from "next/server";
import { searchRSSFeeds } from "@/lib/rss-fetcher";
import { detectInstantAnswer } from "@/lib/instant-answers";
import { getAstraDatabase } from "@/lib/astra-db";
import {
    isBibleRef, lookupBibleVerse,
    searchBibleByKeyword, bibleGatewayUrl,
} from "@/lib/bible-search";

interface SearchResult {
    title: string; description: string; link: string;
    source: string; type: string; imageUrl?: string | null; pubDate?: string | null;
}

// ── UTILS ───────────────────────────────────────────────────

function isValidUrl(url: unknown): url is string {
    if (!url || typeof url !== "string") return false;
    try {
        const u = new URL(url);
        return ["http:", "https:"].includes(u.protocol) &&
            !["localhost", "127.0.0.1", "0.0.0.0"].includes(u.hostname);
    } catch { return false; }
}

function getHostname(url: string): string {
    try { return new URL(url).hostname.replace(/^www\./, ""); } catch { return ""; }
}

function dedup(results: SearchResult[]): SearchResult[] {
    const seen = new Set<string>();
    return results.filter(r => {
        if (!isValidUrl(r.link) || seen.has(r.link)) return false;
        seen.add(r.link);
        return true;
    });
}

const CHRISTIAN_DOMAINS = [
    "christianitytoday.com", "christianpost.com", "cbn.com", "crosswalk.com",
    "thegospelcoalition.org", "desiringgod.org", "relevantmagazine.com",
    "focusonthefamily.com", "christianheadlines.com", "ligonier.org",
    "billygraham.org", "wng.org", "mnnonline.org"
].join(",");

const NEWS_KEYWORDS = [
    "news", "today", "latest", "breaking", "war", "israel", "ukraine", "election",
    "president", "government", "attack", "crisis", "update", "world", "global",
    "report", "conflict", "shooting", "earthquake", "pastor", "church", "persecution"
];

function isNewsQuery(q: string): boolean {
    const ql = q.toLowerCase();
    return NEWS_KEYWORDS.some(kw => ql.includes(kw));
}

// ── EXTERNAL SEARCH ENGINES ─────────────────────────────────

async function searchNewsAPI(query: string, limit = 12): Promise<SearchResult[]> {
    const KEY = process.env.NEWS_API_KEY;
    if (!KEY || KEY === "your_key_here") return [];
    const results: SearchResult[] = [];
    try {
        const r1 = await fetch(
            `https://newsapi.org/v2/everything?` + new URLSearchParams({
                apiKey: KEY, q: query, domains: CHRISTIAN_DOMAINS,
                language: "en", sortBy: "relevancy", pageSize: String(Math.min(limit, 100))
            }), { next: { revalidate: 300 } }
        );
        const d1 = await r1.json();
        if (d1.articles?.length) {
            results.push(...d1.articles
                .filter((a: any) => isValidUrl(a.url) && a.title && !a.title.includes("[Removed]"))
                .map((a: any): SearchResult => ({
                    title: a.title, description: a.description || a.content?.slice(0, 350) || "",
                    link: a.url, source: a.source?.name || getHostname(a.url),
                    type: "news", imageUrl: a.urlToImage || null, pubDate: a.publishedAt || null
                }))
            );
        }
        if (isNewsQuery(query) && results.length < 6) {
            const broadQ = query.toLowerCase().includes("christian") ? query : `${query} christian`;
            const r2 = await fetch(
                `https://newsapi.org/v2/everything?` + new URLSearchParams({
                    apiKey: KEY, q: broadQ, language: "en", sortBy: "publishedAt", pageSize: "10"
                }), { next: { revalidate: 300 } }
            );
            const d2 = await r2.json();
            if (d2.articles?.length) {
                const seenUrls = new Set(results.map(r => r.link));
                const extra = d2.articles
                    .filter((a: any) => isValidUrl(a.url) && a.title && !a.title.includes("[Removed]") && !seenUrls.has(a.url))
                    .slice(0, 8)
                    .map((a: any): SearchResult => ({
                        title: a.title, description: a.description || a.content?.slice(0, 350) || "",
                        link: a.url, source: a.source?.name || getHostname(a.url),
                        type: "news", imageUrl: a.urlToImage || null, pubDate: a.publishedAt || null
                    }));
                results.push(...extra);
            }
        }
    } catch (err: any) {
        console.error("[NewsAPI]", err.message);
    }
    return results.slice(0, limit);
}

async function searchGoogleCSE(query: string, limit = 8): Promise<SearchResult[]> {
    const KEY = process.env.GOOGLE_CSE_API_KEY;
    const CX = process.env.GOOGLE_CSE_ID;
    if (!KEY || !CX || KEY === "your_google_api_key_here") return [];
    try {
        const res = await fetch(
            `https://www.googleapis.com/customsearch/v1?` + new URLSearchParams({
                key: KEY, cx: CX, q: query, num: String(Math.min(limit, 10)), safe: "active", lr: "lang_en"
            }), { next: { revalidate: 300 } }
        );
        const data = await res.json();
        if (data.error) { console.warn("[Google CSE]", data.error.message); return []; }
        return (data.items ?? [])
            .filter((i: any) => isValidUrl(i.link))
            .map((i: any): SearchResult => ({
                title: i.title, description: i.snippet || "",
                link: i.link, source: i.displayLink || "", type: "news",
                imageUrl: i.pagemap?.cse_image?.[0]?.src || null
            }));
    } catch (err: any) { console.error("[Google CSE]", err.message); return []; }
}

async function searchTavily(query: string): Promise<{ answer: string; results: SearchResult[] } | null> {
    const KEY = process.env.TAVILY_API_KEY;
    if (!KEY || KEY === "your_tavily_key_here") return null;
    try {
        const res = await fetch("https://api.tavily.com/search", {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ api_key: KEY, query: query + " christian", search_depth: "basic", include_answer: true, max_results: 8 })
        });
        const data = await res.json();
        if (!data.results?.length) return null;
        return {
            answer: data.answer || "",
            results: data.results.filter((r: any) => isValidUrl(r.url)).map((r: any): SearchResult => ({
                title: r.title, description: r.content?.slice(0, 400) || "",
                link: r.url, source: getHostname(r.url), type: "news"
            }))
        };
    } catch (err: any) { console.error("[Tavily]", err.message); return null; }
}

// ── INTERNAL SEARCH (Astra DB 80GB) ─────────────────────────

async function searchInternalNews(query: string) {
    try {
        const db = await getAstraDatabase().catch(() => null);
        if (db) {
            const collection = db.collection('christian_news');
            const items = await collection.find(
                { $or: [{ title: { $regex: query, $options: 'i' } }, { content: { $regex: query, $options: 'i' } }] },
                { sort: { grace_rank: -1 }, limit: 10 }
            ).toArray();
            return items.map(a => ({
                title: a.title,
                description: a.summary || (a.content ? a.content.substring(0, 300) + '...' : ''),
                link: a.url,
                source: a.source_name || "Astra DB",
                type: "news"
            }));
        }
    } catch (err) { }
    return [];
}

async function searchAstraBible(query: string) {
    try {
        const db = await getAstraDatabase().catch(() => null);
        if (db) {
            const collection = db.collection('bible_verses');
            const verses = await collection.find({ text: { $regex: query } }, { limit: 10 }).toArray();
            return verses.map(v => ({
                title: v.reference,
                description: v.text,
                link: bibleGatewayUrl(v.reference),
                source: "Holy Bible · KJV",
                type: "bible"
            }));
        }
    } catch (err) { }
    return [];
}

// ── FALLBACKS ───────────────────────────────────────────────

function buildFallbackLinks(query: string): SearchResult[] {
    const q = encodeURIComponent(query);
    return [
        { title: `Search "${query}" — Christianity Today`, description: "Award-winning Christian journalism.", link: `https://www.christianitytoday.com/search/?q=${q}`, source: "Christianity Today", type: "news" },
        { title: `Search "${query}" — CBN News`, description: "Christian Broadcasting Network.", link: `https://www1.cbn.com/cbnnews/search?q=${q}`, source: "CBN News", type: "news" },
        { title: `Search "${query}" — Christian Post`, description: "Christian news and commentary.", link: `https://www.christianpost.com/search/?q=${q}`, source: "Christian Post", type: "news" },
        { title: `"${query}" on BibleGateway`, description: "200+ Bible translations.", link: `https://www.biblegateway.com/quicksearch/?quicksearch=${q}&qs_version=KJV`, source: "BibleGateway", type: "bible" },
    ];
}

async function buildGlobalSolution(query: string, rssResults: SearchResult[]) {
    let aiInsight = "";
    let newsResults = [...rssResults].slice(0, 3);

    // 1. Try internal Astra search (High Priority)
    const internalNews = await searchInternalNews(query);
    if (internalNews.length > 0) {
        newsResults = dedup([...internalNews.slice(0, 3), ...newsResults]).slice(0, 4);
    }

    // 2. Try Tavily AI Insight
    const tavily = await searchTavily(query);
    if (tavily?.answer) aiInsight = tavily.answer;
    if (tavily?.results.length) newsResults = dedup([...tavily.results.slice(0, 2), ...newsResults]).slice(0, 4);

    // 3. Try NewsAPI (if still light)
    if (newsResults.length < 3) {
        const newsApi = await searchNewsAPI(query, 6);
        newsResults = dedup([...newsResults, ...newsApi]).slice(0, 4);
    }

    // Bible search (Merged logic)
    let bibleVerses: SearchResult[] = searchBibleByKeyword(query) as SearchResult[];
    const astraBible = await searchAstraBible(query);
    if (astraBible.length > 0) bibleVerses = dedup([...astraBible, ...bibleVerses]);

    if (isBibleRef(query)) {
        const direct = await lookupBibleVerse(query);
        if (direct) bibleVerses = [direct as SearchResult, ...bibleVerses];
    }

    // Ensure insight exists
    if (!aiInsight) aiInsight = `Scripture speaks to "${query}" with clarity. Let these passages guide your understanding as you explore what Christian voices are saying today. "Thy word is a lamp unto my feet." (Psalm 119:105)`;

    return {
        insight: aiInsight,
        bible: bibleVerses.slice(0, 5),
        news: newsResults,
        devotionals: [
            { title: `Daily Manna: ${query}`, description: `Filter headlines about "${query}" through Scripture. God is sovereign.` },
            { title: "Standing Firm", description: '"Watch ye, stand fast in the faith." — 1 Corinthians 16:13' },
            { title: "Seeking Peace", description: `"Pray for the peace of Jerusalem: they shall prosper that love thee." — Psalm 122:6` },
        ],
        sermons: [
            { title: `Biblical Sovereignty in ${query}`, speaker: "John Piper", length: "48 min" },
            { title: `Walking by Faith: ${query}`, speaker: "Alistair Begg", length: "42 min" },
        ],
        deepCrawlAvailable: true // Always show experimental crawler as backup
    };
}

// ── HANDLER ─────────────────────────────────────────────────

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q")?.trim();
    const type = searchParams.get("type") || "global";
    if (!q) return NextResponse.json({ error: "Query required" }, { status: 400 });

    try {
        const instantAnswer = detectInstantAnswer(q);
        let bibleInstant: SearchResult | null = null;
        if (isBibleRef(q)) bibleInstant = await lookupBibleVerse(q) as SearchResult | null;

        // RSS Feed Search (Primary for real-time Christian news)
        const rssCategory = type === "global" ? "news" : type;
        const rssRaw = await searchRSSFeeds(q, { category: rssCategory, limit: 15 });
        const rssResults: SearchResult[] = rssRaw.map(a => ({
            title: a.title, description: a.description, link: a.link,
            source: a.source, type: a.category || "news", imageUrl: a.imageUrl, pubDate: a.pubDate
        }));

        if (type === "global") {
            const solution = await buildGlobalSolution(q, rssResults);
            return NextResponse.json({ instantAnswer: instantAnswer || bibleInstant, solution });
        }

        if (type === "bible") {
            const keywordVerses = searchBibleByKeyword(q) as SearchResult[];
            const astraVerses = await searchAstraBible(q);
            let results: SearchResult[] = dedup([...(bibleInstant ? [bibleInstant] : []), ...astraVerses, ...keywordVerses]);
            if (!results.length) results = buildFallbackLinks(q).filter(r => r.type === "bible");
            return NextResponse.json({ results: results.slice(0, 15), instantAnswer: instantAnswer || bibleInstant });
        }

        // NEWS / DEVOTIONALS / SERMONS
        let results: SearchResult[] = dedup([...rssResults]);
        if (results.length < 5) results = dedup([...results, ...await searchNewsAPI(q, 10)]);
        if (results.length < 5) results = dedup([...results, ...await searchInternalNews(q)]);

        if (results.length === 0) results = buildFallbackLinks(q);

        return NextResponse.json({ results: results.slice(0, 18), instantAnswer: instantAnswer || bibleInstant });

    } catch (error: any) {
        console.error("[SearchAPI Error]", error.message);
        return NextResponse.json({ results: buildFallbackLinks(q ?? "christian news"), instantAnswer: null });
    }
}
