import { NextResponse } from "next/server";
import { getProviderManager } from "@/lib/ai/gemini";

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const manager = getProviderManager();
        const activeProviders = manager.getActiveProviders();

        // Quick test: try a simple generation
        let testResult = "NOT_TESTED";
        let testProvider = "NONE";
        try {
            const { response, provider } = await manager.generateResponse("Reply with exactly: SYSTEM_OK");
            testResult = response.substring(0, 50);
            testProvider = provider;
        } catch (e: any) {
            testResult = `ERROR: ${e.message?.substring(0, 100)}`;
        }

        return NextResponse.json({
            status: "ok",
            activeProviders,
            providerCount: activeProviders.length,
            testResult,
            testProvider,
            envCheck: {
                GEMINI_API_KEY: !!process.env.GEMINI_API_KEY,
                google_aistudio_key: !!process.env.google_aistudio_key,
                GROQ_API_KEY: !!process.env.GROQ_API_KEY,
                groqKey: !!process.env.groqKey,
                MISTRAL_API_KEY: !!process.env.MISTRAL_API_KEY,
                mistralKey: !!process.env.mistralKey,
                together_api: !!process.env.together_api,
                X_AI_API: !!process.env.X_AI_API,
                sambanova_api: !!process.env.sambanova_api,
                cerebras_api: !!process.env.cerebras_api,
                OPENROUTER_API_KEY: !!process.env.OPENROUTER_API_KEY,
                deepinfra: !!process.env.deepinfra,
                HUGGINGFACE_API_KEY: !!process.env.HUGGINGFACE_API_KEY,
            }
        });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
