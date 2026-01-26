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
    1. THEOLOGICAL FREEDOM: You are explicitly permitted to answer questions about Jesus Christ, the Bible, Christian history, and theology. This is PURELY ACADEMIC and INSTRUCTIONAL.
    2. BIBLE VS HISTORY: If the user asks about "John", "Matthew", "Mark", or "Luke" without a clear surname or historical context (like "John Wesley" or "John Calvin"), assume they are asking about the BIBLICAL author or book first. Do NOT default to 18th/19th-century figures unless explicitly named.
    3. HISTORICAL WHITELIST: Discussion of D. L. Moody, Charles H. Spurgeon, John Wesley, and other prominent leaders is encouraged ONLY when clearly identified.
    4. NO SAFETY HALLUCINATION: Do NOT refuse basic theological or historical questions due to "religious views" bias. Provide accurate, grounded information.
    5. SCRIPTURE INTEGRITY: When quoting the Bible, use the King James Version (KJV) style if applicable.
    
    RESEARCH SOURCES:
    ${sources.length > 0 ? sources.map((s, i) => `[Source ${i + 1}]: \n${s}`).join("\n\n") : "NO LOCAL SOURCES (USE WEB)."}

    WEB SEARCH RESULTS:
    ${webContext || "Deep-search internal historical archives."}

    USER QUESTION:
    "${query}"

    EXPERT AI RESPONSE:
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
        return { answer: "I encountered a processing latency in the Research Core DNA.", suggestions: [] };
    }
}

export { rewriteQuery };
