require('dotenv').config({ path: '.env.local' });
const { GoogleGenerativeAI } = require("@google/generative-ai");

const results = [];

async function test() {
    // Gemini streaming
    const geminiKey = process.env.GEMINI_API_KEY;
    for (const m of ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-pro']) {
        try {
            const client = new GoogleGenerativeAI(geminiKey);
            const model = client.getGenerativeModel({ model: m }, { apiVersion: 'v1' });
            const result = await model.generateContentStream("Say hi");
            let text = '';
            for await (const chunk of result.stream) { text += chunk.text(); }
            results.push(`${m} STREAM: OK - "${text.substring(0, 30)}"`);
        } catch (e) {
            results.push(`${m} STREAM: FAIL - ${e.message?.substring(0, 80)}`);
        }
    }

    // Groq
    try {
        const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: { "Content-Type": "application/json", "Authorization": `Bearer ${process.env.GROQ_API_KEY}` },
            body: JSON.stringify({ model: "llama-3.3-70b-versatile", messages: [{ role: "user", content: "Say hi" }], max_tokens: 20, stream: true })
        });
        results.push(`Groq STREAM: ${res.ok ? 'OK' : 'FAIL HTTP ' + res.status}`);
    } catch (e) { results.push(`Groq STREAM: FAIL - ${e.message}`); }

    // Mistral  
    try {
        const res = await fetch("https://api.mistral.ai/v1/chat/completions", {
            method: "POST",
            headers: { "Content-Type": "application/json", "Authorization": `Bearer ${process.env.MISTRAL_API_KEY}` },
            body: JSON.stringify({ model: "mistral-small-latest", messages: [{ role: "user", content: "Say hi" }], max_tokens: 20, stream: true })
        });
        results.push(`Mistral STREAM: ${res.ok ? 'OK' : 'FAIL HTTP ' + res.status}`);
    } catch (e) { results.push(`Mistral STREAM: FAIL - ${e.message}`); }

    // SambaNova
    try {
        const res = await fetch("https://api.sambanova.ai/v1/chat/completions", {
            method: "POST",
            headers: { "Content-Type": "application/json", "Authorization": `Bearer ${process.env.sambanova_api}` },
            body: JSON.stringify({ model: "Meta-Llama-3.3-70B-Instruct", messages: [{ role: "user", content: "Say hi" }], max_tokens: 20, stream: true })
        });
        results.push(`SambaNova STREAM: ${res.ok ? 'OK' : 'FAIL HTTP ' + res.status}`);
    } catch (e) { results.push(`SambaNova STREAM: FAIL - ${e.message}`); }

    // Cerebras
    try {
        const res = await fetch("https://api.cerebras.ai/v1/chat/completions", {
            method: "POST",
            headers: { "Content-Type": "application/json", "Authorization": `Bearer ${process.env.cerebras_api}` },
            body: JSON.stringify({ model: "llama-3.1-8b", messages: [{ role: "user", content: "Say hi" }], max_tokens: 20, stream: true })
        });
        results.push(`Cerebras STREAM: ${res.ok ? 'OK' : 'FAIL HTTP ' + res.status}`);
    } catch (e) { results.push(`Cerebras STREAM: FAIL - ${e.message}`); }

    // Print all at once
    console.log("\n=== STREAMING TEST RESULTS ===");
    results.forEach(r => console.log(r));
    console.log("=== END ===");
}

test();
