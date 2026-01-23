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

    // Using the 'models/' prefix and 'latest' alias to ensure availability
    const model = genAI.getGenerativeModel({ model: "models/gemini-flash-latest" });

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

        // 404 is specifically model-not-found or API-not-enabled
        if (errorMessage.includes("404") || error.status === 404) {
            return `Error 404: The AI model was not found. 
             
Possible fixes:
1. Enable 'Generative Language API' in Google Cloud.
2. Ensure your API Key is from a project where this API is enabled.
3. Check if Gemini 1.5 Flash is available in your region.`;
        }

        return `Something went wrong while analyzing your sources. (Error: ${errorMessage})`;
    }
}
