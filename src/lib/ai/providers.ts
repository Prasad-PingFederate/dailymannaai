/**
 * AI Provider Abstraction Layer
 * Supports multiple AI providers with automatic fallback on rate limits
 */

import { GoogleGenerativeAI } from "@google/generative-ai";
import Groq from "groq-sdk";
import { HfInference } from "@huggingface/inference";

export interface AIProvider {
    name: string;
    generateResponse(prompt: string): Promise<string>;
}

/**
 * Gemini Provider (Primary)
 */
class GeminiProvider implements AIProvider {
    name = "Gemini";
    private client: GoogleGenerativeAI;

    constructor(apiKey: string) {
        this.client = new GoogleGenerativeAI(apiKey);
    }

    async generateResponse(prompt: string): Promise<string> {
        const model = this.client.getGenerativeModel({ model: "models/gemini-flash-latest" });
        const result = await model.generateContent(prompt);
        const response = await result.response;
        return response.text();
    }
}

/**
 * Groq Provider (Fallback #1)
 */
class GroqProvider implements AIProvider {
    name = "Groq";
    private client: Groq;

    constructor(apiKey: string) {
        this.client = new Groq({ apiKey });
    }

    async generateResponse(prompt: string): Promise<string> {
        const completion = await this.client.chat.completions.create({
            messages: [{ role: "user", content: prompt }],
            model: "llama-3.3-70b-versatile",
            temperature: 0.7,
            max_tokens: 2048,
        });
        return completion.choices[0]?.message?.content || "";
    }
}

/**
 * Hugging Face Provider (Fallback #2)
 */
class HuggingFaceProvider implements AIProvider {
    name = "Hugging Face";
    private client: HfInference;

    constructor(apiKey: string) {
        this.client = new HfInference(apiKey);
    }

    async generateResponse(prompt: string): Promise<string> {
        const response = await this.client.textGeneration({
            model: "mistralai/Mixtral-8x7B-Instruct-v0.1",
            inputs: prompt,
            parameters: {
                max_new_tokens: 2048,
                temperature: 0.7,
                return_full_text: false,
            },
        });
        return response.generated_text;
    }
}

/**
 * Together AI Provider (Fallback #3)
 */
class TogetherProvider implements AIProvider {
    name = "Together AI";
    private apiKey: string;

    constructor(apiKey: string) {
        this.apiKey = apiKey;
    }

    async generateResponse(prompt: string): Promise<string> {
        const response = await fetch("https://api.together.xyz/v1/chat/completions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${this.apiKey}`,
            },
            body: JSON.stringify({
                model: "meta-llama/Llama-3-70b-chat-hf",
                messages: [{ role: "user", content: prompt }],
                max_tokens: 2048,
                temperature: 0.7,
            }),
        });

        if (!response.ok) {
            throw new Error(`Together API error: ${response.status}`);
        }

        const data = await response.json();
        return data.choices[0]?.message?.content || "";
    }
}

/**
 * Multi-Provider Manager with Automatic Fallback
 */
export class AIProviderManager {
    private providers: AIProvider[] = [];

    constructor() {
        // Initialize providers based on available API keys
        if (process.env.GEMINI_API_KEY) {
            this.providers.push(new GeminiProvider(process.env.GEMINI_API_KEY));
        }
        if (process.env.GROQ_API_KEY) {
            this.providers.push(new GroqProvider(process.env.GROQ_API_KEY));
        }
        if (process.env.HUGGINGFACE_API_KEY) {
            this.providers.push(new HuggingFaceProvider(process.env.HUGGINGFACE_API_KEY));
        }
        if (process.env.TOGETHER_API_KEY) {
            this.providers.push(new TogetherProvider(process.env.TOGETHER_API_KEY));
        }
    }

    /**
     * Generate response with automatic fallback
     */
    async generateResponse(prompt: string): Promise<{ response: string; provider: string }> {
        if (this.providers.length === 0) {
            throw new Error("No AI providers configured. Please add API keys to .env.local");
        }

        const errors: Array<{ provider: string; error: any }> = [];

        for (const provider of this.providers) {
            try {
                console.log(`[AI] Trying provider: ${provider.name}`);
                const response = await provider.generateResponse(prompt);
                console.log(`[AI] Success with provider: ${provider.name}`);
                return { response, provider: provider.name };
            } catch (error: any) {
                console.error(`[AI] ${provider.name} failed:`, error.message);
                errors.push({ provider: provider.name, error });

                // Check if it's a rate limit error
                const isRateLimit =
                    error.message?.includes("429") ||
                    error.status === 429 ||
                    error.message?.includes("rate limit") ||
                    error.message?.includes("quota");

                if (!isRateLimit) {
                    // If it's not a rate limit, it might be a different error
                    // Continue to next provider
                    continue;
                }

                // Continue to next provider on rate limit
                console.log(`[AI] Rate limit hit on ${provider.name}, trying next provider...`);
            }
        }

        // All providers failed
        const errorMessage = this.formatErrorMessage(errors);
        throw new Error(errorMessage);
    }

    private formatErrorMessage(errors: Array<{ provider: string; error: any }>): string {
        const hasRateLimit = errors.some(e =>
            e.error.message?.includes("429") ||
            e.error.status === 429 ||
            e.error.message?.includes("rate limit")
        );

        if (hasRateLimit) {
            return `🙏 **All AI providers are currently at capacity.**\n\nPlease wait 30-60 seconds and try again. The Word is worth the wait!\n\n(Tried: ${errors.map(e => e.provider).join(", ")})`;
        }

        return `Failed to generate response. Errors:\n${errors.map(e => `- ${e.provider}: ${e.error.message}`).join("\n")}`;
    }

    /**
     * Get list of active providers
     */
    getActiveProviders(): string[] {
        return this.providers.map(p => p.name);
    }
}
