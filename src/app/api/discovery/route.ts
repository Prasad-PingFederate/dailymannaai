import { NextResponse } from 'next/server';
import { runFullRSSCrawl } from '@/lib/crawler/rss-engine';
import { seedMajorBibleVerses } from '@/lib/crawler/bible-engine';

/**
 * API Route to Trigger the Discovery Crawler
 * - In Production: Call this via a secure Cron job (e.g. Vercel Cron)
 */
export async function GET(req: Request) {
    // Basic Security: Check for a secret key if provided in headers/params
    const { searchParams } = new URL(req.url);
    const key = searchParams.get('key');

    if (process.env.CRAWLER_KEY && key !== process.env.CRAWLER_KEY) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        console.log("🛠️ [Discovery] System discovery triggered...");

        // 1. Run RSS Crawl (News, Theology, etc.)
        const rssResult = await runFullRSSCrawl();

        // 2. Seed Bible (Only if specifically requested to save quota/time)
        let bibleResult = { count: 0 };
        if (searchParams.get('bible') === 'true') {
            bibleResult = await seedMajorBibleVerses();
        }

        return NextResponse.json({
            status: 'success',
            discovery: {
                news_articles_saved: rssResult.totalSaved,
                bible_verses_indexed: bibleResult.count
            },
            timestamp: new Date().toISOString()
        });

    } catch (error: any) {
        console.error("❌ [Discovery] Crawler Failed:", error);
        return NextResponse.json({ status: 'error', message: error.message }, { status: 500 });
    }
}
