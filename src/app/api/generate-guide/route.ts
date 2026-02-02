import { NextResponse } from "next/server";
import { AIProviderManager } from "@/lib/ai/providers";

const providerManager = new AIProviderManager();

export async function POST(req: Request) {
    try {
        const { type, sources } = await req.json();

        if (!sources || sources.length === 0) {
            return NextResponse.json({ error: "No sources selected to generate from" }, { status: 400 });
        }

        const sourceContext = sources.map((s: any, i: number) => {
            const name = typeof s === 'string' ? s : s.name;
            const content = typeof s === 'string' ? "" : s.content;
            return `Source [${i + 1}]: ${name}\nCONTENT:\n${content}`;
        }).join("\n\n");

        let prompt = `Identity: ANTIGRAVITY RESEARCH CORE (Expert Agent). 
        Status: Authoritative Research Synthesis.
        
        DNA DIRECTIVES:
        - AUTHORITY: Speak as a world-class historical and theological expert.
        - PRECISION: Extract only high-value insights. 
        - WISDOM-FIRST: Do not just summarize; synthesize the spirit and depth of the material.
        
        TASK: Generate a ${type.toUpperCase()} based on the bedrock truth in the provided sources.`;

        if (type === "study-guide") {
            prompt += `
            Requirement: Include Key Terms, Core Concept Synthesis, Deep Reflection Questions, and a Scripture Cross-Reference list (if applicable).
            SOURCES:
            ${sourceContext}
            FORMAT: Unified Markdown with professional headers.`;
        } else if (type === "faq") {
            prompt += `
            Requirement: Imagine the questions a scholar or deep seeker would ask. Provide 5-7 intellectually rigorous questions and grounded, authoritative answers.
            SOURCES:
            ${sourceContext}
            FORMAT: Use **Q:** and **A:** bolding with academic precision.`;
        } else if (type === "timeline") {
            prompt += `
            Requirement: Extract a high-precision CHRONOLOGICAL TIMELINE of events, births, shifts in thought, and ministry milestones.
            SOURCES:
            ${sourceContext}
            FORMAT: Professional list with years/dates first. Label eras if applicable.`;
        } else if (type === "transcription") {
            prompt = `TASK: Provide the FULL TRANSCRIPTION / CONTENT of the provided sources. 
            Requirement: Present the text verbatim as it appears in the sources. Do not summarize or change the words. Use headers to separate different sources if multiple are provided.
            SOURCES:
            ${sourceContext}
            FORMAT: Clean Markdown.`;
        } else {
            prompt += `
            Requirement: Generate a high-level EXECUTIVE BRIEF capturing the essence, message, and takeaways of the material.
            SOURCES:
            ${sourceContext}`;
        }

        const { response, provider } = await providerManager.generateResponse(prompt);
        console.log(`[AI-DNA] Guide Generated via: ${provider}`);

        return NextResponse.json({ result: response.trim() });
    } catch (error: any) {
        console.error("Guide Generation Error:", error);
        return NextResponse.json({ error: "The Research Core encountered a synthesis latency issue." }, { status: 500 });
    }
}
