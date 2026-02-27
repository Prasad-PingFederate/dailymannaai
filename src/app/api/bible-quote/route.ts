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
        const { category, customTopic } = await req.json();
        const topic = customTopic || TOPIC_MAP[category] || 'Christian encouragement';

        const prompt = `You are a deeply knowledgeable Christian theologian and pastor.
Generate ONE powerful Bible verse about: ${topic}.

Return ONLY valid JSON (no markdown block, just the raw JSON text):
{
  "quote": "exact Bible verse text in KJV or NIV",
  "reference": "Book Chapter:Verse",
  "reflection": "One devotional sentence, max 20 words",
  "testament": "Old" or "New"
}

Ensure the verse is:
- Doctrinally sound and Christ-centered
- Directly relevant to the topic
- Complete (full verse, not truncated)`;

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
