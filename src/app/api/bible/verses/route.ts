// src/app/api/bible/verses/route.ts
import { NextResponse } from "next/server";
import { getCollection } from "@/lib/astra";

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const book = searchParams.get("book")?.trim();
        const chapter = parseInt(searchParams.get("chapter") || "0");
        const translation = searchParams.get("translation")?.toLowerCase() || "kjv";

        if (!book || !chapter) {
            return NextResponse.json({ error: "Book and Chapter are required" }, { status: 400 });
        }

        let collectionName = `bible_${translation}`;
        let queryFilter: any = { book, chapter };

        const hybridMap: Record<string, string> = {
            'ru': 'bible_de',
            'ko': 'bible_fr',
            'te': 'bible_es',
            'ta': 'bible_pt',
            // godlytalias/Bible-Database imports (bible_ar collection)
            'afrikaans': 'bible_ar',
            'bengali': 'bible_ar',
            'english': 'bible_ar',
            'gujarati': 'bible_ar',
            'hindi': 'bible_ar',
            'hungarian': 'bible_ar',
            'indonesian': 'bible_ar',
            'kannada': 'bible_ar',
            'malayalam': 'bible_ar',
            'marathi': 'bible_ar',
            'nepali': 'bible_ar',
            'oriya': 'bible_ar',
            'punjabi': 'bible_ar',
            'sepedi': 'bible_ar',
            'xhosa': 'bible_ar',
            'zulu': 'bible_ar',
            // New imports (also in bible_ar collection)
            'urdu': 'bible_ar',
            'dogri': 'bible_ar',
            'assamese': 'bible_ar',
            'manipuri': 'bible_ar',
            'sanskrit': 'bible_ar',
            'maithili': 'bible_ar',
            'ks': 'bible_ar',
            'el': 'bible_ar',
            'he': 'bible_ar',
            'ja': 'bible_ar',
            'tl': 'bible_ar',
            'th': 'bible_ar',
            'vi': 'bible_ar',
            'my': 'bible_ar',
        };

        if (hybridMap[translation]) {
            collectionName = hybridMap[translation];
            queryFilter.version = translation.toUpperCase();
        }

        const collection = await getCollection(collectionName);

        // Fetch all verses for the chapter
        const result = await collection.find(queryFilter).toArray();
        
        // Manual sort in JS if the DB doesn't have an index
        result.sort((a: any, b: any) => (a.verse || 0) - (b.verse || 0));

        return NextResponse.json({ verses: result });
    } catch (error: any) {
        console.error("Bible Fetch Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
