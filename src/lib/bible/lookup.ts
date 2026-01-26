import kjvData from './data/kjv.json';

export interface BibleVerse {
    pk: number;
    model: string;
    fields: {
        chapter: number;
        text: string;
        verse: number;
        book_id: number;
        comment: string;
    }
}

const BOOK_MAP: Record<string, number> = {
    "genesis": 1, "gen": 1,
    "exodus": 2, "exo": 2, "ex": 2,
    "leviticus": 3, "lev": 3,
    "numbers": 4, "num": 4,
    "deuteronomy": 5, "deu": 5, "dt": 5,
    "joshua": 6, "jos": 6,
    "judges": 7, "jdg": 7,
    "ruth": 8, "rut": 8,
    "1 samuel": 9, "1sa": 9,
    "2 samuel": 10, "2sa": 10,
    "1 kings": 11, "1ki": 11,
    "2 kings": 12, "2ki": 12,
    "1 chronicles": 13, "1ch": 13,
    "2 chronicles": 14, "2ch": 14,
    "ezra": 15, "ezr": 15,
    "nehemiah": 16, "neh": 16,
    "esther": 17, "est": 17,
    "job": 18,
    "psalms": 19, "psm": 19, "ps": 19,
    "proverbs": 20, "pro": 20, "pr": 20,
    "ecclesiastes": 21, "ecc": 21,
    "song of solomon": 22, "sos": 22, "song": 22,
    "isaiah": 23, "isa": 23,
    "jeremiah": 24, "jer": 24,
    "lamentations": 25, "lam": 25,
    "ezekiel": 26, "eze": 26,
    "daniel": 27, "dan": 27,
    "hosea": 28, "hos": 28,
    "joel": 29, "joe": 29,
    "amos": 30, "amo": 30,
    "obadiah": 31, "oba": 31,
    "jonah": 32, "jon": 32,
    "micah": 33, "mic": 33,
    "nahum": 34, "nah": 34,
    "habakkuk": 35, "hab": 35,
    "zephaniah": 36, "zep": 36,
    "haggai": 37, "hag": 37,
    "zechariah": 38, "zec": 38,
    "malachi": 39, "mal": 39,
    "matthew": 40, "mat": 40, "mt": 40,
    "mark": 41, "mrk": 41, "mk": 41,
    "luke": 42, "luk": 42, "lk": 42,
    "john": 43, "jhn": 43, "jn": 43,
    "acts": 44, "act": 44,
    "romans": 45, "rom": 45, "ro": 45,
    "1 corinthians": 46, "1co": 46,
    "2 corinthians": 47, "2co": 47,
    "galatians": 48, "gal": 48, "ga": 48,
    "ephesians": 49, "eph": 49,
    "philippians": 50, "phi": 50, "php": 50,
    "colossians": 51, "col": 51,
    "1 thessalonians": 52, "1th": 52,
    "2 thessalonians": 53, "2th": 53,
    "1 timothy": 54, "1ti": 54,
    "2 timothy": 55, "2ti": 55,
    "titus": 56, "tit": 56,
    "philemon": 57, "phm": 57,
    "hebrews": 58, "heb": 58,
    "james": 59, "jam": 59, "jas": 59,
    "1 peter": 60, "1pe": 60,
    "2 peter": 61, "2pe": 61,
    "1 john": 62, "1jn": 62,
    "2 john": 63, "2jn": 63,
    "3 john": 64, "3jn": 64,
    "jude": 65,
    "revelation": 66, "rev": 66
};

/**
 * Parses a reference like "Matthew 1:1", "matthew:1:1", "1 John 1:1-10", "john1-10"
 */
export function parseVerseReference(ref: string) {
    const original = ref.toLowerCase().trim();
    // 1. Clean query: remove prefixes like "show", "read", "tell me about"
    let clean = original
        .replace(/^(show|read|lookup|give me|find)\s+/i, '')
        .replace(/:/g, ' ');

    // 2. Handle compressed "john1:1" -> "john 1 1"
    // Insert spaces between letters and numbers if missing
    clean = clean.replace(/([a-z])(\d)/g, '$1 $2');

    // Check if there's a hyphen in the original after the prefix
    const hasHyphen = original.includes('-');

    const parts = clean.split(/[\s-]+/); // Split by space or hyphen

    if (parts.length < 2) return null;

    let bookName = "";
    let chapter = 0;
    let startVerse = 0;
    let endVerse = 0;

    if (!isNaN(parseInt(parts[0])) && parts.length >= 3) {
        // "1 John 2 1" or "1 John 2 1 10"
        bookName = `${parts[0]} ${parts[1]}`;
        chapter = parseInt(parts[2]);
        startVerse = parseInt(parts[3]);
        if (parts.length >= 5) endVerse = parseInt(parts[4]);
    } else {
        // "Matthew 1 1" or "John 1 1 10" or "John 1 10"
        bookName = parts[0];
        if (!isNaN(parseInt(parts[1]))) {
            chapter = parseInt(parts[1]);
        }

        if (parts.length === 3) {
            if (hasHyphen) {
                // "John 1-10" -> Interpret as Chapter 1, Verses 1 to 10
                startVerse = 1;
                endVerse = parseInt(parts[2]);
            } else {
                startVerse = parseInt(parts[2]);
            }
        } else if (parts.length >= 4) {
            startVerse = parseInt(parts[2]);
            endVerse = parseInt(parts[3]);
        }
    }

    const bookId = BOOK_MAP[bookName] || BOOK_MAP[bookName.replace(/\s/g, '')];

    if (!bookId || isNaN(chapter)) return null;

    // Default to verse 1 if not specified
    if (!startVerse && !endVerse) startVerse = 1;

    return { bookId, chapter, startVerse: startVerse || 1, endVerse: endVerse || startVerse || 0 };
}

export function getVerseRange(bookId: number, chapter: number, start: number, end: number): string[] {
    const verses = (kjvData as BibleVerse[]).filter(v =>
        v.fields.book_id === bookId &&
        v.fields.chapter === chapter &&
        v.fields.verse >= start &&
        (end === 0 ? v.fields.verse === start : v.fields.verse <= end)
    );
    return verses.sort((a, b) => a.fields.verse - b.fields.verse).map(v => `${v.fields.verse} ${v.fields.text}`);
}

export function lookupBibleReference(query: string): string | null {
    const parsed = parseVerseReference(query);
    if (!parsed) return null;

    const verses = getVerseRange(parsed.bookId, parsed.chapter, parsed.startVerse, parsed.endVerse);
    if (verses.length === 0) return null;

    // Get book name for back-reference
    const bookName = Object.keys(BOOK_MAP).find(key => BOOK_MAP[key] === parsed.bookId && key.length > 3);
    const capitalizedBook = bookName ? bookName.split(' ').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(' ') : "Scripture";

    const title = parsed.endVerse > parsed.startVerse
        ? `${capitalizedBook} ${parsed.chapter}:${parsed.startVerse}-${parsed.endVerse} (KJV)`
        : `${capitalizedBook} ${parsed.chapter}:${parsed.startVerse} (KJV)`;

    return `**${title}**\n\n${verses.map(v => `> ${v}`).join('\n>\n')}`;
}
