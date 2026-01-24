import { AIProviderManager } from "./providers";

const providerManager = new AIProviderManager();

/**
 * Grounded AI response generation with multi-provider fallback
 */
export async function generateGroundedResponse(query: string, sources: string[]) {
    console.log(`[AI] Active providers: ${providerManager.getActiveProviders().join(", ")}`);

    if (providerManager.getActiveProviders().length === 0) {
        return `I can't think because no AI providers are configured. 
        
Please add at least one API key to your .env.local file:
- GEMINI_API_KEY (Google Gemini)
- GROQ_API_KEY (Groq - recommended for speed)
- HUGGINGFACE_API_KEY (Hugging Face)
- TOGETHER_API_KEY (Together AI)`;
    }

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
        const { response, provider } = await providerManager.generateResponse(prompt);
        console.log(`[AI] Response generated successfully using: ${provider}`);
        return response;
    } catch (error: any) {
        console.error("AI Generation Error:", error);
        return error.message || "Failed to generate response from all available AI providers.";
    }
}
