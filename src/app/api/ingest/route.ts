import { NextResponse } from "next/server";
import { ingestDocuments } from "@/lib/storage/vector-store";
import mammoth from "mammoth";

export async function POST(req: Request) {
    try {
        const contentType = req.headers.get("content-type") || "";
        let textContent = "";
        let name = "";

        if (contentType.includes("application/json")) {
            const body = await req.json();
            const { url, text, name: inputName, mode } = body;
            name = inputName;

            // YouTube Detection
            if (url && (url.includes("youtube.com") || url.includes("youtu.be"))) {
                console.log(`[Ingest] Detected YouTube URL: ${url}`);
                try {
                    // Use youtube-transcript-plus (more robust fork)
                    // @ts-ignore
                    const { YoutubeTranscript } = await import('youtube-transcript-plus');
                    const transcriptItems = await YoutubeTranscript.fetchTranscript(url, { lang: 'en' });

                    // Combine transcript parts
                    textContent = transcriptItems.map((item: { text: string }) => item.text).join(' ');

                    console.log(`[Ingest] Fetched YouTube transcript: ${textContent.length} chars`);

                    if (!name) {
                        name = `YouTube Video (${url})`;
                    }

                } catch (ytError: any) {
                    console.error("YouTube Main Transcript Error:", ytError.message);
                    return NextResponse.json({ error: `Failed to fetch YouTube transcript: ${ytError.message}` }, { status: 400 });
                }
            } else if (mode === "website") {
                if (!url) return NextResponse.json({ error: "URL is required" }, { status: 400 });

                console.log(`[Ingest] Fetching website: ${url}`);

                // Advanced headers to bypass aggressive bot protection (Cloudflare, etc.)
                const headers = {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
                    'Accept-Language': 'en-US,en;q=0.9',
                    'Cache-Control': 'no-cache',
                    'Pragma': 'no-cache',
                    'Sec-Ch-Ua': '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
                    'Sec-Ch-Ua-Mobile': '?0',
                    'Sec-Ch-Ua-Platform': '"Windows"',
                    'Sec-Fetch-Dest': 'document',
                    'Sec-Fetch-Mode': 'navigate',
                    'Sec-Fetch-Site': 'none',
                    'Sec-Fetch-User': '?1',
                    'Upgrade-Insecure-Requests': '1',
                    'Referer': 'https://www.google.com/'
                };

                const response = await fetch(url, { headers });

                if (!response.ok) {
                    throw new Error(`Failed to fetch website: ${response.status} ${response.statusText}.`);
                }

                const html = await response.text();

                // Extraction: Improved script/style stripping
                textContent = html
                    .replace(/<script\b[^>]*>([\s\S]*?)<\/script>/gmi, "")
                    .replace(/<style\b[^>]*>([\s\S]*?)<\/style>/gmi, "")
                    .replace(/<nav\b[^>]*>([\s\S]*?)<\/nav>/gmi, "") // Strip nav
                    .replace(/<footer\b[^>]*>([\s\S]*?)<\/footer>/gmi, "") // Strip footer
                    .replace(/<[^>]+>/g, " ")
                    .replace(/\s+/g, " ")
                    .trim();

                console.log(`[Ingest] Successfully extracted ${textContent.length} characters from ${url}`);
            } else if (mode === "text") {
                if (!text) return NextResponse.json({ error: "Text is required" }, { status: 400 });
                textContent = text;
            } else {
                return NextResponse.json({ error: "Invalid mode" }, { status: 400 });
            }
        } else {
            const formData = await req.formData();
            const file = formData.get("file") as File;
            const inputName = formData.get("name") as string;
            name = inputName;

            if (!file || !name) {
                return NextResponse.json({ error: "File and name are required" }, { status: 400 });
            }

            if (file.type === "application/pdf" || name.toLowerCase().endsWith(".pdf")) {
                const buffer = Buffer.from(await file.arrayBuffer());

                // Polyfill for PDF.js in Serverless Environment
                if (typeof (global as any).DOMMatrix === 'undefined') {
                    (global as any).DOMMatrix = class DOMMatrix { };
                }

                try {
                    // Try standard require first
                    const pdfData = require("pdf-parse");
                    const data = await pdfData(buffer);
                    textContent = data.text;

                    // If text is empty/scanned, use Gemini Vision
                    if (!textContent || textContent.trim().length < 50) {
                        console.log("PDF parse yielded empty text. Attempting Gemini OCR...");
                        const ocrText = await performGeminiOCR(buffer, "application/pdf");
                        if (ocrText) textContent = ocrText;
                    }
                } catch (pdfError: any) {
                    console.error("PDF Parse Error, trying Gemini OCR:", pdfError);
                    // Fallback to Gemini if pdf-parse crashes
                    const ocrText = await performGeminiOCR(buffer, "application/pdf");
                    if (ocrText) {
                        textContent = ocrText;
                    } else {
                        throw new Error("Failed to parse PDF and OCR failed.");
                    }
                }
            } else if (file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" || name.toLowerCase().endsWith(".docx")) {
                const buffer = Buffer.from(await file.arrayBuffer());
                const result = await mammoth.extractRawText({ buffer });
                textContent = result.value;
            } else {
                textContent = await file.text();
            }
        }

        if (!textContent || textContent.trim().length < 10) {
            return NextResponse.json({ error: "Document content is empty or too small" }, { status: 400 });
        }

        const chunks = ingestDocuments(textContent, name);

        return NextResponse.json({
            success: true,
            message: `Successfully learned ${chunks.length} segments from ${name}`,
            sourceId: name,
            preview: textContent.substring(0, 1000) // Send larger preview for "Source Explorer"
        });
    } catch (error: any) {
        console.error("Ingestion Error:", error.message);
        return NextResponse.json({ error: error.message || "Failed to read document content" }, { status: 500 });
    }
}

// Helper for Gemini Vision/OCR
import { GoogleGenerativeAI } from "@google/generative-ai";

async function performGeminiOCR(buffer: Buffer, mimeType: string): Promise<string> {
    try {
        if (!process.env.GEMINI_API_KEY) return "";

        console.log("Creating Gemini instance for OCR...");
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        // Use Flash for speed locally, or Pro if needed. Flash handles PDFs natively.
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        const parts = [
            {
                inlineData: {
                    mimeType: mimeType,
                    data: buffer.toString("base64")
                }
            },
            { text: "Extract all text from this document verbatim. Provide only the text content." }
        ];

        console.log("Sending document to Gemini Flash for OCR...");
        const result = await model.generateContent(parts);
        const text = result.response.text();
        console.log(`Gemini OCR success. Extracted ${text.length} chars.`);

        return text;
    } catch (e: any) {
        console.error("Gemini OCR Failed:", e.message);
        return "";
    }
}
