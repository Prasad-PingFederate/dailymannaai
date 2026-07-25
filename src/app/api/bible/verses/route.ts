import { NextResponse } from "next/server";
import { getDatabase } from "@/lib/mongodb";
import * as fs from 'fs';
import * as path from 'path';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const bookRaw = searchParams.get("book")?.trim() || "";
        
        const CANONICAL_BOOKS: Record<string, string> = {
            'genesis': 'Genesis', 'exodus': 'Exodus', 'leviticus': 'Leviticus',
            'numbers': 'Numbers', 'deuteronomy': 'Deuteronomy', 'joshua': 'Joshua',
            'judges': 'Judges', 'ruth': 'Ruth', '1 samuel': '1 Samuel', '2 samuel': '2 Samuel',
            '1 kings': '1 Kings', '2 kings': '2 Kings', '1 chronicles': '1 Chronicles',
            '2 chronicles': '2 Chronicles', 'ezra': 'Ezra', 'nehemiah': 'Nehemiah',
            'esther': 'Esther', 'job': 'Job', 'psalms': 'Psalms', 'proverbs': 'Proverbs',
            'ecclesiastes': 'Ecclesiastes', 'song of solomon': 'Song of Solomon',
            'isaiah': 'Isaiah', 'jeremiah': 'Jeremiah', 'lamentations': 'Lamentations',
            'ezekiel': 'Ezekiel', 'daniel': 'Daniel', 'hosea': 'Hosea', 'joel': 'Joel',
            'amos': 'Amos', 'obadiah': 'Obadiah', 'jonah': 'Jonah', 'micah': 'Micah',
            'nahum': 'Nahum', 'habakkuk': 'Habakkuk', 'zephaniah': 'Zephaniah',
            'haggai': 'Haggai', 'zechariah': 'Zechariah', 'malachi': 'Malachi',
            'matthew': 'Matthew', 'mark': 'Mark', 'luke': 'Luke', 'john': 'John',
            'acts': 'Acts', 'romans': 'Romans', '1 corinthians': '1 Corinthians',
            '2 corinthians': '2 Corinthians', 'galatians': 'Galatians', 'ephesians': 'Ephesians',
            'philippians': 'Philippians', 'colossians': 'Colossians',
            '1 thessalonians': '1 Thessalonians', '2 thessalonians': '2 Thessalonians',
            '1 timothy': '1 Timothy', '2 timothy': '2 Timothy', 'titus': 'Titus',
            'philemon': 'Philemon', 'hebrews': 'Hebrews', 'james': 'James',
            '1 peter': '1 Peter', '2 peter': '2 Peter',
            '1 john': '1 John', '2 john': '2 John', '3 john': '3 John',
            'jude': 'Jude', 'revelation': 'Revelation',
        };
        const book = CANONICAL_BOOKS[bookRaw.toLowerCase()] || bookRaw.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
        const chapter = parseInt(searchParams.get("chapter") || "0");
        const translationRaw = searchParams.get("translation")?.toLowerCase() || "kjv";

        console.log(`[BIBLE_API] Request: ${book} ${chapter} (Translation: ${translationRaw})`);

        if (!book || !chapter) {
            return NextResponse.json({ error: "Book and Chapter are required" }, { status: 400 });
        }

        const VERSION_RESOLVER: Record<string, string> = {
            'tl': 'TGLULB', 'th': 'THAKJV', 'ja': 'JPN1965', 'vi': 'VIE1934', 'my': 'MYA',
            'it': 'ITA1927', 'pl': 'POLUBG', 'tr': 'TURYTC', 'ro': 'RONBTF', 'sw': 'SWHONEN',
            'nl': 'NLDNBG', 'uk': 'UKR1871', 'sv': 'SWE', 'fi': 'FINPR', 'da': 'DAN1931',
            'cs': 'CES1613', 'hr': 'HRV', 'sr': 'SRP1865', 'la': 'LATVUC', 'et': 'EKK',
            'lt': 'LIT', 'eo': 'EPO', 'ru': 'RUSSYN', 'ko': 'KOR', 'de': 'DEUTKW',
            'fr': 'FRANCL', 'pt': 'PORONBV', 'zh': 'ZH', 'es': 'SPARV1909', 'ar': 'ARBNAV',
            'el': 'GRCMT', 'he': 'HEBSG', 'grc': 'GRCLXX', 'hbo': 'HBOWLC', 'syr': 'SYR',
            'got': 'GOT', 'cop': 'COP', 'cu': 'CU', 'pck': 'PCK', 'pes-xml': 'PESOPV',
            'arb-xml': 'ARBNAV', 'my-xml': 'MYA', 'tl-xml': 'TGLULB', 'tr-xml': 'TURYTC',
            'hindi': 'HIN2017', 'hi': 'HIN2017', 'bengali': 'BENIRV', 'bn': 'BENIRV',
            'kannada': 'KANIRV', 'kn': 'KANIRV', 'telugu': 'TEL2017', 'te': 'TEL2017',
            'tamil': 'TAM2017', 'ta': 'TAM2017', 'malayalam': 'MALIRV', 'ml': 'MALIRV',
            'gujarati': 'GUJIRV', 'gu': 'GUJIRV', 'marathi': 'MARIRV', 'mr': 'MARIRV',
            'punjabi': 'PANIRV', 'pa': 'PANIRV', 'oriya': 'ORIIRV', 'or': 'ORIIRV',
            'nepali': 'NPIULB', 'indonesian': 'IND', 'english': 'ENG-WEB-C', 'afrikaans': 'AFR1953',
            'sq': 'ALB', 'nb': 'NOB', 'lv': 'LAT', 'eu': 'EUS', 'mi': 'MAO',
            'ctu': 'CTUBL', 'kyg': 'KYG', 'dww': 'DWW', 'isl': 'ISL', 'kgf': 'KGF',
            'ssd': 'SSD', 'cesnb': 'CESLB', 'cesnkb': 'CESNKB',
        };

        const translation = VERSION_RESOLVER[translationRaw] || translationRaw.toUpperCase();
        
        const getVersesFromLocalJson = (targetVer: string, bookName: string, chapterNum: number) => {
            const VERSION_TO_FILE: Record<string, string> = {
                'SPARV1909': 'bible_es_export.json',
                'ARBNAV': 'bible_ar_export.json',
                'FRANCL': 'bible_fr_export.json',
                'ITB': 'bible_id_export.json',
                'KJV': 'bible_kjv_export.json',
                'NIV': 'bible_niv_export.json',
                'NKJV': 'bible_nkjv_export.json',
                'PORONBV': 'bible_pt_export.json',
                'ZH': 'bible_zh_export.json'
            };

            try {
                const filename = VERSION_TO_FILE[targetVer] || 'bible_translations_export.json';
                const filePath = path.join(process.cwd(), filename);
                
                if (!fs.existsSync(filePath)) return null;

                const content = fs.readFileSync(filePath, 'utf-8');
                const lines = content.split('\n');
                const localVerses: any[] = [];

                for (const line of lines) {
                    if (!line.trim()) continue;
                    try {
                        const verseObj = JSON.parse(line);
                        const matchesBook = verseObj.book?.toLowerCase() === bookName.toLowerCase();
                        const matchesChapter = verseObj.chapter === chapterNum;
                        
                        if (matchesBook && matchesChapter) {
                            if (filename === 'bible_translations_export.json') {
                                if (verseObj.version?.toUpperCase() === targetVer.toUpperCase() || 
                                    verseObj.version?.toUpperCase() === translationRaw.toUpperCase()) {
                                    localVerses.push(verseObj);
                                }
                            } else {
                                localVerses.push(verseObj);
                            }
                        }
                    } catch (e) { continue; }
                }
                return localVerses.length > 0 ? localVerses.sort((a, b) => (a.verse || 0) - (b.verse || 0)) : null;
            } catch (err) {
                console.error(`[BIBLE_API] JSON Fallback Error:`, err);
                return null;
            }
        };

        const PRIMARY_VERSION = translation;
        const FALLBACK_STRATEGY: Record<string, string[]> = {
            'GRCMT': ['GRCLXX', 'GRC-TISCH', 'GRCTCGNT', 'GRCSBL'],
            'GRCLXX': ['GRCMT', 'GRC-TISCH', 'GRCTCGNT', 'GRCSBL'],
            'HEBSG': ['HBOWLC', 'HEBWLC'],
            'HBOWLC': ['HEBSG', 'HEBLB', 'HEGNTPO'],
            'LATVUC': ['LAT'],
            'ARBNAV': ['ARB-VD', 'ARB-XML'],
            'MYA': ['MYAJVB', 'MYK', 'MYW', 'MYY'],
            'TGLULB': ['TGLB'],
            'TURYTC': ['TUR', 'UTR'],
        };

        const versionTries = [PRIMARY_VERSION, ...(FALLBACK_STRATEGY[PRIMARY_VERSION] || [])];
        
        let result: any[] = [];
        let finalResolvedVersion = PRIMARY_VERSION;
        let dataSource = "MongoDB";

        // 1. PRIMARY SOURCE: MongoDB
        try {
            console.log(`[BIBLE_API] Connecting to MongoDB...`);
            const db = await getDatabase();
            
            // Try both 'bible_verses' and 'verses' collections
            const collectionsToTry = ['bible_verses', 'verses'];
            
            for (const collName of collectionsToTry) {
                const collection = db.collection(collName);
                
                for (const targetVer of versionTries) {
                    console.log(`[BIBLE_API] Querying MongoDB ${collName}: ${book} ${chapter} (Version: ${targetVer})`);
                    
                    const mongoRes = await collection.find({
                        book: book.toUpperCase(),
                        chapter: chapter,
                        version: targetVer
                    }).toArray();

                    if (mongoRes && mongoRes.length > 0) {
                        result = mongoRes;
                        finalResolvedVersion = targetVer;
                        console.log(`[BIBLE_API] MongoDB SUCCESS in ${collName}! Found ${result.length} verses.`);
                        break;
                    }
                }
                
                if (result.length > 0) break;
            }
            
        } catch (err: any) {
            console.warn("[BIBLE_API] MongoDB query failed:", err.message);
        }

        // 2. FALLBACK SOURCE: Local JSON files
        if (result.length === 0) {
            console.log(`[BIBLE_API] No DB results. Attempting JSON Fallback for ${book} ${chapter}`);
            const localVerses = getVersesFromLocalJson(PRIMARY_VERSION, book, chapter);
            if (localVerses) {
                result = localVerses;
                finalResolvedVersion = PRIMARY_VERSION;
                dataSource = "LocalJSON";
                console.log(`[BIBLE_API] JSON Fallback SUCCESS!`);
            }
        }

        if (result.length === 0) {
            console.warn(`[BIBLE_API] No verses found for ${book} ${chapter} in ${PRIMARY_VERSION} (including JSON fallback)`);
        } else {
            console.log(`[BIBLE_API] Success! Found ${result.length} verses in ${finalResolvedVersion} from ${dataSource}.`);
        }

        result.sort((a: any, b: any) => (a.verse || 0) - (b.verse || 0));

        return NextResponse.json({ 
            verses: result,
            meta: {
                resolvedVersion: finalResolvedVersion,
                requestedVersion: PRIMARY_VERSION,
                isFallback: finalResolvedVersion !== PRIMARY_VERSION,
                requestedBook: book,
                requestedChapter: chapter,
                db: dataSource,
                count: result.length,
                timestamp: new Date().toISOString()
            }
        });
    } catch (error: any) {
        console.error("Bible Fetch Error Details:", {
            message: error.message,
            stack: error.stack,
        });
        return NextResponse.json({ 
            error: "Failed to load scripture content", 
            details: error.message,
            help: "Try selecting a different translation or verify if this book/chapter exists in this version."
        }, { status: 500 });
    }
}
