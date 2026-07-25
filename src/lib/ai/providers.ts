import { generateText, streamText } from 'ai';
import { google } from '@ai-sdk/google';
import { createOpenAI } from '@ai-sdk/openai';

export interface AIProvider {
    name: string;
    generateResponse(prompt: string): Promise<string>;
    generateStream(prompt: string): Promise<ReadableStream>;
}

export class AIProviderManager {
    private providers: AIProvider[] = [];

    constructor() {
        const geminiKey = process.env.GEMINI_API_KEY;
        const groqKey = process.env.GROQ_API_KEY;
        const togetherKey = process.env.TOGETHER_API_KEY;

        // 1. Google Gemini (Vercel AI SDK)
        if (geminiKey) {
            this.providers.push({
                name: "Gemini",
                async generateResponse(prompt: string) {
                    const { text } = await generateText({
                        model: google('gemini-1.5-flash'),
                        prompt: prompt,
                    });
                    return text;
                },
                async generateStream(prompt: string) {
                    const { textStream } = await streamText({
                        model: google('gemini-1.5-flash'),
                        prompt: prompt,
                    });
                    const encoder = new TextEncoder();
                    return new ReadableStream({
                        async start(controller) {
                            for await (const chunk of textStream) {
                                controller.enqueue(encoder.encode(chunk));
                            }
                            controller.close();
                        }
                    });
                }
            });
        }

        // 2. Groq (OpenAI Compatible via Vercel AI SDK)
        if (groqKey) {
            const groq = createOpenAI({
                baseURL: 'https://api.groq.com/openai/v1',
                apiKey: groqKey,
            });
            this.providers.push({
                name: "Groq",
                async generateResponse(prompt: string) {
                    const { text } = await generateText({
                        model: groq('llama-3.3-70b-versatile'),
                        prompt: prompt,
                    });
                    return text;
                },
                async generateStream(prompt: string) {
                    const { textStream } = await streamText({
                        model: groq('llama-3.3-70b-versatile'),
                        prompt: prompt,
                    });
                    const encoder = new TextEncoder();
                    return new ReadableStream({
                        async start(controller) {
                            for await (const chunk of textStream) {
                                controller.enqueue(encoder.encode(chunk));
                            }
                            controller.close();
                        }
                    });
                }
            });
        }

        // 3. Together AI (OpenAI Compatible via Vercel AI SDK)
        if (togetherKey) {
            const together = createOpenAI({
                baseURL: 'https://api.together.xyz/v1',
                apiKey: togetherKey,
            });
            this.providers.push({
                name: "Together AI",
                async generateResponse(prompt: string) {
                    const { text } = await generateText({
                        model: together('meta-llama/Llama-3.1-8b-chat-hf'),
                        prompt: prompt,
                    });
                    return text;
                },
                async generateStream(prompt: string) {
                    const { textStream } = await streamText({
                        model: together('meta-llama/Llama-3.1-8b-chat-hf'),
                        prompt: prompt,
                    });
                    const encoder = new TextEncoder();
                    return new ReadableStream({
                        async start(controller) {
                            for await (const chunk of textStream) {
                                controller.enqueue(encoder.encode(chunk));
                            }
                            controller.close();
                        }
                    });
                }
            });
        }
    }

    getActiveProviders(): string[] {
        return this.providers.map(p => p.name);
    }

    async generateResponse(prompt: string): Promise<{ response: string, provider: string }> {
        if (this.providers.length === 0) {
            throw new Error("No AI providers configured. Please set GEMINI_API_KEY, GROQ_API_KEY, or TOGETHER_API_KEY.");
        }

        let lastError = "";
        for (const provider of this.providers) {
            try {
                console.log(`[AI-Manager] Trying ${provider.name}...`);
                const response = await provider.generateResponse(prompt);
                return { response, provider: provider.name };
            } catch (error: any) {
                lastError = error.message;
                console.warn(`[AI-Manager] ${provider.name} failed: ${lastError}`);
            }
        }
        throw new Error(`All configured AI providers failed. Last Error: ${lastError}`);
    }

    async generateStream(prompt: string): Promise<{ stream: ReadableStream, provider: string }> {
        if (this.providers.length === 0) {
            throw new Error("No AI providers configured. Please set GEMINI_API_KEY, GROQ_API_KEY, or TOGETHER_API_KEY.");
        }

        let lastError = "";
        for (const provider of this.providers) {
            try {
                console.log(`[AI-Manager] Stream trying ${provider.name}...`);
                const stream = await provider.generateStream(prompt);
                return { stream, provider: provider.name };
            } catch (error: any) {
                lastError = error.message;
                console.warn(`[AI-Manager] ${provider.name} stream failed: ${lastError}`);
            }
        }
        throw new Error(`All configured AI providers failed streaming. Last Error: ${lastError}`);
    }

    async transcribeAudio(audioUrl: string): Promise<string> {
        const groqKey = process.env.GROQ_API_KEY;
        if (!groqKey) {
            throw new Error("GROQ_API_KEY is required for audio transcription.");
        }

        console.log(`[AI-Manager] Groq (Whisper) transcription for: ${audioUrl.substring(0, 50)}...`);
        try {
            const audioRes = await fetch(audioUrl);
            if (!audioRes.ok) throw new Error(`Failed to fetch audio: ${audioRes.status}`);
            const blob = await audioRes.blob();

            const formData = new FormData();
            formData.append('file', blob, 'audio.mp3');
            formData.append('model', 'whisper-large-v3');
            formData.append('response_format', 'json');

            const response = await fetch("https://api.groq.com/openai/v1/audio/transcriptions", {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${groqKey}`,
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
            console.error(`[AI-Manager] Groq transcription failed: ${error.message}`);
            throw error;
        }
    }
}

export function getProviderManager() {
    return new AIProviderManager();
}
