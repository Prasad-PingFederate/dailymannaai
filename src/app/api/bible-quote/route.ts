import { NextResponse } from "next/server";
import { getProviderManager } from "@/lib/ai/gemini";
import { DataAPIClient } from "@datastax/astra-db-ts";

const TOPIC_MAP: Record<string, string> = {
    faith: 'faith, trust in God, believing without seeing',
    love: "God's unconditional love, John 3:16, agape love",
    strength: 'strength through Christ, overcoming adversity',
    peace: 'peace that surpasses understanding, rest in God',
    salvation: 'salvation through Jesus Christ, redemption',
    wisdom: "divine wisdom, Proverbs, seeking God's guidance",
    prayer: "the power of prayer, communication with God",
    hope: "hope in Christ, eternal promises of God",
};

let astraDbCache: any = null;

function getAstraDatabase() {
    if (astraDbCache) return astraDbCache;
    const { ASTRA_DB_APPLICATION_TOKEN, ASTRA_DB_API_ENDPOINT, ASTRA_DB_NAMESPACE } = process.env;
    if (!ASTRA_DB_APPLICATION_TOKEN || !ASTRA_DB_API_ENDPOINT) return null;

    const client = new DataAPIClient(ASTRA_DB_APPLICATION_TOKEN);
    astraDbCache = client.db(ASTRA_DB_API_ENDPOINT, {
        keyspace: ASTRA_DB_NAMESPACE || "default_keyspace"
    });
    return astraDbCache;
}

export async function POST(req: Request) {
    try {
        const { category, customTopic, usedReferences = [] } = await req.json();
        const topic = customTopic || TOPIC_MAP[category] || 'Christian encouragement';

        // --- ATTEMPT 1: AstraDB "sermons_archive" Database Random Pull ---
        const db = getAstraDatabase();
        if (db && Math.random() > 0.4) { // 60% chance to try Astra DB Sermons vs Bible LLM
            try {
                const collection = db.collection('sermons_archive');

                // Get all possible preachers and random skip
                // Note: Astra native random requires sorting or skipping mathematically, doing light skip approximation
                const skipAmount = Math.floor(Math.random() * 50); // Just a small skip since db might be huge
                const sermonCursor = await collection.find({}, { limit: 10 });
                const sermonsList = await sermonCursor.toArray();

                if (sermonsList && sermonsList.length > 0) {
                    // Pick a random sermon
                    const randomSermon = sermonsList[Math.floor(Math.random() * sermonsList.length)];

                    // Extract a readable 2-3 sentence quote from the content text
                    if (randomSermon.content && randomSermon.content.length > 100) {
                        const words = randomSermon.content.split(/\s+/);
                        const startWordIdx = Math.floor(Math.random() * (words.length - 40));
                        let snippet = words.slice(Math.max(0, startWordIdx), startWordIdx + 30).join(" ");

                        // Clean up boundaries
                        snippet = snippet.replace(/^[a-z]/, (c: string) => c.toUpperCase()); // Capitalize start
                        if (!snippet.endsWith('.')) snippet += "...";

                        const preacherName = randomSermon.preacher || "Classic Sermon";
                        const refMatch = preacherName + " - " + (randomSermon.title || "Archive");

                        // Make sure we aren't repeating it based on frontend tracker
                        if (!usedReferences.includes(refMatch)) {
                            console.log("Successfully fetched quote from AstraDB!");
                            return NextResponse.json({
                                quote: snippet,
                                reference: refMatch,
                                reflection: "A deep thought from the classic archives of faith.",
                                testament: ""
                            });
                        }
                    }
                }
            } catch (err) {
                console.warn("AstraDB Sermon fetch failed, falling back to LLM", err);
            }
        }

        // --- ATTEMPT 2: Fallback to Gemini AI Native Generation ---
        const avoidConstraint = usedReferences.length > 0
            ? `\nCRITICAL: Do NOT use any of these references that have already been shown: ${usedReferences.join(', ')}.`
            : '';

        const prompt = `You are a deeply knowledgeable Christian theologian and pastor.
Generate ONE powerful piece of encouragement about: ${topic}. 
You should randomly choose between EITHER a Bible verse OR a quote from a famous faithful preacher (like Billy Graham, Charles Spurgeon, etc.).${avoidConstraint}

Return ONLY valid JSON (no markdown block, just the raw JSON text):
{
  "quote": "exact Bible verse text OR exact quote from the preacher",
  "reference": "Book Chapter:Verse OR Preacher Name (e.g. 'Billy Graham')",
  "reflection": "One devotional sentence about the quote, max 20 words",
  "testament": "Old", "New", or leave empty/null if it is a preacher quote
}

Ensure the chosen text is:
- Doctrinally sound, Christ-centered, and inspiring
- Directly relevant to the topic
- Complete (full verse or quote, not truncated)
- DIFFERENT from any references listed in the critical avoid list`;

        const { response } = await getProviderManager().generateResponse(prompt);

        // Clean response of any markdown backticks
        const cleanText = response.replace(/\`\`\`json/g, '').replace(/\`\`\`/g, '').trim();

        let data;
        try {
            data = JSON.parse(cleanText);
        } catch (e) {
            throw new Error("Failed to parse AI response into JSON. Text was: " + cleanText);
        }

        // Validate required fields
        if (!data.quote || !data.reference) {
            throw new Error('Invalid response format');
        }

        return NextResponse.json(data);
    } catch (error: any) {
        console.error('Bible quote API error:', error);
        return NextResponse.json({ error: 'Failed to fetch scripture. Please try again.' }, { status: 500 });
    }
}
