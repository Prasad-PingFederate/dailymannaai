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

        const prompt = `You are creating a podcast-style audio overview of spiritual research materials. Generate a natural, engaging conversation between two hosts discussing the content.

RESEARCH MATERIALS:
${combinedContent}

Create a podcast script with:
- Two hosts: "Sarah" (enthusiastic, asks questions) and "David" (knowledgeable, provides insights)
- Natural, conversational dialogue
- Discussion of key spiritual themes and teachings
- References to Scripture and Christian leaders mentioned
- Engaging back-and-forth that makes complex theology accessible
- 3-5 minutes of content (roughly 500-700 words)

Format as:
Sarah: [dialogue]
David: [dialogue]

Make it sound like a real conversation, not a formal presentation. Use natural speech patterns, occasional questions, and friendly banter.

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
