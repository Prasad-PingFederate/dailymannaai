import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

/**
 * Grounded AI response generation
 * This is the "Librarian" part of the project that ensures the AI 
 * only uses the provided sources.
 */
export async function generateGroundedResponse(query: string, sources: string[]) {
    const context = sources.join("\n\n---\n\n");

    const prompt = `
    You are an expert AI Research Assistant.
    Answer the following user question ONLY using the provided research sources below.
    If the answer is not in the sources, say "I don't have enough information in your current sources."
    
    IMPORTANT: You must include citations in the format [1], [2], etc., immediately after the sentence they support.
    Wait, do not use the source name in the bracket, use the INDEX of the source in the list provided.

    RESEARCH SOURCES (indexed):
    ${sources.map((s, i) => `[${i + 1}] ${s}`).join("\n\n---\n\n")}

    USER QUESTION:
    ${query}

    AI ANSWER:
  `;

    try {
        const result = await model.generateContent(prompt);
        const response = await result.response;
        return response.text();
    } catch (error) {
        console.error("AI Generation Error:", error);
        return "Something went wrong while analyzing your sources.";
    }
}
