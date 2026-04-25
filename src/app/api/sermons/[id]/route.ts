// src/app/api/sermons/[id]/route.ts
// Fetches ONE sermon's full content from AstraDB REST API

import { NextRequest, NextResponse } from "next/server";

// Fallback logic to support both Data API env vars and REST API env vars
const ASTRA_DB_ID     = process.env.ASTRA_DB_ID || (process.env.ASTRA_DB_API_ENDPOINT?.match(/https:\/\/(.*?)-/)?.[1]);
const ASTRA_DB_REGION = process.env.ASTRA_DB_REGION || (process.env.ASTRA_DB_API_ENDPOINT?.match(/-(.*?)\.apps/)?.[1]);
const ASTRA_KEYSPACE  = process.env.ASTRA_KEYSPACE || process.env.ASTRA_DB_NAMESPACE || process.env.ASTRA_DB_KEYSPACE || "dailymanna";
const ASTRA_TABLE     = process.env.ASTRA_TABLE_SERMONS || "sermons";
const ASTRA_TOKEN     = process.env.ASTRA_DB_TOKEN || process.env.ASTRA_DB_APPLICATION_TOKEN!;

const BASE_URL = `https://${ASTRA_DB_ID}-${ASTRA_DB_REGION}.apps.astra.datastax.com`;

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
    if (!ASTRA_DB_ID || !ASTRA_DB_REGION || !ASTRA_TOKEN) {
        return NextResponse.json({ error: "Missing Astra credentials in env" }, { status: 500 });
    }

    // ── Fetch single sermon row by primary key (id) ──────────────────────────
    const url = `${BASE_URL}/api/rest/v2/keyspaces/${ASTRA_KEYSPACE}/${ASTRA_TABLE}/${encodeURIComponent(id)}`;

    const res = await fetch(url, {
      method: "GET",
      headers: {
        "X-Cassandra-Token": ASTRA_TOKEN,
        "Content-Type": "application/json",
      },
      // Cache each sermon for 10 minutes after first fetch
      next: { revalidate: 600 },
    });

    if (res.status === 404) {
      return NextResponse.json({ error: "Sermon not found" }, { status: 404 });
    }

    if (!res.ok) {
      const err = await res.text();
      console.error(`AstraDB error (detail ${id}):`, err);
      return NextResponse.json({ error: "Failed to fetch sermon" }, { status: 500 });
    }

    const data = await res.json();
    const row = data.data?.[0] || data;

    if (!row || !row.id) {
      return NextResponse.json({ error: "Sermon not found" }, { status: 404 });
    }

    // ── Return full sermon detail ─────────────────────────────────────────────
    const sermon = {
      id:         row.id,
      title:      row.title,
      author:     row.author,
      scripture:  row.scripture   || null,
      audioUrl:   row.audio_url   || null,
      fullText:   row.full_text   || "",
      keyPoints:  row.key_points  || [],
      category:   row.category    || "General",
      duration:   row.duration    || null,
      publishedAt: row.published_at || null,
    };

    return NextResponse.json({ sermon });
  } catch (error) {
    console.error(`Sermon detail error (${id}):`, error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
