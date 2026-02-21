
const fetch = require('node-fetch');

async function testDirectLookup(query = "John 3:16") {
    try {
        console.log(`Testing /api/chat endpoint with Direct Lookup: "${query}"...`);
        const res = await fetch("http://localhost:3000/api/chat", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                query: query,
                history: []
            }),
        });

        console.log("Status:", res.status);
        const data = await res.json();
        console.log("Response:", JSON.stringify(data, null, 2));

    } catch (e) {
        console.error("Fetch failed:", e.message);
    }
}

testDirectLookup();
