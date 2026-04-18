// src/app/api/bible/debug/route.ts
import { NextResponse } from "next/server";
import { getCosmosContainer } from "@/lib/cosmos";

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const container = getCosmosContainer("BibleDatabase", "verses");
        
        // Scan for ALL distinct version strings in the DB
        const querySpec = {
            query: "SELECT DISTINCT VALUE c.version FROM c",
        };
        const { resources: versions } = await container.items.query(querySpec, { maxItemCount: 100 }).fetchAll();

        // Get sample records
        const querySample = {
            query: "SELECT TOP 10 * FROM c",
        };
        const { resources: samples } = await container.items.query(querySample).fetchAll();

        return NextResponse.json({ 
            status: "connected",
            database: "BibleDatabase",
            container: "verses",
            distinctVersions: versions.sort(),
            samples: samples.map(s => ({
                id: s.id,
                v: s.version,
                b: s.book,
                c: s.chapter,
                firstChars: (s.text || "").substring(0, 20)
            })),
            timestamp: new Date().toISOString()
        });
    } catch (error: any) {
        return NextResponse.json({ 
            status: "error", 
            message: error.message
        }, { status: 500 });
    }
}
