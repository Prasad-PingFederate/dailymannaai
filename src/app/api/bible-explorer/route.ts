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

        const stream = await askBibleQuestion(question, history || []);

        const encoder = new TextEncoder();
        const readableStream = new ReadableStream({
            async start(controller) {
                try {
                    for await (const chunk of stream) {
                        const text = typeof chunk.content === 'string' ? chunk.content : '';
                        if (text) {
                            controller.enqueue(encoder.encode(text));
                        }
                    }
                    controller.close();
                } catch (error) {
                    console.error("Streaming error:", error);
                    controller.error(error);
                }
            },
        });

        return new Response(readableStream, {
            headers: {
                'Content-Type': 'text/plain; charset=utf-8',
                'Transfer-Encoding': 'chunked',
                'Cache-Control': 'no-cache',
            },
        });
    } catch (error: any) {
        console.error("Error in Bible Explorer API:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
