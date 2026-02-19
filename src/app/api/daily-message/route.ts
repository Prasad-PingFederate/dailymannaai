export const dynamic = 'force-dynamic';

import { NextResponse } from "next/server";
import { AIProviderManager } from "@/lib/ai/providers";

const providerManager = new AIProviderManager();

export async function GET() {
    try {
        const today = new Date();
        const dateStr = `${today.getDate().toString().padStart(2, '0')}/${(today.getMonth() + 1).toString().padStart(2, '0')}/${today.getFullYear()}`;

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
        - Purpose: To help busy employees and people remember God throughout their day.
        - Style: Poetic yet practical.

        DAILY MANNA MESSAGE:`;

        const { response } = await providerManager.generateResponse(prompt);

        return NextResponse.json({
            date: dateStr,
            message: response
        });
    } catch (error: any) {
        console.error("Daily Message Error:", error);
        return NextResponse.json({
            error: error.message || "Failed to generate Daily Manna"
        }, { status: 500 });
    }
}
