// src/lib/crawler/faith-classifier.ts
// Intelligent classification and filtering for Christian content

const FAITH_KEYWORDS: Record<string, number> = {
    'jesus christ': 3.0, 'holy spirit': 2.5, 'son of god': 2.5,
    'resurrection': 2.0, 'salvation': 2.0, 'gospel': 2.0,
    'scripture': 1.8, 'repentance': 1.8, 'atonement': 1.8,
    'holy bible': 2.0, 'word of god': 2.0, 'lord jesus': 2.0,
    'jesus': 1.5, 'christ': 1.5, 'bible': 1.5, 'christian': 1.5,
    'church': 1.0, 'faith': 1.0, 'prayer': 1.0, 'worship': 1.0,
    'sermon': 1.0, 'pastor': 1.0, 'devotional': 1.0, 'grace': 1.0,
    'genesis': 1.5, 'exodus': 1.5, 'psalms': 1.5, 'proverbs': 1.5,
    'matthew': 1.5, 'john': 0.5, 'acts': 0.5, 'romans': 1.0, 'revelation': 1.0,
    'theology': 1.2, 'apologetics': 1.2,
};

const BLOCKED_TERMS = [
    'pornography', 'adult content', 'gambling', 'casino', 'lottery',
    'horoscope', 'astrology', 'witchcraft', 'occult', 'satanism',
];

/**
 * Calculates a faith relevance score (0-1) for a piece of text.
 * -1 indicates blocked content.
 */
export function getFaithScore(text: string): number {
    if (!text) return 0;
    const lower = text.toLowerCase();

    // Immediate block
    if (BLOCKED_TERMS.some(term => lower.includes(term))) return -1;

    let totalScore = 0;
    let matches = 0;
    const words = lower.split(/\s+/).length;

    for (const [keyword, weight] of Object.entries(FAITH_KEYWORDS)) {
        // Use regex for word boundaries
        const regex = new RegExp(`\\b${keyword.replace(/\s+/g, '\\s+')}\\b`, 'gi');
        const count = (lower.match(regex) || []).length;
        if (count > 0) {
            // Logarithmic scaling for multiple occurrences
            totalScore += weight * Math.log(count + 1);
            matches++;
        }
    }

    // Density normalization
    const density = (totalScore / Math.max(words / 100, 1));
    const raw = Math.min(density / 5, 1);
    const breadth = Math.min(matches / 10, 0.3);

    return Math.min(raw + breadth, 1.0);
}

/**
 * SECRET SAUCE: Divine Cross-Linking
 * Detects Bible references in text using regex.
 */
export function detectScriptureReferences(text: string): string[] {
    const bookPattern = "(?:(?:1|2|3|I|II|III)\\s*)?(?:Gen(?:esis)?|Ex(?:odus)?|Lev(?:iticus)?|Num(?:bers)?|Deut(?:eronomy)?|Josh(?:ua)?|Judg(?:es)?|Ruth|Sam(?:uel)?|Kings?|Chron(?:icles)?|Ezra|Neh(?:emiah)?|Esth(?:er)?|Job|Ps(?:alms?)?|Prov(?:erbs)?|Eccl(?:esiaste)?s|Song|Isa(?:iah)?|Jer(?:emiah)?|Lam(?:entations)?|Ezek(?:iel)?|Dan(?:iel)?|Hos(?:ea)?|Joel|Amos|Obad(?:iah)?|Jonah|Mic(?:ah)?|Nah(?:um)?|Hab(?:akkuk)?|Zeph(?:aniah)?|Hag(?:gai)?|Zech(?:ariah)?|Mal(?:achi)?|Matt(?:hew)?|Mark|Luke|John|Acts|Rom(?:ans)?|Cor(?:inthians)?|Gal(?:atians)?|Eph(?:esians)?|Phil(?:ippians)?|Col(?:ossians)?|Thess(?:alonians)?|Tim(?:othy)?|Tit(?:us)?|Philem(?:on)?|Heb(?:rews)?|James|Pet(?:er)?|John|Jude|Rev(?:elation)?|Scripture)";
    const refRegex = new RegExp(`${bookPattern}\\s+\\d+(?::\\d+(?:-\\d+)?)?`, "gi");

    const matches = text.match(refRegex) || [];
    return [...new Set(matches)]; // Return unique references
}

/**
 * SECRET SAUCE: Grace-Based Ranking
 * Calculates the final ranking weight for a search result.
 */
export function calculateGraceRank(faithScore: number, authorityScore: number): number {
    // 70% content relevance, 30% source authority
    return (faithScore * 0.7) + (authorityScore / 10 * 0.3);
}

/**
 * Clean HTML and extract high-quality text for indexing.
 */
export function cleanContent(html: string): string {
    if (!html) return '';
    return html
        .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
        .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
        .replace(/<[^>]+>/g, ' ')
        .replace(/&nbsp;/g, ' ')
        .replace(/\s{2,}/g, ' ')
        .trim();
}
