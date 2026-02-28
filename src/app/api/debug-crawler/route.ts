import { NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';

export async function GET() {
    try {
        const db = await getDatabase();
        const collection = db.collection('christian_news');
        const count = await collection.countDocuments();
        const sample = await collection.find({}).limit(5).toArray();

        return NextResponse.json({
            count,
            sample: sample.map(s => ({ title: s.title, date: s.published_at, source: s.source_name }))
        });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
