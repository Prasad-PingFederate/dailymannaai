// src/app/api/sermons/route.ts
// Fetches all sermon summaries from AstraDB
// Called ONCE on page load — returns lightweight list (no full text)

import { NextResponse } from "next/server";

const ASTRA_DB_ID     = process.env.ASTRA_DB_ID!;        // e.g. "abc123-..."
const ASTRA_DB_REGION = process.env.ASTRA_DB_REGION!;    // e.g. "us-east1"
const ASTRA_KEYSPACE  = process.env.ASTRA_KEYSPACE!;     // e.g. "dailymanna"
const ASTRA_TABLE     = process.env.ASTRA_TABLE_SERMONS || "sermons";
const ASTRA_TOKEN     = process.env.ASTRA_DB_TOKEN!;     // AstraCS:...

const BASE_URL = `https://${ASTRA_DB_ID}-${ASTRA_DB_REGION}.apps.astra.datastax.com`;

export async function GET() {
  try {
    // ── Fetch all sermon rows from AstraDB REST API ──────────────────────────
    // We only select summary columns — NOT full_text (saves bandwidth)
    const url = `${BASE_URL}/api/rest/v2/keyspaces/${ASTRA_KEYSPACE}/${ASTRA_TABLE}/rows`;

    const res = await fetch(url, {
      method: "GET",
      headers: {
        "X-Cassandra-Token": ASTRA_TOKEN,
        "Content-Type": "application/json",
      },
      // Next.js cache: revalidate every 5 minutes
      next: { revalidate: 300 },
    });

    if (!res.ok) {
      const err = await res.text();
      console.error("AstraDB error (list):", err);
      return NextResponse.json({ error: "Failed to fetch sermons" }, { status: 500 });
    }

    const data = await res.json();

    // ── Shape the response — only send what the card UI needs ────────────────
    // AstraDB returns { data: [ { id, title, author, ... }, ... ] }
    const sermons = (data.data || []).map((row: any) => ({
      id:       row.id,
      title:    row.title,
      author:   row.author,
      initials: row.initials || getInitials(row.author),
      category: row.category || "General",
      duration: row.duration || null,
      hasAudio: !!row.audio_url,
      preview:  row.preview || row.full_text?.substring(0, 120) + "...",
    }));

    return NextResponse.json({ sermons });
  } catch (error) {
    console.error("Sermons list error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .substring(0, 2);
}
