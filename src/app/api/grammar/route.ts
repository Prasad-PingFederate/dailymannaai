import { NextResponse } from "next/server";
import { AIProviderManager } from "@/lib/ai/providers";

const providerManager = new AIProviderManager();

export async function POST(req: Request) {
    try {
        const { text } = await req.json();

        if (!text || text.trim().length === 0) {
            return NextResponse.json({ error: "No text provided to check" }, { status: 400 });
        }

        const prompt = `
        You are an expert Grammar and Theological Editor for a Christian Research app.
        Analyze the following text for grammar, punctuation, and clarity errors. 
        
        TEXT TO ANALYZE:
        "${text}"

        REQUEST:
        1. Identify specific mistakes.
        2. Provide corrections.
        3. CHOOSE ONE MISTAKE and explain it DEEPLY (the rule behind it, why it matters in spiritual writing, etc.) as requested by the user.
        
        FORMAT YOUR RESPONSE AS JSON ONLY:
        {
            "hasMistakes": boolean,
            "suggestions": [
                { "original": "string", "corrected": "string", "reason": "string" }
            ],
            "deepDive": {
                "mistake": "string",
                "explanation": "string",
                "rule": "string"
            },
            "overallQuality": "1-10 string"
        }

        JSON:
        `;

        const { response } = await providerManager.generateResponse(prompt);

        // Robust JSON extraction
        let jsonStr = response;
        const jsonMatch = response.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            jsonStr = jsonMatch[0];
        } else {
            jsonStr = response.replace(/```json|```/g, "").trim();
        }

        try {
            const analysis = JSON.parse(jsonStr);
            return NextResponse.json(analysis);
        } catch (e) {
            console.error("JSON Parse Error:", e, "Raw:", response);
            return NextResponse.json({
                hasMistakes: true,
                suggestions: [{ original: "N/A", corrected: "N/A", reason: "The AI had trouble formatting the feedback. Please try again." }],
                deepDive: { mistake: "Formatting Error", explanation: "The AI response was not in a readable format.", rule: "Clarity" },
                overallQuality: "7"
            });
        }
    } catch (error: any) {
        console.error("Grammar Check Error:", error);
        return NextResponse.json({
            error: "Failed to perform deep grammar analysis. Please check your text and try again.",
            details: error.message
        }, { status: 500 });
    }
}
