
const { GoogleGenerativeAI } = require("@google/generative-ai");
require('dotenv').config({ path: '.env.local' });

async function verifyGeminiSDK() {
    console.log("=== 🔍 GEMINI SDK DIRECT TEST ===\n");
    // List of models to try
    const models = ["gemini-1.5-flash", "gemini-1.5-pro", "gemini-pro", "gemini-2.0-flash-exp"];

    for (const modelName of models) {
        try {
            console.log(`Testing ${modelName}...`);
            const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
            const model = genAI.getGenerativeModel({ model: modelName });
            const result = await model.generateContent("Hi");
            const response = await result.response;
            console.log(`✅ ${modelName}: ONLINE`);
            return; // Stop after first success
        } catch (e) {
            console.log(`❌ ${modelName}: FAILED (${e.message.substring(0, 100)})`);
        }
    }
}

verifyGeminiSDK();
