import { NextResponse } from "next/server";
import { generateGroundedResponse } from "@/lib/ai/gemini";

export async function POST(req: Request) {
    try {
        const { query, sources } = await req.json();

        if (!query) {
            return NextResponse.json({ error: "Query is required" }, { status: 400 });
        }

        // In a real scenario, sources would be fetched from a vector DB.
        // Here we simulate the grounded response.
        const response = await generateGroundedResponse(query, sources || ["No sources provided."]);

        return NextResponse.json({
            role: "assistant",
            content: response,
            citations: [1, 2] // Mocking citation ID mapping
        });
    } catch (error) {
        console.error("API Route Error:", error);
        return NextResponse.json({ error: "Failed to generate response" }, { status: 500 });
    }
}
