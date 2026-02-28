import { NextResponse } from "next/server";
import { getProviderManager } from "@/lib/ai/gemini";

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
