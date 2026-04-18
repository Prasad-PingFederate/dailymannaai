// src/lib/ai/bible-explorer-tavily.ts

export async function searchTavily(query: string) {
    const TAVILY_API_KEY = process.env.TAVILY_API_KEY;
    const TAVILY_API_URL = "https://api.tavily.com/search";

    if (!TAVILY_API_KEY) {
        console.warn("Tavily API key missing.");
        return null;
    }

    try {
        const response = await fetch(TAVILY_API_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                api_key: TAVILY_API_KEY,
                query: query,
                search_depth: "advanced",
                include_answer: true,
                max_results: 5
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Tavily API error: ${response.status}. ${errorText}`);
        }

        return await response.json();
    } catch (error) {
        console.error("Error in Tavily Bible search:", error);
        return null;
    }
}
