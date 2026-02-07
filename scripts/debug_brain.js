
require('dotenv').config({ path: '.env.local' });
const { generateGroundedResponse } = require('../src/lib/ai/gemini');

async function debugBrain() {
    console.log("--- 🧠 AI Brain Diagnostic: Topic Drift & Repetition Test ---");

    const history = [
        { role: 'user', content: 'Tell me about the Sermon on the Mount.' },
        { role: 'assistant', content: 'The Sermon on the Mount is recorded in Matthew 5-7...' }
    ];

    const newQuery = "Who is Matthew?";

    console.log(`\n[Test 1] Topic Transition`);
    console.log(`History Topic: Sermon on the Mount`);
    console.log(`New Query: "${newQuery}"`);
    console.log(`-----------------------------------`);

    try {
        // We simulate the grounded response
        // Note: In local test, we might need to mock some parts if they depend on Next.js specific globals
        const result = await generateGroundedResponse(newQuery, [], "Sample web context about Matthew the Apostle.", history);

        console.log("\n[AI RESPONSE]");
        console.log(result.answer);
        console.log("\n[SUGGESTIONS]");
        console.log(result.suggestions);
        console.log("\n[SUBJECT]");
        console.log(result.suggestedSubject);

        if (result.answer.toLowerCase().includes("sermon on the mount") && !newQuery.toLowerCase().includes("sermon")) {
            console.log("\n❌ BUG DETECTED: Context Pollution found. Response still contains Sermon on the Mount.");
        } else {
            console.log("\n✅ SUCCESS: Topic drift handled correctly.");
        }

    } catch (error) {
        console.error("Diagnostic Failed:", error);
    }
}

debugBrain();
