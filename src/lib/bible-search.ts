// lib/bible-search.ts
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Bible verse lookup and search.
// ✅ bible-api.com — FREE, no key needed (KJV / ASV)
// 🔑 scripture.api.bible — FREE key, more translations
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export interface BibleResult {
    title: string;  // e.g. "John 3:16"
    description: string;  // verse text
    link: string;  // BibleGateway URL
    source: string;
    type: "bible";
    translation?: string;
}

// Detect Bible references: "John 3:16", "Psalm 23", "1 John 4:8"
export function isBibleRef(text: string): boolean {
    return /^(1\s*|2\s*|3\s*)?[a-zA-Z]+\s+\d{1,3}(:\d{1,3}(-\d{1,3})?)?$/i.test(text.trim());
}

// Build BibleGateway URL (always works, no API key)
export function bibleGatewayUrl(ref: string, version = "KJV"): string {
    return `https://www.biblegateway.com/passage/?search=${encodeURIComponent(ref)}&version=${version}`;
}

// Lookup a single verse from bible-api.com (no key needed)
export async function lookupBibleVerse(reference: string): Promise<BibleResult | null> {
    // Normalise: "John 3:16" → "john+3:16"
    const slug = reference.trim().toLowerCase().replace(/\s+/g, "+");

    const urls = [
        `https://bible-api.com/${slug}?translation=kjv`,
        `https://bible-api.com/${slug}`,  // fallback without translation param
    ];

    for (const url of urls) {
        try {
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), 6000);
            const res = await fetch(url, { signal: controller.signal });
            clearTimeout(timeout);

            if (!res.ok) continue;
            const data = await res.json();
            if (data.error) continue;

            // Could be a single verse or multi-verse passage
            const text = data.text?.trim() ||
                data.verses?.map((v: any) => v.text?.trim()).join(" ") || "";

            if (!text) continue;

            return {
                title: data.reference || reference,
                description: text,
                link: bibleGatewayUrl(data.reference || reference),
                source: "Holy Bible · KJV",
                type: "bible",
                translation: "KJV",
            };
        } catch { /* try next URL */ }
    }

    // Final fallback — return a gateway link even if API fails
    return {
        title: reference,
        description: `Click to read ${reference} on BibleGateway.com`,
        link: bibleGatewayUrl(reference),
        source: "BibleGateway.com",
        type: "bible",
    };
}

// Popular verses for keyword search (instant, no API call)
const POPULAR_VERSES: Record<string, string> = {
    "love": "For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life. — John 3:16",
    "faith": "Now faith is the substance of things hoped for, the evidence of things not seen. — Hebrews 11:1",
    "strength": "I can do all things through Christ which strengtheneth me. — Philippians 4:13",
    "peace": "And the peace of God, which passeth all understanding, shall keep your hearts and minds through Christ Jesus. — Philippians 4:7",
    "hope": "For I know the thoughts that I think toward you, saith the LORD, thoughts of peace, and not of evil, to give you an expected end. — Jeremiah 29:11",
    "grace": "For by grace are ye saved through faith; and that not of yourselves: it is the gift of God. — Ephesians 2:8",
    "israel": "Pray for the peace of Jerusalem: they shall prosper that love thee. — Psalm 122:6",
    "prayer": "Ask, and it shall be given you; seek, and ye shall find; knock, and it shall be opened unto you. — Matthew 7:7",
    "healing": "He healeth the broken in heart, and bindeth up their wounds. — Psalm 147:3",
    "wisdom": "If any of you lack wisdom, let him ask of God, that giveth to all men liberally, and upbraideth not; and it shall be given him. — James 1:5",
    "fear": "Fear thou not; for I am with thee: be not dismayed; for I am thy God: I will strengthen thee. — Isaiah 41:10",
    "worry": "Be careful for nothing; but in every thing by prayer and supplication with thanksgiving let your requests be made known unto God. — Philippians 4:6",
    "salvation": "For God sent not his Son into the world to condemn the world; but that the world through him might be saved. — John 3:17",
    "joy": "Rejoice in the Lord alway: and again I say, Rejoice. — Philippians 4:4",
    "trust": "Trust in the LORD with all thine heart; and lean not unto thine own understanding. — Proverbs 3:5",
    "forgiveness": "If we confess our sins, he is faithful and just to forgive us our sins, and to cleanse us from all unrighteousness. — 1 John 1:9",
    "heaven": "Let not your heart be troubled: ye believe in God, believe also in me. In my Father's house are many mansions. — John 14:1-2",
    "war": "For the LORD your God is he that goeth with you, to fight for you against your enemies, to save you. — Deuteronomy 20:4",
    "persecution": "Blessed are they which are persecuted for righteousness' sake: for theirs is the kingdom of heaven. — Matthew 5:10",
};

// Search Bible by keyword — returns relevant verses
export function searchBibleByKeyword(query: string): BibleResult[] {
    const q = query.toLowerCase();
    const results: BibleResult[] = [];

    for (const [keyword, text] of Object.entries(POPULAR_VERSES)) {
        if (q.includes(keyword) || keyword.includes(q.split(" ")[0] ?? "")) {
            const [verseText, ref] = text.split(" — ").reverse();
            const reference = ref || keyword;
            results.push({
                title: reference,
                description: (verseText || text).trim(),
                link: bibleGatewayUrl(reference),
                source: "Holy Bible · KJV",
                type: "bible",
                translation: "KJV",
            });
        }
    }

    return results;
}
