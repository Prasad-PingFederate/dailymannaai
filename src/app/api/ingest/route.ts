import { NextResponse } from "next/server";
import { ingestDocuments } from "@/lib/storage/vector-store";

export async function POST(req: Request) {
    try {
        const formData = await req.formData();
        const file = formData.get("file") as File;
        const name = formData.get("name") as string;

        if (!file || !name) {
            return NextResponse.json({ error: "File and name are required" }, { status: 400 });
        }

        let textContent = "";

        // 1. Check if it's a PDF
        if (file.type === "application/pdf" || name.toLowerCase().endsWith(".pdf")) {
            const buffer = Buffer.from(await file.arrayBuffer());

            // Using dynamic require to handle pdf-parse in Next.js
            const pdf = require("pdf-parse");
            const data = await pdf(buffer);
            textContent = data.text;
        } else {
            // 2. Otherwise treat as text
            textContent = await file.text();
        }

        if (!textContent || textContent.trim().length < 10) {
            return NextResponse.json({ error: "Document content is empty or too small" }, { status: 400 });
        }

        // 3. Ingest the REAL extracted content into our vector store
        const chunks = ingestDocuments(textContent, name);

        return NextResponse.json({
            success: true,
            message: `Successfully learned ${chunks.length} segments from ${name}`,
            sourceId: name,
            preview: textContent.substring(0, 100) + "..."
        });
    } catch (error) {
        console.error("Ingestion Error:", error);
        return NextResponse.json({ error: "Failed to read document content" }, { status: 500 });
    }
}
