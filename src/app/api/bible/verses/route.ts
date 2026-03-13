// src/app/api/bible/verses/route.ts
import { NextResponse } from "next/server";
import { getCollection } from "@/lib/astra";

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const book = searchParams.get("book");
        const chapter = parseInt(searchParams.get("chapter") || "0");
        const translation = searchParams.get("translation")?.toLowerCase() || "kjv";

        if (!book || !chapter) {
            return NextResponse.json({ error: "Book and Chapter are required" }, { status: 400 });
        }

        const collectionName = `bible_${translation}`;
        const collection = await getCollection(collectionName);

        // Fetch all verses for the chapter
        // Astra DB Data API syntax
        const result = await collection.find({
            book: book,
            chapter: chapter
        }, {
            sort: { verse: 1 }
        }).toArray();

        return NextResponse.json({ verses: result });
    } catch (error: any) {
        console.error("Bible Fetch Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
