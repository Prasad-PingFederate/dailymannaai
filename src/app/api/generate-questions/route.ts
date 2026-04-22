import { NextRequest, NextResponse } from "next/server";
import { getProviderManager } from "@/lib/ai/gemini";
import { 
    getQuestions, 
    createQuestion, 
    deleteAllQuestions, 
    syncLegacyData,
    getQuestionBySlug
} from "@/lib/questions-service";

export interface SpiritualQuestion {
    slug: string;
    question: string;
    category: string;
    keywords: string[];
    searchVolume: string;
    createdAt: string;
    metaDescription: string;
    answer?: string;
    shortAnswer?: string;
    keyVerse?: string;
    verseRefs?: string[];
}

function slugify(text: string) {
    return text
        .toLowerCase()
        .replace(/['''"""]/g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .substring(0, 80);
}

// ── GET  — return existing questions from Cosmos DB ───────────────────────────
export async function GET(req: NextRequest) {
    await syncLegacyData();
    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category") || undefined;

    const questions = await getQuestions(category);

    return NextResponse.json({ 
        questions, 
        total: questions.length 
    });
}

// ── POST — generate new questions via AI ──────────────────────────────────────
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const count = Math.min(Number(body.count) || 20, 50);
        const category: string = body.category || "all";

        const categoryInstructions: Record<string, string> = {
            salvation: "salvation, being born again, faith, grace, repentance, eternal life",
            prayer: "prayer, intercession, fasting, how to pray, answered prayer, the Lord's Prayer",
            healing: "divine healing, physical healing, emotional healing, miraculous healing in the Bible",
            faith: "faith, doubt, trust in God, walking by faith, mustard seed faith",
            prophecy: "biblical prophecy, end times, rapture, second coming, book of Revelation",
            relationships: "marriage, forgiveness, love, friendship, family, conflict resolution from the Bible",
            suffering: "suffering, trials, why bad things happen, Job, perseverance, hope in pain",
            "holy-spirit": "Holy Spirit, spiritual gifts, baptism in the Spirit, speaking in tongues, fruits of the Spirit",
            church: "church, worship, communion, baptism, tithing, Sunday attendance",
            bible: "Bible study, interpreting Scripture, Bible contradictions, inspired Word of God",
            all: "salvation, prayer, healing, faith, prophecy, relationships, suffering, Holy Spirit, church, Bible",
        };

        const topics = categoryInstructions[category] || categoryInstructions["all"];

        const prompt = `You are a Christian content strategist expert in SEO and biblical theology.

Generate exactly ${count} high-search-volume questions that real Christians or seekers ask about: ${topics}.

These are questions that millions of people Google every month. Make them specific, genuine, and varied.
Include beginner questions, intermediate theological questions, and personal spiritual questions.

Return ONLY valid JSON (no markdown, no code blocks) in this exact format:
[
  {
    "question": "What does the Bible say about anxiety?",
    "category": "faith",
    "keywords": ["anxiety", "bible", "worry", "peace", "God"],
    "searchVolume": "high",
    "metaDescription": "Discover what the Bible says about anxiety and how Scripture provides peace. Explore key verses and practical Christian guidance."
  }
]

Rules:
- Each question must be genuinely what a person would type into Google
- Categories must be one of: salvation, prayer, healing, faith, prophecy, relationships, suffering, holy-spirit, church, bible
- searchVolume must be "high" or "medium"
- metaDescription must be 120-160 characters, compelling, naturally include the question keywords
- No duplicate questions
- Generate exactly ${count} questions`;

        const { response } = await getProviderManager().generateResponse(prompt);

        // Parse the JSON response
        let cleanJson = response.replace(/```json|```/g, "").trim();

        // Find the JSON array
        const jsonStart = cleanJson.indexOf("[");
        const jsonEnd = cleanJson.lastIndexOf("]");
        if (jsonStart === -1 || jsonEnd === -1) {
            throw new Error("AI did not return a valid JSON array");
        }
        cleanJson = cleanJson.substring(jsonStart, jsonEnd + 1);

        const rawQuestions: any[] = JSON.parse(cleanJson);

        const newQuestions = [];
        for (const q of rawQuestions) {
            const slug = slugify(q.question);
            
            const existing = await getQuestionBySlug(slug);
            if (existing) continue;

            const newQ: SpiritualQuestion = {
                slug,
                question: q.question,
                category: q.category,
                keywords: q.keywords,
                searchVolume: q.searchVolume,
                metaDescription: q.metaDescription,
                createdAt: new Date().toISOString(),
            };
            
            await createQuestion(newQ);
            newQuestions.push(newQ);
        }

        const questionsAcrossAll = await getQuestions();

        return NextResponse.json({
            success: true,
            generated: newQuestions.length,
            total: questionsAcrossAll.length,
            questions: newQuestions,
        });
    } catch (error: any) {
        console.error("[generate-questions] Error:", error);
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        );
    }
}

// ── DELETE — clear all questions ───────────────────────────────────────────────
export async function DELETE() {
    await deleteAllQuestions();
    return NextResponse.json({ success: true, message: "All questions cleared from Cosmos DB" });
}
