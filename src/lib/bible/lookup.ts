// import kjvData from './data/kjv.json'; // Lazy loaded now
import { getDatabase } from "@/lib/mongodb";

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

const ID_TO_BOOK: Record<number, string> = {
    1: "Genesis", 2: "Exodus", 3: "Leviticus", 4: "Numbers", 5: "Deuteronomy",
    6: "Joshua", 7: "Judges", 8: "Ruth", 9: "1 Samuel", 10: "2 Samuel",
    11: "1 Kings", 12: "2 Kings", 13: "1 Chronicles", 14: "2 Chronicles",
    15: "Ezra", 16: "Nehemiah", 17: "Esther", 18: "Job", 19: "Psalms",
    20: "Proverbs", 21: "Ecclesiastes", 22: "Song of Solomon", 23: "Isaiah",
    24: "Jeremiah", 25: "Lamentations", 26: "Ezekiel", 27: "Daniel",
    28: "Hosea", 29: "Joel", 30: "Amos", 31: "Obadiah", 32: "Jonah",
    33: "Micah", 34: "Nahum", 35: "Habakkuk", 36: "Zephaniah", 37: "Haggai",
    38: "Zechariah", 39: "Malachi", 40: "Matthew", 41: "Mark", 42: "Luke",
    43: "John", 44: "Acts", 45: "Romans", 46: "1 Corinthians", 47: "2 Corinthians",
    48: "Galatians", 49: "Ephesians", 50: "Philippians", 51: "Colossians",
    52: "1 Thessalonians", 53: "2 Thessalonians", 54: "1 Timothy", 55: "2 Timothy",
    56: "Titus", 57: "Philemon", 58: "Hebrews", 59: "James", 60: "1 Peter",
    61: "2 Peter", 62: "1 John", 63: "2 John", 64: "3 John", 65: "Jude",
    66: "Revelation"
};

/**
 * Parses a reference like "Matthew 1:1", "matthew:1:1", "1 John 1:1-10", "john1-10"
 */
/**
 * Parses a reference like "Matthew 1:1", "matthew:1:1", "1 John 1:1-10", "john1-10"
 * Also attempts to find a reference within a sentence.
 */
export function parseVerseReference(ref: string) {
    const original = ref.toLowerCase().trim();

    // 1. CRITICAL: Remove fluff words that break the parser
    let clean = original
        .replace(/\b(what is|chapter|verse|the book of|lookup|tell me about|where is|read|show me|give me|find)\b/g, '')
        .replace(/:/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();

    // 2. Handle compressed "john1:1" -> "john 1 1"
    clean = clean.replace(/([a-z])(\d)/g, '$1 $2');

    // Check if there's a hyphen in the original for ranges
    const hasHyphen = original.includes('-');

    const parts = clean.split(/[\s-]+/);

    if (parts.length < 1) return null;

    let bookName = "";
    let chapter = 0;
    let startVerse = 0;
    let endVerse = 0;
    let foundRef = false;

    // Search for a Book name anywhere in the cleaned string
    for (let i = 0; i < parts.length; i++) {
        let currentBook = parts[i];
        let nextIndex = i + 1;

        // Handle numbered books like "1 John"
        if ((currentBook === '1' || currentBook === '2' || currentBook === '3' ||
            currentBook === 'i' || currentBook === 'ii' || currentBook === 'iii') && parts[i + 1]) {

            // Normalize i, ii, iii to 1, 2, 3
            let num = currentBook;
            if (num === 'i') num = '1';
            if (num === 'ii') num = '2';
            if (num === 'iii') num = '3';

            currentBook = `${num} ${parts[i + 1]}`;
            nextIndex = i + 2;
        }

        const bookId = BOOK_MAP[currentBook] || BOOK_MAP[currentBook.replace(/\s/g, '')];

        if (bookId && parts[nextIndex] && !isNaN(parseInt(parts[nextIndex]))) {
            bookName = currentBook;
            chapter = parseInt(parts[nextIndex]);

            // Look for verse numbers after the chapter
            if (parts[nextIndex + 1] && !isNaN(parseInt(parts[nextIndex + 1]))) {
                startVerse = parseInt(parts[nextIndex + 1]);

                // Look for range "1-10"
                if (parts[nextIndex + 2] && !isNaN(parseInt(parts[nextIndex + 2]))) {
                    endVerse = parseInt(parts[nextIndex + 2]);
                }
            } else if (hasHyphen && parts[nextIndex + 1] && !isNaN(parseInt(parts[nextIndex + 1]))) {
                // Handle "John 1-10" as chapter/verse if no verse was specified
                startVerse = 1;
                endVerse = parseInt(parts[nextIndex + 1]);
            }

            if (!startVerse) startVerse = 1;
            foundRef = true;
            break;
        }
    }

    const bookId = BOOK_MAP[bookName] || BOOK_MAP[bookName.replace(/\s/g, '')];
    if (!foundRef || !bookId || isNaN(chapter)) return null;

    // Determine if this was a direct "shorthand" query or a long sentence
    const isDirectLookup = /^(show|read|lookup|give me|find)?\s*([123]?\s*[a-z]+)\s*\d+([: ]\d+)?([-\s]\d+)?$/i.test(original.replace(/\b(what is|chapter|verse)\b/g, '').trim());

    return { bookId, chapter, startVerse: startVerse || 1, endVerse: endVerse || startVerse || 0, isDirectLookup };
}


export async function getVerseRange(bookId: number, chapter: number, start: number, end: number): Promise<string[]> {
    try {
        const db = await getDatabase();
        const bookName = ID_TO_BOOK[bookId];

        if (!bookName) return [];

        const query: any = {
            book: bookName,
            chapter: chapter,
            verse: { $gte: start }
        };

        if (end !== 0 && end !== start) {
            query.verse.$lte = end;
        } else if (end === start || end === 0) {
            query.verse = start;
        }

        console.log(`[BibleLookup] Querying MongoDB for: ${bookName} ${chapter}:${start}${end ? '-' + end : ''}`);

        const verses = await db.collection('bible_kjv')
            .find(query)
            .sort({ verse: 1 })
            .toArray();

        return verses.map(v => `${v.verse} ${v.text}`);
    } catch (error) {
        console.error("[BibleLookup] MongoDB Error:", error);
        return [];
    }
}

export async function lookupBibleReference(query: string): Promise<string | null> {
    const parsed = parseVerseReference(query);
    if (!parsed) return null;

    const verses = await getVerseRange(parsed.bookId, parsed.chapter, parsed.startVerse, parsed.endVerse);
    if (verses.length === 0) return null;

    // Get canonical book name
    const bookName = ID_TO_BOOK[parsed.bookId] || "Scripture";

    const title = parsed.endVerse > parsed.startVerse
        ? `${bookName} ${parsed.chapter}:${parsed.startVerse}-${parsed.endVerse} (KJV)`
        : `${bookName} ${parsed.chapter}:${parsed.startVerse} (KJV)`;

    return `**${title}**\n\n${verses.map(v => `> ${v}`).join('\n>\n')}`;
}
