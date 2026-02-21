import { AIProviderManager } from "./providers";
import { prisma } from "../db";
import { TrainingLogger } from "./training-logger";

let _providerManager: AIProviderManager | null = null;
export function getProviderManager() {
    if (!_providerManager) _providerManager = new AIProviderManager();
    return _providerManager;
}

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
 * 🧹 HISTORY TRUNCATOR: Strips long content from previous turns to prevent context pollution.
 * We only need the core intent/topic of previous messages, not the full text.
 */
function truncateHistory(history: any[]): any[] {
    return history.map(m => ({
        ...m,
        content: m.role === 'assistant'
            ? m.content.substring(0, 250) + (m.content.length > 250 ? "..." : "")
            : m.content
    }));
}

/**
 * 🧬 EXPERT DNA REWRITER: Fixes phonetic typos and resolves context.
 */
async function rewriteQuery(query: string, history: any[]): Promise<string> {
    // Truncate and limit history to avoid "Context Contamination"
    const recentHistory = truncateHistory(history.slice(-6));

    const rewritePrompt = `
    Identity: High-Precision Query Engine.
    Mission: Resolve pronouns and CORRECT phonetic misspellings.
    
    CRITICAL RULE: If the NEW USER INPUT is a completely new topic or subject (e.g., "Pilgrim's Progress") compared to the CONVERSATION HISTORY (e.g., "Sermon on the Mount"), ignore the history and treat the input as a fresh standalone query.
    
    CONVERSATION HISTORY:
    ${recentHistory.map(m => `${m.role.toUpperCase()}: ${m.content}`).join("\n")}
    
    NEW USER INPUT: "${query}"
    
    TASK: Rewrite the NEW USER INPUT into a standalone search query. 
    
    ⚠️ CRITICAL TOPIC DRIFT GUARD: If the NEW USER INPUT is about a new person, location, or concept and the history is about something else, DO NOT include history keywords in your standalone query. Keep it PURE to the new input.
    
    STANDALONE QUERY:
    `;

    try {
        const { response } = await getProviderManager().generateResponse(rewritePrompt);
        return response.trim().replace(/^"|"$/g, '');
    } catch (e) {
        return query;
    }
}

export async function generateGroundedResponse(query: string, sources: string[], webContext: string = "", history: any[] = [], standaloneFocusedQuery?: string, truthSummary?: string) {
    // Truncate and limit history
    const recentHistory = truncateHistory(history.slice(-5));

    const prompt = `
    EXPERT AI RESPONSE PROTOCOL (Deep Synthesis Engine):
    
    STEP 1: REASONING HUB (Internal Thought Process)
    - Before answering, analyze the RESEARCH SOURCES and WEB RESULTS. 
    - Identify if the question is BIBLICAL, HISTORICAL, or PERSONAL.
    - If there is a conflict between WEB results and BIBLE sources, the BIBLE (KJV) is the Absolute Truth.
    - 🛡️ TRUTH FILTER STATUS: ${truthSummary || "Not audited."}
    
    STEP 2: THE CHAIN OF TRUTH (Grounding Rules)
    - 🛡️ BIBLE FIRST: If a verse from 'KJV Bible' is in the sources, quote it exactly. Do not summarize it.
    - 🛡️ ENTITY VERIFICATION: Distinguish between biblical figures (e.g. Joshua) and historical figures (e.g. Joshua Daniel). 
    - 🛡️ CITATION: Explicitly mention where each piece of information came from [Source X] or [Web].
    
    STEP 3: SYNTHESIS & VOICE
    - Write as a "Born-Again Scholar": Authoritative, precise, and encouraging.
    - Avoid "I think" or "Maybe". Use "The Scriptures record..." or "Historical records indicate...".
    - If the user asks for a specific verse (e.g. Genesis 1:1), and it is provided in the sources, quote it EXACTLY.

    STEP 4: FORMATTING PROTOCOL (Visual Clarity & Zero-Clutter)
    - **NO STARS IN HEADERS**: Never put bolding (\*\*) inside or around a header (###). Headers should be clean text.
    - **HEADER DEPTH**: Use \`###\` for main sections. Avoid \`####\` or deeper level hashes.
    - **DRASTICALLY REDUCE BOLDING**: Do not bold every other phrase. Limit bolding (\*\*) to a MAXIMUM of 2 key names or critical scriptural concepts per paragraph.
    - **NO NESTED SYMBOLS**: Never combine headers and bolding (e.g., \`### **Title**\` is FORBIDDEN).
    - **CLEAN PARAGRAPHS**: Let the text breathe. Use italics (*) only for Bible references or very subtle emphasis.
    - **PRACTICAL APPLICATION**: Use \`### Practical Application\` as the section title, then clean text below.

    RESEARCH SOURCES (VERIFIED KNOWLEDGE):
    ${sources.length > 0 ? sources.map((s, i) => `[Expert Source ${i + 1}]: \n${s}`).join("\n\n") : "NO LOCAL SOURCES (USE WEB)."}

    WEB SEARCH RESULTS (REAL-TIME CONTEXT):
    ${webContext || "Deep-search internal historical archives."}

    CONVERSATION HISTORY (FOR TOPIC RESOLUTION):
    ${recentHistory.map(m => `${m.role.toUpperCase()}: ${m.content}`).join("\n")}

    USER QUESTION (ACTIVE INTENT):
    "${query}"
    ${standaloneFocusedQuery ? `(RESOLVED FOR DEEP ANALYSIS: ${standaloneFocusedQuery})` : ""}

    RESPONSE FORMAT:
    [Answer text with Scripture citations]
    ---SUGGESTIONS---
    [3 brief follow-up questions]
    [METADATA:SUBJECT=Subject Name]

    ### RESPONSE START ###
    `;

    try {
        let attempt = 1;
        let finalResponse = "";
        let finalProvider = "";

        while (attempt <= 2) {
            const { response, provider } = await getProviderManager().generateResponse(prompt);

            const isRefusal = REFUSAL_TOKENS.some(token => response.toLowerCase().includes(token.toLowerCase()));

            if (!isRefusal) {
                finalResponse = response;
                finalProvider = provider;
                break;
            }

            console.log(`[AI - DNA] Detected Safety / Bias Refusal from ${provider}. Attempting override...`);
            attempt++;
        }

        if (!finalResponse) {
            finalResponse = "The Research Core is currently re-calibrating. Please try again.";
        }

        console.log(`[AI - DNA] Synthesis complete via: ${finalProvider} `);

        // Clean prompt leakage (strip everything before the delimiter)
        if (finalResponse.includes("### RESPONSE START ###")) {
            finalResponse = finalResponse.split("### RESPONSE START ###").pop()?.trim() || finalResponse;
        } else if (finalResponse.includes("EXPERT AI RESPONSE:")) {
            finalResponse = finalResponse.split("EXPERT AI RESPONSE:").pop()?.trim() || finalResponse;
        }

        // Extract metadata before splitting by suggestions
        let suggestedSubject = "";
        const metadataMatch = finalResponse.match(/\[METADATA:SUBJECT=(.+?)\]/);
        if (metadataMatch) {
            suggestedSubject = metadataMatch[1].trim();
            finalResponse = finalResponse.replace(metadataMatch[0], "").trim();
        }

        const parts = finalResponse.split("---SUGGESTIONS---");
        let answer = parts[0].trim();

        // 🧪 ANTI-REPETITION POLISH: Detect and strip runaway headers
        const answerLines = answer.split('\n');
        if (answerLines.length > 10) {
            const firstHeader = answerLines.find(l => l.startsWith('###'));
            if (firstHeader) {
                // If the same header repeats many times, take only the section up to the first repeat
                const firstOccurence = answer.indexOf(firstHeader);
                const secondOccurence = answer.indexOf(firstHeader, firstOccurence + firstHeader.length);
                if (secondOccurence > -1) {
                    console.warn("[AI-DNA] Repetitive loop detected in answer. Truncating...");
                    answer = answer.substring(0, secondOccurence).trim();
                }
            }
        }

        const suggestions = parts[1]
            ? parts[1].split("\n").map(s => s.trim().replace(/^\d+\.\s*|-\s*|\?\s*$/, "") + "?").filter(s => s.length > 5).slice(0, 3)
            : ["Tell me more about this.", "How does this apply to me?", "What does the Bible say?"];

        // If no metadata found, fallback to original heuristic
        if (!suggestedSubject) {
            const lines = answer.split('\n');
            const headerMatch = answer.match(/^#+\s*(.+)$/m);
            if (headerMatch) {
                suggestedSubject = headerMatch[1].trim();
            } else {
                for (let i = 0; i < Math.min(lines.length, 3); i++) {
                    const line = lines[i].trim();
                    const match = line.match(/\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)\b/);
                    if (match) {
                        suggestedSubject = match[1];
                        break;
                    }
                }
            }
        }

        if (suggestedSubject) {
            suggestedSubject = suggestedSubject.replace(/'s$/i, '').trim();
        }

        // 📊 Log enriched interaction to DB (Supabase - User Data)
        if (prisma) {
            prisma.interaction.create({
                data: {
                    query: query.substring(0, 1000),
                    answer: answer.substring(0, 5000),
                    provider: finalProvider || "Unknown",
                    subject: suggestedSubject || "General",
                    latency: 0
                }
            }).catch(e => console.error("[DB] Logging failed:", e.message));
        }

        // 🧠 Log high-fidelity RESEARCH DATA to MongoDB (AI Training)
        TrainingLogger.log({
            timestamp: new Date().toISOString(),
            request: {
                query: query,
                provider: "Brain-Synthesizer",
                model: finalProvider,
                systemPrompt: "SPIRITUAL RESEARCH DISCIPLE",
                historyContextCount: recentHistory.length
            },
            response: {
                answer: answer,
                latency: 0,
                modelUsed: finalProvider
            },
            metadata: {
                sources_count: sources.length,
                has_web_context: !!webContext,
                subject: suggestedSubject
            }
        }).catch(e => console.error("[MongoDB] Research logging failed:", e.message));

        return { answer, suggestions, suggestedSubject };
    } catch (error: any) {
        console.error('[AI-DNA] Core synthesis error:', error.message);

        return {
            answer: "I encountered an issue processing your request. Please try again.",
            suggestions: ["Try asking: Who is Jesus?", "Try asking: John 3:16"],
            suggestedSubject: ""
        };
    }
}

export { rewriteQuery };
