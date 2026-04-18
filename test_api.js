
const fetch = require('node-fetch');

async function testChat(query = "What is the meaning of God?") {
    try {
        console.log(`Testing /api/chat endpoint with query: "${query}"...`);
        const res = await fetch("http://localhost:3000/api/chat", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                query: query,
                history: []
            }),
        });

        console.log("Status:", res.status);
        if (!res.ok) {
            const err = await res.text();
            console.error("Error Response:", err);
            return;
        }

        const contentType = res.headers.get("content-type");
        console.log("Content-Type:", contentType);

        if (contentType.includes("application/json")) {
            const data = await res.json();
            console.log("JSON response:", JSON.stringify(data, null, 2));
        } else {
            console.log("Streaming response:");
            const reader = res.body;
            reader.on('data', (chunk) => {
                process.stdout.write(chunk.toString());
            });

            reader.on('end', () => {
                console.log("\n--- Done ---");
            });
        }

    } catch (e) {
        console.error("Fetch failed:", e.message);
    }
}

testChat();
