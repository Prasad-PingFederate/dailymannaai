import { NextResponse } from "next/server";
import { getProviderManager } from "@/lib/ai/providers";
import { getDatabase } from "@/lib/mongodb";

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

export async function POST(req: Request) {
    try {
        const { category, customTopic, usedReferences = [] } = await req.json();
        const topic = customTopic || TOPIC_MAP[category] || 'Christian encouragement';

        // --- ATTEMPT 1: MongoDB "sermons_archive" Random Pull ---
        if (Math.random() > 0.4) { // 60% chance to try DB Sermons vs Bible LLM
            try {
                const db = await getDatabase();
                const collection = db.collection('sermons_archive');

                // MongoDB native random using $sample aggregation
                const sermonsList = await collection.aggregate([{ $sample: { size: 1 } }]).toArray();

                if (sermonsList && sermonsList.length > 0) {
                    const randomSermon = sermonsList[0];

                    if (randomSermon.content && randomSermon.content.length > 100) {
                        const words = randomSermon.content.split(/\s+/);
                        const startWordIdx = Math.floor(Math.random() * Math.max(1, words.length - 80));
                        const rawSnippet = words.slice(Math.max(0, startWordIdx), startWordIdx + 80).join(" ");

                        const preacherName = randomSermon.preacher || "Classic Sermon";

                        const formatPrompt = `You are a pastor editing a daily devotional. 
Take this raw, incomplete chunk from a historic sermon by ${preacherName}:
"${rawSnippet}"

Extract and politely reframe the BEST 1-2 sentences from it so it sounds like a complete, beautiful standalone quote.
Return ONLY valid JSON (no markdown block):
{
  "quote": "the perfectly framed 1-2 sentence quote",
  "reference": "${preacherName}",
  "reflection": "One devotional sentence about this, max 15 words",
  "testament": ""
}`;
                        const { response: llmFormatted } = await getProviderManager().generateResponse(formatPrompt);
                        const cleanText = llmFormatted.replace(/\`\`\`json/g, '').replace(/\`\`\`/g, '').trim();

                        try {
                            const data = JSON.parse(cleanText);
                            if (!usedReferences.includes(data.quote.substring(0, 20))) {
                                console.log("Successfully fetched AND formatted quote from MongoDB!");
                                return NextResponse.json({
                                    quote: data.quote,
                                    reference: data.reference,
                                    reflection: data.reflection,
                                    testament: ""
                                });
                            }
                        } catch (parseErr) {
                            console.warn("Failed to parse LLM formatted DB quote, falling back to native LLM", parseErr);
                        }
                    }
                }
            } catch (err) {
                console.warn("MongoDB Sermon fetch failed, falling back to LLM", err);
            }
        }

        // --- ATTEMPT 2: Fallback to AI Native Generation ---
        const avoidConstraint = usedReferences.length > 0
            ? `\nCRITICAL: Do NOT use any of these references that have already been shown: ${usedReferences.join(', ')}.`
            : '';

        const prompt = `You are a deeply knowledgeable Christian theologian and pastor.
Generate ONE powerful piece of encouragement about: ${topic}. 
You should randomly choose between EITHER a Bible verse OR a quote from a famous faithful preacher like Billy Graham.

CRITICAL INSTRUCTION: The user heavily prefers quotes spoken by Jesus Christ, St. Paul, Peter, John, or famous preachers like Billy Graham! Bias your selection towards these figures!${avoidConstraint}

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

        const cleanText = response.replace(/\`\`\`json/g, '').replace(/\`\`\`/g, '').trim();

        let data;
        try {
            data = JSON.parse(cleanText);
        } catch (e) {
            throw new Error("Failed to parse AI response into JSON. Text was: " + cleanText);
        }

        if (!data.quote || !data.reference) {
            throw new Error('Invalid response format');
        }

        return NextResponse.json(data);
    } catch (error: any) {
        console.error('Bible quote API error:', error);
        return NextResponse.json({ error: 'Failed to fetch scripture. Please try again.' }, { status: 500 });
    }
}
