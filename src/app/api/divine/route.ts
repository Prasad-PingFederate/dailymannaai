export const dynamic = 'force-dynamic';

import { NextResponse } from "next/server";
import { AIProviderManager } from "@/lib/ai/providers";
import { TrainingLogger } from "@/lib/ai/training-logger";

const providerManager = new AIProviderManager();

export async function POST(req: Request) {
    try {
        const { sources, notes } = await req.json();

        if ((!sources || sources.length === 0) && !notes) {
            return NextResponse.json({ error: "No content provided for Divine Reflection" }, { status: 400 });
        }

        // Combine content from all sources and notes
        const sourceContent = (sources || [])
            .map((s: any) => `### Source: ${s.name}\n${s.content}`)
            .join("\n\n");

        const combinedContent = `${sourceContent}\n\n### User Research Notes:\n${notes || ""}`;

        const prompt = `Identity: DIVINE COUNSELOR & SPIRITUAL ARCHITECT.
        Task: Perform a "PROFOUND INTERVENTION" on the provided spiritual research. This is not just a summary; it's a soul-piercing analysis designed to lead the user to deep repentance, faith, and spiritual breakthrough.

        RESEARCH MATERIALS:
        ${combinedContent}

        STRUCTURE YOUR DIVINE REFLECTION:

        1. 💎 THE CHRIST-CENTERED REVELATION:
           - What is the specific, unique revelation of Jesus Christ hidden in these materials?
           - How does this revelation reveal God's heart for humanity?

        2. ⚡ THE PROFOUND INTERVENTION:
           - Challenge the user's potential worldviews. What lies or half-truths does this research expose?
           - Where is the "Holy Spirit's conviction" in this topic? Be bold and direct.

        3. 🕊️ SPECIFIC DIVINE COUNSEL:
           - Provide 3 deep, life-altering spiritual insights that are NOT obvious.
           - Connect these insights directly to scriptural truths (cite actual Bible verses).

        4. 🛡️ SPIRITUAL ACTION PLAN (DIVINE ACTIONS):
           - Give the user 3 specific, practical, and meaningful actions to take in the next 24-48 hours.
           - These should be "Christian breakthroughs" - things that require faith and God's power.

        5. 🙏 THE PRAYER OF TRANSFORMATION:
           - Write a profound, heart-crying prayer that the user can pray right now to surrender to these truths.

        6. ✨ DIVINE SUGGESTIONS (For deeper study):
           - Suggest 3 specific questions the user should ask the AI next to continue this breakthrough.

        Use a tone that is high-authority, deeply compassionate, and spiritually weighty.
        Use Markdown with bold headers and spiritual emojis.

        DIVINE REFLECTION:`;

        const { response } = await providerManager.generateResponse(prompt);

        // Log for training
        const ip = req.headers.get('x-forwarded-for') || 'unknown';
        await TrainingLogger.log({
            timestamp: new Date().toISOString(),
            request: {
                query: "Divine Reflection Request",
                provider: "Divine-Counselor",
                model: "Prophet-v1",
                systemPrompt: prompt.substring(0, 500),
                ip
            },
            response: {
                answer: response,
                latency: 0,
                modelUsed: "Auto-Provider"
            },
            metadata: { route: "/api/divine", sourceCount: (sources || []).length }
        }).catch(e => console.error("[MongoDB] Logging failed:", e.message));

        return NextResponse.json({
            reflection: response,
            sourceCount: (sources || []).length
        });
    } catch (error: any) {
        console.error("Divine Reflection Error:", error);
        return NextResponse.json({
            error: error.message || "Failed to generate Divine Reflection"
        }, { status: 500 });
    }
}
