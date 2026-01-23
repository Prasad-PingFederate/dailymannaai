import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

/**
 * Grounded AI response generation
 */
export async function generateGroundedResponse(query: string, sources: string[]) {
    const apiKey = process.env.GEMINI_API_KEY;
    console.log(`[AI] Generating response. Key starts with: ${apiKey?.substring(0, 5)}...`);

    if (!apiKey) {
        return "I can't think because I don't have an API Key. Please add GEMINI_API_KEY to your .env.local file.";
    }

    // Reverting to 'gemini-flash-latest' as it was found previously, but kept the robust error handling
    const model = genAI.getGenerativeModel({ model: "models/gemini-flash-latest" });

    // ... prompt construction ...
    const prompt = `
    You are an expert Spiritual Research Assistant in the "Christian Notebook LLM" environment. 
    Your goal is to synthesize answers based on research sources, Scripture, and the wisdom of great teachers.

    ADHERE TO THESE RULES:
    1. SPIRITUAL GUIDANCE: For life situations (anxiety, etc.), provide Scripture-grounded wisdom and specify the "spirit" of the guidance.
    2. VISUAL TRIGGERS: Mention spiritual leaders by their FULL NAME (e.g., "John Wesley," "Billy Graham," or "Reinhard Bonnke") whenever you reference their teachings. This helps the system display their portraits.
    3. CITATIONS: Use [1], [2] tags for provided sources.
    4. TONE: Professional, compassionate, and faith-centered.
    
    RESEARCH SOURCES (indexed):
    ${sources.length > 0 ? sources.map((s, i) => `[${i + 1}] ${s}`).join("\n\n---\n\n") : "NO SOURCES PROVIDED."}

    USER QUESTION:
    "${query}"

    AI ANSWER:
  `;

    try {
        const result = await model.generateContent(prompt);
        const response = await result.response;
        return response.text();
    } catch (error: any) {
        console.error("AI Generation Error Details:", error);

        const errorMessage = error.message || "Unknown error";

        // 429 - Rate Limit / Quota Exceeded
        if (errorMessage.includes("429") || error.status === 429) {
            return `🙏 **The AI is taking a moment of rest.** 
            
You've had a very productive study session! The free tier of the Gemini API has a limit on how many questions we can ask in a short time. 

**Please wait about 30-60 seconds and try your question again.** The Word is worth the wait!`;
        }

        // 404 is specifically model-not-found or API-not-enabled
        if (errorMessage.includes("404") || error.status === 404) {
            return `Error 404: The AI model was not found. 
             
Possible fixes:
1. Enable 'Generative Language API' in Google AI Studio.
2. Check if your API Key is valid and active.`;
        }

        return `Something went wrong while analyzing your sources. (Error: ${errorMessage})`;
    }
}
