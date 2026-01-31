import { NextResponse } from "next/server";
import { AIProviderManager } from "@/lib/ai/providers";
import { searchRelevantChunks } from "@/lib/storage/vector-store";

const providerManager = new AIProviderManager();

export async function POST(req: Request) {
    try {
        const { sourceIds } = await req.json();

        const { sources } = await req.json();

        if (!sources || sources.length === 0) {
            return NextResponse.json({ error: "No source content provided" }, { status: 400 });
        }

        // Combine content from all provided sources
        const combinedContent = sources
            .map((s: any) => `### Source: ${s.name}\n${s.content}`)
            .join("\n\n");

        const prompt = `You are a spiritual research assistant helping to summarize Christian teachings and biblical wisdom.

SOURCES TO SUMMARIZE:
${combinedContent}

Please provide a comprehensive yet concise summary that:
1. Captures the main spiritual themes and teachings
2. Highlights key Scripture references
3. Notes important wisdom from Christian leaders mentioned
4. Organizes insights into clear sections
5. Uses a warm, faith-centered tone

Format the summary with clear headings and bullet points for readability.

SUMMARY:`;

        const { response } = await providerManager.generateResponse(prompt);

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
