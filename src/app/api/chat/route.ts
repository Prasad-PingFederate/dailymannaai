import { NextResponse } from "next/server";
import { generateGroundedResponse } from "@/lib/ai/gemini";
import { searchRelevantChunks } from "@/lib/storage/vector-store";

export async function POST(req: Request) {
    try {
        const { query } = await req.json();

        if (!query) {
            return NextResponse.json({ error: "Query is required" }, { status: 400 });
        }

        // 1. Search our "Vector Database" for relevant text pieces
        const relevantChunks = searchRelevantChunks(query);
        const sourcesText = relevantChunks.map(c => `[${c.sourceId}] ${c.content}`);

        // 2. Generate the grounded response
        const response = await generateGroundedResponse(query, sourcesText);

        return NextResponse.json({
            role: "assistant",
            content: response,
            citations: relevantChunks.map(c => ({
                id: c.id,
                source: c.sourceId,
                preview: c.content.substring(0, 50) + "..."
            }))
        });
    } catch (error) {
        console.error("API Route Error:", error);
        return NextResponse.json({ error: "Failed to generate response" }, { status: 500 });
    }
}
