import { NextResponse } from "next/server";
import axios from "axios";
import { searchBible as localSearchBible } from "@/lib/search/bible-search";

async function fetchChristianNews(query: string) {
    const BING_API_KEY = process.env.BING_API_KEY;
    if (!BING_API_KEY) {
        // Fallback to a mock for now or use RSS feed if BING is missing
        return [
            {
                title: `${query} - Christianity Today`,
                description: `Latest perspectives on ${query} from a Christian worldview.`,
                link: `https://www.christianitytoday.com/search/?q=${encodeURIComponent(query)}`
            }
        ];
    }

    try {
        const response = await axios.get(
            `https://api.bing.microsoft.com/v7.0/search?q=${encodeURIComponent(query)} christian news`,
            {
                headers: { "Ocp-Apim-Subscription-Key": BING_API_KEY },
            }
        );

        return response.data.webPages.value.map((item: any) => ({
            title: item.name,
            description: item.snippet,
            link: item.url,
            source: "Bing Search"
        }));
    } catch (err: any) {
        console.error("Bing Search Failed:", err.message);
        return [];
    }
}

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q");
    const type = searchParams.get("type") || "bible";

    if (!q) {
        return NextResponse.json({ error: "Query required" }, { status: 400 });
    }

    try {
        let results: any[] = [];

        if (type === "bible") {
            // Check if it looks like a reference (e.g., "John 3:16")
            const isReference = /^[1-3]?\s*[a-zA-Z]+\s+\d+:\d+/.test(q);

            if (isReference) {
                const res = await axios.get(`https://bible-api.com/${encodeURIComponent(q)}`);
                results = [
                    {
                        title: res.data.reference,
                        description: res.data.text,
                        link: null,
                    },
                ];
            } else {
                // Use local keyword search
                const localResults = await localSearchBible(q.split(" "));
                results = localResults.map(r => ({
                    title: r.reference,
                    description: r.text,
                    link: null
                }));
            }
        } else if (type === "news") {
            results = await fetchChristianNews(q);
        } else if (type === "devotionals") {
            // Mock for now
            results = [
                { title: "Daily Manna Devotional", description: `A spiritual reflection on ${q}.`, link: "#" }
            ];
        } else if (type === "sermons") {
            // Mock for now
            results = [
                { title: "Sermon: The Power of Faith", description: `Expanding on ${q} through the lens of scripture.`, link: "#" }
            ];
        }

        return NextResponse.json({ results });
    } catch (error: any) {
        console.error("Search API Error:", error.message);
        return NextResponse.json({ error: "Search failed" }, { status: 500 });
    }
}
