export const dynamic = 'force-dynamic';

import { NextResponse } from "next/server";
import { AIProviderManager } from "@/lib/ai/providers";

const providerManager = new AIProviderManager();

export async function POST(req: Request) {
    try {
        const { text } = await req.json();

        if (!text || text.trim().length === 0) {
            return NextResponse.json({ error: "No text provided to refine" }, { status: 400 });
        }

        const prompt = `You are a spiritual writing assistant helping to refine and improve Christian research notes.

ORIGINAL TEXT:
${text}

Please refine this text by:
1. Improving clarity and flow while maintaining the spiritual message
2. Correcting any grammatical or spelling errors
3. Enhancing the theological accuracy
4. Making the language more engaging and inspirational
5. Ensuring proper Scripture citation format
6. Maintaining the original meaning and intent

Provide ONLY the refined version without explanations or meta-commentary.

REFINED TEXT:`;

        const { response } = await providerManager.generateResponse(prompt);

        return NextResponse.json({
            original: text,
            refined: response.trim()
        });
    } catch (error: any) {
        console.error("Refine Error:", error);
        return NextResponse.json({
            error: error.message || "Failed to refine text"
        }, { status: 500 });
    }
}
