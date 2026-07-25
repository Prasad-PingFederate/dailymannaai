// src/app/api/bible-explorer/route.ts
import { NextResponse } from "next/server";
import { askBibleQuestion } from "@/lib/ai/bible-explorer-service";

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
    try {
        const { question, history } = await req.json();

        if (!question) {
            return NextResponse.json({ error: "Question is required" }, { status: 400 });
        }

        const result = await askBibleQuestion(question, history || []);

        return result.toDataStreamResponse();
    } catch (error: any) {
        console.error("Error in Bible Explorer API:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
