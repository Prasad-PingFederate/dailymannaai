import { NextResponse } from "next/server";
import { getAstraDatabase } from "@/lib/astra-db";

function mapSermonSummary(doc: Record<string, any>) {
  return {
    id: String(doc._id ?? ""),
    _id: String(doc._id ?? ""),
    speaker: doc.preacher ?? doc.speaker ?? "Unknown Speaker",
    sermon_title: doc.title ?? doc.sermon_title ?? "Untitled Message",
    audio_url: doc.audio_url ?? doc.audioUrl ?? "",
    scripture_reference: doc.scripture_reference ?? doc.scripture ?? doc.reference ?? "",
    duration: doc.duration ?? "",
    date: doc.date ?? "",
    series: doc.series ?? doc.category ?? "",
    category: doc.series ?? doc.category ?? "General",
    // Note: 'content' is intentionally omitted for lazy loading
  };
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const speaker = searchParams.get("speaker");
    const limit = Math.min(parseInt(searchParams.get("limit") || "100"), 100);

    const db = await getAstraDatabase().catch((err) => {
      console.error("[Sermons API] DB connection error:", err.message);
      return null;
    });

    if (!db) {
      return NextResponse.json({ error: "DB_CONNECTION_FAILED" }, { status: 500 });
    }

    const collection = db.collection("sermons_archive");

    const query: Record<string, any> = {};
    if (speaker && speaker !== "ALL") {
      query["$or"] = [{ preacher: speaker }, { speaker: speaker }];
    }

    // Fetch without the heavy content string
    const raw = await collection.find(query, {
      limit,
      projection: { content: 0, full_text: 0 }
    }).toArray();

    const sermons = raw.map(mapSermonSummary);

    return NextResponse.json({ sermons });

  } catch (error: any) {
    console.error("[Sermons API Error]", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
