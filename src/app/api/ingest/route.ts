import { NextResponse } from "next/server";
import { ingestDocuments } from "@/lib/storage/vector-store";

export async function POST(req: Request) {
    try {
        const { name, type, content } = await req.json();

        if (!name || !content) {
            return NextResponse.json({ error: "Name and content are required" }, { status: 400 });
        }

        // Ingest the simulated content into our vector store
        const chunks = ingestDocuments(content, name);

        return NextResponse.json({
            success: true,
            message: `Successfully ingested ${chunks.length} chunks from ${name}`,
            sourceId: name
        });
    } catch (error) {
        console.error("Ingestion Error:", error);
        return NextResponse.json({ error: "Failed to ingest document" }, { status: 500 });
    }
}
