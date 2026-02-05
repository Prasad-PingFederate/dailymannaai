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

                console.log(`[Ingest-DNA] Initializing Stealth Mode fetch for: ${url}`);

                async function expertStealthFetch(targetUrl: string) {
                    const ua = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36';

                    const directHeaders = {
                        'User-Agent': ua,
                        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
                        'Accept-Language': 'en-US,en;q=0.9',
                        'Cache-Control': 'no-cache',
                        'Pragma': 'no-cache',
                        'Referer': 'https://www.google.com/',
                        'Upgrade-Insecure-Requests': '1'
                    };

                    // Attempt 1: Direct Fetch with Stealth Headers
                    let response = await fetch(targetUrl, { headers: directHeaders, cache: 'no-store' }).catch(() => null);

                    // Attempt 2: Proxy Fallback (Highly reliable for 403/Blocked regions)
                    if (!response || !response.ok || response.status === 403 || response.status === 401) {
                        console.warn(`[Ingest-DNA] Direct fetch blocked or failed (${response?.status}). Engaging Proxy Fallback...`);

                        // Using AllOrigins as a transparent, high-reputation proxy
                        const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(targetUrl)}`;
                        response = await fetch(proxyUrl, { cache: 'no-store' }).catch(() => null);
                    }

                    // Attempt 3: Simpler Proxy Fallback
                    if (!response || !response.ok) {
                        console.warn(`[Ingest-DNA] Proxy 1 failed. Trying Alternate Proxy...`);
                        const altProxy = `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(targetUrl)}`;
                        response = await fetch(altProxy).catch(() => null);
                    }

                    return response;
                }

                const response = await expertStealthFetch(url);

                if (!response || !response.ok) {
                    throw new Error(`The website "${url}" blocked all our connections (${response?.status || 'Unknown'}). This usually requires a residential IP or specific cookies.`);
                }

                const html = await response.text();

                // EXPERT EXTRACTION: Semantic Content Isolation
                // We identify the "meat" of the page before stripping tags.
                let semanticHtml = html;
                const articleMatch = html.match(/<article\b[^>]*>([\s\S]*?)<\/article>/i)
                    || html.match(/<main\b[^>]*>([\s\S]*?)<\/main>/i)
                    || html.match(/<div\s+class=["'][^"']*(?:content|post|entry|article)[^"']*["'][^>]*>([\s\S]*?)<\/div>/i);

                if (articleMatch) {
                    console.log("[Ingest-DNA] Semantic content island identified. Focusing extraction...");
                    semanticHtml = articleMatch[1];
                }

                textContent = semanticHtml
                    .replace(/<script\b[^>]*>([\s\S]*?)<\/script>/gm, "")
                    .replace(/<style\b[^>]*>([\s\S]*?)<\/style>/gm, "")
                    .replace(/<svg\b[^>]*>([\s\S]*?)<\/svg>/gm, "")
                    .replace(/<nav\b[^>]*>([\s\S]*?)<\/nav>/gm, "")
                    .replace(/<footer\b[^>]*>([\s\S]*?)<\/footer>/gm, "")
                    .replace(/<header\b[^>]*>([\s\S]*?)<\/header>/gm, "")
                    .replace(/<[^>]+>/g, " ")
                    .replace(/&nbsp;/g, " ")
                    .replace(/&quot;/g, '"')
                    .replace(/&amp;/g, '&')
                    .replace(/&rsquo;/g, "'")
                    .replace(/&lsquo;/g, "'")
                    .replace(/&rdquo;/g, '"')
                    .replace(/&ldquo;/g, '"')
                    .replace(/\s+/g, " ")
                    .trim();

                console.log(`[Ingest-DNA] High-fidelity extraction success: ${textContent.length} characters.`);
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
