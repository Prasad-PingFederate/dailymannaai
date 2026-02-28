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
 * 🧬 ORCHESTRATOR: Resolves intent and rewrites query in a SINGLE AI call to save quota.
 */
export async function analyzeResearchIntent(query: string, history: any[]): Promise<{ standaloneQuery: string; type: string; primaryKeywords: string[] }> {
    const recentHistory = truncateHistory(history.slice(-6));

    const orchestratorPrompt = `
    Identity: High-Precision Spiritual Research Orchestrator.
    Task: Analyze user intent and provide a standalone search query.
    
    1. INTENT TYPE: Choose ONE: "VERSE_LOOKUP", "TOPICAL_SEARCH", "HISTORICAL_QUERY", "PERSONAL_GUIDANCE", "GREETING".
    2. REWRITE: Resolve pronouns and CORRECT phonetic misspellings (e.g., "stan" -> "Satan"). 
    3. STANDALONE: If the input is a new topic, ignore history.
    
    CONVERSATION HISTORY:
    ${recentHistory.map(m => `${m.role.toUpperCase()}: ${m.content}`).join("\n")}
    
    NEW USER INPUT: "${query}"
    
    RESPONSE FORMAT (JSON ONLY):
    {
        "type": "INTENT_TYPE",
        "standaloneQuery": "Cleaned version for search",
        "primaryKeywords": ["word1", "word2"]
    }
    `;

    try {
        const { response } = await getProviderManager().generateResponse(orchestratorPrompt);
        const cleanJson = response.replace(/```json|```/g, "").trim();
        const parsed = JSON.parse(cleanJson);
        return {
            type: parsed.type || "TOPICAL_SEARCH",
            standaloneQuery: parsed.standaloneQuery || query,
            primaryKeywords: parsed.primaryKeywords || []
        };
    } catch (e) {
        console.error("[Orchestrator] Error:", e);
        return { type: "TOPICAL_SEARCH", standaloneQuery: query, primaryKeywords: [] };
    }
}

/**
 * 🧬 EXPERT DNA REWRITER: Fixes phonetic typos and resolves context.
 * (Backward compatibility layer)
 */
async function rewriteQuery(query: string, history: any[]): Promise<string> {
    const res = await analyzeResearchIntent(query, history);
    return res.standaloneQuery;
}

export async function generateGroundedResponse(query: string, sources: string[], webContext: string = "", history: any[] = [], standaloneFocusedQuery?: string, truthSummary?: string) {
    // Truncate and limit history
    const recentHistory = truncateHistory(history.slice(-5));

    const prompt = `
    EXPERT AI RESPONSE PROTOCOL (Deep Synthesis Engine):
    
    STEP 1: REASONING HUB (Internal Thought Process)
    - Before answering, briefly analyze the RESEARCH SOURCES and WEB RESULTS. 
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

    STEP 4: INTERNAL REASONING (The "Thinking" Process)
    - YOU MUST START YOUR RESPONSE WITH YOUR INTERNAL REASONING WRAPPED IN \`<THOUGHT>\` tags.
    - Inside \`<THOUGHT>\`, keep it CONCISE: 2-3 short sentences identifying the intent, key sources, and your plan.
    - Do NOT write long paragraphs inside <THOUGHT>. Save all depth and detail for the ACTUAL VISIBLE RESPONSE.
    - The thinking block should be a brief roadmap, not the main content.

    STEP 5: DEPTH & RICHNESS PROTOCOL (Thorough Exposition)
    - **VISIBLE ANSWER**: Aim for 3-4 substantial, well-developed paragraphs. Be thorough but avoid unnecessary repetition.
    - **DOCTRINE AUDIT**: If any search results contradict the Deity of Christ or KJV Scriptures, prioritize the BIBLE as the absolute truth and note the discrepancy if relevant.
    - **CLEAN PROSE**: Write in a scholarly, encouraging flow. Use **bold** for section titles and key terms.
    - **NO SYMBOLS**: Do not use "✅", "🚀", or emojis.

    FEW-SHOT STYLE EXAMPLE (DESIRED OUTPUT — NOTE THE LENGTH AND DEPTH):
    **The Nature of Faith in Scripture**

    Faith is described in the Epistle to the Hebrews as "the substance of things hoped for, the evidence of things not seen" (Hebrews 11:1). This is not merely an abstract theological concept but the very foundation upon which the entire Christian walk is built. The original Greek word "pistis" carries the meaning of trust, confidence, and firm persuasion — it is an active, living force that moves the believer from doubt into the assurance of God's promises. Without faith, the Scriptures declare, it is impossible to please God (Hebrews 11:6), which tells us that faith is not optional but essential to our relationship with the Almighty.

    When we examine the lives of the great men and women of God throughout Scripture, we see that faith was never a passive feeling but a persistent, courageous action. Abraham, whom the Apostle Paul calls "the father of all them that believe" (Romans 4:11), left his homeland of Ur of the Chaldees without knowing where God was leading him, trusting solely in the promise that God would make of him a great nation (Genesis 12:1-3). Moses, raised in the palace of Pharaoh with every earthly privilege, chose by faith to suffer affliction with the people of God rather than to enjoy the pleasures of sin for a season (Hebrews 11:24-25). These were not men of extraordinary natural ability — they were ordinary people who served an extraordinary God and took Him at His Word.

    The catalogue of faith found in Hebrews chapter 11 provides a sweeping panorama of what trusting God looks like across different circumstances and centuries. From Abel's acceptable sacrifice to Noah's obedient construction of the ark, from Rahab's courageous protection of the spies to David's triumph over Goliath, each account demonstrates that faith expresses itself through obedience, sacrifice, and unwavering trust in God's character even when the visible circumstances seem impossible. The thread that connects every one of these testimonies is that these individuals "looked for a city which hath foundations, whose builder and maker is God" (Hebrews 11:10) — they lived with an eternal perspective that transcended their temporary trials.

    **Practical Application**
    To grow in faith today, begin each morning by dedicating your first thoughts to the Creator through prayer and meditation on His Word. Read a passage of Scripture before you reach for your phone, and ask the Holy Spirit to strengthen your trust throughout the day. When challenges arise, remind yourself of the faithfulness of God as recorded in the testimonies of those who walked before you — from Abraham to the Apostles. Faith is a muscle that grows stronger with exercise, and every small act of trust builds upon the last, drawing you ever closer to the heart of the living God.

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
    <THOUGHT>
    [2-3 concise sentences: intent, key sources, response plan. Keep this SHORT.]
    </THOUGHT>
    
    ### RESPONSE START ###
    **Descriptive Title**

    [Rich, thorough, multi-paragraph answer. Expound on scriptures, provide cross-references, historical context, and theological depth. Aim for at least 4-6 paragraphs.]
    
    **Practical Application**
    [A full paragraph of specific, actionable spiritual guidance for daily life.]

    ---SUGGESTIONS---
    [3 thoughtful follow-up questions]
    [METADATA:SUBJECT=Subject Name]
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

        // 🧬 CHAIN-OF-THOUGHT EXTRACTION: Pull out the reasoning block (Case-Insensitive + Fallbacks)
        let thought = "";

        // Strategy 1: XML-style tags (Standard)
        const thoughtMatch = finalResponse.match(/<THOUGHT>([\s\S]*?)<\/THOUGHT>/i);
        if (thoughtMatch) {
            thought = thoughtMatch[1].trim();
            finalResponse = finalResponse.replace(thoughtMatch[0], "").trim();
        } else {
            // Strategy 2: Markdown headers (Fallback)
            const mdMatch = finalResponse.match(/(\*\*Thinking\*\*|\*\*Reasoning\*\*|### Thinking):?([\s\S]*?)(?=### RESPONSE START ###|\*\*Answer\*\*|$)/i);
            if (mdMatch) {
                thought = mdMatch[2].trim();
                finalResponse = finalResponse.replace(mdMatch[0], "").trim();
            }
        }

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

        // 🧪 POST-SYNTHESIS CLEANER: Forcefully strip excessive symbols

        // 1. Convert all headers (anything starting with #) to clean BOLD text
        answer = answer.replace(/^#+ (.*)$/gm, '**$1**');

        // 2. Strip single-star italics (e.g. *text* -> text)
        // We do this by replacing * with nothing if it's not a double-star bold
        answer = answer.replace(/(?<!\*)\*(?!\*)(.*?)(?<!\*)\*(?!\*)/g, '$1');

        // 3. Remove cases where symbols are tripled or more
        answer = answer.replace(/\*{3,}/g, '**');

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
            }).catch((e: any) => console.error("[DB] Logging failed:", e.message));
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
                thought: thought,
                latency: 0,
                modelUsed: finalProvider
            },
            metadata: {
                sources_count: sources.length,
                has_web_context: !!webContext,
                subject: suggestedSubject
            }
        }).catch(e => console.error("[MongoDB] Research logging failed:", e.message));

        return { answer, thought, suggestions, suggestedSubject };
    } catch (error: any) {
        console.error('[AI-DNA] Core synthesis error:', error.message);

        return {
            answer: "I encountered an issue processing your request. Please try again.",
            thought: "",
            suggestions: ["Try asking: Who is Jesus?", "Try asking: John 3:16"],
            suggestedSubject: ""
        };
    }
}

export async function generateGroundedStream(query: string, sources: string[], webContext: string = "", history: any[] = [], standaloneFocusedQuery?: string, truthSummary?: string) {
    const recentHistory = truncateHistory(history.slice(-5));

    const prompt = `
    EXPERT AI RESPONSE PROTOCOL (Deep Synthesis Engine):
    
    STEP 1: REASONING HUB (Internal Thought Process)
    - Before answering, briefly analyze the RESEARCH SOURCES and WEB RESULTS. 
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

    STEP 4: INTERNAL REASONING (The "Thinking" Process)
    - YOU MUST START YOUR RESPONSE WITH YOUR INTERNAL REASONING WRAPPED IN \`<THOUGHT>\` tags.
    - Inside \`<THOUGHT>\`, keep it CONCISE: 2-3 short sentences identifying the intent, key sources, and your plan.
    - Do NOT write long paragraphs inside <THOUGHT>. Save all depth and detail for the ACTUAL VISIBLE RESPONSE.
    - The thinking block should be a brief roadmap, not the main content.

    STEP 5: DEPTH & RICHNESS PROTOCOL (Thorough Exposition)
    - **WRITE LONG, DETAILED RESPONSES**: Your visible answer should be comprehensive, thorough, and richly elaborated. Aim for at least 4-6 well-developed paragraphs.
    - **EXPOUND ON SCRIPTURE**: When quoting a verse, do not just quote it — explain its historical context, its theological significance, how it connects to other scriptures (cross-references), and what it means for the believer today.
    - **TELL THE FULL STORY**: If discussing a biblical figure or historical person, provide their background, the context of their era, the key events of their life, their legacy, and the lessons we can draw from their journey.
    - **MULTIPLE SCRIPTURE REFERENCES**: Support your answer with multiple relevant Bible verses, not just one. Show how different parts of Scripture harmonize on the topic.
    - **PRACTICAL DEPTH**: The Practical Application section should be a full paragraph (not one sentence) explaining how the truth can be lived out in daily life with specific, actionable guidance.
    - **FLOWING PROSE**: Write in a natural, conversational, scholarly flow. Use longer sentences that connect ideas together. Avoid bullet-point lists — prefer rich paragraphs.
    - **NO HASH SYMBOLS**: Never use '#' or '####' for headers. Use **Bold Text** for section titles on their own line.
    - **NO ITALICS**: Never use single stars (*) for italics. Stick to plain text.
    - **BOLD for KEY TERMS**: Use **bold** for important names, doctrines, and scripture references to aid readability.
    - **CLEAN PARAGRAPHS**: Use double line breaks between paragraphs.
    - **NO SYMBOLS**: Do not use "✅", "🚀", or emojis unless explicitly requested.

    FEW-SHOT STYLE EXAMPLE (DESIRED OUTPUT — NOTE THE LENGTH AND DEPTH):
    **The Nature of Faith in Scripture**

    Faith is described in the Epistle to the Hebrews as "the substance of things hoped for, the evidence of things not seen" (Hebrews 11:1). This is not merely an abstract theological concept but the very foundation upon which the entire Christian walk is built. The original Greek word "pistis" carries the meaning of trust, confidence, and firm persuasion — it is an active, living force that moves the believer from doubt into the assurance of God's promises. Without faith, the Scriptures declare, it is impossible to please God (Hebrews 11:6), which tells us that faith is not optional but essential to our relationship with the Almighty.

    When we examine the lives of the great men and women of God throughout Scripture, we see that faith was never a passive feeling but a persistent, courageous action. Abraham, whom the Apostle Paul calls "the father of all them that believe" (Romans 4:11), left his homeland of Ur of the Chaldees without knowing where God was leading him, trusting solely in the promise that God would make of him a great nation (Genesis 12:1-3). Moses, raised in the palace of Pharaoh with every earthly privilege, chose by faith to suffer affliction with the people of God rather than to enjoy the pleasures of sin for a season (Hebrews 11:24-25). These were not men of extraordinary natural ability — they were ordinary people who served an extraordinary God and took Him at His Word.

    The catalogue of faith found in Hebrews chapter 11 provides a sweeping panorama of what trusting God looks like across different circumstances and centuries. From Abel's acceptable sacrifice to Noah's obedient construction of the ark, from Rahab's courageous protection of the spies to David's triumph over Goliath, each account demonstrates that faith expresses itself through obedience, sacrifice, and unwavering trust in God's character even when the visible circumstances seem impossible. The thread that connects every one of these testimonies is that these individuals "looked for a city which hath foundations, whose builder and maker is God" (Hebrews 11:10) — they lived with an eternal perspective that transcended their temporary trials.

    **Practical Application**
    To grow in faith today, begin each morning by dedicating your first thoughts to the Creator through prayer and meditation on His Word. Read a passage of Scripture before you reach for your phone, and ask the Holy Spirit to strengthen your trust throughout the day. When challenges arise, remind yourself of the faithfulness of God as recorded in the testimonies of those who walked before you — from Abraham to the Apostles. Faith is a muscle that grows stronger with exercise, and every small act of trust builds upon the last, drawing you ever closer to the heart of the living God.

    RESEARCH SOURCES (VERIFIED KNOWLEDGE):
    ${sources.length > 0 ? sources.map((s, i) => `[Expert Source ${i + 1}]: \n${s}`).join("\n\n") : "NO LOCAL SOURCES (USE WEB)."}

    WEB SEARCH RESULTS (REAL-TIME CONTEXT):
    ${webContext || "Deep-search internal historical archives."}

    CONVERSATION HISTORY (FOR TOPIC RESOLUTION):
    ${recentHistory.map(m => `${m.role.toUpperCase()}: ${m.content}`).join("\n")}

    USER QUESTION (ACTIVE INTENT):
    "${query}"
    ${standaloneFocusedQuery ? `(RESOLVED FOR DEEP ANALYSIS: ${standaloneFocusedQuery})` : ""}

    RESPONSE FORMAT (STRICT):
    <THOUGHT>
    [INTERNAL REASONING: Keep this under 150 characters. Just 1 short sentence on intent and plan. SPEED IS CRITICAL.]
    </THOUGHT>
    
    ### RESPONSE START ###
    **Descriptive Title**

    [Rich, thorough, multi-paragraph answer. Expound on scriptures, provide cross-references, historical context, and theological depth. Aim for at least 4-6 paragraphs.]
    
    **Practical Application**
    [A full paragraph of specific, actionable spiritual guidance for daily life.]

    ---SUGGESTIONS---
    [3 thoughtful follow-up questions]
    
    [METADATA:SUBJECT=Subject Name]
    `;

    return getProviderManager().generateStream(prompt);
}

export { rewriteQuery };
