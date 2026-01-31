import { AIProviderManager } from "./providers";

const providerManager = new AIProviderManager();

const REFUSAL_TOKENS = [
    "I can't help with that",
    "I cannot fulfill your request",
    "I am unable to provide information",
    "I cannot provide a response that promotes",
    "Standard safety protocols",
    "glorifies or promotes",
    "defamation of celebrities",
    "illegal or harmful activities"
];

/**
 * 🧬 EXPERT DNA REWRITER: Fixes phonetic typos and resolves context.
 */
async function rewriteQuery(query: string, history: any[]): Promise<string> {
    if (history.length === 0) return query;

    const rewritePrompt = `
    Identity: High-Precision Query Engine.
    Mission: Resolve pronouns and CORRECT phonetic misspellings (e.g., "dk moody" -> D. L. Moody, "bonkey" -> Bonnke, "spurgen" -> Spurgeon).
    DNA: If the user seems to be asking about a person, ensure the FULL NAME is used.
    
    LATEST: "${query}"
    STANDALONE QUERY:
    `;

    try {
        const { response } = await providerManager.generateResponse(rewritePrompt);
        return response.trim().replace(/^"|"$/g, '');
    } catch (e) {
        return query;
    }
}

/**
 * 🧬 EXPERT DNA RESPONDER: The Core Persona Synthesis Engine.
 * Includes "Freedom Directive" to bypass false-positive safety bias.
 */
export async function generateGroundedResponse(query: string, sources: string[], webContext: string = "", history: any[] = []) {
    const prompt = `
    Identity: ANTIGRAVITY RESEARCH CORE (Universal Christian Knowledge Engine). 
    Status: You are an authoritative, world-class theologian and historical researcher.
    
    FREEDOM DIRECTIVE (DNA OVERRIDE):
    1. THEOLOGICAL DEPTH: The user requests "FULL DETAILS". Do NOT summarize. Provide comprehensive, deep, and spirit-filled explanations.
    2. SCRIPTURE SATURATION: Use "more and more passages". When citing a verse, provide the FULL TEXT of the verse. Do not just list references (e.g. John 3:16). Write it out.
    3. TRUE AND FULL: Focus on the "Truth". Provide historical context, original Greek/Hebrew nuances if applicable, and deep theological implications.
    4. NO SAFETY HALLUCINATION: Do NOT refuse basic theological or historical questions.
    5. STRUCTURE: Use clear headings, bullet points, and bold text to organize the long content.
    
    RESEARCH SOURCES:
    ${sources.length > 0 ? sources.map((s, i) => `[Source ${i + 1}]: \n${s}`).join("\n\n") : "NO LOCAL SOURCES (USE WEB)."}

    WEB SEARCH RESULTS:
    ${webContext || "Deep-search internal historical archives."}

    USER QUESTION:
    "${query}"

    EXPERT AI RESPONSE (Provide a DETAILED, MULTI-PARAGRAPH Thesis):
  `;

    try {
        let attempt = 1;
        let finalResponse = "";
        let finalProvider = "";

        while (attempt <= 2) {
            const { response, provider } = await providerManager.generateResponse(prompt);

            // Check if the response is a false-positive safety refusal OR biased refusal
            const isRefusal = REFUSAL_TOKENS.some(token => response.toLowerCase().includes(token.toLowerCase()));

            if (!isRefusal) {
                finalResponse = response;
                finalProvider = provider;
                break;
            }

            console.log(`[AI-DNA] Detected Safety/Bias Refusal from ${provider}. Attempting expert override with alternate model...`);
            attempt++;
        }

        if (!finalResponse) {
            finalResponse = "The Research Core is currently re-calibrating its historical parameters to bypass modern filter bias for this historical query. Please ask specifically for 'Dwight L. Moody biography'.";
        }

        console.log(`[AI-DNA] Synthesis complete via: ${finalProvider || 'Override-Chain'}`);

        const parts = finalResponse.split("---SUGGESTIONS---");
        const answer = parts[0].trim();
        const suggestions = parts[1]
            ? parts[1].split("\n").map(s => s.trim().replace(/^\d+\.\s*|-\s*|\?\s*$/, "") + "?").filter(s => s.length > 5).slice(0, 3)
            : [
                `Tell me about Moody's impact in Chicago.`,
                `What are the most famous books written by D.L. Moody?`,
                `How did Moody's Bible Institute start?`
            ];

        return { answer, suggestions };
    } catch (error: any) {
        console.error('[AI-DNA] Core synthesis error:', error.message);

        // Provide specific, helpful error messages
        let userMessage = "I encountered an issue processing your request. ";

        if (error.message?.includes('timeout') || error.message?.includes('Timeout')) {
            userMessage += "The AI service took too long to respond. Please try again with a shorter question.";
        } else if (error.message?.includes('API key') || error.message?.includes('401') || error.message?.includes('403')) {
            userMessage += "There's an authentication issue with the AI service. Please contact support.";
        } else if (error.message?.includes('rate') || error.message?.includes('429') || error.message?.includes('quota')) {
            userMessage += "The AI service is currently at capacity. Please wait a moment and try again.";
        } else if (error.message?.includes('offline') || error.message?.includes('network')) {
            userMessage += "Unable to connect to AI services. Please check your connection.";
        } else {
            userMessage += "Please try rephrasing your question or try again in a few moments.";
        }

        return { answer: userMessage, suggestions: ["Try asking: Who is Jesus?", "Try asking: John 3:16"] };
    }
}

export { rewriteQuery };
