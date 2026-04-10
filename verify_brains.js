
const fetch = require('node-fetch');
require('dotenv').config({ path: '.env.local' });

async function verifyAIProviders() {
    console.log("=== 🔍 DAILY MANNA AI: PROVIDER HEALTH CHECK (TOTAL VICTORY EDITION) ===\n");

    const providers = [
        {
            name: "GEMINI 2.5",
            url: `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
            method: "POST",
            body: { contents: [{ parts: [{ text: "Hi" }] }] }
        },
        {
            name: "GEMINI 3.0",
            url: `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${process.env.GEMINI_API_KEY}`,
            method: "POST",
            body: { contents: [{ parts: [{ text: "Hi" }] }] }
        },
        {
            name: "GROQ",
            url: "https://api.groq.com/openai/v1/chat/completions",
            headers: { "Authorization": `Bearer ${process.env.GROQ_API_KEY}` },
            method: "POST",
            body: { model: "llama-3.3-70b-versatile", messages: [{ role: "user", content: "Hi" }] }
        },
        {
            name: "MISTRAL",
            url: "https://api.mistral.ai/v1/chat/completions",
            headers: { "Authorization": `Bearer ${process.env.MISTRAL_API_KEY}` },
            method: "POST",
            body: { model: "mistral-small-latest", messages: [{ role: "user", content: "Hi" }] }
        },
        {
            name: "CLAUDE",
            url: "https://openrouter.ai/api/v1/chat/completions",
            headers: { 
                "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
                "HTTP-Referer": "https://dailymannaai.com",
                "X-Title": "Daily Manna AI"
            },
            method: "POST",
            body: { model: "anthropic/claude-3.5-sonnet", messages: [{ role: "user", content: "Hi" }] }
        }
    ];

    for (const p of providers) {
        try {
            const start = Date.now();
            const res = await fetch(p.url, {
                method: p.method,
                headers: { "Content-Type": "application/json", ...p.headers },
                body: JSON.stringify(p.body)
            });
            const latency = Date.now() - start;

            if (res.ok) {
                console.log(`✅ ${p.name.padEnd(12)}: ONLINE (${latency}ms)`);
            } else {
                const err = await res.text();
                console.log(`❌ ${p.name.padEnd(12)}: FAILED (${res.status})`);
                console.log(`   Detail: ${err.substring(0, 100)}`);
            }
        } catch (e) {
            console.log(`❌ ${p.name.padEnd(12)}: ERROR (${e.message})`);
        }
    }
    console.log("\n===============================================");
}

verifyAIProviders();
