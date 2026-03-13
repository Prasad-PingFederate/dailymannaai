// src/lib/crawler/faith-classifier.ts
// DailyMannaAI — Intelligent Content Classification Engine (v2.0)
// Scoring Strategy:
//   • faithScore    → How Christian/relevant the content is (0–1)
//   • israelScore   → How Israel/Holy Land-focused the content is (0–1)
//   • prophecyScore → How End-Times/Second Coming-focused the content is (0–1)
//   • graceRank     → Final composite ranking weight for sorting/display

// ─────────────────────────────────────────────────────────────────────────────
// KEYWORD DICTIONARIES
// Each entry: keyword → base weight (higher = more relevant)
// ─────────────────────────────────────────────────────────────────────────────

// Core Christian faith keywords
const FAITH_KEYWORDS: Record<string, number> = {
    // Highest weight — Core Christology
    'jesus christ': 3.5, 'lord jesus christ': 4.0, 'son of god': 3.0,
    'risen lord': 3.0, 'resurrection of christ': 3.5, 'blood of christ': 3.0,
    'cross of christ': 3.0, 'gospel of jesus': 3.5, 'savior': 2.8,
    'holy spirit': 3.0, 'trinity': 2.5, 'born again': 2.5,

    // High weight — Core Gospel
    'salvation': 2.5, 'gospel': 2.5, 'atonement': 2.5, 'repentance': 2.5,
    'sanctification': 2.2, 'justification': 2.2, 'redemption': 2.2,
    'word of god': 2.5, 'holy bible': 2.5, 'scripture': 2.0,
    'resurrection': 2.0, 'eternal life': 2.0, 'forgiveness of sins': 2.5,
    'grace of god': 2.2, 'lord jesus': 2.5,

    // Medium-high weight
    'jesus': 1.8, 'christ': 1.8, 'christian': 1.5, 'bible': 1.5,
    'prayer': 1.3, 'worship': 1.3, 'sermon': 1.3, 'pastor': 1.2,
    'church': 1.2, 'faith': 1.2, 'grace': 1.2, 'holy': 1.2,
    'devotional': 1.3, 'ministry': 1.2, 'missionary': 1.3,
    'theology': 1.5, 'apologetics': 1.5, 'doctrine': 1.3,
    'disciples': 1.5, 'apostle': 1.3, 'evangelical': 1.5,

    // Medium weight — Bible books that signal Christian content
    'genesis': 1.5, 'exodus': 1.5, 'psalms': 1.5, 'proverbs': 1.5,
    'isaiah': 1.5, 'daniel': 1.5, 'ezekiel': 1.5, 'revelation': 1.8,
    'matthew': 1.5, 'john': 0.5, 'acts': 0.5, 'romans': 1.2,
    'ephesians': 1.2, 'philippians': 1.2, 'hebrews': 1.2,

    // Lower weight — broader Christian culture
    'christian community': 1.0, 'christian values': 1.0, 'holy land': 1.5,
    'baptism': 1.5, 'communion': 1.2, 'pentecost': 1.3, 'advent': 1.0,
    'lent': 1.0, 'resurrection sunday': 2.0, 'easter': 1.0, 'christmas': 0.8,
};

// Israel / Holy Land keywords (for ISRAEL scoring)
const ISRAEL_KEYWORDS: Record<string, number> = {
    'israel': 3.0, 'jerusalem': 3.0, 'holy land': 2.5, 'temple mount': 3.0,
    'zion': 2.5, 'jewish': 2.0, 'jews': 1.8, 'idf': 2.5,
    'gaza': 2.5, 'west bank': 2.0, 'hamas': 2.5, 'hezbollah': 2.0,
    'netanyahu': 2.0, 'knesset': 2.0, 'tel aviv': 2.0, 'haifa': 1.5,
    'nazareth': 2.0, 'bethlehem': 2.5, 'galilee': 2.0, 'dead sea': 1.5,
    'jordan river': 2.0, 'negev': 1.5, 'sinai': 1.5, 'arab-israeli': 2.0,
    'palestinian': 2.0, 'two-state': 1.5, 'middle east peace': 2.0,
    'abraham accords': 2.0, 'iron dome': 2.0, 'mossad': 1.8,
    'aliyah': 2.0, 'diaspora': 1.5, 'antisemitism': 2.0,
    'holocaust': 2.0, 'yom kippur': 2.0, 'passover': 2.0, 'shabbat': 1.5,
    'messianic jewish': 2.5, 'messianic believer': 2.5,
    'israel war': 3.0, 'israel attack': 2.5, 'israel news': 2.5,
};

// Second Coming / Prophecy / End-Times keywords
const PROPHECY_KEYWORDS: Record<string, number> = {
    'second coming': 4.0, 'second coming of jesus': 4.5, 'return of christ': 4.0,
    'rapture': 3.5, 'tribulation': 3.0, 'great tribulation': 3.5,
    'antichrist': 3.0, 'mark of the beast': 3.0, '666': 2.5,
    'end times': 3.5, 'end of days': 3.5, 'last days': 3.0,
    'millennial kingdom': 3.0, 'millennium': 2.5, 'armageddon': 3.5,
    'apocalypse': 3.0, 'book of revelation': 3.0,
    'daniel\'s prophecy': 3.0, 'abomination of desolation': 3.5,
    'third temple': 3.5, 'temple rebuilt': 3.5, 'temple construction': 3.0,
    'gog and magog': 3.5, 'ezekiel 38': 3.5, 'ezekiel 39': 3.5,
    'zechariah 12': 3.0, 'zechariah 14': 3.0, 'isaiah 17': 3.0,
    'four horsemen': 3.0, 'seven seals': 2.5, 'seven trumpets': 2.5,
    'new world order': 2.0, 'one world government': 2.5,
    'bible prophecy': 3.0, 'biblical prophecy': 3.0, 'fulfilled prophecy': 2.5,
    'signs of the times': 2.5, 'parousia': 3.0,
    'premillennial': 2.0, 'pretribulation': 2.5, 'eschatology': 3.0,
    'messianic age': 2.5, 'coming of the lord': 3.5,
    'jesus is coming': 4.0, 'maranatha': 3.5, 'even so come lord jesus': 4.0,
    'catching up': 2.0, 'catching away': 2.0,
    'new jerusalem': 2.5, 'thousand years': 2.0, 'lake of fire': 2.5,
    'judgment day': 2.5, 'great white throne': 2.5,
};

// Hard-block terms
const BLOCKED_TERMS = [
    'pornography', 'adult content', 'gambling', 'casino', 'lottery',
    'horoscope', 'astrology', 'witchcraft', 'occult', 'satanism',
    'wicca', 'pagan ritual', 'spirit medium', 'séance',
];

// ─────────────────────────────────────────────────────────────────────────────
// SCORING ENGINE
// ─────────────────────────────────────────────────────────────────────────────

interface ClassificationResult {
    faithScore: number;     // 0–1: Overall Christian relevance
    israelScore: number;    // 0–1: Israel/Holy Land relevance
    prophecyScore: number;  // 0–1: Second Coming / End-Times relevance
    graceRank: number;      // 0–1: Final composite rank (used for sorting)
    isBlocked: boolean;
    matchedFaithTerms: string[];
    matchedIsraelTerms: string[];
    matchedProphecyTerms: string[];
    bibleRefs: string[];
}

/**
 * Calculates a raw score from a dictionary of weighted keywords against text.
 */
function scoreFromKeywords(
    lower: string,
    keywords: Record<string, number>,
    wordCount: number
): { score: number; matched: string[] } {
    let totalScore = 0;
    const matched: string[] = [];

    for (const [keyword, weight] of Object.entries(keywords)) {
        const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\s+/g, '\\s+');
        const regex = new RegExp(`\\b${escaped}\\b`, 'gi');
        const count = (lower.match(regex) || []).length;
        if (count > 0) {
            totalScore += weight * Math.log(count + 1);
            matched.push(keyword);
        }
    }

    // Normalize by word density
    const density = totalScore / Math.max(wordCount / 100, 1);
    const breadthBonus = Math.min(matched.length / 10, 0.3);
    const normalized = Math.min(density / 5, 1.0);
    return { score: Math.min(normalized + breadthBonus, 1.0), matched };
}

/**
 * Full classification of a text — returns all scores and metadata.
 */
export function classifyContent(text: string): ClassificationResult {
    const empty: ClassificationResult = {
        faithScore: 0, israelScore: 0, prophecyScore: 0,
        graceRank: 0, isBlocked: false,
        matchedFaithTerms: [], matchedIsraelTerms: [],
        matchedProphecyTerms: [], bibleRefs: [],
    };
    if (!text) return empty;

    const lower = text.toLowerCase();
    const wordCount = lower.split(/\s+/).length;

    // Immediate block check
    if (BLOCKED_TERMS.some(t => lower.includes(t))) {
        return { ...empty, isBlocked: true };
    }

    const faith = scoreFromKeywords(lower, FAITH_KEYWORDS, wordCount);
    const israel = scoreFromKeywords(lower, ISRAEL_KEYWORDS, wordCount);
    const prophecy = scoreFromKeywords(lower, PROPHECY_KEYWORDS, wordCount);
    const bibleRefs = detectScriptureReferences(text);

    // Bible reference bonus on faith score
    const bibleBonus = Math.min(bibleRefs.length * 0.05, 0.2);
    const faithFinal = Math.min(faith.score + bibleBonus, 1.0);

    return {
        faithScore: faithFinal,
        israelScore: israel.score,
        prophecyScore: prophecy.score,
        graceRank: 0, // calculated separately with authority score
        isBlocked: false,
        matchedFaithTerms: faith.matched,
        matchedIsraelTerms: israel.matched,
        matchedProphecyTerms: prophecy.matched,
        bibleRefs,
    };
}

/**
 * Simple faith score for backward compatibility.
 * Returns -1 if blocked.
 */
export function getFaithScore(text: string): number {
    const result = classifyContent(text);
    if (result.isBlocked) return -1;
    return result.faithScore;
}

/**
 * Israel-specific score (0–1).
 */
export function getIsraelScore(text: string): number {
    return classifyContent(text).israelScore;
}

/**
 * Prophecy / Second Coming score (0–1).
 */
export function getProphecyScore(text: string): number {
    return classifyContent(text).prophecyScore;
}

/**
 * Detects Bible references in text using a robust regex.
 */
export function detectScriptureReferences(text: string): string[] {
    const bookPattern = [
        '(?:1|2|3|I|II|III)?\\s*',
        '(?:',
        'Gen(?:esis)?|Ex(?:odus)?|Lev(?:iticus)?|Num(?:bers)?|Deut(?:eronomy)?',
        '|Josh(?:ua)?|Judg(?:es)?|Ruth|(?:1|2)\\s*Sam(?:uel)?',
        '|(?:1|2)\\s*Kin(?:gs)?|(?:1|2)\\s*Chr(?:on(?:icles)?)?',
        '|Ezra|Neh(?:emiah)?|Esth(?:er)?|Job|Ps(?:alms?)?',
        '|Prov(?:erbs)?|Eccl(?:esiastes)?|Song(?:\\s*of\\s*Sol(?:omon)?)?',
        '|Isa(?:iah)?|Jer(?:emiah)?|Lam(?:entations)?|Ezek(?:iel)?|Dan(?:iel)?',
        '|Hos(?:ea)?|Joel|Amos|Obad(?:iah)?|Jonah|Mic(?:ah)?|Nah(?:um)?',
        '|Hab(?:akkuk)?|Zeph(?:aniah)?|Hag(?:gai)?|Zech(?:ariah)?|Mal(?:achi)?',
        '|Matt(?:hew)?|Mark|Luke|John|Acts|Rom(?:ans)?',
        '|(?:1|2)\\s*Cor(?:inthians)?|Gal(?:atians)?|Eph(?:esians)?',
        '|Phil(?:ippians)?|Col(?:ossians)?|(?:1|2)\\s*Thess(?:alonians)?',
        '|(?:1|2)\\s*Tim(?:othy)?|Tit(?:us)?|Philem(?:on)?|Heb(?:rews)?',
        '|Jas(?:es)?|(?:1|2)\\s*Pet(?:er)?|(?:1|2|3)\\s*John|Jude|Rev(?:elation)?',
        ')',
    ].join('');

    const refRegex = new RegExp(
        `${bookPattern}\\s+\\d+(?::\\d+(?:[–\\-]\\d+)?)?`,
        'gi'
    );

    const matches = text.match(refRegex) || [];
    return [...new Set(matches.map(m => m.trim()))];
}

/**
 * Boost multiplier from a feed source's boostKeywords list.
 * Returns 1.0 (no boost) to 1.5 (strong boost).
 */
export function getBoostMultiplier(text: string, boostKeywords?: string[]): number {
    if (!boostKeywords || boostKeywords.length === 0) return 1.0;
    const lower = text.toLowerCase();
    const hits = boostKeywords.filter(k => lower.includes(k.toLowerCase())).length;
    if (hits === 0) return 1.0;
    return Math.min(1.0 + hits * 0.1, 1.5);
}

/**
 * COMPOSITE GRACE RANK — Final sort score used throughout the app.
 *
 * Priority formula:
 *   Tier 1 (Israel)     → israelScore * 0.50 + faithScore * 0.20 + authority * 0.30
 *   Tier 2 (Prophecy)   → prophecyScore * 0.50 + faithScore * 0.25 + authority * 0.25
 *   Tier 3 (Christian)  → faithScore * 0.60 + authority * 0.40
 *   Tier 4–5 (World)    → faithScore * 0.40 + authority * 0.40 + recencyBoost * 0.20
 */
export function calculateGraceRank(
    faithScore: number,
    israelScore: number,
    prophecyScore: number,
    authorityScore: number,  // 1–10
    tier: number,
    publishedAt: Date,
    boostMultiplier: number = 1.0
): number {
    const authority = authorityScore / 10;

    // Recency decay — articles older than 48h start losing rank
    const ageHours = (Date.now() - publishedAt.getTime()) / (1000 * 60 * 60);
    const recencyBoost = ageHours < 6 ? 1.0
        : ageHours < 24 ? 0.9
        : ageHours < 48 ? 0.75
        : ageHours < 168 ? 0.5  // 1 week
        : 0.25;

    let base = 0;
    switch (tier) {
        case 1: // Israel feeds
            base = israelScore * 0.50 + faithScore * 0.20 + authority * 0.30;
            break;
        case 2: // Prophecy / Second Coming feeds
            base = prophecyScore * 0.50 + faithScore * 0.25 + authority * 0.25;
            break;
        case 3: // Christian news / theology
            base = faithScore * 0.60 + authority * 0.40;
            break;
        case 4: // World news
            base = faithScore * 0.35 + authority * 0.40 + recencyBoost * 0.25;
            break;
        case 5: // India news
            base = faithScore * 0.35 + authority * 0.40 + recencyBoost * 0.25;
            break;
        default: // Social / Tier 6
            base = faithScore * 0.30 + authority * 0.35 + recencyBoost * 0.35;
    }

    // Tier weight offset — guarantees priority order across tiers
    // Tier 1 gets +0.50, Tier 2 gets +0.40, etc.
    const tierOffset = Math.max(0, (6 - tier) * 0.10);

    const raw = (base + tierOffset) * recencyBoost * boostMultiplier;
    return Math.min(parseFloat(raw.toFixed(4)), 1.99); // cap at 1.99 so tier offsets don't exceed 2.0
}

/**
 * Cleans HTML and returns plain-text ready for indexing.
 */
export function cleanContent(html: string): string {
    if (!html) return '';
    return html
        .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
        .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
        .replace(/<iframe[^>]*>[\s\S]*?<\/iframe>/gi, '')
        .replace(/<[^>]+>/g, ' ')
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#\d+;/g, ' ')
        .replace(/\s{2,}/g, ' ')
        .trim()
        .substring(0, 5000); // Hard limit for storage efficiency
}

/**
 * Detects if this article is "world-relevant" even if faith score is low.
 * Used for Tier 4/5 feeds where we show top news regardless of faith content.
 */
export function isWorldNewsRelevant(faithScore: number, israelScore: number, prophecyScore: number, tier: number): boolean {
    if (tier <= 2) return true; // Always show Israel & Prophecy
    if (tier === 3) return faithScore >= 0.05; // Require minimal faith signal
    if (tier === 4 || tier === 5) return true; // Show all world/India top news
    return faithScore >= 0.1 || israelScore >= 0.1 || prophecyScore >= 0.1;
}
