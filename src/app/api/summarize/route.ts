export const dynamic = 'force-dynamic';

import { NextResponse } from "next/server";
import { AIProviderManager } from "@/lib/ai/providers";
import { TrainingLogger } from "@/lib/ai/training-logger";
import { searchRelevantChunks } from "@/lib/storage/vector-store";

const providerManager = new AIProviderManager();

export async function POST(req: Request) {
    try {
        const { sources } = await req.json();

        if (!sources || sources.length === 0) {
            return NextResponse.json({ error: "No source content provided" }, { status: 400 });
        }

        // Combine content from all provided sources
        const combinedContent = sources
            .map((s: any) => `### Source: ${s.name}\n${s.content}`)
            .join("\n\n");

        const prompt = `Identity: SPIRITUAL RESEARCH DISCIPLE (Master Synthesizer).
        Task: Create a DUAL-LENS COMPREHENSIVE SUMMARY that bridges the Scientific/Historical and the Spiritual.

        SOURCES TO ANALYZE:
        ${combinedContent}

        STRUCTURE YOUR SUMMARY IN TWO DISTINCT PILLARS:

        1. 🔬 THE SCIENTIFIC & HISTORICAL PILLAR:
           - Analyze dates, names, locations, and historical contexts.
           - Identify verifiable facts and logical frameworks mentioned in the text.
           - Present the evidence-based foundation of the material.

        2. 🕊️ THE SPIRITUAL & REVELATORY PILLAR:
           - Extract the soul of the message and the depth of Jesus Christ hidden in the text.
           - Highlight Scriptural wisdom and revelatory insights.
           - Explain how these truths lead to salvation or spiritual growth.

        CONCLUSION: Provide a "Divine Synthesis" that connects both pillars into one unified truth to help seekers be benefited and saved.

        Use high-precision Markdown with bold headers and clear formatting.
        SUMMARY:`;

        const { response } = await providerManager.generateResponse(prompt);

        // 🧠 Global Training Log: Summary Synthesis
        const ip = req.headers.get('x-forwarded-for') || 'unknown';
        const userAgent = req.headers.get('user-agent') || 'unknown';
        const referer = req.headers.get('referer') || 'unknown';

        await TrainingLogger.log({
            timestamp: new Date().toISOString(),
            request: {
                query: "Summarization Request",
                provider: "Summarizer",
                model: "Synthesizer-v1",
                systemPrompt: prompt.substring(0, 500),
                ip,
                userAgent,
                referer
            },
            response: {
                answer: response,
                latency: 0,
                modelUsed: "Auto-Provider"
            },
            metadata: { route: "/api/summarize", sourceCount: sources.length }
        }).catch(e => console.error("[MongoDB] Logging failed:", e.message));

        return NextResponse.json({
            summary: response,
            sourceCount: sources.length
        });
    } catch (error: any) {
        console.error("Summarize Error:", error);
        return NextResponse.json({
            error: error.message || "Failed to generate summary"
        }, { status: 500 });
    }
}
