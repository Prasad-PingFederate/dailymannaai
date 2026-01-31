import { NextResponse } from 'next/server';
import { search, SafeSearchType } from 'duck-duck-scrape';

export async function GET() {
    const report: any = {
        timestamp: new Date().toISOString(),
        environment: {
            node_env: process.env.NODE_ENV,
            region: process.env.VERCEL_REGION || 'unknown',
        },
        keys: {
            gemini: !!process.env.GEMINI_API_KEY ? 'Set' : 'Missing',
            openrouter: !!process.env.OPENROUTER_API_KEY ? 'Set' : 'Missing',
            huggingface: !!process.env.HUGGINGFACE_API_KEY ? 'Set' : 'Missing',
            groq: !!process.env.GROQ_API_KEY ? 'Set' : 'Missing',
        },
        tests: {}
    };

    // Test 1: Web Search Connectivity (DuckDuckGo)
    try {
        const start = Date.now();
        console.log("Testing Web Search...");
        const searchRes = await search("Jesus Christ", { safeSearch: SafeSearchType.STRICT });
        const duration = Date.now() - start;
        report.tests.web_search = {
            status: searchRes.results.length > 0 ? 'OK' : 'Empty Results',
            latency_ms: duration,
            result_count: searchRes.results.length
        };
    } catch (e: any) {
        report.tests.web_search = {
            status: 'Failed',
            error: e.message
        };
    }

    // Test 2: OpenRouter Connectivity
    if (process.env.OPENROUTER_API_KEY) {
        try {
            const start = Date.now();
            console.log("Testing OpenRouter...");
            const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
                    "HTTP-Referer": "https://dailymannaai.com",
                    "X-Title": "Debug Tool",
                },
                body: JSON.stringify({
                    model: "google/gemini-2.0-flash-exp:free",
                    messages: [{ role: "user", content: "Hi" }],
                    max_tokens: 5,
                }),
            });
            const duration = Date.now() - start;

            if (res.ok) {
                const data = await res.json();
                report.tests.openrouter = {
                    status: 'OK',
                    latency_ms: duration,
                    response: data.choices?.[0]?.message?.content || 'No content'
                };
            } else {
                const text = await res.text();
                report.tests.openrouter = {
                    status: 'API Error',
                    code: res.status,
                    details: text
                };
            }
        } catch (e: any) {
            report.tests.openrouter = {
                status: 'Network Failed',
                error: e.message
            };
        }
    } else {
        report.tests.openrouter = { status: 'Skipped (No Key)' };
    }

    return NextResponse.json(report, { status: 200 });
}
