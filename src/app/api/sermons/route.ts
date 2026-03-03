import { NextResponse } from "next/server";
import { getAstraDatabase } from "@/lib/astra-db";

/**
 * GET /api/sermons
 * Fetches all sermons or filtered by speaker from Astra DB.
 */
export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const speaker = searchParams.get("speaker");
        const limit = parseInt(searchParams.get("limit") || "50");

        const db = await getAstraDatabase().catch(() => null);
        if (!db) {
            return NextResponse.json({ error: "DB_CONNECTION_FAILED" }, { status: 500 });
        }

        const collection = db.collection('sermons');

        let query = {};
        if (speaker && speaker !== "ALL") {
            query = { speaker: { $regex: speaker, $options: 'i' } };
        }

        // Attempting to find sermons in Astra DB
        const sermons = await collection.find(query, {
            limit: Math.min(limit, 500),
            sort: { date: -1 }
        }).toArray();

        // If collection is empty, Astra might return an empty array.
        // We'll return it as 'sermons' key to match the component's expectations.
        return NextResponse.json({ sermons });
    } catch (error: any) {
        console.error("[Sermons API Error]", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
