
const fetch = require('node-fetch');
require('dotenv').config({ path: '.env.local' });

async function listGeminiModels() {
    console.log("=== 🔍 LISTING AVAILABLE GEMINI MODELS ===\n");
    try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${process.env.GEMINI_API_KEY}`;
        const res = await fetch(url);
        if (!res.ok) {
            console.log("Failed to list models:", res.status);
            console.log(await res.text());
            return;
        }
        const data = await res.json();
        console.log("Found", data.models.length, "models.");
        data.models.forEach(m => {
            if (m.supportedGenerationMethods.includes("generateContent")) {
                console.log(`- ${m.name}`);
            }
        });
    } catch (e) {
        console.log("Error:", e.message);
    }
    console.log("\n===============================================");
}

listGeminiModels();
