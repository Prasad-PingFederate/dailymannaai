import { getProviderManager } from "../ai/gemini";
import { DEITY_OF_CHRIST_DOCTRINE } from "../data/deity_of_christ";

export interface TruthAssessment {
    isSound: boolean;
    integrityScore: number;
    warnings: string[];
    recommendation?: string;
}

/**
 * THE TRUTH FILTER
 * A specialized layer to ensure search results align with scriptural integrity.
 */
export async function assessTruthIntegrity(query: string, results: string[]): Promise<TruthAssessment> {
    const assessmentPrompt = `
    Identity: DOCTRINAL INTEGRITY OFFICER.
    Task: Audit search results against core Christian doctrine.
    
    CORE DOCTRINE:
    ${DEITY_OF_CHRIST_DOCTRINE}
    
    SEARCH QUERY: "${query}"
    RETRIEVED DATA:
    ${results.join("\n---\n")}
    
    TASK: Detect if any retrieved data promotes false doctrine or contradicts the Deity of Christ.
    
    RESPONSE FORMAT (JSON ONLY):
    {
        "isSound": true/false,
        "integrityScore": 0-100,
        "warnings": ["Warning if suspect content found"],
        "recommendation": "Advice for the synthesis engine"
    }
    `;

    try {
        const { response } = await getProviderManager().generateResponse(assessmentPrompt);
        const cleanJson = response.replace(/```json|```/g, "").trim();
        return JSON.parse(cleanJson) as TruthAssessment;
    } catch (error) {
        console.error("[TruthFilter] Error:", error);
        return { isSound: true, integrityScore: 100, warnings: [] };
    }
}
