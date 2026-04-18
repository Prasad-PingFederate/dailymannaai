require('dotenv').config({ path: '.env.local' });
const { GoogleGenerativeAI } = require("@google/generative-ai");

async function test() {
    const key = process.env.GEMINI_API_KEY;
    const key2 = process.env.google_aistudio_key;
    const client = new GoogleGenerativeAI(key);

    const models = ['gemini-2.0-flash', 'gemini-2.5-flash', 'gemini-pro'];

    for (const m of models) {
        try {
            const model = client.getGenerativeModel({ model: m }, { apiVersion: 'v1' });
            const r = await model.generateContent('Say hi in one word');
            console.log(m + ': OK - ' + r.response.text().substring(0, 30));
        } catch (e) {
            console.log(m + ': FAIL - ' + e.message?.substring(0, 60));
        }
    }

    // Also test Groq with updated model
    console.log('\n--- Groq ---');
    const groqKey = process.env.GROQ_API_KEY;
    try {
        const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: { "Content-Type": "application/json", "Authorization": `Bearer ${groqKey}` },
            body: JSON.stringify({ model: "llama-3.3-70b-versatile", messages: [{ role: "user", content: "Say hi" }], max_tokens: 20 })
        });
        const data = await res.json();
        if (data.choices) console.log('Groq: OK - ' + data.choices[0]?.message?.content);
        else console.log('Groq: FAIL - ' + JSON.stringify(data.error).substring(0, 60));
    } catch (e) { console.log('Groq: FAIL - ' + e.message); }

    // Test Mistral
    console.log('\n--- Mistral ---');
    try {
        const res = await fetch("https://api.mistral.ai/v1/chat/completions", {
            method: "POST",
            headers: { "Content-Type": "application/json", "Authorization": `Bearer ${process.env.MISTRAL_API_KEY}` },
            body: JSON.stringify({ model: "mistral-small-latest", messages: [{ role: "user", content: "Say hi" }], max_tokens: 20 })
        });
        const data = await res.json();
        if (data.choices) console.log('Mistral: OK - ' + data.choices[0]?.message?.content);
        else console.log('Mistral: FAIL - ' + JSON.stringify(data.error).substring(0, 60));
    } catch (e) { console.log('Mistral: FAIL - ' + e.message); }
}

test();
