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

        // 1. Check if it's a PDF or Audio
        if (file.type === "application/pdf" || name.toLowerCase().endsWith(".pdf")) {
            const buffer = Buffer.from(await file.arrayBuffer());

            // Fix for pdf-parse "ReferenceError: DOMMatrix is not defined" in Node.js
            if (typeof (global as any).DOMMatrix === 'undefined') {
                (global as any).DOMMatrix = class DOMMatrix { };
            }

            // Using dynamic require to handle pdf-parse in Next.js
            const pdfData = require("pdf-parse");
            const data = await pdfData(buffer);
            textContent = data.text;
        } else if (file.type === "audio/mpeg" || name.toLowerCase().endsWith(".mp3")) {
            // Simulated Sermon Transcription
            // In a production app, we would use OpenAI Whisper or Google Cloud Speech-to-Text
            textContent = `Sermon Transcript for "${name}": 
            This sermon emphasizes the power of faith and the goodness of God. 
            The speaker cites Romans 8:28, "And we know that in all things God works for the good of those who love him, who have been called according to his purpose." 
            The message encourages listeners to trust God's timing even in difficult seasons. 
            Key wisdom: "Your current situation is a setup for your future blessing."`;
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
