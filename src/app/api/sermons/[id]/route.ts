import { NextRequest, NextResponse } from "next/server";
import { getAstraDatabase } from "@/lib/astra-db";

export async function GET(
    request: NextRequest,
    props: { params: Promise<{ id: string }> }
) {
    const params = await props.params;
    const { id } = params;

    if (!id) {
        return NextResponse.json({ error: "Sermon ID required" }, { status: 400 });
    }

    try {
        const db = await getAstraDatabase().catch((err) => {
            console.error("[Sermons API] DB connection error:", err.message);
            return null;
        });

        if (!db) {
            return NextResponse.json({ error: "DB_CONNECTION_FAILED" }, { status: 500 });
        }

        const collection = db.collection("sermons_archive");
        let doc = await collection.findOne({ _id: id });
        
        // Fallback in case they used standard UUID 'id' instead of '_id'
        if (!doc) {
           doc = await collection.findOne({ id: id });
        }

        if (!doc) {
            return NextResponse.json({ error: "Sermon not found" }, { status: 404 });
        }

        const author = doc.preacher ?? doc.speaker ?? doc.author ?? "Unknown Speaker";

        const sermon = {
            id: String(doc._id ?? doc.id ?? ""),
            title: doc.title ?? doc.sermon_title ?? "Untitled Message",
            author: author,
            scripture: doc.scripture_reference ?? doc.scripture ?? doc.reference ?? null,
            audioUrl: doc.audio_url ?? doc.audioUrl ?? null,
            fullText: doc.content ?? doc.full_text ?? "Full text not available.",
            keyPoints: doc.key_points ?? doc.keyPoints ?? [],
            category: doc.series ?? doc.category ?? "General",
            duration: doc.duration ?? null,
            publishedAt: doc.date ?? doc.published_at ?? doc.publishedAt ?? null,
        };

        return NextResponse.json({ sermon }); // Wrapped in { sermon } to match frontend logic
    } catch (error: any) {
        console.error(`[Sermon API Detail] Error (${id}):`, error.message);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
