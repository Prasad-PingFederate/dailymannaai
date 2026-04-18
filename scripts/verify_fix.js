
require('dotenv').config({ path: '.env.local' });
const { generateGroundedResponse } = require('../src/lib/ai/gemini');

async function verifyFix() {
    console.log("--- 🧠 AI Brain Verification: Pivot Test ---");

    const history = [
        { role: 'user', content: 'Tell me about the Sermon on the Mount.' },
        { role: 'assistant', content: 'The Sermon on the Mount is a collection of teachings in Matthew 5-7 about love and humility.' }
    ];

    const questions = [
        "Who is Matthew?",
        "What is Genesis 1:1?",
        "Tell me about Martin Luther."
    ];

    for (const q of questions) {
        console.log(`\nTesting Query: "${q}"`);
        try {
            const result = await generateGroundedResponse(q, [], "", history);
            console.log("Subject Detected:", result.suggestedSubject);
            console.log("Preview:", result.answer.substring(0, 100) + "...");

            if (result.answer.toLowerCase().includes("sermon on the mount") && !q.toLowerCase().includes("sermon")) {
                console.log("❌ FAILED: Still stuck on Sermon on the Mount context.");
            } else {
                console.log("✅ PASSED: Correctly moved to new topic.");
            }
        } catch (e) {
            console.error("Test error:", e.message);
        }
    }
}

verifyFix();
