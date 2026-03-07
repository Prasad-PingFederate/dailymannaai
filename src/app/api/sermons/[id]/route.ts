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

        if (!doc) {
            return NextResponse.json({ error: "Sermon not found" }, { status: 404 });
        }

        const sermon = {
            id: String(doc._id ?? ""),
            _id: String(doc._id ?? ""),
            speaker: doc.preacher ?? doc.speaker ?? "Unknown Speaker",
            sermon_title: doc.title ?? doc.sermon_title ?? "Untitled Message",
            content: doc.content ?? doc.full_text ?? "",
            audio_url: doc.audio_url ?? doc.audioUrl ?? "",
            scripture_reference: doc.scripture_reference ?? doc.scripture ?? doc.reference ?? "",
            duration: doc.duration ?? "",
            date: doc.date ?? "",
            series: doc.series ?? doc.category ?? "",
            category: doc.series ?? doc.category ?? "General",
        };

        return NextResponse.json(sermon);
    } catch (error: any) {
        console.error(`[Sermon API Detail] Error (${id}):`, error.message);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
