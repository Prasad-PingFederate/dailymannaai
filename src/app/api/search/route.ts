import { NextResponse } from "next/server";
import axios from "axios";
import { searchBible as localSearchBible } from "@/lib/search/bible-search";
import { getAstraDatabase } from "@/lib/astra-db";

/**
 * INTERNAL SEARCH: Prioritizes the 80GB Astra DB for high-volume content.
 */
async function searchInternalNews(query: string) {
    try {
        const db = await getAstraDatabase();
        if (!db) return [];

        const collection = db.collection('christian_news');

        // Astra Data API uses a MongoDB-like syntax
        const cursor = collection.find(
            {
                $or: [
                    { title: { $regex: query } },
                    { content: { $regex: query } }
                ]
            },
            {
                sort: { grace_rank: -1 },
                limit: 20
            }
        );

        const articles = await cursor.toArray();

        return articles.map(a => ({
            title: a.title,
            description: a.summary || (a.content ? a.content.substring(0, 300) + '...' : ''),
            link: a.url,
            source: a.source_name,
            grace_rank: a.grace_rank,
            bible_refs: a.bible_refs || []
        }));
    } catch (err) {
        console.error("Astra News Search Failed:", err);
        return [];
    }
}

/**
 * BIBLE SEARCH: Leverages Astra DB for the full Scripture index.
 */
async function searchAstraBible(query: string) {
    try {
        const db = await getAstraDatabase();
        const collection = db.collection('bible_verses');

        const cursor = collection.find(
            { text: { $regex: query } },
            { limit: 10 }
        );

        const verses = await cursor.toArray();
        return verses.map(v => ({
            title: v.reference,
            description: v.text,
            link: null
        }));
    } catch (err) {
        return null;
    }
}

async function fetchChristianNews(query: string) {
    const BING_API_KEY = process.env.BING_API_KEY;
    if (!BING_API_KEY) return [];

    try {
        const response = await axios.get(
            `https://api.bing.microsoft.com/v7.0/search?q=${encodeURIComponent(query)} christian news`,
            { headers: { "Ocp-Apim-Subscription-Key": BING_API_KEY } }
        );

        return response.data.webPages.value.map((item: any) => ({
            title: item.name,
            description: item.snippet,
            link: item.url,
            source: "Web Search"
        }));
    } catch (err: any) {
        return [];
    }
}

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q");
    const type = searchParams.get("type") || "bible";

    if (!q) return NextResponse.json({ error: "Query required" }, { status: 400 });

    try {
        let results: any[] = [];

        if (type === "bible") {
            const isReference = /^[1-3]?\s*[a-zA-Z]+\s+\d+:\d+/.test(q);
            if (isReference) {
                const res = await axios.get(`https://bible-api.com/${encodeURIComponent(q)}`);
                results = [{ title: res.data.reference, description: res.data.text, link: null }];
            } else {
                // Try Astra first for Bible
                const astraResults = await searchAstraBible(q);
                if (astraResults && astraResults.length > 0) {
                    results = astraResults;
                } else {
                    // Fallback to MongoDB-based bible search
                    const localResults = await localSearchBible(q.split(" "));
                    results = localResults.map(r => ({ title: r.reference, description: r.text, link: null }));
                }
            }
        } else {
            // News / Devotionals / Sermons
            const internalResults = await searchInternalNews(q);

            if (internalResults.length < 5) {
                const externalResults = await fetchChristianNews(q);
                results = [...internalResults, ...externalResults];
            } else {
                results = internalResults;
            }
        }

        return NextResponse.json({ results });
    } catch (error: any) {
        return NextResponse.json({ error: "Search failed" }, { status: 500 });
    }
}
