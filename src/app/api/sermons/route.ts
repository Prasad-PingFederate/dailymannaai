import { NextResponse } from "next/server";
import { getAstraDatabase } from "@/lib/astra-db";

function getInitials(name: string): string {
  return name.split(" ").map((w) => w[0]).join("").toUpperCase().substring(0, 2);
}

function mapSermonSummary(doc: Record<string, any>) {
  const author = doc.preacher ?? doc.speaker ?? "Unknown Speaker";
  const fullText = doc.content ?? doc.full_text ?? "";
  const audioUrl = doc.audio_url ?? doc.audioUrl ?? "";

  return {
    id: String(doc._id ?? ""),
    title: doc.title ?? doc.sermon_title ?? "Untitled Message",
    author,
    initials: getInitials(author),
    category: doc.series ?? doc.category ?? "General",
    duration: doc.duration ?? null,
    hasAudio: !!audioUrl,
    preview: doc.preview ?? fullText.substring(0, 120) ?? "Sermon details...",
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
