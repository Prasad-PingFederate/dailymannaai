import { generateGroundedResponse } from './src/lib/ai/gemini';

async function test() {
    console.log("Testing query: 'Who is Jesus Christ?'");
    const result = await generateGroundedResponse("Who is Jesus Christ?", [], "Jesus Christ is the central figure of Christianity, believed by Christians to be the Son of God and the Savior of the world.", []);
    console.log("\n--- ANSWER ---");
    console.log(result.answer);
    console.log("\n--- SUGGESTIONS ---");
    console.log(result.suggestions);
}

test().catch(console.error);
