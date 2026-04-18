export const dynamic = 'force-dynamic';

import { NextResponse } from "next/server";
import { AIProviderManager } from "@/lib/ai/providers";
import { searchRelevantChunks } from "@/lib/storage/vector-store";

const providerManager = new AIProviderManager();

export async function POST(req: Request) {
    try {
        const { sources } = await req.json();

        if (!sources || sources.length === 0) {
            return NextResponse.json({ error: "No sources provided" }, { status: 400 });
        }

        // Combine content from all sources
        const combinedContent = sources
            .map((s: any) => `### Source: ${s.name}\n${s.content}`)
            .join("\n\n");

        const prompt = `You are creating a highly profound, spiritually-rich podcast-style audio overview of Christian research materials. 

Generate a natural, deeply engaging conversation between two hosts who are passionate about theology and spiritual growth.

RESEARCH MATERIALS:
${combinedContent}

The goal is to make this the #1 spiritual podcast experience for users.
Create a podcast script with:
- Two hosts: "Sarah" (enthusiastic, seeks deeper meaning, asks "how does this change my life?") and "David" (knowledgeable, biblically grounded, provides profound theological insights)
- Natural, conversational dialogue with emotional depth
- Focus on the "Profound Intervention": How do these truths challenge our current worldview?
- Discussion of key spiritual themes, hidden gems in the text, and historical context
- Integration of Scripture and Wisdom: Connect the research to the broader narrative of the Gospel
- Practical Applications: What are 2-3 specific "Divine Actions" the listener can take this week?
- Length: 800-1000 words (deep dive)

Format as:
Sarah: [dialogue]
David: [dialogue]

Ensure the tone is reverent yet accessible, providing "Daily Manna" that truly nourishes the soul.

PODCAST SCRIPT:`;

        const { response } = await providerManager.generateResponse(prompt);

        // For now, return just the script
        // In production, you would:
        // 1. Parse the script
        // 2. Use OpenAI TTS API or ElevenLabs to generate audio
        // 3. Return audio URL

        return NextResponse.json({
            script: response,
            title: `Spiritual Insights: ${sources.length} Source${sources.length > 1 ? 's' : ''}`,
            sourceCount: sources.length,
            duration: "~3-5 minutes"
        });
    } catch (error: any) {
        console.error("Audio Overview Error:", error);

        // Fallback for testing/demo if API fails
        const mockScript = `Sarah: Welcome to our deep dive into these spiritual resources. It looks like we're having some trouble connecting to the AI brain right now, but we can still explore the key themes.
David: That's right, Sarah. Even without the full analysis, clarity is important.
Sarah: exactly. And I see we have some new controls to play and stop this conversation.
David: Yes, the new Start and Stop buttons should give you full control over this playback. Give them a try!`;

        return NextResponse.json({
            script: mockScript,
            title: `Audio Overview (Offline Mode)`,
            sourceCount: 1,
            duration: "~1 minute",
            isMock: true
        });
    }
}
