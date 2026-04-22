// src/app/api/generate-questions/short-answer/route.ts
// Generates a concise short answer (3-4 sentences + 1 Bible verse) for inline accordion display

import { NextRequest, NextResponse } from "next/server";
import { getProviderManager } from "@/lib/ai/gemini";
import { getQuestionBySlug, updateQuestion } from "@/lib/questions-service";

export async function POST(req: NextRequest) {
    try {
        const { slug } = await req.json();
        if (!slug) return NextResponse.json({ error: "slug required" }, { status: 400 });

        const q = await getQuestionBySlug(slug);
        if (!q) return NextResponse.json({ error: "Question not found" }, { status: 404 });

        // If already generated, return it immediately
        if (q.shortAnswer) {
            return NextResponse.json({ success: true, shortAnswer: q.shortAnswer, keyVerse: q.keyVerse, cached: true });
        }

        const prompt = `You are a Christian theologian giving a brief, powerful answer to a spiritual question.

QUESTION: "${q.question}"

Write a SHORT answer in exactly this format:

ANSWER: [2-3 clear, warm, authoritative sentences answering the question directly from a biblical perspective. Be specific and helpful.]

VERSE: [One most relevant KJV Bible verse, format: "verse text" — Book Chapter:Verse]

Rules:
- Answer must be 2-3 sentences maximum
- Use plain English, no jargon
- Be warm and encouraging
- Always ground the answer in Scripture
- VERSE must include the actual verse text in quotes, then the reference after a dash`;

        const { response } = await getProviderManager().generateResponse(prompt);

        // Parse ANSWER and VERSE
        const answerMatch = response.match(/ANSWER:\s*([\s\S]+?)(?=VERSE:|$)/);
        const verseMatch = response.match(/VERSE:\s*([\s\S]+)/);

        const shortAnswer = answerMatch ? answerMatch[1].trim() : response.trim().substring(0, 300);
        const keyVerse = verseMatch ? verseMatch[1].trim() : null;

        // Save back to DB
        await updateQuestion(slug, { shortAnswer, keyVerse });

        return NextResponse.json({ success: true, shortAnswer, keyVerse, cached: false });
    } catch (error: any) {
        console.error("[short-answer] Error:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
