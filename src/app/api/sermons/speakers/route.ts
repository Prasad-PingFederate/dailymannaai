// src/app/api/sermons/speakers/route.ts
import { NextResponse } from "next/server";
import { getDatabase as getAstraDatabase } from "@/lib/mongodb";

/**
 * GET /api/sermons/speakers
 * Returns a unique sorted list of speaker names from Astra DB.
 */
export async function GET() {
    try {
        const db = await getAstraDatabase().catch(() => null);
        if (!db) {
            return NextResponse.json({ speakers: [] });
        }

        const collection = db.collection("sermons_archive");

        // Fetch only name fields for performance
        const docs = await collection
            .find({}, { limit: 500 })
            .project({ preacher: 1, speaker: 1, _id: 0 })
            .toArray();

        const counts: Record<string, number> = {};
        for (const doc of docs) {
            const name = (doc.preacher || doc.speaker || "").trim();
            if (name) counts[name] = (counts[name] || 0) + 1;
        }

        const speakers = Object.keys(counts).sort(
            (a, b) => counts[b] - counts[a]
        );

        return NextResponse.json({ speakers });
    } catch (error: any) {
        console.error("[Speakers API Error]", error.message);
        return NextResponse.json({ speakers: [] });
    }
}
