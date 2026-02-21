import { generateGroundedResponse } from "./src/lib/ai/gemini";
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

async function test() {
    console.log("Testing CoT Extraction...");
    const result = await generateGroundedResponse("Who is Jesus?", ["Jesus is the Son of God."], "Web results about Jesus.", []);
    console.log("ANSWER:", result.answer.substring(0, 50) + "...");
    console.log("THOUGHT:", result.thought ? "FOUND: " + result.thought.substring(0, 50) + "..." : "NOT FOUND");
    process.exit(0);
}

test();
