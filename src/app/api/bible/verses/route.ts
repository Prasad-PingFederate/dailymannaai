import { NextResponse } from "next/server";
import { getCosmosContainer } from "@/lib/cosmos";
import { getAstraDb } from "@/lib/astra";
import * as fs from 'fs';
import * as path from 'path';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const bookRaw = searchParams.get("book")?.trim() || "";
        
        // Canonical book name map — guarantees exact DB match for ALL 66 books
        const CANONICAL_BOOKS: Record<string, string> = {
            // Old Testament
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
            // New Testament
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

        // LOGGING FOR FUTURE MONITORING
        console.log(`[BIBLE_API] Request: ${book} ${chapter} (Translation: ${translationRaw})`);

        if (!book || !chapter) {
            return NextResponse.json({ error: "Book and Chapter are required" }, { status: 400 });
        }

        // VERSION RESOLVER: Maps legacy UI IDs to actual DB Version Codes
        const VERSION_RESOLVER: Record<string, string> = {
            'tl': 'TGLULB',
            'th': 'THAKJV',
            'ja': 'JPN1965',
            'vi': 'VIE1934',
            'my': 'MYA',
            'it': 'ITA1927',
            'pl': 'POLUBG',
            'tr': 'TURYTC',
            'ro': 'RONBTF',
            'sw': 'SWHONEN',
            'nl': 'NLDNBG',
            'uk': 'UKR1871',
            'sv': 'SWE',
            'fi': 'FINPR',
            'da': 'DAN1931',
            'cs': 'CES1613',
            'hr': 'HRV',
            'sr': 'SRP1865',
            'la': 'LATVUC',
            'et': 'EKK',
            'lt': 'LIT',
            'eo': 'EPO',
            'ru': 'RUSSYN',
            'ko': 'KOR',
            'de': 'DEUTKW',
            'fr': 'FRANCL',
            'pt': 'PORONBV',
            'zh': 'ZH',
            'es': 'SPARV1909',
            'ar': 'ARBNAV',
            'el': 'GRCMT',
            'he': 'HEBSG',
            'grc': 'GRCLXX',
            'hbo': 'HBOWLC',
            'syr': 'SYR',
            'got': 'GOT',
            'cop': 'COP',
            'cu': 'CU',
            'pck': 'PCK',
            'pes-xml': 'PESOPV',
            'arb-xml': 'ARBNAV',
            'my-xml': 'MYA',
            'tl-xml': 'TGLULB',
            'tr-xml': 'TURYTC',
            'hindi': 'HIN2017',
            'hi': 'HIN2017',
            'bengali': 'BENIRV',
            'bn': 'BENIRV',
            'kannada': 'KANIRV',
            'kn': 'KANIRV',
            'telugu': 'TEL2017',
            'te': 'TEL2017',
            'tamil': 'TAM2017',
            'ta': 'TAM2017',
            'malayalam': 'MALIRV',
            'ml': 'MALIRV',
            'gujarati': 'GUJIRV',
            'gu': 'GUJIRV',
            'marathi': 'MARIRV',
            'mr': 'MARIRV',
            'punjabi': 'PANIRV',
            'pa': 'PANIRV',
            'oriya': 'ORIIRV',
            'or': 'ORIIRV',
            'nepali': 'NPIULB',
            'indonesian': 'IND',
            'english': 'ENG-WEB-C',
            'afrikaans': 'AFR1953',
            'sq': 'ALB',
            'nb': 'NOB',
            'lv': 'LAT',
            'eu': 'EUS',
            'mi': 'MAO',
            'ctu': 'CTUBL',
            'kyg': 'KYG',
            'dww': 'DWW',
            'isl': 'ISL',
            'kgf': 'KGF',
            'ssd': 'SSD',
            'cesnb': 'CESLB',
            'cesnkb': 'CESNKB',
        };

        const translation = VERSION_RESOLVER[translationRaw] || translationRaw.toUpperCase();
        
        // Helper to fetch from local JSON fallback files if DB fails
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
                        // Check book, chapter AND version (if in the big translations file)
                        const matchesBook = verseObj.book?.toLowerCase() === bookName.toLowerCase();
                        const matchesChapter = verseObj.chapter === chapterNum;
                        
                        if (matchesBook && matchesChapter) {
                            if (filename === 'bible_translations_export.json') {
                                // For the general file, try to match the version string (e.g. "BENGALI", "HINDI")
                                // or the targetVer code if it's stored there.
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

        // ------------------------------------------------------------------------
        // CHANGED TO COSMOS DB
        // ------------------------------------------------------------------------
        // We no longer query split collections like `bible_ar` vs `bible_kjv`.
        // Cosmos DB contains ALL verses in the single `verses` container!
        
        // SMART FALLBACK SYSTEM: Combine fragments (e.g. Greek LXX + NT)
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
        let dataSource = "AstraDB";

        // 1. PRIMARY SOURCE: ASTRA DB (80GB Data Source)
        console.log(`[BIBLE_API] Querying Astra DB: ${book} ${chapter} (Version: ${PRIMARY_VERSION})`);
        try {
            const astraDb = getAstraDb();
            const astraColl = astraDb.collection('bible_verses');
            
            const astraRes = await astraColl.find({
                book: book.toUpperCase(),
                chapter: chapter,
                version: PRIMARY_VERSION.toUpperCase()
            }).toArray();

            if (astraRes && astraRes.length > 0) {
                result = astraRes;
                console.log(`[BIBLE_API] Astra DB SUCCESS! Found ${result.length} verses.`);
            }
        } catch (err) {
            console.warn("[BIBLE_API] Astra DB Primary query failed:", err);
        }

        // 2. SECONDARY SOURCE: COSMOS DB (Fallback)
        if (result.length === 0) {
            console.log(`[BIBLE_API] Astra empty/failed. Attempting Cosmos DB Fallback...`);
            try {
                const container = getCosmosContainer("BibleDatabase", "verses");
                for (const targetVer of versionTries) {
                    console.log(`[BIBLE_API] Querying Cosmos Fallback: ${book} ${chapter} (Version: ${targetVer})`);
                    try {
                        const querySpec = {
                            query: "SELECT * FROM c WHERE UPPER(c.book) = @book AND c.chapter = @chapter AND c.version = @version",
                            parameters: [
                                { name: "@book", value: book.toUpperCase() },
                                { name: "@chapter", value: chapter },
                                { name: "@version", value: targetVer }
                            ]
                        };

                        const { resources: currentResult } = await container.items.query(querySpec, { 
                            partitionKey: targetVer,
                            maxItemCount: 200 
                        }).fetchAll();

                        if (currentResult && currentResult.length > 0) {
                            result = currentResult;
                            finalResolvedVersion = targetVer;
                            dataSource = "CosmosDB";
                            break; 
                        }
                    } catch (cosmosError) {
                        console.warn(`[BIBLE_API] Cosmos Fallback Failed for ${targetVer}:`, cosmosError);
                    }
                }
            } catch (e) {
                console.error("[BIBLE_API] Cosmos Client Initialization Failed:", e);
            }
        }

        // 3. TERTIARY SOURCE: JSON FALLBACK
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

        // Manual sort by verse number locally
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
            url: req.url
        });
        return NextResponse.json({ 
            error: "Failed to load scripture content", 
            details: error.message,
            help: "Try selecting a different translation or verify if this book/chapter exists in this version."
        }, { status: 500 });
    }
}
