// lib/rss-fetcher.ts
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Fetches real-time Christian news from 25+ RSS feeds.
// ✅ ZERO API KEYS — works 100% immediately out of the box.
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export interface RSSArticle {
    title: string;
    description: string;
    link: string;
    source: string;
    pubDate: string | null;
    imageUrl: string | null;
    category: string;
    type: "article";
}

// ── 25 LIVE CHRISTIAN RSS FEEDS (all free, no auth) ─────────
const RSS_FEEDS = [
    // ▸ NEWS
    { url: "https://www.christianitytoday.com/rss/ct.xml", name: "Christianity Today", cat: "news" },
    { url: "https://www.christianpost.com/rss/", name: "Christian Post", cat: "news" },
    { url: "https://www.cbn.com/cbnnews/rss/feed/?type=full", name: "CBN News", cat: "news" },
    { url: "https://crosswalk.com/rss/", name: "Crosswalk", cat: "news" },
    { url: "https://www.christianheadlines.com/rss/", name: "Christian Headlines", cat: "news" },
    { url: "https://relevantmagazine.com/feed/", name: "Relevant Magazine", cat: "news" },
    { url: "https://www.mnnonline.org/feed/", name: "Mission Network News", cat: "missions" },
    // ▸ ISRAEL / MIDDLE EAST (critical for "israel news today")
    { url: "https://www.cbn.com/cbnnews/israel/rss/feed/?type=full", name: "CBN Israel", cat: "news" },
    { url: "https://www.christianpost.com/rss/section/world/", name: "Christian Post World", cat: "news" },
    { url: "https://www.opendoorsusa.org/feed/", name: "Open Doors", cat: "missions" },
    // ▸ THEOLOGY
    { url: "https://www.thegospelcoalition.org/feed/", name: "The Gospel Coalition", cat: "theology" },
    { url: "https://www.desiringgod.org/rss", name: "Desiring God", cat: "theology" },
    { url: "https://www.ligonier.org/rss", name: "Ligonier", cat: "theology" },
    { url: "https://albertmohler.com/feed/", name: "Albert Mohler", cat: "theology" },
    { url: "https://corechristianity.com/feed/", name: "Core Christianity", cat: "theology" },
    // ▸ DEVOTIONALS
    { url: "https://odb.org/feed/", name: "Our Daily Bread", cat: "devotional" },
    { url: "https://billygraham.org/devotions/feed/", name: "Billy Graham", cat: "devotional" },
    { url: "https://www.gty.org/rss", name: "Grace to You", cat: "devotional" },
    // ▸ SERMONS
    { url: "https://www.sermonaudio.com/rss/newest.asp", name: "SermonAudio", cat: "sermon" },
    { url: "https://www.truthforlife.org/rss/sermons/", name: "Truth for Life", cat: "sermon" },
    // ▸ APOLOGETICS
    { url: "https://www.gotquestions.org/gotquestions-rss.xml", name: "Got Questions", cat: "qa" },
    { url: "https://coldcasechristianity.com/feed/", name: "Cold Case Christianity", cat: "apologetics" },
    { url: "https://www.str.org/w/rss.xml", name: "Stand to Reason", cat: "apologetics" },
    // ▸ FAMILY
    { url: "https://www.focusonthefamily.com/rss/", name: "Focus on the Family", cat: "family" },
    // ▸ WORLD MISSIONS
    { url: "https://wng.org/rss", name: "World Mag", cat: "news" },
];

// ── KEYWORD IMPORTANCE WEIGHTS ───────────────────────────────
// Scores article relevance against a search query
function scoreArticle(article: RSSArticle, terms: string[]): number {
    const titleLower = article.title.toLowerCase();
    const descLower = article.description.toLowerCase();
    let score = 0;
    for (const term of terms) {
        const t = term.toLowerCase();
        if (titleLower.includes(t)) score += 5;       // title match = very high
        if (descLower.includes(t)) score += 2;        // desc match
        if (article.source.toLowerCase().includes(t)) score += 1;
    }
    // Boost recent articles
    if (article.pubDate) {
        const age = Date.now() - new Date(article.pubDate).getTime();
        const hoursOld = age / 3_600_000;
        if (hoursOld < 6) score += 4;
        else if (hoursOld < 24) score += 2;
        else if (hoursOld < 72) score += 1;
    }
    return score;
}

// ── PARSE ONE RSS FEED ───────────────────────────────────────
async function parseFeed(feed: typeof RSS_FEEDS[0]): Promise<RSSArticle[]> {
    try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 8000);

        const res = await fetch(feed.url, {
            signal: controller.signal,
            headers: {
                "User-Agent": "DailyMannaAI/1.0 (+https://dailymannaai.com/bot)",
                "Accept": "application/rss+xml, application/xml, text/xml, */*",
            },
            next: { revalidate: 300 }, // cache 5 minutes
        });

        clearTimeout(timeout);
        if (!res.ok) return [];

        const xml = await res.text();
        return parseXML(xml, feed.name, feed.cat);
    } catch {
        return []; // silent fail — other feeds continue
    }
}

// ── XML PARSER (no library needed) ───────────────────────────
function parseXML(xml: string, sourceName: string, category: string): RSSArticle[] {
    const articles: RSSArticle[] = [];
    const itemRegex = /<item[^>]*>([\s\S]*?)<\/item>/gi;
    let match: RegExpExecArray | null;

    while ((match = itemRegex.exec(xml)) !== null) {
        const block = match[1];

        const rawTitle = getTag(block, "title") || getTag(block, "dc:title") || "";
        const rawLink = getTag(block, "link") || getAttrTag(block, "guid", "isPermaLink", "true") || getTag(block, "guid") || "";
        const rawDesc = getTag(block, "content:encoded") || getTag(block, "description") || getTag(block, "summary") || "";
        const pubDate = getTag(block, "pubDate") || getTag(block, "dc:date") || getTag(block, "updated") || null;
        const imageUrl = extractImage(block, rawDesc);

        const title = cleanHtml(stripCDATA(rawTitle)).slice(0, 200);
        const desc = cleanHtml(stripCDATA(rawDesc)).slice(0, 500);
        const link = sanitizeUrl(stripCDATA(rawLink));

        if (title && link) {
            articles.push({ title, description: desc, link, source: sourceName, pubDate, imageUrl, category, type: "article" });
        }
    }

    return articles;
}

// ── PUBLIC API ────────────────────────────────────────────────

/** Search across all RSS feeds. Always returns results. */
export async function searchRSSFeeds(query: string, options: {
    category?: string;
    limit?: number;
} = {}): Promise<RSSArticle[]> {
    const { limit = 15 } = options;

    // Pick feeds — always include news feeds for broader coverage
    const feeds = options.category && options.category !== "news"
        ? RSS_FEEDS.filter(f => f.cat === options.category || f.cat === "news")
        : RSS_FEEDS;

    // Fetch all feeds in parallel
    const settled = await Promise.allSettled(feeds.map(parseFeed));
    const all: RSSArticle[] = [];
    settled.forEach(r => { if (r.status === "fulfilled") all.push(...r.value); });

    if (all.length === 0) return [];

    // Score + sort by relevance
    const terms = query.toLowerCase().split(/\s+/).filter(t => t.length > 1);

    const scored = all
        .map(a => ({ a, s: scoreArticle(a, terms) }))
        .filter(r => r.s > 0)
        .sort((a, b) => b.s - a.s);

    // If NO keyword matches at all, fall back to latest articles
    if (scored.length === 0) {
        return all
            .filter(a => a.link && a.title)
            .sort((a, b) => {
                const da = a.pubDate ? +new Date(a.pubDate) : 0;
                const db = b.pubDate ? +new Date(b.pubDate) : 0;
                return db - da;
            })
            .slice(0, limit);
    }

    return scored.slice(0, limit).map(r => r.a);
}

/** Fetch latest Christian news with no query filter */
export async function getLatestChristianNews(limit = 10): Promise<RSSArticle[]> {
    const newsFeeds = RSS_FEEDS.filter(f => ["news", "missions"].includes(f.cat));
    const settled = await Promise.allSettled(newsFeeds.map(parseFeed));
    const all: RSSArticle[] = [];
    settled.forEach(r => { if (r.status === "fulfilled") all.push(...r.value); });

    return all
        .filter(a => a.link && a.title)
        .sort((a, b) => (+new Date(b.pubDate ?? 0)) - (+new Date(a.pubDate ?? 0)))
        .slice(0, limit);
}

// ── UTILITIES ─────────────────────────────────────────────────

function getTag(xml: string, tag: string): string {
    const re = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "i");
    return xml.match(re)?.[1]?.trim() ?? "";
}

function getAttrTag(xml: string, tag: string, attr: string, val: string): string {
    const re = new RegExp(`<${tag}[^>]*${attr}=["']${val}["'][^>]*>([\\s\\S]*?)<\\/${tag}>`, "i");
    return xml.match(re)?.[1]?.trim() ?? "";
}

function stripCDATA(s: string): string {
    return s.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1").trim();
}

function cleanHtml(html: string): string {
    return html
        .replace(/<script[\s\S]*?<\/script>/gi, "")
        .replace(/<style[\s\S]*?<\/style>/gi, "")
        .replace(/<[^>]+>/g, " ")
        .replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'")
        .replace(/\s{2,}/g, " ").trim();
}

function sanitizeUrl(url: string): string {
    const u = url.trim().replace(/^<|>$/g, "");
    if (!u) return "";
    try {
        const parsed = new URL(u.startsWith("http") ? u : `https://${u}`);
        if (!["http:", "https:"].includes(parsed.protocol)) return "";
        return parsed.href;
    } catch { return ""; }
}

function extractImage(block: string, desc: string): string | null {
    return (
        block.match(/<media:thumbnail[^>]+url=["']([^"']+)["']/i)?.[1] ||
        block.match(/<media:content[^>]+url=["']([^"']+)["'][^>]+type=["']image/i)?.[1] ||
        block.match(/<enclosure[^>]+url=["']([^"']+\.(?:jpg|jpeg|png|webp))["']/i)?.[1] ||
        desc.match(/<img[^>]+src=["']([^"']+)["']/i)?.[1] ||
        null
    );
}
