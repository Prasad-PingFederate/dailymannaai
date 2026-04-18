// src/app/api/sermons/route.ts
import { NextResponse } from "next/server";
import { getAstraDatabase } from "@/lib/astra-db";

function mapSermon(doc: Record<string, any>) {
    return {
        _id: String(doc._id ?? ""),
        speaker: doc.preacher ?? doc.speaker ?? "Unknown Speaker",
        sermon_title: doc.title ?? doc.sermon_title ?? "Untitled Message",
        content: doc.content ?? "",
        audio_url: doc.audio_url ?? doc.audioUrl ?? "",
        scripture_reference: doc.scripture_reference ?? doc.scripture ?? doc.reference ?? "",
        duration: doc.duration ?? "",
        date: doc.date ?? "",
        series: doc.series ?? doc.category ?? "",
    };
}

/**
 * GET /api/sermons
 * Fetches sermons from Astra DB with speaker filter and search support.
 */
export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const speaker = searchParams.get("speaker");
        const search = searchParams.get("search");
        // AstraDB Data API caps at 20 docs without vector search
        const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 20);

        const db = await getAstraDatabase().catch((err) => {
            console.error("[Sermons API] DB connection error:", err.message);
            return null;
        });

        if (!db) {
            return NextResponse.json(
                { error: "DB_CONNECTION_FAILED", detail: "Check Astra env vars in Vercel dashboard" },
                { status: 500 }
            );
        }

        const collection = db.collection("sermons_archive");

        // Build filter query ΓÇö removed $regex as it's unsupported in this collection
        const query: Record<string, any> = {};
        if (speaker && speaker !== "ALL") {
            query["$or"] = [
                { preacher: speaker },
                { speaker: speaker },
            ];
        }
        if (search) {
            // If regex is unsupported, we can't do partial title search easily without Search Index.
            // For now, let's try an exact title match or just log a warning.
            const searchClause = {
                "$or": [
                    { title: search },
                    { sermon_title: search },
                    { preacher: search },
                    { speaker: search },
                ]
            };
            if (Object.keys(query).length > 0) {
                query["$and"] = [JSON.parse(JSON.stringify(query)), searchClause];
            } else {
                Object.assign(query, searchClause);
            }
        }

        const raw = await collection.find(query, { limit }).toArray();
        const sermons = raw.map(mapSermon);

        return NextResponse.json({ sermons, count: sermons.length });

    } catch (error: any) {
        console.error("[Sermons API Error]", error.message);
        return NextResponse.json(
            { error: error.message },
            { status: 500 }
        );
    }
}

/**
 * GET /api/sermons/speakers ΓÇö returns unique speaker list
 * NOTE: This is handled by a separate route file at /api/sermons/speakers/route.ts
 */
