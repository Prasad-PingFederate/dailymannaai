import { NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';
import { runFullRSSCrawl } from '@/lib/crawler/rss-engine';

export async function GET() {
    try {
        const db = await getDatabase();
        const collection = db.collection('christian_news');
        const count = await collection.countDocuments();
        const recent = await collection.find({}).sort({ crawled_at: -1 }).limit(10).toArray();
        const runs = await db.collection('crawl_runs').find({}).sort({ startedAt: -1 }).limit(5).toArray();

        return NextResponse.json({
            count,
            recent: recent.map(s => ({ 
                title: s.title, 
                date: s.published_at, 
                source: s.source_name,
                grace_rank: s.grace_rank
            })),
            lastRuns: runs
        });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

export async function POST() {
    try {
        console.log("🚀 [DebugAPI] Triggering manual full crawl...");
        const result = await runFullRSSCrawl();
        return NextResponse.json({
            message: "Crawl completed successfully",
            result
        });
    } catch (err: any) {
        console.error("❌ [DebugAPI] Manual crawl failed:", err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
