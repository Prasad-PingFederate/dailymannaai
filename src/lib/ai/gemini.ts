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
    Your goal is to synthesize answers based on:
    1. The research sources provided below (Sermons, PDFs, etc.).
    2. The Holy Scriptures (Bible).
    3. The theological wisdom of John Wesley, Billy Graham, and Reinhard Bonnke.

    ADHERE TO THESE RULES:
    1. SPIRITUAL GUIDANCE: When a user shares a situation (e.g., anxiety, doubt, decision making), provide comforting, Scripture-grounded wisdom.
    2. GROUNDING: Prioritize the provided research sources. If the information isn't there, specify that you are drawing from general Scripture or the wisdom of historically great teachers.
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
