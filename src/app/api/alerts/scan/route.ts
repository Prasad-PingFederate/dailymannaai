import { NextResponse } from "next/server";
import { searchRSSFeeds, RSSArticle } from "@/lib/rss-fetcher";
import { getProviderManager } from "@/lib/ai/gemini";

// Keywords that trigger a "Prophetic Alert"
const SENTINEL_KEYWORDS = [
    "israel", "gaza", "palestine", "hamas", "hezbollah", "iran", "middle east",
    "war", "invasion", "missile", "strike", "nuclear", "temple mount",
    "prophecy", "bible", "end times", "armageddon"
];

let lastSeenArticleUrl = "";

export async function GET() {
    try {
        // 1. Fetch only the absolute latest "breaking" news (no cache)
        // We use searchRSSFeeds with 'breaking' category to hit Google News / Wire feeds
        const articles = await searchRSSFeeds("breaking", { limit: 10 });

        if (articles.length === 0) {
            return NextResponse.json({ active: false, message: "No new articles found" });
        }

        // 2. Identify the most recent article that matches sentinel keywords
        const matches = articles.filter(a => {
            const text = `${a.title} ${a.description}`.toLowerCase();
            return SENTINEL_KEYWORDS.some(kw => text.includes(kw));
        });

        if (matches.length === 0) {
            return NextResponse.json({ active: false, message: "No prophetic triggers detected in breaking feeds" });
        }

        const latestMatch = matches[0];

        // 3. Avoid duplicate alerts (only alert if the top match is NEW)
        if (latestMatch.link === lastSeenArticleUrl) {
            return NextResponse.json({ active: false, message: "No new prophetic events since last scan" });
        }

        lastSeenArticleUrl = latestMatch.link;

        // 4. Generate AI Prophetic Insight
        let propheticInsight = latestMatch.description || latestMatch.title;
        try {
            const prompt = `
You are a Prophetic Sentinel watching global news. 
A major news event just broke:
TITLE: ${latestMatch.title}
SUMMARY: ${latestMatch.description}

TASK:
In exactly 2 short sentences, explain how this event connects to biblical prophecy (e.g., End Times, Israel, Wars and Rumors of Wars) and specifically include ONE relevant King James Bible verse reference. Speak with urgent, prophetic authority but offer hope in Jesus Christ.

Return ONLY the 2-sentence insight. Do NOT include any markdown, headers, or extra formatting.
            `;

            const aiProvider = getProviderManager();
            const { response } = await aiProvider.generateResponse(prompt);

            if (response && response.length > 20) {
                propheticInsight = response.replace(/\*\*/g, '').replace(/###/g, '').trim();
            }
        } catch (e) {
            console.error("AI Insight failed, falling back to description", e);
        }

        // 5. Return the alert payload
        return NextResponse.json({
            active: true,
            alert: {
                title: "🔥 Prophetic Alert: Breaking Event",
                body: propheticInsight,
                link: latestMatch.link,
                source: latestMatch.source,
                timestamp: new Date().toISOString()
            }
        });

    } catch (error) {
        console.error("Sentinel Error:", error);
        return NextResponse.json({ active: false, error: "Sentinel failed to scan news" }, { status: 500 });
    }
}
