import { lookupBibleReference } from './src/lib/bible/lookup';
import { generateGroundedResponse } from './src/lib/ai/gemini';

async function verify() {
    console.log("--- BIBLE LOOKUP TEST ---");
    const matthew = lookupBibleReference("matthew:1:1");
    console.log("Matthew 1:1:", matthew);

    const john316 = lookupBibleReference("John 3 16");
    console.log("John 3:16:", john316);

    const firstJohn = lookupBibleReference("1 john 1:1");
    console.log("1 John 1:1:", firstJohn);

    console.log("\n--- AI DNA TEST ---");
    // Note: This won't run fully without API keys, but we can check the prompt logic if needed
    // or just rely on the fact that we've broadened the prompt.
    // console.log("Testing AI DNA with query: 'Who is Jesus Christ?'");
    // const aiResponse = await generateGroundedResponse("Who is Jesus Christ?", [], "", []);
    // console.log("AI Answer preview:", aiResponse.answer.substring(0, 100));
}

verify().catch(console.error);
