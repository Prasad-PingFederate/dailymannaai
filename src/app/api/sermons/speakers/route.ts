import { NextResponse } from "next/server";
import { getAstraDatabase } from "@/lib/astra-db";

/**
 * GET /api/sermons/speakers
 * Fetches unique speakers from Astra DB sermons collection.
 */
export async function GET(req: Request) {
    try {
        const db = await getAstraDatabase().catch(() => null);
        if (!db) {
            return NextResponse.json({ error: "DB_CONNECTION_FAILED" }, { status: 500 });
        }

        const collection = db.collection('sermons');

        // Astra DB Data API doesn't have `distinct` like MongoDB.
        // We can use `find` with high limit or if the DB has a lot of data, we should have a separate speakers collection.
        // For now, we'll try to find speakers from a sample or return a base list.
        const sermons = await collection.find({}, { limit: 1000, projection: { speaker: 1 } }).toArray();
        const speakers = [...new Set(sermons.map(s => s.speaker).filter(Boolean))].sort();

        // If the collection is empty, return a default list for now or empty.
        return NextResponse.json({ speakers });
    } catch (error: any) {
        console.error("[Sermons Speakers API Error]", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
