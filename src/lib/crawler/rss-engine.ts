// src/lib/crawler/rss-engine.ts
// The Core RSS Engine of DailyMannaAI
import Parser from 'rss-parser';
import pLimit from 'p-limit';
import { getDatabase } from '../mongodb';
import { getAstraDatabase } from '../astra-db';
import { RSS_FEEDS } from './sources';
import { getFaithScore, detectScriptureReferences, cleanContent, calculateGraceRank } from './faith-classifier';

const parser = new Parser({
    timeout: 15000,
    headers: {
        'User-Agent': 'DailyMannaAI-Bot/1.0 (+https://dailymannaai.com/bot)',
        'Accept': 'application/rss+xml, application/xml, text/xml, application/atom+xml, */*',
    }
});

/**
 * Crawls a single RSS feed and saves new Christian content.
 */
async function crawlFeed(feedSource: any) {
    try {
        console.log(`📡 [RSS-Crawl] Starting: ${feedSource.name}`);
        const feed = await parser.parseURL(feedSource.url);

        // --- 1. Connect to Databases ---
        const db = await getDatabase();
        const collection = db.collection('christian_news');

        let astraCollection: any = null;
        try {
            const astraDb = await getAstraDatabase();
            if (astraDb) astraCollection = astraDb.collection('christian_news');
        } catch (_) { /* Astra optional */ }

        let savedCount = 0;
        let skippedCount = 0;

        for (const item of feed.items) {
            try {
                const url = item.link || item.guid || '';
                const title = item.title || '';
                if (!url || !title) continue;

                // Check for duplicate in Primary Store (MongoDB)
                const existing = await collection.findOne({ url });
                if (existing) {
                    skippedCount++;
                    continue;
                }

                // AI Processing
                const rawContent = cleanContent(item['content:encoded'] || item.content || item.contentSnippet || '');
                const textForScoring = `${title} ${rawContent}`;

                const faithScore = getFaithScore(textForScoring);

                // Content Filter: Needs to be relevant
                if (faithScore === -1 || (faithScore < 0.1 && feedSource.priority > 1)) {
                    continue;
                }

                // SECRET SAUCE: Divine Cross-Linking & Grace Ranking
                const bibleRefs = detectScriptureReferences(textForScoring);
                const graceRank = calculateGraceRank(faithScore, feedSource.authorityScore);

                // Prepare for Storage
                const article = {
                    title,
                    url,
                    content: rawContent,
                    summary: item.contentSnippet || '',
                    author: item.creator || item.author || null,
                    published_at: item.pubDate || item.isoDate ? new Date(item.pubDate || item.isoDate!) : new Date(),
                    source_name: feedSource.name,
                    source_url: feedSource.url,
                    category: feedSource.category,
                    faith_score: faithScore,
                    authority_score: feedSource.authorityScore,
                    grace_rank: graceRank,
                    bible_refs: bibleRefs,
                    crawled_at: new Date(),
                    last_indexed: new Date(),
                };

                // Save to MongoDB
                await collection.insertOne(article);

                // Save to Astra DB (Global Christian Index)
                if (astraCollection) {
                    try {
                        await astraCollection.insertOne(article);
                    } catch (astraErr) {
                        console.error(`[RSS-Crawl] AstraDB Error: ${astraErr}`);
                    }
                }

                savedCount++;
            } catch (itemErr) {
                console.warn(`[RSS-Crawl] Item Skip (${feedSource.name}): ${itemErr}`);
            }
        }

        console.log(`✅ [RSS-Crawl] Finished ${feedSource.name}: ${savedCount} saved, ${skippedCount} items were duplicates.`);
        return { savedCount, scannedCount: feed.items.length };

    } catch (err: any) {
        console.error(`❌ [RSS-Crawl] Feed Failure: ${feedSource.name} - ${err.message}`);
        return { savedCount: 0 };
    }
}

/**
 * Main entry point: Crawl all feeds in parallel with concurrency limit.
 */
export async function runFullRSSCrawl() {
    console.log(`🚀 [RSS-Crawl] Starting full search engine crawl for ${RSS_FEEDS.length} sources...`);

    // Concurrency limit to follow ethical crawling (3 concurrent requests)
    const limit = pLimit(3);

    const results = await Promise.all(
        RSS_FEEDS.map(source => limit(() => crawlFeed(source)))
    );

    const totalSaved = results.reduce((acc, r) => acc + r.savedCount, 0);
    const totalScanned = results.reduce((acc, r) => acc + (r as any).scannedCount || 0, 0);
    console.log(`📊 [RSS-Crawl] COMPLETE. Total New Christian Articles Saved: ${totalSaved}`);

    return { totalSaved, totalScanned };
}
