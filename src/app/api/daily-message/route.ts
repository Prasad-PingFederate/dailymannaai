import { NextResponse } from "next/server";
import { AIProviderManager } from "@/lib/ai/providers";
import { getDatabase } from "@/lib/mongodb";

const providerManager = new AIProviderManager();

export async function GET() {
    try {
        const today = new Date();
        const dateStr = `${today.getDate().toString().padStart(2, '0')}/${(today.getMonth() + 1).toString().padStart(2, '0')}/${today.getFullYear()}`;

        // 1. Try to fetch from Cache (MongoDB)
        let db;
        try {
            db = await getDatabase();
            const cachedManna = await db.collection('daily_manna').findOne({ date: dateStr });

            if (cachedManna) {
                console.log(`[Cache Hit] Serving Daily Manna for ${dateStr}`);
                return NextResponse.json({
                    date: dateStr,
                    message: cachedManna.message,
                    source: 'cache'
                });
            }
        } catch (dbError) {
            console.error("DB Cache Error (continuing to AI):", dbError);
        }

        // 2. If not in cache, generate with AI
        console.log(`[Cache Miss] Generating fresh Daily Manna for ${dateStr}`);
        const prompt = `Identity: HEAVENLY MESSENGER & SPIRITUAL GUIDE.
        Task: Generate a "Daily Manna" message for today (${dateStr}).
        
        Themes to include:
        1. The Unfathomable Love of God.
        2. Our Responsibilities as Christians in a busy world.
        3. The Glorious Second Coming of Jesus Christ.
        4. Relevant Scripture references (cite Book, Chapter:Verse).

        Requirements:
        - Format the date as ${dateStr} at the very top.
        - The message should be profound, encouraging, and challenging.
        - Length: Medium (around 150-200 words).
        - Style: Poetic yet practical.

        DAILY MANNA MESSAGE:`;

        const { response } = await providerManager.generateResponse(prompt);

        // 3. Save to Cache for next users
        if (db) {
            await db.collection('daily_manna').insertOne({
                date: dateStr,
                message: response,
                createdAt: new Date()
            });
        }

        return NextResponse.json({
            date: dateStr,
            message: response,
            source: 'generated'
        });
    } catch (error: any) {
        console.error("Daily Message Error:", error);
        return NextResponse.json({
            error: error.message || "Failed to generate Daily Manna"
        }, { status: 500 });
    }
}
