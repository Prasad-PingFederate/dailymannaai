export const dynamic = 'force-dynamic';

import { NextResponse } from "next/server";
import { TrainingLogger } from "@/lib/ai/training-logger";

export async function POST(req: Request) {
    try {
        const data = await req.json();
        const ip = req.headers.get('x-forwarded-for') || 'unknown';
        const userAgent = req.headers.get('user-agent') || 'unknown';
        const referer = req.headers.get('referer') || 'unknown';

        // Prepare the log entry based on the global capture pattern
        await TrainingLogger.log({
            timestamp: new Date().toISOString(),
            request: {
                query: data.path || "Global-Route-Capture",
                provider: "Global-Middleware",
                model: "Audit-Log",
                ip,
                userAgent,
                referer
            },
            response: {
                answer: `Route: ${data.path} | Method: ${data.method} | Status: ${data.status}`,
                latency: data.latency || 0,
                modelUsed: "N/A"
            },
            metadata: {
                type: "global_capture",
                fullUrl: data.url,
                ...data.metadata
            }
        }).catch(e => console.error("[MongoDB] Global capture log failed:", e.message));

        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
