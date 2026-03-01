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
    { url: "https://news.google.com/rss?hl=en-US&gl=US&ceid=US:en", name: "Google News Top", cat: "breaking", authority: 100 },
    { url: "https://news.google.com/rss/topics/CAAqJggKIiBDQkFTRWdvSUwyMHZNRFZxYVdjU0FtVnVHZ0pWVXlnQVAB?hl=en-US&gl=US&ceid=US:en", name: "Google News World", cat: "breaking", authority: 100 },
    { url: "https://news.google.com/rss/topics/CAAqIggKIhxDQkFTRHdvSkwyMHZNR1ptZHpWbUVnSmxiaWdBUAE?hl=en-IN&gl=IN&ceid=IN:en", name: "Google News India", cat: "breaking", authority: 100 },
    { url: "https://news.google.com/rss/search?q=Israel+Iran+war+conflict&hl=en-US&gl=US&ceid=US:en", name: "Google News Israel", cat: "breaking", authority: 100 },
    { url: "https://news.google.com/rss/search?q=Middle+East+conflict+war&hl=en-US&gl=US&ceid=US:en", name: "Google News Middle East", cat: "breaking", authority: 95 },
    { url: "https://news.google.com/rss/search?q=breaking+news+world&hl=en-US&gl=US&ceid=US:en", name: "Google News Breaking", cat: "breaking", authority: 95 },
    { url: "https://news.google.com/rss/search?q=war+military+attack&hl=en-US&gl=US&ceid=US:en", name: "Google News War", cat: "breaking", authority: 95 },

    // ════════════════════════════════════════════════════════
    // ▸ USA NEWS — Top Pulse
    // ════════════════════════════════════════════════════════
    { url: "https://rss.cnn.com/rss/cnn_topstories.rss", name: "CNN USA", cat: "world", authority: 98 },
    { url: "https://moxie.foxnews.com/google-publisher/latest.xml", name: "Fox News USA", cat: "world", authority: 95 },
    { url: "https://feeds.washingtonpost.com/rss/national", name: "Washington Post", cat: "world", authority: 96 },
    { url: "https://www.npr.org/rss/rss.php?id=1001", name: "NPR USA", cat: "world", authority: 94 },
    { url: "https://rss.nytimes.com/services/xml/rss/nyt/HomePage.xml", name: "NY Times", cat: "world", authority: 98 },
    { url: "https://www.usatoday.com/rss/news", name: "USA Today", cat: "world", authority: 92 },

    // ════════════════════════════════════════════════════════
    // ▸ UK & BRITAIN NEWS — Top Pulse
    // ════════════════════════════════════════════════════════
    { url: "https://feeds.bbci.co.uk/news/rss.xml", name: "BBC News UK", cat: "world", authority: 100 },
    { url: "https://www.theguardian.com/uk/rss", name: "The Guardian UK", cat: "world", authority: 97 },
    { url: "https://feeds.skynews.com/feeds/rss/uk.xml", name: "Sky News UK", cat: "world", authority: 94 },
    { url: "https://www.independent.co.uk/news/uk/rss", name: "The Independent UK", cat: "world", authority: 90 },
    { url: "https://www.standard.co.uk/news/uk/rss", name: "Evening Standard UK", cat: "world", authority: 85 },

    // ════════════════════════════════════════════════════════
    // ▸ FRANCE NEWS (English Versions)
    // ════════════════════════════════════════════════════════
    { url: "https://www.france24.com/en/rss", name: "France 24 World", cat: "world", authority: 95 },
    { url: "https://www.france24.com/en/france/rss", name: "France 24 News", cat: "world", authority: 90 },
    { url: "https://www.lemonde.fr/en/rss/full_feed.xml", name: "Le Monde (EN)", cat: "world", authority: 97 },
    { url: "https://www.rfi.fr/en/rss", name: "RFI (EN)", cat: "world", authority: 88 },

    // ════════════════════════════════════════════════════════
    // ▸ INDIA NEWS — Priority Sources
    // ════════════════════════════════════════════════════════
    { url: "https://www.indiatoday.in/rss/home", name: "India Today", cat: "india", authority: 94 },
    { url: "https://www.indiatoday.in/rss/1206578", name: "India Today World", cat: "india", authority: 92 },
    { url: "https://www.thehindu.com/feeder/default.rss", name: "The Hindu", cat: "india", authority: 96 },
    { url: "https://www.thehindu.com/news/international/feeder/default.rss", name: "The Hindu International", cat: "india", authority: 95 },
    { url: "https://www.hindustantimes.com/feeds/rss/india-news/rssfeed.xml", name: "Hindustan Times", cat: "india", authority: 92 },
    { url: "https://www.hindustantimes.com/feeds/rss/world-news/rssfeed.xml", name: "Hindustan Times World", cat: "india", authority: 90 },
    { url: "https://feeds.feedburner.com/ndtvnews-top-stories", name: "NDTV Top Stories", cat: "india", authority: 95 },
    { url: "https://feeds.feedburner.com/ndtvnews-world-news", name: "NDTV World", cat: "india", authority: 94 },
    { url: "https://www.indiatoday.in/rss/1206514", name: "India Today Israel", cat: "india", authority: 90 },
    { url: "https://timesofindia.indiatimes.com/rssfeedstopstories.cms", name: "Times of India", cat: "india", authority: 98 },
    { url: "https://timesofindia.indiatimes.com/rssfeeds/296589292.cms", name: "TOI World", cat: "india", authority: 97 },
    { url: "https://indianexpress.com/feed/", name: "The Indian Express", cat: "india", authority: 93 },
    { url: "https://economictimes.indiatimes.com/rssfeedstopstories.cms", name: "Economic Times", cat: "india", authority: 90 },
    { url: "https://scroll.in/feed", name: "Scroll.in", cat: "india", authority: 85 },
    { url: "https://www.news18.com/rss/world.xml", name: "News18 World", cat: "india", authority: 88 },

    // ════════════════════════════════════════════════════════
    // ▸ CHRISTIAN NEWS
    // ════════════════════════════════════════════════════════
    { url: "https://www.christianitytoday.com/rss/ct.xml", name: "Christianity Today", cat: "news", authority: 95 },
    { url: "https://www.christianpost.com/rss/", name: "Christian Post", cat: "news", authority: 92 },
    { url: "https://www.cbn.com/cbnnews/rss/feed/?type=full", name: "CBN News", cat: "news", authority: 90 },
    { url: "https://www.cbn.com/cbnnews/israel/rss/feed/?type=full", name: "CBN Israel", cat: "news", authority: 90 },
    { url: "https://crosswalk.com/rss/", name: "Crosswalk", cat: "news", authority: 85 },
    { url: "https://www.christianheadlines.com/rss/", name: "Christian Headlines", cat: "news", authority: 85 },
    { url: "https://relevantmagazine.com/feed/", name: "Relevant Magazine", cat: "news", authority: 80 },
    { url: "https://www.mnnonline.org/feed/", name: "Mission Network News", cat: "missions", authority: 75 },
    { url: "https://www.christianpost.com/rss/section/world/", name: "Christian Post World", cat: "news", authority: 90 },
    { url: "https://www.opendoorsusa.org/feed/", name: "Open Doors", cat: "missions", authority: 85 },
    { url: "https://wng.org/rss", name: "World Mag", cat: "news", authority: 88 },
    { url: "https://www.baptistpress.com/feed/", name: "Baptist Press", cat: "news", authority: 85 },

    // ▸ THEOLOGY
    { url: "https://www.thegospelcoalition.org/feed/", name: "The Gospel Coalition", cat: "theology", authority: 88 },
    { url: "https://www.desiringgod.org/rss", name: "Desiring God", cat: "theology", authority: 85 },
    { url: "https://www.ligonier.org/rss", name: "Ligonier", cat: "theology", authority: 85 },
    { url: "https://albertmohler.com/feed/", name: "Albert Mohler", cat: "theology", authority: 80 },
    { url: "https://corechristianity.com/feed/", name: "Core Christianity", cat: "theology", authority: 80 },

    // ▸ DEVOTIONALS
    { url: "https://odb.org/feed/", name: "Our Daily Bread", cat: "devotional", authority: 90 },
    { url: "https://billygraham.org/devotions/feed/", name: "Billy Graham", cat: "devotional", authority: 90 },
    { url: "https://www.gty.org/rss", name: "Grace to You", cat: "devotional", authority: 90 },

    // ▸ SERMONS
    { url: "https://www.sermonaudio.com/rss/newest.asp", name: "SermonAudio", cat: "sermon", authority: 85 },
    { url: "https://www.truthforlife.org/rss/sermons/", name: "Truth for Life", cat: "sermon", authority: 85 },

    // ▸ APOLOGETICS / Q&A
    { url: "https://www.gotquestions.org/gotquestions-rss.xml", name: "Got Questions", cat: "qa", authority: 90 },
    { url: "https://coldcasechristianity.com/feed/", name: "Cold Case Christianity", cat: "apologetics", authority: 80 },
    { url: "https://www.str.org/w/rss.xml", name: "Stand to Reason", cat: "apologetics", authority: 80 },

    // ▸ FAMILY
    { url: "https://www.focusonthefamily.com/rss/", name: "Focus on the Family", cat: "family", authority: 90 },
];

// ── HIGH-PRIORITY BREAKING NEWS FEEDS (always fetched for news mode) ──────────
const BREAKING_FEEDS = RSS_FEEDS.filter(f => f.cat === "breaking");

// ── CORE FEEDS: Diversified subset to ensure pluralism in sources ─────────────
const CORE_FEEDS = [
    RSS_FEEDS.find(f => f.name === "Google News World")!,
    RSS_FEEDS.find(f => f.name === "Google News India")!,
    ...RSS_FEEDS.filter(f => ["BBC News UK", "CNN USA", "Fox News USA", "The Hindu", "Times of India", "Christianity Today", "France 24 World"].includes(f.name)),
].filter(Boolean);

// ── KEYWORD IMPORTANCE WEIGHTS ───────────────────────────────
function scoreArticle(article: RSSArticle, queryKeywords: string[]): number {
    let score = 0;
    const title = article.title.toLowerCase();
    const desc = article.description.toLowerCase();

    // 1. Keyword match
    queryKeywords.forEach(kw => {
        if (title.includes(kw)) score += 15;
        if (desc.includes(kw)) score += 5;
    });

    // 2. AUTHORITY SCORE (Ranking by Popularity)
    // Find the original feed authority. Note: article.source might be the real name (e.g. "BBC")
    // but the feed list has "BBC News UK". We do a fuzzy match.
    const fed = RSS_FEEDS.find(f =>
        f.name === article.source ||
        f.name.includes(article.source) ||
        article.source.includes(f.name)
    );
    const authority = (fed as any)?.authority || 70; // 70 is decent base for reputable links
    score += (authority / 5); // 0-20 boost

    // 3. RECENCY (Freshness)
    if (article.pubDate) {
        const age = Date.now() - new Date(article.pubDate).getTime();
        const hrs = age / 3600000;
        if (hrs < 1) score += 15;
        else if (hrs < 6) score += 8;
        else if (hrs < 24) score += 4;
    }

    // 4. DIVERSITY PENALTY (Small penalty for aggregator links if we have direct ones)
    if (article.link.includes("news.google.com")) {
        score -= 2;
    }

    return score;
}

// ── PARSE ONE RSS FEED ───────────────────────────────────────
async function parseFeed(feed: typeof RSS_FEEDS[0], noCache = false): Promise<RSSArticle[]> {
    try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 5000);

        const res = await fetch(feed.url, {
            signal: controller.signal,
            headers: {
                "User-Agent": "DailyMannaAI/1.0 (+https://dailymannaai.com/bot)",
                "Accept": "application/rss+xml, application/xml, text/xml, */*",
            },
            next: noCache ? { revalidate: 0 } : { revalidate: 60 },
        });

        clearTimeout(timeout);
        if (!res.ok) return [];

        const xml = await res.text();
        return parseXML(xml, feed.name, feed.cat);
    } catch {
        return [];
    }
}

// ── XML PARSER ───────────────────────────────────────────────
function parseXML(xml: string, defaultSource: string, category: string): RSSArticle[] {
    const articles: RSSArticle[] = [];
    const itemRegex = /<item[^>]*>([\s\S]*?)<\/item>/gi;
    let match: RegExpExecArray | null;

    while ((match = itemRegex.exec(xml)) !== null) {
        const block = match[1];
        const rawTitle = getTag(block, "title") || getTag(block, "dc:title") || "";
        const rawLink = getTag(block, "link") || getTag(block, "guid") || "";
        const rawDesc = getTag(block, "content:encoded") || getTag(block, "description") || getTag(block, "summary") || "";
        const pubDate = getTag(block, "pubDate") || getTag(block, "dc:date") || getTag(block, "updated") || null;
        const imageUrl = extractImage(block, rawDesc);

        // Extract real source from <source> tag (standard in Google News RSS)
        const detectedSource = getTag(block, "source");
        const sourceName = detectedSource || defaultSource;

        const title = cleanHtml(stripCDATA(rawTitle)).slice(0, 150);
        let desc = cleanHtml(stripCDATA(rawDesc));

        // If desc is just a messy fragment of the title or too short, keep it clean
        if (desc.length < 10) desc = title;
        desc = smartTruncate(desc, 280);

        const link = sanitizeUrl(stripCDATA(rawLink));

        if (title && link) {
            articles.push({ title, description: desc, link, source: sourceName, pubDate, imageUrl, category, type: "article" });
        }
    }
    return articles;
}

/** Search across all RSS feeds. */
export async function searchRSSFeeds(query: string, options: {
    category?: string;
    limit?: number;
} = {}): Promise<RSSArticle[]> {
    const { limit = 80 } = options;

    let targetFeeds = options.category && options.category !== "news"
        ? RSS_FEEDS.filter(f => f.cat === options.category || f.cat === "world")
        : [...BREAKING_FEEDS, ...CORE_FEEDS];

    const finalFeedList = targetFeeds.slice(0, 55);
    const settled = await Promise.allSettled(finalFeedList.map(f => parseFeed(f, f.cat === "breaking")));

    const all: RSSArticle[] = [];
    settled.forEach(r => { if (r.status === "fulfilled") all.push(...r.value); });
    if (all.length === 0) return [];

    const terms = query.toLowerCase().split(/\s+/).filter(t => t.length > 1);
    const scored = all
        .map(a => ({ a, s: scoreArticle(a, terms) }))
        .filter(r => r.s > 0)
        .sort((a, b) => b.s - a.s);

    if (scored.length === 0) {
        return all.slice(0, limit);
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

function stripCDATA(s: string): string {
    return s.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1").trim();
}

function cleanHtml(html: string): string {
    if (!html) return "";
    let text = html;
    // Handle double-encoded entities (common in Google News RSS)
    text = text.replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&");
    text = text.replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&nbsp;/g, " ");

    // Remove scripts and styles
    text = text.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "");
    text = text.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "");

    // Strip all HTML tags
    text = text.replace(/<[^>]+>/g, " ");

    // Final cleanup of extra whitespace
    return text.replace(/\s{2,}/g, " ").trim();
}

function smartTruncate(text: string, max: number): string {
    if (text.length <= max) return text;
    return text.slice(0, max) + "…";
}

function sanitizeUrl(url: string): string {
    return url.trim();
}

function extractImage(block: string, desc: string): string | null {
    return block.match(/<media:thumbnail[^>]+url=["']([^"']+)["']/i)?.[1] || null;
}
