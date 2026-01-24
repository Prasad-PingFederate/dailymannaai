import { NextResponse } from "next/server";
import { AIProviderManager } from "@/lib/ai/providers";
import { searchRelevantChunks } from "@/lib/storage/vector-store";

const providerManager = new AIProviderManager();

export async function POST(req: Request) {
    try {
        const { sourceIds } = await req.json();

        if (!sourceIds || sourceIds.length === 0) {
            return NextResponse.json({ error: "No sources selected" }, { status: 400 });
        }

        // Get all chunks from selected sources
        const allChunks = searchRelevantChunks("", 100).filter(chunk =>
            sourceIds.includes(chunk.sourceId)
        );

        if (allChunks.length === 0) {
            return NextResponse.json({ error: "No content found in selected sources" }, { status: 400 });
        }

        // Combine content from all sources
        const combinedContent = allChunks
            .map(chunk => chunk.content)
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
            sourceCount: sourceIds.length,
            chunkCount: allChunks.length
        });
    } catch (error: any) {
        console.error("Summarize Error:", error);
        return NextResponse.json({
            error: error.message || "Failed to generate summary"
        }, { status: 500 });
    }
}
