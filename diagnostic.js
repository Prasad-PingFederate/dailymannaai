const { searchRelevantChunks } = require('./src/lib/storage/vector-store.ts');
// Note: We can't easily run TS with node without ts-node, 
// so I'll create a standalone check that mimics the logic or reads the dist.
// Better: Create a test-api-logic.js that doesn't need to import but checks the files.

const fs = require('fs');
const vectorStorePath = './src/lib/storage/vector-store.ts';
const content = fs.readFileSync(vectorStorePath, 'utf8');

console.log("--- Diagnostic Check ---");
console.log("Vector Store has Sadhu code:", content.includes("Sadhu-Sundar-Singh-Biography"));

// Let's create a temporary JS file that we can actually RUN to test the logic
const testScript = `
const mockVectorDb = [];

function chunkText(text, sourceId) {
    const words = text.split(/\\s+/);
    const chunks = [];
    const chunkSize = 150;
    for (let i = 0; i < words.length; i += chunkSize) {
        const content = words.slice(i, i + chunkSize).join(" ");
        chunks.push({ id: \`\${sourceId}-\${i}\`, sourceId, content });
    }
    return chunks;
}

function ingest(text, sourceId) {
    const newChunks = chunkText(text, sourceId);
    mockVectorDb.push(...newChunks);
}

// Mimic the actual data
ingest(\`
    Sadhu Sundar Singh (1889–1929): Known as "The Apostle with the Bleeding Feet." 
    Born into a wealthy Sikh family in Punjab, India. After a profound vision of Jesus Christ in 1904, he converted to Christianity and was disowned by his family.
    He adopted the life of a Sadhu (holy man), wearing a saffron robe and turban, to preach the Gospel "in an Indian way."
    Ministry: He walked across India and into Tibet multiple times, facing imprisonment, stoning, and biological threats. He preached in Ceylon, Japan, and Western nations.
    Theology: Emphasized Christ-centered mysticism and simplicity. Famous quote: "I am not worthy to be called a follower of Christ, but He has called me."
    Legacy: One of the most famous and beloved Indian Christian figures, bridge-building between Indian culture and Christian faith.
\`, "Sadhu-Sundar-Singh-Biography");

function search(query) {
    const q = query.toLowerCase();
    const searchTerms = q.split(/\\W+/).filter(t => t.length > 2);
    console.log("Searching for:", q);
    
    const scored = mockVectorDb.map(chunk => {
        let score = 0;
        const contentLower = chunk.content.toLowerCase();
        if (contentLower.includes(q)) score += 10;
        searchTerms.forEach(term => {
            if (contentLower.includes(term)) score += 2;
        });
        return { ...chunk, score };
    });

    return scored.filter(c => c.score > 0).sort((a,b) => b.score - a.score);
}

const query = "do you know sadhu sundar singh in indian christian";
const results = search(query);
console.log("FOUND CHUNKS:", results.length);
if (results.length > 0) {
    console.log("BEST MATCH CONTENT:", results[0].content.substring(0, 100));
}
`;

fs.writeFileSync('diagnostic-test.js', testScript);
console.log("Running logic test...");
require('child_process').execSync('node diagnostic-test.js', { stdio: 'inherit' });
