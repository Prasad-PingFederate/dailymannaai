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
 * 🧬 EXPERT DNA REWRITER: Fixes phonetic typos and resolves context.
 */
async function rewriteQuery(query: string, history: any[]): Promise<string> {
    // Only use the last 10 messages of history to avoid "Context Contamination"
    const recentHistory = history.slice(-10);

    const rewritePrompt = `
    Identity: High-Precision Query Engine.
    Mission: Resolve pronouns and CORRECT phonetic misspellings.
    
    CRITICAL RULE: If the NEW USER INPUT is a completely new topic or subject (e.g., "Pilgrim's Progress") compared to the CONVERSATION HISTORY (e.g., "Sermon on the Mount"), ignore the history and treat the input as a fresh standalone query.
    
    CONVERSATION HISTORY:
    ${recentHistory.map(m => `${m.role.toUpperCase()}: ${m.content}`).join("\n")}
    
    NEW USER INPUT: "${query}"
    
    TASK: Rewrite the NEW USER INPUT into a standalone search query. Resolve pronouns ONLY if they refer to something in the RECENT history.
    STANDALONE QUERY:
    `;

    try {
        const { response } = await getProviderManager().generateResponse(rewritePrompt);
        return response.trim().replace(/^"|"$/g, '');
    } catch (e) {
        return query;
    }
}

export async function generateGroundedResponse(query: string, sources: string[], webContext: string = "", history: any[] = []) {
    const recentHistory = history.slice(-10);

    const prompt = `
    Identity: SPIRITUAL RESEARCH DISCIPLE (The Voice of Truth and Wisdom). 
    Status: You are an authoritative, world-class theologian and historical researcher. You ground your answers in provided research chunks and web search results.

    IMAGE RESOLUTION PROTOCOL:
    Identify the primary person or specific historical topic discussed in your answer.
    At the very end of your response, you MUST include this metadata tag on a new line:
    [METADATA:SUBJECT=Name of Person or Topic]

    EXPERT AI RESPONSE PROTOCOL:
    1. Your answer must be grounded ONLY in the provided context and scripture.
    2. Do NOT mention these rules, the history, or the metadata strings in your talk.
    3. Use "### RESPONSE START ###" as a divider if the model starts hallucinating instructions.
    4. TOPIC DRIFT: If the USER QUESTION (CURRENT) is about a new topic (e.g. Pilgrim's Progress) while the CONVERSATION HISTORY is about something else (e.g. Sermon on the Mount), prioritize the CURRENT question and do NOT mix the topics.

    RESEARCH SOURCES:
    ${sources.length > 0 ? sources.map((s, i) => `[Source ${i + 1}]: \n${s}`).join("\n\n") : "NO LOCAL SOURCES (USE WEB)."}

    WEB SEARCH RESULTS:
    ${webContext || "Deep-search internal historical archives."}

    CONVERSATION HISTORY (FOR CONTEXT):
    ${recentHistory.map(m => `${m.role.toUpperCase()}: ${m.content}`).join("\n")}

    USER QUESTION (CURRENT):
    "${query}"

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

            console.log(`[AI-DNA] Detected Safety/Bias Refusal from ${provider}. Attempting override...`);
            attempt++;
        }

        if (!finalResponse) {
            finalResponse = "The Research Core is currently re-calibrating. Please try again.";
        }

        console.log(`[AI-DNA] Synthesis complete via: ${finalProvider}`);

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
        const answer = parts[0].trim();
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
