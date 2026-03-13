const fetch = require('node-fetch');

async function test() {
    const url = 'http://localhost:3000/api/bible/verses?book=Genesis&chapter=1&translation=ru';
    try {
        const res = await fetch(url);
        const data = await res.json();
        console.log('API Response:', JSON.stringify(data).substring(0, 500));
        console.log('Verses Count:', data.verses ? data.verses.length : 'N/A');
    } catch (e) {
        console.error('Fetch error:', e);
    }
}

test();
