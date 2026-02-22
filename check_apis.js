/**
 * 🏥 DailyMannaAI — API Health Check Dashboard
 * Run: node check_apis.js
 * Tests all 11 AI providers and reports status
 */

require('dotenv').config({ path: '.env.local' });

const TEST_PROMPT = "Say hello in one sentence.";

const providers = [
    {
        name: "1. Gemini (Primary)",
        key: process.env.GEMINI_API_KEY,
        test: async (key) => {
            const { GoogleGenerativeAI } = require("@google/generative-ai");
            const client = new GoogleGenerativeAI(key);
            const model = client.getGenerativeModel({ model: "gemini-2.0-flash" }, { apiVersion: "v1" });
            const result = await model.generateContent(TEST_PROMPT);
            return result.response.text();
        }
    },
    {
        name: "2. Groq",
        key: process.env.GROQ_API_KEY,
        test: async (key) => {
            const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
                method: "POST",
                headers: { "Content-Type": "application/json", "Authorization": `Bearer ${key}` },
                body: JSON.stringify({ model: "llama-3.3-70b-versatile", messages: [{ role: "user", content: TEST_PROMPT }], max_tokens: 50 })
            });
            if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`);
            const data = await res.json();
            return data.choices[0]?.message?.content;
        }
    },
    {
        name: "3. Mistral",
        key: process.env.MISTRAL_API_KEY,
        test: async (key) => {
            const res = await fetch("https://api.mistral.ai/v1/chat/completions", {
                method: "POST",
                headers: { "Content-Type": "application/json", "Authorization": `Bearer ${key}` },
                body: JSON.stringify({ model: "mistral-small-latest", messages: [{ role: "user", content: TEST_PROMPT }], max_tokens: 50 })
            });
            if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`);
            const data = await res.json();
            return data.choices[0]?.message?.content;
        }
    },
    {
        name: "4. Together AI",
        key: process.env.together_api || process.env.TOGETHER_API_KEY,
        test: async (key) => {
            const res = await fetch("https://api.together.xyz/v1/chat/completions", {
                method: "POST",
                headers: { "Content-Type": "application/json", "Authorization": `Bearer ${key}` },
                body: JSON.stringify({ model: "meta-llama/Llama-3.3-70B-Instruct-Turbo", messages: [{ role: "user", content: TEST_PROMPT }], max_tokens: 50 })
            });
            if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`);
            const data = await res.json();
            return data.choices[0]?.message?.content;
        }
    },
    {
        name: "5. xAI (Grok)",
        key: process.env.XAI_API_KEY,
        test: async (key) => {
            const res = await fetch("https://api.x.ai/v1/chat/completions", {
                method: "POST",
                headers: { "Content-Type": "application/json", "Authorization": `Bearer ${key}` },
                body: JSON.stringify({ model: "grok-2-latest", messages: [{ role: "user", content: TEST_PROMPT }], max_tokens: 50 })
            });
            if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`);
            const data = await res.json();
            return data.choices[0]?.message?.content;
        }
    },
    {
        name: "6. Gemini-Backup",
        key: process.env.google_aistudio_key,
        test: async (key) => {
            const { GoogleGenerativeAI } = require("@google/generative-ai");
            const client = new GoogleGenerativeAI(key);
            const model = client.getGenerativeModel({ model: "gemini-2.0-flash" }, { apiVersion: "v1" });
            const result = await model.generateContent(TEST_PROMPT);
            return result.response.text();
        }
    },
    {
        name: "7. SambaNova",
        key: process.env.sambanova_api || process.env.SAMBANOVA_API_KEY,
        test: async (key) => {
            const res = await fetch("https://api.sambanova.ai/v1/chat/completions", {
                method: "POST",
                headers: { "Content-Type": "application/json", "Authorization": `Bearer ${key}` },
                body: JSON.stringify({ model: "Meta-Llama-3.3-70B-Instruct", messages: [{ role: "user", content: TEST_PROMPT }], max_tokens: 50 })
            });
            if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`);
            const data = await res.json();
            return data.choices[0]?.message?.content;
        }
    },
    {
        name: "8. Cerebras",
        key: process.env.cerebras_api || process.env.CEREBRAS_API_KEY,
        test: async (key) => {
            const res = await fetch("https://api.cerebras.ai/v1/chat/completions", {
                method: "POST",
                headers: { "Content-Type": "application/json", "Authorization": `Bearer ${key}` },
                body: JSON.stringify({ model: "llama-3.1-8b", messages: [{ role: "user", content: TEST_PROMPT }], max_tokens: 50 })
            });
            if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`);
            const data = await res.json();
            return data.choices[0]?.message?.content;
        }
    },
    {
        name: "9. OpenRouter",
        key: process.env.OPENROUTER_API_KEY,
        test: async (key) => {
            const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
                method: "POST",
                headers: { "Content-Type": "application/json", "Authorization": `Bearer ${key}` },
                body: JSON.stringify({ model: "meta-llama/llama-3.3-70b-instruct:free", messages: [{ role: "user", content: TEST_PROMPT }], max_tokens: 50 })
            });
            if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`);
            const data = await res.json();
            return data.choices[0]?.message?.content;
        }
    },
    {
        name: "10. DeepInfra",
        key: process.env.deepinfra || process.env.DEEPINFRA_API_KEY,
        test: async (key) => {
            const res = await fetch("https://api.deepinfra.com/v1/openai/chat/completions", {
                method: "POST",
                headers: { "Content-Type": "application/json", "Authorization": `Bearer ${key}` },
                body: JSON.stringify({ model: "meta-llama/Llama-3.3-70B-Instruct", messages: [{ role: "user", content: TEST_PROMPT }], max_tokens: 50 })
            });
            if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`);
            const data = await res.json();
            return data.choices[0]?.message?.content;
        }
    },
    {
        name: "11. Hugging Face",
        key: process.env.HUGGINGFACE_API_KEY,
        test: async (key) => {
            const res = await fetch("https://router.huggingface.co/hf-inference/models/mistralai/Mistral-7B-Instruct-v0.2/v1/chat/completions", {
                method: "POST",
                headers: { "Content-Type": "application/json", "Authorization": `Bearer ${key}` },
                body: JSON.stringify({ messages: [{ role: "user", content: TEST_PROMPT }], max_tokens: 50 })
            });
            if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`);
            const data = await res.json();
            return data.choices?.[0]?.message?.content;
        }
    }
];

async function checkAll() {
    console.log("\n" + "=".repeat(70));
    console.log("  🏥 DailyMannaAI — API Health Check Dashboard");
    console.log("  📅 " + new Date().toLocaleString());
    console.log("=".repeat(70) + "\n");

    const results = [];

    for (const provider of providers) {
        process.stdout.write(`  Testing ${provider.name}...`);

        if (!provider.key) {
            console.log(" ⚪ NO KEY");
            results.push({ name: provider.name, status: "⚪ NO KEY", latency: "-", response: "-" });
            continue;
        }

        const start = Date.now();
        try {
            const response = await Promise.race([
                provider.test(provider.key),
                new Promise((_, reject) => setTimeout(() => reject(new Error("Timeout (15s)")), 15000))
            ]);

            const latency = Date.now() - start;
            const preview = String(response).substring(0, 40).replace(/\n/g, " ");
            console.log(` ✅ UP (${latency}ms) — "${preview}"`);
            results.push({ name: provider.name, status: "✅ UP", latency: `${latency}ms`, response: preview });
        } catch (err) {
            const latency = Date.now() - start;
            const errMsg = err.message?.substring(0, 60) || "Unknown error";
            console.log(` ❌ DOWN (${latency}ms) — ${errMsg}`);
            results.push({ name: provider.name, status: "❌ DOWN", latency: `${latency}ms`, response: errMsg });
        }
    }

    // Summary
    const up = results.filter(r => r.status === "✅ UP").length;
    const down = results.filter(r => r.status === "❌ DOWN").length;
    const noKey = results.filter(r => r.status === "⚪ NO KEY").length;

    console.log("\n" + "=".repeat(70));
    console.log(`  📊 SUMMARY: ${up} UP ✅ | ${down} DOWN ❌ | ${noKey} NO KEY ⚪`);
    console.log("=".repeat(70));

    if (down > 0) {
        console.log("\n  ⚠️  Failed providers:");
        results.filter(r => r.status === "❌ DOWN").forEach(r => {
            console.log(`     ${r.name}: ${r.response}`);
        });
    }

    if (up >= 3) {
        console.log("\n  💪 Your app is HEALTHY — enough providers are online!\n");
    } else if (up >= 1) {
        console.log("\n  ⚠️  WARNING — Only few providers online. Monitor closely!\n");
    } else {
        console.log("\n  🚨 CRITICAL — ALL providers are down! Check API keys!\n");
    }
}

checkAll().catch(console.error);
