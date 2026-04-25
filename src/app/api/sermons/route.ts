// src/app/api/sermons/route.ts
// Fetches all sermon summaries from AstraDB using REST API
// Called ONCE on page load — returns lightweight list (no full text)

import { NextResponse } from "next/server";

// Fallback logic to support both Data API env vars and REST API env vars
const ASTRA_DB_ID     = process.env.ASTRA_DB_ID || (process.env.ASTRA_DB_API_ENDPOINT?.match(/https:\/\/(.*?)-/)?.[1]);
const ASTRA_DB_REGION = process.env.ASTRA_DB_REGION || (process.env.ASTRA_DB_API_ENDPOINT?.match(/-(.*?)\.apps/)?.[1]);
const ASTRA_KEYSPACE  = process.env.ASTRA_KEYSPACE || process.env.ASTRA_DB_NAMESPACE || process.env.ASTRA_DB_KEYSPACE || "dailymanna";
const ASTRA_TABLE     = process.env.ASTRA_TABLE_SERMONS || "sermons";
const ASTRA_TOKEN     = process.env.ASTRA_DB_TOKEN || process.env.ASTRA_DB_APPLICATION_TOKEN!;

const BASE_URL = `https://${ASTRA_DB_ID}-${ASTRA_DB_REGION}.apps.astra.datastax.com`;

export async function GET() {
  try {
    if (!ASTRA_DB_ID || !ASTRA_DB_REGION || !ASTRA_TOKEN) {
        return NextResponse.json({ error: "Missing Astra credentials in env" }, { status: 500 });
    }

    // ── Fetch all sermon rows from AstraDB REST API ──────────────────────────
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
    const sermons = (data.data || []).map((row: any) => ({
      id:       row.id,
      title:    row.title,
      author:   row.author,
      initials: row.initials || getInitials(row.author || "Unknown Speaker"),
      category: row.category || "General",
      duration: row.duration || null,
      hasAudio: !!row.audio_url,
      preview:  row.preview || (row.full_text ? row.full_text.substring(0, 120) + "..." : "Sermon details..."),
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
