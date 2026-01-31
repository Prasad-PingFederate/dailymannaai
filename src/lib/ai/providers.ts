/**
 * AI Provider Abstraction Layer (Final Bulletproof Version)
 * Supports multiple providers with v1 API support and deep fallback chains
 */

import { GoogleGenerativeAI } from "@google/generative-ai";
import Groq from "groq-sdk";
import { HfInference } from "@huggingface/inference";

export interface AIProvider {
    name: string;
    generateResponse(prompt: string): Promise<string>;
}

/**
 * Gemini Provider (Switching to v1 API)
 */
class GeminiProvider implements AIProvider {
    name = "Gemini";
    private client: GoogleGenerativeAI;

    constructor(apiKey: string) {
        this.client = new GoogleGenerativeAI(apiKey);
    }

    async generateResponse(prompt: string): Promise<string> {
        // Broad list of stable model identifiers
        const modelNames = [
            "gemini-1.5-flash",
            "gemini-1.5-pro",
            "gemini-pro"
        ];
        let lastError = "";

        for (const modelName of modelNames) {
            try {
                console.log(`[AI] Gemini testing: ${modelName} (v1 API)...`);
                // Force v1 API which is more stable
                const model = this.client.getGenerativeModel({ model: modelName }, { apiVersion: "v1" });
                const result = await model.generateContent(prompt);
                const response = await result.response;
                return response.text();
            } catch (error: any) {
                lastError = error.message || String(error);
                console.warn(`[AI] Gemini ${modelName} failed: ${lastError}`);
                // If 404, try next name
                if (lastError.includes("404") || lastError.toLowerCase().includes("not found")) {
                    continue;
                }
                throw error;
            }
        }
        throw new Error(`Gemini failed all model attempts. Last error: ${lastError}`);
    }
}

/**
 * xAI Provider (Grok)
 */
class XAIProvider implements AIProvider {
    name = "xAI (Grok)";
    private apiKey: string;

    constructor(apiKey: string) {
        this.apiKey = apiKey;
    }

    async generateResponse(prompt: string): Promise<string> {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 8000); // 8s timeout

        try {
            const response = await fetch("https://api.x.ai/v1/chat/completions", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${this.apiKey}`,
                },
                body: JSON.stringify({
                    model: "grok-beta",
                    messages: [{ role: "user", content: prompt }],
                }),
                signal: controller.signal,
            });

            if (!response.ok) {
                const text = await response.text();
                if (text.includes("credits")) {
                    throw new Error("Grok requires a credit purchase to use the API.");
                }
                throw new Error(`xAI Error ${response.status}: ${text}`);
            }

            const data = await response.json();
            return data.choices[0]?.message?.content || "";
        } finally {
            clearTimeout(timeoutId);
        }
    }
}

/**
 * OpenRouter Provider (Wide variety of free endpoints)
 */
class OpenRouterProvider implements AIProvider {
    name = "OpenRouter";
    private apiKey: string;

    constructor(apiKey: string) {
        this.apiKey = apiKey;
    }

    async generateResponse(prompt: string): Promise<string> {
        const fallbackModels = [
            "deepseek/deepseek-chat", // Very high quality, extremely cheap (often free/heavy discount)
            "google/gemini-2.0-flash-exp:free",
            "meta-llama/llama-3.1-8b-instruct:free",
            "mistralai/mistral-7b-instruct:free",
            "qwen/qwen-2.5-72b-instruct:free",
            "google/gemini-flash-1.5-8b"
        ];

        let lastError = "";

        for (const modelId of fallbackModels) {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 8000); // 8s timeout

            try {
                console.log(`[AI] OpenRouter testing: ${modelId}...`);
                const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${this.apiKey}`,
                        "HTTP-Referer": "https://dailymannaai.com",
                        "X-Title": "Daily Manna AI",
                    },
                    body: JSON.stringify({
                        model: modelId,
                        messages: [{ role: "user", content: prompt }],
                        max_tokens: 1024,
                    }),
                    signal: controller.signal,
                });

                const data = await response.json().catch(() => ({ error: { message: "Invalid JSON" } }));

                if (!response.ok) {
                    lastError = data.error?.message || response.statusText;
                    console.warn(`[AI] OpenRouter ${modelId} failed: ${lastError}`);
                    if (response.status === 404 || lastError.toLowerCase().includes("endpoints") || lastError.toLowerCase().includes("credits")) {
                        continue;
                    }
                    throw new Error(lastError);
                }

                return data.choices[0]?.message?.content || "";
            } catch (error: any) {
                lastError = error.name === 'AbortError' ? 'Request timeout (8s)' : error.message;
                continue;
            } finally {
                clearTimeout(timeoutId);
            }
        }
        throw new Error(`OpenRouter failed (likely credits or no free endpoints). Last: ${lastError}`);
    }
}

/**
 * Hugging Face Provider
 */
class HuggingFaceProvider implements AIProvider {
    name = "Hugging Face";
    private client: HfInference;

    constructor(apiKey: string) {
        this.client = new HfInference(apiKey);
    }

    async generateResponse(prompt: string): Promise<string> {
        // Try stable models that support conversational tasks
        const models = [
            "mistralai/Mistral-7B-Instruct-v0.2",
            "meta-llama/Llama-3.2-1B-Instruct",
            "HuggingFaceH4/zephyr-7b-beta"
        ];

        let lastError = "";
        for (const model of models) {
            try {
                console.log(`[AI] HuggingFace testing: ${model}...`);
                const response = await this.client.chatCompletion({
                    model: model,
                    messages: [{ role: "user", content: prompt }],
                    max_tokens: 2048,
                });
                return response.choices[0]?.message?.content || "";
            } catch (error: any) {
                lastError = error.message;
                console.warn(`[AI] HuggingFace ${model} failed: ${lastError}`);
                continue;
            }
        }
        throw new Error(`Hugging Face failed models. Last: ${lastError}`);
    }
}

/**
 * Together AI Provider
 */
class TogetherProvider implements AIProvider {
    name = "Together AI";
    private apiKey: string;

    constructor(apiKey: string) {
        this.apiKey = apiKey;
    }

    async generateResponse(prompt: string): Promise<string> {
        const models = [
            "meta-llama/Llama-3.1-8b-chat-hf",
            "mistralai/Mixtral-8x7B-Instruct-v0.1"
        ];

        let lastError = "";
        for (const model of models) {
            try {
                console.log(`[AI] Together testing: ${model}...`);
                const response = await fetch("https://api.together.xyz/v1/chat/completions", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${this.apiKey}`,
                    },
                    body: JSON.stringify({
                        model: model,
                        messages: [{ role: "user", content: prompt }],
                        max_tokens: 2048,
                    }),
                });

                if (!response.ok) {
                    lastError = await response.text();
                    continue;
                }

                const data = await response.json();
                return data.choices?.[0]?.message?.content || "";
            } catch (error: any) {
                lastError = error.message;
                continue;
            }
        }
        throw new Error(`Together AI failed. Last: ${lastError}`);
    }
}

/**
 * Multi-Provider Manager
 */
export class AIProviderManager {
    private providers: AIProvider[] = [];

    constructor() {
        const geminiKey = process.env.GEMINI_API_KEY;
        const openRouterKey = process.env.OPENROUTER_API_KEY;
        const groqKey = process.env.GROQ_API_KEY;

        // Sequence: Gemini -> OpenRouter -> xAI -> Together -> Hugging Face
        if (geminiKey) this.providers.push(new GeminiProvider(geminiKey));
        if (openRouterKey) this.providers.push(new OpenRouterProvider(openRouterKey));

        if (groqKey && groqKey.startsWith("xai-")) {
            this.providers.push(new XAIProvider(groqKey));
        }

        if (process.env.TOGETHER_API_KEY && !process.env.TOGETHER_API_KEY.includes("your_together")) {
            this.providers.push(new TogetherProvider(process.env.TOGETHER_API_KEY));
        }

        if (process.env.HUGGINGFACE_API_KEY) {
            this.providers.push(new HuggingFaceProvider(process.env.HUGGINGFACE_API_KEY));
        }
    }

    async generateResponse(prompt: string): Promise<{ response: string; provider: string }> {
        if (this.providers.length === 0) {
            throw new Error("No AI providers configured. Add API keys to .env.local");
        }

        const errors: Array<{ provider: string; error: any }> = [];

        for (const provider of this.providers) {
            try {
                console.log(`[AI] Attempting ${provider.name}...`);
                const response = await provider.generateResponse(prompt);
                console.log(`[AI] ✅ SUCCESS with ${provider.name}`);
                return { response, provider: provider.name };
            } catch (error: any) {
                console.error(`[AI] ❌ FAILED ${provider.name}:`, error.message);
                errors.push({ provider: provider.name, error });
            }
        }

        // Special case: If ALL failed, provide a humble "busy" response instead of a crash
        return {
            response: "🙏 I'm sorry, but all my spiritual wisdom centers are currently offline or at capacity. Please check your API keys or wait a few minutes before asking again. The Word is always available in your local notes!",
            provider: "System Recovery"
        };
    }

    getActiveProviders(): string[] {
        return this.providers.map(p => p.name);
    }
}
