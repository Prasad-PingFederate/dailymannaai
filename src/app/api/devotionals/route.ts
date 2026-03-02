import { NextResponse } from "next/server";
import { AIProviderManager } from "@/lib/ai/providers";
import { getDatabase } from "@/lib/mongodb";

const providerManager = new AIProviderManager();

export async function POST(req: Request) {
    try {
        const { slot, dateLabel, dateKey } = await req.json();

        // 1. Check Cache
        let db;
        try {
            db = await getDatabase();
            const cached = await db.collection('devotionals').findOne({ dateKey, slot });
            if (cached) {
                console.log(`[Cache Hit] Devotional ${slot} for ${dateKey}`);
                return NextResponse.json(cached.data);
            }
        } catch (e) {
            console.warn("DB Cache Error (continuing to AI):", e);
        }

        // 2. Generate
        console.log(`[AI] Generating Devotional ${slot} for ${dateLabel}`);

        const prompt = `You are a deeply anointed Bible teacher and servant of Jesus Christ. Generate ${slot === 1 ? "the MORNING" : "the EVENING"} daily devotional for ${dateLabel}.

This devotional must be DEEP, RICH, and TRANSFORMATIVE — not surface level. Think like Paul writing to the churches, like Spurgeon preaching to thousands, like Jesus teaching on the mount.

STRICT FORMAT — respond ONLY in this exact JSON (no markdown, no backticks):
{
  "title": "Powerful devotional title",
  "subtitle": "A short compelling subtitle",
  "scripture": {
    "verse": "The exact scripture verse text",
    "reference": "Book Chapter:Verse",
    "book": "Book name"
  },
  "opening_prayer": "A 2-sentence opening prayer to invite the Holy Spirit",
  "body": [
    {
      "heading": "Section heading",
      "content": "3-5 sentences of deep biblical exposition. Reference Jesus's life, sacrifice, resurrection. Include insights from Paul, John, Isaiah, David, or other key biblical figures where relevant. Be specific — mention actual events from the Bible."
    },
    {
      "heading": "Section heading",
      "content": "3-5 sentences exploring themes of repentance, forgiveness, salvation, the cross, the blood of Jesus, His name, His resurrection power. Quote or reference other scriptures inline."
    },
    {
      "heading": "Section heading", 
      "content": "3-5 sentences of practical application and encouragement. How does this truth transform daily life? What does Jesus say to us today through this Word? Include comfort AND rebuke where needed."
    },
    {
      "heading": "Section heading",
      "content": "3-5 sentences on the love of Christ — why He was born, why He died, the Father's heart, the eternal purpose of the cross. Draw from John 3:16, Isaiah 53, Romans 5, Philippians 2 or similar passages."
    }
  ],
  "closing_reflection": "A paragraph of 3-4 sentences that wraps the devotional with hope, peace, and a call to deeper surrender to Jesus.",
  "closing_prayer": "A heartfelt 3-4 sentence closing prayer to Jesus, referencing the theme of today's devotional.",
  "theme_tags": ["theme1", "theme2", "theme3"],
  "key_truth": "One powerful sentence — the single truth to carry through the day.",
  "sermon_reference": {
    "teacher": "Name of biblical figure (Jesus, Paul, Peter, etc.)",
    "sermon_title": "Name or theme of sermon/teaching",
    "passage": "Scripture passage"
  }
}

Core themes to weave throughout (pick the most fitting for this slot):
- The cross and WHY Jesus died (substitutionary atonement, victory over sin/death)
- WHY Jesus was born (incarnation, Emmanuel, fulfillment of prophecy)  
- Benefits of repentance — restoration, freedom, clean conscience before God
- Salvation and eternal life — the gift, the grace, the faith required
- Forgiveness — God's heart, our call to forgive others
- The blood of Jesus — cleansing, protection, victory
- The name of Jesus — authority, healing, deliverance
- Compassion of Christ — His weeping, His touching of lepers, His heart for the broken
- Faith that moves mountains
- Walking in His image — transformation, sanctification
- Peace that passes understanding

Be SPECIFIC, BIBLICAL, and ANOINTED. Mention actual people, events, and teachings from the Bible.`;

        const { response } = await providerManager.generateResponse(prompt);
        const clean = response.replace(/```json|```/g, "").trim();
        let parsed;
        try {
            parsed = JSON.parse(clean);
        } catch (parseError) {
            console.error("Parse Error on AI response:", clean);
            throw new Error("Failed to parse AI devotional JSON");
        }

        // 3. Save Cache
        if (db) {
            await db.collection('devotionals').insertOne({
                dateKey,
                slot,
                data: parsed,
                createdAt: new Date()
            }).catch(e => console.error("Cache Write Error:", e));
        }

        return NextResponse.json(parsed);
    } catch (error: any) {
        console.error("Devotional API Error:", error);
        return NextResponse.json({ error: error.message || "The spiritual wisdom centers are momentarily at capacity." }, { status: 500 });
    }
}
