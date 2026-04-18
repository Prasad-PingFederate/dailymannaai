import { NextResponse } from 'next/server';
import { runFullRSSCrawl } from '@/lib/crawler/rss-engine';
import { seedMajorBibleVerses } from '@/lib/crawler/bible-engine';
import { RSS_FEEDS } from '@/lib/crawler/sources';

/**
 * API Route to Trigger the Discovery Crawler
 * - In Production: Call this via a secure Cron job (e.g. Vercel Cron)
 */
export async function GET(req: Request) {
    // Basic Security: Check for a secret key if provided in headers/params
    const { searchParams } = new URL(req.url);
    const key = searchParams.get('key');

    const crawlerKey = process.env.Dailymanna_CRAWLER_KEY;
    if (crawlerKey && key !== crawlerKey) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        console.log("🛠️ [Discovery] System discovery triggered...");

        // 1. Run RSS Crawl (News, Theology, etc.)
        const rssResult = await runFullRSSCrawl();

        // 2. Seed Bible (Only if specifically requested)
        let bibleResult = { count: 0 };
        if (searchParams.get('bible') === 'true') {
            bibleResult = await seedMajorBibleVerses();
        }

        return NextResponse.json({
            status: 'success',
            report: {
                engine: "DailyMannaAI-Discovery-v2",
                articles_scanned: rssResult.totalScanned || 0,
                new_articles_saved: rssResult.totalSaved,
                bible_verses_indexed: bibleResult.count,
                sources_contacted: RSS_FEEDS.length,
                timestamp: new Date().toISOString()
            },
            instruction: rssResult.totalSaved === 0
                ? "No new articles found since last crawl. Everything is up to date."
                : "Database updated with fresh word."
        });

    } catch (error: any) {
        console.error("❌ [Discovery] Crawler Failed:", error);
        return NextResponse.json({
            status: 'error',
            message: error.message,
            tip: "Check your MONGODB_URI and Dailymanna_CRAWLER_KEY in Vercel settings."
        }, { status: 500 });
    }
}
