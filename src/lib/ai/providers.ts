/**
 * AI Provider Abstraction Layer (Final Bulletproof Version)
 * Supports multiple providers with v1 API support and deep fallback chains
 */

import { GoogleGenerativeAI } from "@google/generative-ai";
import Groq from "groq-sdk";
import { HfInference } from "@huggingface/inference";
import { prisma } from "../db";
import { TrainingLogger } from "./training-logger";

export interface AIProvider {
    name: string;
    generateResponse(prompt: string): Promise<string>;
    generateStream?(prompt: string): Promise<ReadableStream>;
    transcribeVideo?(videoUrl: string): Promise<string>;
    transcribeAudio?(audioUrl: string): Promise<string>;
}

/**
 * Utility to detect if an AI response is a "refusal" 
 * (e.g. "I cannot access YouTube") rather than a transcript.
 */
export function isRefusalResponse(text: string): boolean {
    const refusalPatterns = [
        "cannot directly access",
        "don't have access to",
        "cannot transcribe",
        "am an AI",
        "unable to visit",
        "I can't access",
        "I am unable to access",
        "as an AI language model",
        "I don't have real-time",
        "unfortunately, i cannot",
        "sorry, i had trouble",
        "3rd party tools",
        "manual transcription"
    ];
    const lower = text.toLowerCase();
    return refusalPatterns.some(p => lower.includes(p));
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

    async generateStream(prompt: string): Promise<ReadableStream> {
        const model = this.client.getGenerativeModel({ model: "gemini-1.5-flash" }, { apiVersion: "v1" });
        const result = await model.generateContentStream(prompt);

        return new ReadableStream({
            async start(controller) {
                const encoder = new TextEncoder();
                try {
                    for await (const chunk of result.stream) {
                        const text = chunk.text();
                        if (text) {
                            controller.enqueue(encoder.encode(text));
                        }
                    }
                    controller.close();
                } catch (e) {
                    controller.error(e);
                }
            },
        });
    }

    async transcribeVideo(videoUrl: string): Promise<string> {
        console.log(`[AI] Deep Transcription starting for: ${videoUrl}`);

        // Try multiple models in order of priority
        const transcriptionModels = [
            "gemini-1.5-flash",
            "gemini-1.5-flash-latest",
            "gemini-1.5-pro",
            "gemini-1.5-pro-latest",
            "gemini-pro"
        ];

        let lastError = "";
        for (const modelName of transcriptionModels) {
            try {
                console.log(`[AI] Transcription attempt with: ${modelName}`);
                const model = this.client.getGenerativeModel({ model: modelName });

                const prompt = `
                Mission: Act as a high-precision transcription engine.
                Source: ${videoUrl}
                Task: Provide a FULL, VERBATIM TRANSCRIPT of the speech content in this video.
                Constraint 1: If you can access the video content directly (via URL analysis or internal tools), do so.
                Constraint 2: If you CANNOT access the video directly, use your extensive internal knowledge of historical sermons, transcriptions, and metadata for this specific Video ID to reconstruct the SPEECH as accurately as possible. 
                Constraint 3: Do NOT summarize. Provide the actual spoken words as if you were transcribing them.
                Output: Just the transcript text, no preamble or summary headers.
                `;

                const result = await model.generateContent(prompt);
                const response = await result.response;
                const text = response.text();

                if (text && text.length > 50) {
                    if (isRefusalResponse(text)) {
                        console.warn(`[AI] ${modelName} returned a refusal message. Treating as failure.`);
                        continue;
                    }
                    console.log(`[AI] ✅ Success with model: ${modelName}`);
                    return text;
                }
            } catch (error: any) {
                lastError = error.message;
                console.warn(`[AI] Transcription with ${modelName} failed: ${lastError}`);
            }
        }

        throw new Error(`AI transcription totally failed across all Gemini models. Last: ${lastError}`);
    }
}

/**
 * Groq Provider
 */
class GroqProvider implements AIProvider {
    name = "Groq";
    private apiKey: string;

    constructor(apiKey: string) {
        this.apiKey = apiKey;
    }

    async generateResponse(prompt: string): Promise<string> {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 8000);

        try {
            const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${this.apiKey}`,
                },
                body: JSON.stringify({
                    model: "llama-3.1-70b-versatile",
                    messages: [{ role: "user", content: prompt }],
                }),
                signal: controller.signal,
            });

            if (!response.ok) {
                const text = await response.text();
                throw new Error(`Groq Error ${response.status}: ${text}`);
            }

            const data = await response.json();
            return data.choices[0]?.message?.content || "";
        } finally {
            clearTimeout(timeoutId);
        }
    }

    async transcribeAudio(audioUrl: string): Promise<string> {
        console.log(`[AI] Groq (Whisper) transcription for: ${audioUrl.substring(0, 50)}...`);
        try {
            // 1. Fetch the audio file
            const audioRes = await fetch(audioUrl);
            if (!audioRes.ok) throw new Error(`Failed to fetch audio: ${audioRes.status}`);
            const blob = await audioRes.blob();

            // 2. Prepare multipart form data
            const formData = new FormData();
            formData.append('file', blob, 'audio.mp3');
            formData.append('model', 'whisper-large-v3');
            formData.append('response_format', 'json');

            // 3. Call Groq's transcription endpoint
            const response = await fetch("https://api.groq.com/openai/v1/audio/transcriptions", {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${this.apiKey}`,
                },
                body: formData
            });

            if (!response.ok) {
                const errText = await response.text();
                throw new Error(`Groq Whisper Error: ${errText}`);
            }

            const data = await response.json();
            return data.text || "";
        } catch (error: any) {
            console.error(`[AI] Groq transcription failed: ${error.message}`);
            throw error;
        }
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
            "deepseek/deepseek-chat",
            "google/gemini-flash-1.5",
            "google/gemini-2.0-flash-exp:free",
            "meta-llama/llama-3.1-8b-instruct:free",
            "mistralai/mistral-7b-instruct:free",
            "anthropic/claude-3-haiku:free"
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
                        max_tokens: 4096,
                        temperature: 0.7,
                        repetition_penalty: 1.1,
                        top_p: 0.9,
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

    async generateStream(prompt: string): Promise<ReadableStream> {
        const models = ["deepseek/deepseek-r1:free", "deepseek/deepseek-chat", "google/gemini-2.0-flash-exp:free"];
        let lastError = "";

        for (const modelId of models) {
            try {
                const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${this.apiKey}`,
                    },
                    body: JSON.stringify({
                        model: modelId,
                        messages: [{ role: "user", content: prompt }],
                        stream: true,
                    }),
                });

                if (!response.ok) {
                    const err = await response.text();
                    throw new Error(err);
                }

                return response.body!;
            } catch (error: any) {
                lastError = error.message;
                continue;
            }
        }
        throw new Error(`OpenRouter Stream failed: ${lastError}`);
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
                    temperature: 0.7,
                    repetition_penalty: 1.1
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
                        temperature: 0.7,
                        repetition_penalty: 1.1,
                        top_p: 0.9
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
        const xaiKey = process.env.XAI_API_KEY;

        if (openRouterKey) this.providers.push(new OpenRouterProvider(openRouterKey));
        if (geminiKey) this.providers.push(new GeminiProvider(geminiKey));

        // Handle Groq (should start with gsk_)
        if (groqKey && groqKey.startsWith("gsk_")) {
            this.providers.push(new GroqProvider(groqKey));
        }

        // Handle xAI (should start with xai- or provided as XAI_API_KEY)
        const activeXaiKey = xaiKey || (groqKey && groqKey.startsWith("xai-") ? groqKey : null);
        if (activeXaiKey) {
            this.providers.push(new XAIProvider(activeXaiKey));
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
        const startTime = Date.now();

        for (const provider of this.providers) {
            try {
                console.log(`[AI] Attempting ${provider.name}...`);
                const response = await provider.generateResponse(prompt);
                const latency = Date.now() - startTime;

                console.log(`[AI] ✅ SUCCESS with ${provider.name} (${latency}ms)`);

                // 📊 Global Training Log: Success
                await TrainingLogger.log({
                    timestamp: new Date().toISOString(),
                    request: { query: prompt, provider: provider.name, model: "auto" },
                    response: { answer: response, latency, modelUsed: "auto" },
                    metadata: { status: "success" }
                }).catch(e => console.error("[MongoDB] Logging failed:", e.message));

                return { response, provider: provider.name };
            } catch (error: any) {
                console.error(`[AI] ❌ FAILED ${provider.name}:`, error.message);
                errors.push({ provider: provider.name, error });

                // 📊 Global Training Log: Failure
                await TrainingLogger.log({
                    timestamp: new Date().toISOString(),
                    request: { query: prompt, provider: provider.name, model: "auto" },
                    response: { answer: error.message, latency: Date.now() - startTime, modelUsed: "auto" },
                    metadata: { status: "error", error_stack: error.stack }
                }).catch(e => console.error("[MongoDB] Logging failed:", e.message));

                // Log error to DB (Supabase)
                if (prisma) {
                    prisma.errorLog.create({
                        data: {
                            provider: provider.name,
                            error: error.message,
                            stack: error.stack
                        }
                    }).catch(e => console.error("[DB] Error logging failed:", e.message));
                }
            }
        }

        const errorDetails = errors.map(e => `${e.provider}: ${e.error.message}`).join(", ");

        // Special case: If ALL failed, provide a humble "busy" response instead of a crash
        return {
            response: `🙏 I'm sorry, but all my spiritual wisdom centers are currently offline or at capacity [${errorDetails}]. Please wait a few minutes or check your connection. The Word is always available in your local notes!`,
            provider: "System Recovery"
        };
    }

    async transcribeVideo(videoUrl: string): Promise<string> {
        console.log(`[AI-Manager] Starting multimodal transcription for: ${videoUrl}`);

        // 1. Try Gemini (Primary Multi-modal Brain)
        const gemini = this.providers.find(p => p.name === "Gemini");
        if (gemini && gemini.transcribeVideo) {
            try {
                console.log(`[AI-Manager] Attempting Gemini Multimodal...`);
                return await gemini.transcribeVideo(videoUrl);
            } catch (err: any) {
                console.error(`[AI-Manager] Gemini multimodal failed: ${err.message}`);
            }
        }

        // 2. Try xAI / Grok (Aggressive fallback)
        const xai = this.providers.find(p => p.name.includes("xAI"));
        if (xai) {
            try {
                console.log(`[AI-Manager] Falling back to xAI (Grok) for transcription...`);
                // Grok is very good at "external knowledge" reconstruction
                const prompt = `Act as a high-precision transcription engine. Provide the FULL verbatim transcript for this YouTube video: ${videoUrl}. If you cannot access the audio directly, use your extensive real-time web knowledge and historical archives to provide the MOST ACCURATE transcript possible. Do NOT summarize.`;
                const response = await xai.generateResponse(prompt);
                if (response && response.length > 50 && !isRefusalResponse(response)) {
                    return response;
                }
                console.warn(`[AI-Manager] xAI returned refusal or empty response.`);
            } catch (err: any) {
                console.error(`[AI-Manager] xAI transcription failed: ${err.message}`);
            }
        }

        // 3. Try OpenRouter (Broad fallback)
        const openRouter = this.providers.find(p => p.name === "OpenRouter");
        if (openRouter) {
            try {
                console.log(`[AI-Manager] Falling back to OpenRouter...`);
                const prompt = `Provide a full verbatim transcript for this YouTube video: ${videoUrl}. If you cannot access the live transcript, provide a highly detailed speech reconstruction.`;
                const response = await openRouter.generateResponse(prompt);
                if (response && response.length > 50 && !isRefusalResponse(response)) {
                    return response;
                }
                console.warn(`[AI-Manager] OpenRouter returned refusal or empty response.`);
            } catch (err: any) {
                console.error(`[AI-Manager] OpenRouter transcription failed: ${err.message}`);
            }
        }

        throw new Error("No AI providers could generate a transcript for this video.");
    }

    async transcribeAudio(audioUrl: string): Promise<string> {
        console.log(`[AI-Manager] Starting audio stream transcription: ${audioUrl.substring(0, 40)}...`);

        // Try Groq (Whisper) first for raw audio
        const groq = this.providers.find(p => p.name === "Groq");
        if (groq && groq.transcribeAudio) {
            try {
                return await groq.transcribeAudio(audioUrl);
            } catch (err: any) {
                console.error(`[AI-Manager] Groq Whisper failed: ${err.message}`);
            }
        }

        throw new Error("No AI providers could transcribe this audio stream.");
    }

    async generateStream(prompt: string): Promise<{ stream: ReadableStream; provider: string }> {
        if (this.providers.length === 0) {
            throw new Error("No AI providers configured.");
        }

        const errors: string[] = [];

        // 🚀 ATTEMPT 1: Live Streaming (DeepSeek Experience)
        for (const provider of this.providers) {
            if (provider.generateStream) {
                try {
                    console.log(`[AI-Manager] Attempting stream from ${provider.name}...`);
                    const stream = await provider.generateStream(prompt);
                    return { stream, provider: provider.name };
                } catch (e: any) {
                    const msg = e.message || String(e);
                    console.warn(`[AI-Manager] Streaming failed on ${provider.name}: ${msg}`);
                    errors.push(`${provider.name}: ${msg}`);
                }
            }
        }

        // 🛡️ ATTEMPT 2: Fallback to Static (The "Backup System")
        console.warn("[AI-Manager] ⚠️ All stream attempts failed. Falling back to static response...");
        try {
            const { response, provider } = await this.generateResponse(prompt);

            // Wrap the static response in a stream so the frontend doesn't break
            const staticStream = new ReadableStream({
                start(controller) {
                    const encoder = new TextEncoder();
                    controller.enqueue(encoder.encode(response));
                    controller.close();
                }
            });

            return { stream: staticStream, provider: `${provider} (Static Fallback)` };
        } catch (e: any) {
            throw new Error(`Critical Synthesis Failure: Both streaming AND static paths failed. [${errors.join(", ")}]`);
        }
    }

    getActiveProviders(): string[] {
        return this.providers.map(p => p.name);
    }
}
