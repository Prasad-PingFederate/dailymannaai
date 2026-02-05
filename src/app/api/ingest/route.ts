import { NextResponse } from "next/server";
import { ingestDocuments } from "@/lib/storage/vector-store";
import mammoth from "mammoth";
import path from 'path';
import { fetchYoutubeTranscript } from "@/lib/youtube-utils";

export const runtime = 'nodejs';

export async function POST(req: Request) {
    try {
        const contentType = req.headers.get("content-type") || "";
        let textContent = "";
        let name = "";

        if (contentType.includes("application/json")) {
            const body = await req.json();
            const { url, text, name: inputName, mode } = body;
            name = inputName;

            // YouTube Detection (Bypass if text is already provided via Client-Side fetch)
            if (!text && url && (url.includes("youtube.com") || url.includes("youtu.be"))) {
                console.log(`[Ingest] Detected YouTube URL (No client-side text): ${url}`);
                try {
                    textContent = await fetchYoutubeTranscript(url);
                    console.log(`[Ingest] Server-side YT fetch success: ${textContent.length} chars.`);
                } catch (ytError: any) {
                    console.error("YouTube Main Transcript Error:", ytError.message);
                    return NextResponse.json({ error: ytError.message }, { status: 400 });
                }
            } else if (text) {
                console.log(`[Ingest] Using provided text content for ${name || "unnamed source"}`);
                textContent = text;
            } else if (mode === "website") {
                if (!url) return NextResponse.json({ error: "URL is required" }, { status: 400 });

                console.log(`[Ingest] Fetching website: ${url}`);

                async function robustFetch(targetUrl: string) {
                    const userAgents = [
                        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
                        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                        'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36'
                    ];

                    const strategy = async (ua: string) => {
                        const headers: any = {
                            'User-Agent': ua,
                            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
                            'Accept-Language': 'en-US,en;q=0.9',
                            'Accept-Encoding': 'gzip, deflate, br',
                            'Connection': 'keep-alive',
                            'Upgrade-Insecure-Requests': '1',
                            'Sec-Fetch-Dest': 'document',
                            'Sec-Fetch-Mode': 'navigate',
                            'Sec-Fetch-Site': 'none',
                            'Sec-Fetch-User': '?1',
                            'Cache-Control': 'max-age=0',
                            'Referer': 'https://www.google.com/'
                        };
                        return await fetch(targetUrl, { headers });
                    };

                    let response = await strategy(userAgents[0]);

                    // If blocked (403/401), try a different UA or a simpler approach
                    if (!response.ok && (response.status === 403 || response.status === 401)) {
                        console.warn(`[Ingest] Strategy 1 failed (${response.status}). Retrying with alternate UA...`);
                        response = await strategy(userAgents[1]);
                    }

                    // Last resort: Try a proxy-less broad fetch (some environments handle this better)
                    if (!response.ok) {
                        console.warn(`[Ingest] All direct strategies failed (${response.status}). Attempting clean fetch...`);
                        response = await fetch(targetUrl).catch(() => response);
                    }

                    return response;
                }

                const response = await robustFetch(url);

                if (!response.ok) {
                    throw new Error(`The website ${url} blocked our connection (${response.status}). This often happens with strict anti-bot settings.`);
                }

                const html = await response.text();

                // Advanced Extraction: Semantic Content Isolation
                // We strip heavy noise while preserving structure
                textContent = html
                    .replace(/<script\b[^>]*>([\s\S]*?)<\/script>/gm, "")
                    .replace(/<style\b[^>]*>([\s\S]*?)<\/style>/gm, "")
                    .replace(/<svg\b[^>]*>([\s\S]*?)<\/svg>/gm, "")
                    .replace(/<header\b[^>]*>([\s\S]*?)<\/header>/gm, "") // Strip header
                    .replace(/<footer\b[^>]*>([\s\S]*?)<\/footer>/gm, "") // Strip footer
                    .replace(/<nav\b[^>]*>([\s\S]*?)<\/nav>/gm, "")     // Strip navigation
                    .replace(/<aside\b[^>]*>([\s\S]*?)<\/aside>/gm, "") // Strip sidebars
                    .replace(/<iframe\b[^>]*>([\s\S]*?)<\/iframe>/gm, "")
                    .replace(/<[^>]+>/g, " ")
                    .replace(/&nbsp;/g, " ")
                    .replace(/&quot;/g, '"')
                    .replace(/&amp;/g, '&')
                    .replace(/\s+/g, " ")
                    .trim();

                console.log(`[Ingest] Expert extraction success: ${textContent.length} characters.`);
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
