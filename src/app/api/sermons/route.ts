// src/app/api/sermons/route.ts
import { NextResponse } from "next/server";
import { getAstraDatabase } from "@/lib/astra-db";

/**
 * GET /api/sermons
 * Fetches sermons from Astra DB.
 */
export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const speaker = searchParams.get("speaker");
        // ⚠️ AstraDB Data API max page size is 20 without vector search.
        // Requesting 500 will cause a 500 error. Cap at 20.
        const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 20);

        const db = await getAstraDatabase().catch((err) => {
            console.error("[Sermons API] DB connection error:", err.message);
            return null;
        });

        if (!db) {
            return NextResponse.json(
                { error: "DB_CONNECTION_FAILED", hint: "Check ASTRA_DB_TOKEN and ASTRA_DB_API_ENDPOINT in Vercel env vars" },
                { status: 500 }
            );
        }

        // Using the 80GB dataset collection
        const collection = db.collection("sermons_archive");

        // Build query
        const query: Record<string, any> = {};
        if (speaker && speaker !== "ALL") {
            query.speaker = { $regex: speaker, $options: "i" };
        }

        // ✅ AstraDB find - capped at 20 per page
        const sermons = await collection.find(query, { limit }).toArray();

        return NextResponse.json({ sermons, count: sermons.length });
    } catch (error: any) {
        console.error("[Sermons API Error]", error.message);
        return NextResponse.json(
            { error: error.message, stack: process.env.NODE_ENV === "development" ? error.stack : undefined },
            { status: 500 }
        );
    }
}
