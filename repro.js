const mockVectorDb = [];

function chunkText(text, sourceId) {
    const words = text.split(/\s+/);
    const chunks = [];
    const chunkSize = 150;
    for (let i = 0; i < words.length; i += chunkSize) {
        const content = words.slice(i, i + chunkSize).join(" ");
        chunks.push({ id: `${sourceId}-${i}`, sourceId, content });
    }
    return chunks;
}

function ingest(text, sourceId) {
    const newChunks = chunkText(text, sourceId);
    mockVectorDb.push(...newChunks);
}

ingest(`
    Sadhu Sundar Singh (1889–1929): Known as "The Apostle with the Bleeding Feet." 
    Born into a wealthy Sikh family in Punjab, India. After a profound vision of Jesus Christ in 1904, he converted to Christianity and was disowned by his family.
    He adopted the life of a Sadhu (holy man), wearing a saffron robe and turban, to preach the Gospel "in an Indian way."
    Ministry: He walked across India and into Tibet multiple times, facing imprisonment, stoning, and biological threats. He preached in Ceylon, Japan, and Western nations.
    Theology: Emphasized Christ-centered mysticism and simplicity. Famous quote: "I am not worthy to be called a follower of Christ, but He has called me."
    Legacy: One of the most famous and beloved Indian Christian figures, bridge-building between Indian culture and Christian faith.
`, "Sadhu-Sundar-Singh-Biography");

function search(query) {
    const q = query.toLowerCase();
    const searchTerms = q.split(/\W+/).filter(t => t.length > 2);
    console.log("Search Terms:", searchTerms);

    const results = mockVectorDb.map(chunk => {
        let score = 0;
        const contentLower = chunk.content.toLowerCase();

        if (contentLower.includes(q)) {
            score += 20;
            console.log("Match found for full query!");
        }

        searchTerms.forEach(term => {
            if (contentLower.includes(term.toLowerCase())) {
                score += 5;
                console.log(`Match found for term: ${term}`);
            }
        });

        return { ...chunk, score };
    })
        .filter(c => c.score > 0)
        .sort((a, b) => b.score - a.score);

    return results;
}

const query = "who is sadhu sundar singh";
const found = search(query);
console.log("\nResults found:", found.length);
if (found.length > 0) {
    console.log("Top Result Score:", found[0].score);
} else {
    console.log("NO RESULTS FOUND.");
}
