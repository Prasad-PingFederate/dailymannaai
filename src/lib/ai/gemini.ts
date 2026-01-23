import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

/**
 * Grounded AI response generation
 */
export async function generateGroundedResponse(query: string, sources: string[]) {
    console.log(`[AI] Generating response with model: gemini-1.5-flash. Key starts with: ${process.env.GEMINI_API_KEY?.substring(0, 5)}...`);
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
    } catch (error: any) {
        console.error("AI Generation Error:", error);

        // If 404 (Model Not Found), try the legacy model as a fallback
        if (error.status === 404 || error.message?.includes("404")) {
            console.log("[AI] Primary model failed with 404, falling back to gemini-pro...");
            try {
                const fallbackModel = genAI.getGenerativeModel({ model: "gemini-pro" });
                const result = await fallbackModel.generateContent(prompt);
                const response = await result.response;
                return response.text();
            } catch (fallbackError) {
                console.error("Fallback Model Error:", fallbackError);
            }
        }

        return `Something went wrong while analyzing your sources. (Error: ${error.status || 'Unknown'})`;
    }
}
