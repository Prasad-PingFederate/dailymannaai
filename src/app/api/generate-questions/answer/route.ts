import { NextRequest, NextResponse } from "next/server";
import { getProviderManager } from "@/lib/ai/gemini";
import { getQuestionBySlug, updateQuestion } from "@/lib/questions-service";

export async function POST(req: NextRequest) {
    try {
        const { slug } = await req.json();
        if (!slug) return NextResponse.json({ error: "slug required" }, { status: 400 });

        const q = await getQuestionBySlug(slug);
        if (!q) return NextResponse.json({ error: "Question not found" }, { status: 404 });

        const prompt = `You are a Spirit-filled Christian theologian writing a comprehensive, SEO-optimized blog post.

QUESTION: "${q.question}"
CATEGORY: ${q.category}
KEYWORDS: ${q.keywords.join(", ")}

Write a rich, authoritative, full blog-post answer. Structure it as follows:

**[Engaging Title that includes the main question keyword]**

[Opening paragraph: Hook the reader, state the importance of this question from a Christian perspective. 3-4 sentences.]

**What the Bible Says About This**

[2-3 paragraphs quoting and expounding KJV Bible verses that directly address this question. Include at least 3 scripture references with book, chapter, and verse numbers.]

**The Christian Perspective**

[1-2 paragraphs explaining the broader theological context, church history, or how different Christian traditions view this.]

**Practical Application for Your Daily Life**

[1-2 paragraphs of specific, actionable spiritual guidance.]

**Common Questions Related to This Topic**

[3 bullet points with related questions naturally using the keywords.]

**Closing Prayer**

[A short 3-4 sentence prayer related to the topic.]

---VERSE_REFS---
[List exactly the Bible references used, one per line, format: Book Chapter:Verse]

Rules:
- Write in a warm, authoritative "Born-Again Scholar" voice
- Every claim must be backed by Scripture
- Include at least 4 different Bible verses (KJV)
- Total length: 600-900 words
- No emojis, no hashtags
- Use **bold** for headers and key terms
- This should rank on Google for the question: "${q.question}"`;

        const { response } = await getProviderManager().generateResponse(prompt);

        // Extract verse refs
        const parts = response.split("---VERSE_REFS---");
        const answer = parts[0].trim();
        const verseRefs = parts[1]
            ? parts[1]
                  .trim()
                  .split("\n")
                  .map((r: string) => r.trim())
                  .filter((r: string) => r.length > 2)
            : [];

        await updateQuestion(slug, { answer, verseRefs });

        return NextResponse.json({ success: true, slug, answer, verseRefs });
    } catch (error: any) {
        console.error("[generate-answer] Error:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
