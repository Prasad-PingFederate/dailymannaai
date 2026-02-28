import { NextResponse } from "next/server";
import axios from "axios";
import { searchBible as localSearchBible } from "@/lib/search/bible-search";
import { getAstraDatabase } from "@/lib/astra-db";
import { evaluate } from "mathjs";
import moment from "moment-timezone";

/**
 * SMART QUERY DETECTOR: Returns instant answers for common utility queries.
 */
function getInstantAnswer(query: string) {
    const normalizedQuery = query.toLowerCase().trim();

    // 1. Calculator
    if (/^[0-9+\-*/().%\s^=]+$/.test(normalizedQuery) && /[0-9]/.test(normalizedQuery)) {
        let mathQuery = normalizedQuery.replace(/=/g, '').trim();
        try {
            const res = evaluate(mathQuery);
            return {
                type: "calculator",
                result: res.toString(),
                title: "Calculator Result",
                query: normalizedQuery
            };
        } catch (e) {
            // Not a valid math expr, continue
        }
    }

    // 2. Today's Date & Time
    const dateKeywords = ["today", "date", "what is today's date", "current date", "today's date", "day", "calendar"];
    const timeKeywords = ["time", "current time", "what time is it", "local time", "time now", "today time"];

    const isDateQuery = dateKeywords.some(kw => normalizedQuery === kw || normalizedQuery.includes("today date"));
    const isTimeQuery = timeKeywords.some(kw => normalizedQuery === kw || normalizedQuery.includes("time now") || normalizedQuery.includes("today time"));

    if (isDateQuery && !isTimeQuery) {
        return {
            type: "date",
            result: moment().format("dddd, MMMM Do YYYY"),
            title: "Today's Date",
            subtitle: `Divine Calendar`
        };
    }

    // 3. World Time / Local Time
    if (normalizedQuery.includes("time in") || isTimeQuery) {
        const locationPart = normalizedQuery.includes("time in") ? normalizedQuery.split("time in")[1]?.trim() : null;
        if (locationPart || isTimeQuery) {
            const tzMap: Record<string, string> = {
                "india": "Asia/Kolkata",
                "usa": "America/New_York",
                "uk": "Europe/London",
                "london": "Europe/London",
                "nigeria": "Africa/Lagos",
                "kenya": "Africa/Nairobi",
                "south africa": "Africa/Johannesburg",
                "canada": "America/Toronto",
                "australia": "Australia/Sydney",
                "germany": "Europe/Berlin",
                "philippines": "Asia/Manila",
                "singapore": "Asia/Singapore",
            };

            const tz = locationPart ? tzMap[locationPart] : "Asia/Kolkata"; // Default to India/Local
            if (tz || isTimeQuery) {
                return {
                    type: "time",
                    result: moment().tz(tz).format("hh:mm A"),
                    title: locationPart ? `Current Time in ${locationPart.toUpperCase()}` : "Local Time",
                    subtitle: moment().tz(tz).format("dddd, MMMM Do YYYY")
                };
            }
        }
    }

    // 4. Age Calculator
    if (normalizedQuery.includes("born") || normalizedQuery.includes("age calculator") || normalizedQuery.includes("how old")) {
        const dateMatch = normalizedQuery.match(/\d{4}-\d{2}-\d{2}/) || normalizedQuery.match(/\d{1,2}\/\d{1,2}\/\d{4}/);
        if (dateMatch) {
            const birthDate = moment(dateMatch[0]);
            if (birthDate.isValid()) {
                const diff = moment().diff(birthDate, "years");
                return {
                    type: "age",
                    result: `${diff} Years`,
                    title: "Age Explorer",
                    subtitle: `Calculated from ${birthDate.format("MMMM Do YYYY")}`
                };
            }
        } else if (normalizedQuery.includes("age calculator") || normalizedQuery.includes("how old")) {
            return {
                type: "age",
                result: "N/A",
                title: "Age Explorer",
                subtitle: "Please provide a birthdate (e.g., born 1995-06-12)"
            };
        }
    }

    return null;
}

function isBibleReference(text: string) {
    return /^[1-3]?\s*[a-zA-Z]+\s+\d+:\d+(-\d+)?$/.test(text);
}

/**
 * INTERNAL SEARCH: Prioritizes the 80GB Astra DB for high-volume content.
 */
async function searchInternalNews(query: string) {
    try {
        const db = await getAstraDatabase();
        if (!db) return [];

        const collection = db.collection('christian_news');

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

async function searchAstraBible(query: string) {
    try {
        const db = await getAstraDatabase();
        if (!db) return null;
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

        return response.data.webPages.value?.map((item: any) => ({
            title: item.name,
            description: item.snippet,
            link: item.url,
            source: "Web Search"
        })) || [];
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
        // 1️ Check for Instant Smart Answers
        const instantAnswer = getInstantAnswer(q);

        let results: any[] = [];
        let bibleInstant = null;

        // If it's a Bible reference, handle it immediately
        if (isBibleReference(q)) {
            try {
                const res = await axios.get(`https://bible-api.com/${encodeURIComponent(q)}`);
                bibleInstant = {
                    title: res.data.reference,
                    description: res.data.text,
                    link: null,
                    type: "bible"
                };
            } catch (e) {
                // If API fails, fallback to standard bible search below
            }
        }

        // 2️ Fetch regular results
        if (type === "global") {
            const bible = await searchAstraBible(q) || [];
            const news = await searchInternalNews(q) || [];

            return NextResponse.json({
                instantAnswer,
                solution: {
                    model: "5!4!3!2!1!",
                    bible: bible.slice(0, 5),
                    news: news.slice(0, 4),
                    devotionals: [
                        { title: `Living for ${q}`, description: "A daily walk in faith regarding this topic...", source: "Daily Manna" },
                        { title: `Overcoming ${q}`, description: "Practical steps to conquer daily challenges.", source: "Grace Daily" },
                        { title: `The Peace of ${q}`, description: "Finding tranquility in His Word.", source: "Morning Dew" }
                    ].slice(0, 3),
                    sermons: [
                        { title: `The Power of ${q}`, speaker: "Pastor John Doe", length: "45 mins" },
                        { title: `Walking in ${q}`, speaker: "Evangelist Jane Smith", length: "32 mins" }
                    ].slice(0, 2),
                    insight: `The solution to ${q} is found in steadfast faith and practical action. Align your hearts with scripture and stay informed with godly perspectives.`
                }
            });
        }

        if (type === "bible") {
            const astraResults = await searchAstraBible(q);
            if (astraResults && astraResults.length > 0) {
                results = astraResults;
            } else {
                const localResults = await localSearchBible(q.split(" "));
                results = localResults.map(r => ({ title: r.reference, description: r.text, link: null }));
            }
        } else {
            const internalResults = await searchInternalNews(q);
            if (internalResults.length < 5) {
                const externalResults = await fetchChristianNews(q);
                results = [...internalResults, ...externalResults];
            } else {
                results = internalResults;
            }
        }

        return NextResponse.json({
            results,
            instantAnswer: instantAnswer || bibleInstant
        });
    } catch (error: any) {
        console.error("Search API Error:", error);
        return NextResponse.json({ error: "Search failed" }, { status: 500 });
    }
}
