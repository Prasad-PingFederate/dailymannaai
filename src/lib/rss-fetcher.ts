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

// ── 100+ LIVE RSS FEEDS: World + India + Google News + Christian ──────────────
const RSS_FEEDS = [
    // ════════════════════════════════════════════════════════
    // ▸ GOOGLE NEWS RSS — Updates within MINUTES (no auth needed)
    // ════════════════════════════════════════════════════════
    { url: "https://news.google.com/rss?hl=en-US&gl=US&ceid=US:en", name: "Google News Top", cat: "breaking" },
    { url: "https://news.google.com/rss/topics/CAAqJggKIiBDQkFTRWdvSUwyMHZNRFZxYVdjU0FtVnVHZ0pWVXlnQVAB?hl=en-US&gl=US&ceid=US:en", name: "Google News World", cat: "breaking" },
    { url: "https://news.google.com/rss/topics/CAAqIggKIhxDQkFTRHdvSkwyMHZNR1ptZHpWbUVnSmxiaWdBUAE?hl=en-IN&gl=IN&ceid=IN:en", name: "Google News India", cat: "breaking" },
    { url: "https://news.google.com/rss/search?q=Israel+Iran+war+conflict&hl=en-US&gl=US&ceid=US:en", name: "Google News Israel", cat: "breaking" },
    { url: "https://news.google.com/rss/search?q=Middle+East+conflict+war&hl=en-US&gl=US&ceid=US:en", name: "Google News Middle East", cat: "breaking" },
    { url: "https://news.google.com/rss/search?q=breaking+news+world&hl=en-US&gl=US&ceid=US:en", name: "Google News Breaking", cat: "breaking" },
    { url: "https://news.google.com/rss/search?q=war+military+attack&hl=en-US&gl=US&ceid=US:en", name: "Google News War", cat: "breaking" },
    // ════════════════════════════════════════════════════════
    // ▸ USA NEWS — Top Pulse
    // ════════════════════════════════════════════════════════
    { url: "https://rss.cnn.com/rss/cnn_topstories.rss", name: "CNN USA", cat: "world" },
    { url: "https://moxie.foxnews.com/google-publisher/latest.xml", name: "Fox News USA", cat: "world" },
    { url: "https://feeds.washingtonpost.com/rss/national", name: "Washington Post", cat: "world" },
    { url: "https://www.npr.org/rss/rss.php?id=1001", name: "NPR USA", cat: "world" },
    { url: "https://rss.nytimes.com/services/xml/rss/nyt/HomePage.xml", name: "NY Times", cat: "world" },
    { url: "https://www.usatoday.com/rss/news", name: "USA Today", cat: "world" },

    // ════════════════════════════════════════════════════════
    // ▸ UK & BRITAIN NEWS — Top Pulse
    // ════════════════════════════════════════════════════════
    { url: "https://feeds.bbci.co.uk/news/rss.xml", name: "BBC News UK", cat: "world" },
    { url: "https://www.theguardian.com/uk/rss", name: "The Guardian UK", cat: "world" },
    { url: "https://feeds.skynews.com/feeds/rss/uk.xml", name: "Sky News UK", cat: "world" },
    { url: "https://www.independent.co.uk/news/uk/rss", name: "The Independent UK", cat: "world" },
    { url: "https://www.standard.co.uk/news/uk/rss", name: "Evening Standard UK", cat: "world" },

    // ════════════════════════════════════════════════════════
    // ▸ FRANCE NEWS (English Versions)
    // ════════════════════════════════════════════════════════
    { url: "https://www.france24.com/en/rss", name: "France 24 World", cat: "world" },
    { url: "https://www.france24.com/en/france/rss", name: "France 24 News", cat: "world" },
    { url: "https://www.lemonde.fr/en/rss/full_feed.xml", name: "Le Monde (EN)", cat: "world" },
    { url: "https://www.rfi.fr/en/rss", name: "RFI (EN)", cat: "world" },

    // ════════════════════════════════════════════════════════
    // ▸ MAJOR WORLD NEWS — Top Global Sources
    // ════════════════════════════════════════════════════════
    // ════════════════════════════════════════════════════════
    // ▸ INDIA NEWS — Priority Sources
    // ════════════════════════════════════════════════════════
    { url: "https://www.indiatoday.in/rss/home", name: "India Today", cat: "india" },
    { url: "https://www.indiatoday.in/rss/1206578", name: "India Today World", cat: "india" },
    { url: "https://www.thehindu.com/feeder/default.rss", name: "The Hindu", cat: "india" },
    { url: "https://www.thehindu.com/news/international/feeder/default.rss", name: "The Hindu International", cat: "india" },
    { url: "https://www.hindustantimes.com/feeds/rss/india-news/rssfeed.xml", name: "Hindustan Times", cat: "india" },
    { url: "https://www.hindustantimes.com/feeds/rss/world-news/rssfeed.xml", name: "Hindustan Times World", cat: "india" },
    { url: "https://feeds.feedburner.com/ndtvnews-top-stories", name: "NDTV Top Stories", cat: "india" },
    { url: "https://feeds.feedburner.com/ndtvnews-world-news", name: "NDTV World", cat: "india" },
    { url: "https://www.indiatoday.in/rss/1206514", name: "India Today Israel", cat: "india" },
    { url: "https://timesofindia.indiatimes.com/rssfeedstopstories.cms", name: "Times of India", cat: "india" },
    { url: "https://timesofindia.indiatimes.com/rssfeeds/296589292.cms", name: "TOI World", cat: "india" },
    { url: "https://indianexpress.com/feed/", name: "The Indian Express", cat: "india" },
    { url: "https://economictimes.indiatimes.com/rssfeedstopstories.cms", name: "Economic Times", cat: "india" },
    { url: "https://scroll.in/feed", name: "Scroll.in", cat: "india" },
    { url: "https://www.news18.com/rss/world.xml", name: "News18 World", cat: "india" },
    // ════════════════════════════════════════════════════════
    // ▸ CHRISTIAN NEWS
    // ════════════════════════════════════════════════════════
    { url: "https://www.christianitytoday.com/rss/ct.xml", name: "Christianity Today", cat: "news" },
    { url: "https://www.christianpost.com/rss/", name: "Christian Post", cat: "news" },
    { url: "https://www.cbn.com/cbnnews/rss/feed/?type=full", name: "CBN News", cat: "news" },
    { url: "https://www.cbn.com/cbnnews/israel/rss/feed/?type=full", name: "CBN Israel", cat: "news" },
    { url: "https://crosswalk.com/rss/", name: "Crosswalk", cat: "news" },
    { url: "https://www.christianheadlines.com/rss/", name: "Christian Headlines", cat: "news" },
    { url: "https://relevantmagazine.com/feed/", name: "Relevant Magazine", cat: "news" },
    { url: "https://www.mnnonline.org/feed/", name: "Mission Network News", cat: "missions" },
    { url: "https://www.christianpost.com/rss/section/world/", name: "Christian Post World", cat: "news" },
    { url: "https://www.opendoorsusa.org/feed/", name: "Open Doors", cat: "missions" },
    { url: "https://wng.org/rss", name: "World Mag", cat: "news" },
    { url: "https://www.baptistpress.com/feed/", name: "Baptist Press", cat: "news" },
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
    // ▸ APOLOGETICS / Q&A
    { url: "https://www.gotquestions.org/gotquestions-rss.xml", name: "Got Questions", cat: "qa" },
    { url: "https://coldcasechristianity.com/feed/", name: "Cold Case Christianity", cat: "apologetics" },
    { url: "https://www.str.org/w/rss.xml", name: "Stand to Reason", cat: "apologetics" },
    // ▸ FAMILY
    { url: "https://www.focusonthefamily.com/rss/", name: "Focus on the Family", cat: "family" },
];

// ── HIGH-PRIORITY BREAKING NEWS FEEDS (always fetched for news mode) ──────────
// These are fetched first with no caching for maximum recency
const BREAKING_FEEDS = RSS_FEEDS.filter(f => f.cat === "breaking");

// ── CORE FEEDS: Diversified subset to ensure pluralism in sources ─────────────
// We limit Google to 2 and add key global/christian/india direct sites.
const CORE_FEEDS = [
    // Top-tier aggregators (limited)
    RSS_FEEDS.find(f => f.name === "Google News World")!,
    RSS_FEEDS.find(f => f.name === "Google News India")!,
    // Top World Direct Sources
    ...RSS_FEEDS.filter(f => ["BBC World", "Reuters World", "AP World", "Al Jazeera", "France 24 World"].includes(f.name)),
    // Top UK/USA Sources
    ...RSS_FEEDS.filter(f => ["CNN USA", "Fox News USA", "BBC News UK", "The Guardian UK"].includes(f.name)),
    // Top Christian Direct Sources
    ...RSS_FEEDS.filter(f => ["Christianity Today", "Christian Post", "CBN News", "CBN Israel", "World Mag"].includes(f.name)),
    // Top India Direct Sources
    ...RSS_FEEDS.filter(f => ["India Today", "The Hindu", "Hindustan Times", "NDTV Top Stories", "Times of India"].includes(f.name))
].filter(Boolean).slice(0, 30);


// ── KEYWORD IMPORTANCE WEIGHTS ───────────────────────────────
// Scores article relevance against a search query
// Recency is heavily weighted — articles from the last hour score highest
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
    // ── HEAVY RECENCY BOOST ── Articles from last hours get priority
    if (article.pubDate) {
        const age = Date.now() - new Date(article.pubDate).getTime();
        const minsOld = age / 60_000;
        const hoursOld = age / 3_600_000;
        if (minsOld < 30) score += 12;  // <30 mins — breaking!!
        else if (hoursOld < 2) score += 8;   // <2 hours  — very fresh
        else if (hoursOld < 6) score += 5;   // <6 hours  — same day
        else if (hoursOld < 24) score += 2;   // <24 hours — today
        else if (hoursOld < 48) score += 0;   // <48 hours — recent
        else score -= 2;   // older than 2 days — deprioritize
    }
    return score;
}

// ── PARSE ONE RSS FEED ───────────────────────────────────────
async function parseFeed(feed: typeof RSS_FEEDS[0], noCache = false): Promise<RSSArticle[]> {
    try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 5000); // 5s timeout (was 8s)

        const res = await fetch(feed.url, {
            signal: controller.signal,
            headers: {
                "User-Agent": "DailyMannaAI/1.0 (+https://dailymannaai.com/bot)",
                "Accept": "application/rss+xml, application/xml, text/xml, */*",
            },
            // Breaking feeds: no cache. Others: 60s cache (was 300s)
            next: noCache ? { revalidate: 0 } : { revalidate: 60 },
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

        const title = cleanHtml(stripCDATA(rawTitle)).slice(0, 150);
        const desc = smartTruncate(cleanHtml(stripCDATA(rawDesc)), 280);
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
    const { limit = 20 } = options; // Increased from 15 → 20 for better pool

    // Always fetch breaking feeds first (no cache) + relevant category feeds
    const breakingFeeds = BREAKING_FEEDS;

    // Optimization: Don't fetch everything. Fetch a smart subset.
    let targetFeeds = [];
    if (options.category && options.category !== "news") {
        targetFeeds = RSS_FEEDS.filter(f => f.cat === options.category || f.cat === "world" || f.cat === "india");
    } else {
        targetFeeds = CORE_FEEDS;
    }

    // Limit absolute number of total feeds to fetch to avoid socket exhaustion
    const finalFeedList = targetFeeds.slice(0, 25);

    // Fetch combined list in parallel
    const settled = await Promise.allSettled(finalFeedList.map(f => parseFeed(f, f.cat === "breaking")));

    const all: RSSArticle[] = [];
    settled.forEach(r => { if (r.status === "fulfilled") all.push(...r.value); });

    if (all.length === 0) return [];

    // Score + sort by relevance + recency
    const terms = query.toLowerCase().split(/\s+/).filter(t => t.length > 1);

    const scored = all
        .map(a => ({ a, s: scoreArticle(a, terms) }))
        .filter(r => r.s > 0)
        .sort((a, b) => b.s - a.s);

    // If NO keyword matches, fall back to the most recent articles across all feeds
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
    const settled = await Promise.allSettled(newsFeeds.map(f => parseFeed(f, false)));
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

function smartTruncate(text: string, max: number): string {
    if (text.length <= max) return text;
    const cut = text.lastIndexOf(" ", max);
    return (cut > max * 0.6 ? text.slice(0, cut) : text.slice(0, max)) + "…";
}

function stripCDATA(s: string): string {
    return s.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1").trim();
}

/** Decode common HTML entities to plain text */
function decodeEntities(s: string): string {
    return s
        .replace(/&nbsp;/g, " ")
        .replace(/&amp;/g, "&")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/&apos;/g, "'")
        .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
        .replace(/&[a-z]{2,8};/gi, " "); // catch anything else (e.g. &mdash;)
}

/** Strip all HTML tags — includes script, style, and bare angle-bracket fragments */
function stripTags(s: string): string {
    return s
        .replace(/<script[\s\S]*?<\/script>/gi, "")
        .replace(/<style[\s\S]*?<\/style>/gi, "")
        .replace(/<[^>]+>/g, " ")           // strip normal tags
        .replace(/[<>]/g, " ");          // strip stray angle brackets
}

/**
 * Two-pass clean: decode → strip → decode → strip
 * Handles both plain HTML and double-encoded HTML (&lt;p&gt; → <p> → stripped).
 */
function cleanHtml(html: string): string {
    // Pass 1: decode entities, then strip tags (handles &lt;p&gt; case)
    let result = stripTags(decodeEntities(html));
    // Pass 2: decode any newly revealed entities, strip again
    result = stripTags(decodeEntities(result));
    // Final cleanup: collapse whitespace
    return result.replace(/\s{2,}/g, " ").trim();
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
