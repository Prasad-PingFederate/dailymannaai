// src/components/bible-explorer/BibleExplorer.tsx
"use client";

import React, { useState, useEffect, useRef } from 'react';
import { 
    Search, Book, Mic2, Sparkles, BookOpen, Share2, 
    ChevronLeft, ChevronRight, Volume2, Copy, Pin, 
    ExternalLink, Check, Heart, MessageSquare, Plus,
    User, ChevronDown, List, Settings, 
    Download, FileAudio, Clock, Flag, Globe, Info,
    Zap, Newspaper,
    PanelLeftClose, PanelLeftOpen,
    Maximize2, Minimize2,
    Type, Home
} from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/hooks/useAuth';
import VoiceInput from '@/components/notebook/VoiceInput';
import { useSearchParams } from 'next/navigation';

// --- HELPERS ---
const NT_ONLY_TRANSLATIONS = [
    'ja', 'fi', 'et', 'cop', 'isl', 'ctu', 'kyg', 'dww', 'syr', 'syrp', 'got', 'la', 'sq', 'afrikaans', 'jpn1965', 'copbhc', 'est', 'lav', 'alb', 'ks', 'nb', 'nn', 'lt', 'lv'
];

const getBookSlugVariants = (name: string): string[] => {
    const main = name.toLowerCase().trim().replace(/\s+/g, '-');
    const noSpace = name.toLowerCase().trim().replace(/\s+/g, '');
    const plain = name.toLowerCase().trim();
    
    const variants = [main, noSpace, plain, main.replace('-', ' ')];
    
    const leadingNumberMatch = name.match(/^(\d)\s+(.+)$/);
    if (leadingNumberMatch) {
        const [, number, rest] = leadingNumberMatch;
        const trailingVariant = `${rest.toLowerCase().replace(/\s+/g, '-')}-${number}`;
        variants.push(trailingVariant);
    }
    
    return Array.from(new Set(variants));
};

// --- DATA ---
const BIBLE_BOOKS = {
    OT: [
        { name: 'Genesis', abbr: 'Gen', chapters: 50 },
        { name: 'Exodus', abbr: 'Exo', chapters: 40 },
        { name: 'Leviticus', abbr: 'Lev', chapters: 27 },
        { name: 'Numbers', abbr: 'Num', chapters: 36 },
        { name: 'Deuteronomy', abbr: 'Deu', chapters: 34 },
        { name: 'Joshua', abbr: 'Jos', chapters: 24 },
        { name: 'Judges', abbr: 'Jdg', chapters: 21 },
        { name: 'Ruth', abbr: 'Rut', chapters: 4 },
        { name: '1 Samuel', abbr: '1Sa', chapters: 31 },
        { name: '2 Samuel', abbr: '2Sa', chapters: 24 },
        { name: '1 Kings', abbr: '1Ki', chapters: 22 },
        { name: '2 Kings', abbr: '2Ki', chapters: 25 },
        { name: '1 Chronicles', abbr: '1Ch', chapters: 29 },
        { name: '2 Chronicles', abbr: '2Ch', chapters: 36 },
        { name: 'Ezra', abbr: 'Ezr', chapters: 10 },
        { name: 'Nehemiah', abbr: 'Neh', chapters: 13 },
        { name: 'Esther', abbr: 'Est', chapters: 10 },
        { name: 'Job', abbr: 'Job', chapters: 42 },
        { name: 'Psalms', abbr: 'Psa', chapters: 150 },
        { name: 'Proverbs', abbr: 'Pro', chapters: 31 },
        { name: 'Ecclesiastes', abbr: 'Ecc', chapters: 12 },
        { name: 'Song of Solomon', abbr: 'Son', chapters: 8 },
        { name: 'Isaiah', abbr: 'Isa', chapters: 66 },
        { name: 'Jeremiah', abbr: 'Jer', chapters: 52 },
        { name: 'Lamentations', abbr: 'Lam', chapters: 5 },
        { name: 'Ezekiel', abbr: 'Eze', chapters: 48 },
        { name: 'Daniel', abbr: 'Dan', chapters: 12 },
        { name: 'Hosea', abbr: 'Hos', chapters: 14 },
        { name: 'Joel', abbr: 'Joe', chapters: 3 },
        { name: 'Amos', abbr: 'Amo', chapters: 9 },
        { name: 'Obadiah', abbr: 'Oba', chapters: 1 },
        { name: 'Jonah', abbr: 'Jon', chapters: 4 },
        { name: 'Micah', abbr: 'Mic', chapters: 7 },
        { name: 'Nahum', abbr: 'Nah', chapters: 3 },
        { name: 'Habakkuk', abbr: 'Hab', chapters: 3 },
        { name: 'Zephaniah', abbr: 'Zep', chapters: 3 },
        { name: 'Haggai', abbr: 'Hag', chapters: 2 },
        { name: 'Zechariah', abbr: 'Zec', chapters: 14 },
        { name: 'Malachi', abbr: 'Mal', chapters: 4 },
    ],
    NT: [
        { name: 'Matthew', abbr: 'Mat', chapters: 28 },
        { name: 'Mark', abbr: 'Mar', chapters: 16 },
        { name: 'Luke', abbr: 'Luk', chapters: 24 },
        { name: 'John', abbr: 'Joh', chapters: 21 },
        { name: 'Acts', abbr: 'Act', chapters: 28 },
        { name: 'Romans', abbr: 'Rom', chapters: 16 },
        { name: '1 Corinthians', abbr: '1Co', chapters: 16 },
        { name: '2 Corinthians', abbr: '2Co', chapters: 13 },
        { name: 'Galatians', abbr: 'Gal', chapters: 6 },
        { name: 'Ephesians', abbr: 'Eph', chapters: 6 },
        { name: 'Philippians', abbr: 'Phi', chapters: 4 },
        { name: 'Colossians', abbr: 'Col', chapters: 4 },
        { name: '1 Thessalonians', abbr: '1Th', chapters: 5 },
        { name: '2 Thessalonians', abbr: '2Th', chapters: 3 },
        { name: '1 Timothy', abbr: '1Ti', chapters: 6 },
        { name: '2 Timothy', abbr: '2Ti', chapters: 4 },
        { name: 'Titus', abbr: 'Tit', chapters: 3 },
        { name: 'Philemon', abbr: 'Phm', chapters: 1 },
        { name: 'Hebrews', abbr: 'Heb', chapters: 13 },
        { name: 'James', abbr: 'Jam', chapters: 5 },
        { name: '1 Peter', abbr: '1Pe', chapters: 5 },
        { name: '2 Peter', abbr: '2Pe', chapters: 3 },
        { name: '1 John', abbr: '1Jo', chapters: 5 },
        { name: '2 John', abbr: '2Jo', chapters: 1 },
        { name: '3 John', abbr: '3Jo', chapters: 1 },
        { name: 'Jude', abbr: 'Jud', chapters: 1 },
        { name: 'Revelation', abbr: 'Rev', chapters: 22 },
    ]
};



const parseSearchBookAndChapter = (query: string): { book: string; chapter: number } => {
    const normalized = query.trim().replace(/\s+/g, ' ');
    const parts = normalized.split(' ');

    if (parts.length === 0) {
        return { book: '', chapter: 1 };
    }

    const first = parts[0];
    const last = parts[parts.length - 1];

    // Handles "1 John 2" or "2 Peter"
    if (/^[1-3]$/.test(first)) {
        const chapterToken = parts[2];
        const chapter = Number.parseInt(chapterToken?.split(':')[0] || '1', 10) || 1;
        return { book: `${first} ${parts[1] || ''}`.trim(), chapter };
    }

    // Handles "John 3" and "Samuel 1"
    if (/^\d+(:\d+)?$/.test(last)) {
        const chapter = Number.parseInt(last.split(':')[0], 10) || 1;
        const book = parts.slice(0, -1).join(' ');

        // If this is a numbered book in reverse order (e.g., "Samuel 1"), normalize to "1 Samuel".
        if (/^[1-3]$/.test(last) && book) {
            return { book: `${last} ${book}`.trim(), chapter: 1 };
        }

        return { book, chapter };
    }

    return { book: parts[0], chapter: Number.parseInt(parts[1]?.split(':')[0] || '1', 10) || 1 };
};

export default function BibleExplorer({ 
    initialBookSlug = null, 
    initialChapter = null,
    initialTranslation = null
}: { 
    initialBookSlug?: string | null, 
    initialChapter?: number | null,
    initialTranslation?: string | null
}) {

    const { theme, isDark } = useTheme();
    const { user } = useAuth();
    
    // Synchronous Initialization for SSR & SEO
    let initTestament: 'OT' | 'NT' = 'OT';
    let initBook = null;
    let initChapter: number | null = initialChapter;
    let initExpandedBook = null;

    if (initialBookSlug) {
        const normalizedSlug = initialBookSlug.toLowerCase().trim();
        const foundInOT = BIBLE_BOOKS.OT.find((b) => getBookSlugVariants(b.name).includes(normalizedSlug));
        const foundInNT = BIBLE_BOOKS.NT.find((b) => getBookSlugVariants(b.name).includes(normalizedSlug));
        const found = foundInOT || foundInNT;
        
        if (found) {
            initTestament = foundInNT ? 'NT' : 'OT';
            initBook = found;
            initExpandedBook = found.name;
            if (initChapter === null) {
                initChapter = 1;
            }
        }
    }

    // State
    const [testament, setTestament] = useState<'OT' | 'NT'>(initTestament);
    const [currentBook, setCurrentBook] = useState<any>(initBook);
    const [currentChapter, setCurrentChapter] = useState<number | null>(initChapter);
    const [verses, setVerses] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [fetchError, setFetchError] = useState<string | null>(null);
    const [translation, setTranslation] = useState(initialTranslation || 'kjv');

    const [searchQuery, setSearchQuery] = useState('');
    const [highlightedVerse, setHighlightedVerse] = useState<number | null>(null);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    
    // New UX State for Space
    const [leftSidebarOpen, setLeftSidebarOpen] = useState(true);

    const [fontSize, setFontSize] = useState(19);
    const [isZenMode, setIsZenMode] = useState(false);
    
    // New UX State for Inline Chapters
    const [expandedBook, setExpandedBook] = useState<string | null>(initExpandedBook);
    const [showVersePopup, setShowVersePopup] = useState(false);
    const [popupVerse, setPopupVerse] = useState<number | null>(null);

    // Initial Deep Link Logic
    const searchParams = useSearchParams();
    
    useEffect(() => {
        // Deep link parameter for highlighted verse
        const verseFromQuery = searchParams ? parseInt(searchParams.get('head') || '0') : 0;
        
        // Client-side fallback if URL wasn't passed via props but is in window
        if (!initialBookSlug && typeof window !== 'undefined' && window.location.pathname.startsWith('/bible/')) {
            const slugFromWindow = window.location.pathname.replace('/bible/', '').split('/')[0];
            const normalizedSlug = slugFromWindow.toLowerCase().trim();
            const foundInOT = BIBLE_BOOKS.OT.find((b) => getBookSlugVariants(b.name).includes(normalizedSlug));
            const foundInNT = BIBLE_BOOKS.NT.find((b) => getBookSlugVariants(b.name).includes(normalizedSlug));
            const found = foundInOT || foundInNT;

            if (found && (!currentBook || currentBook.name !== found.name)) {
                setTestament(foundInNT ? 'NT' : 'OT');
                setCurrentBook(found);
                setExpandedBook(found.name);
                setCurrentChapter(initialChapter || 1);
            }
        }

        if (Number.isFinite(verseFromQuery) && verseFromQuery > 0) {
            setHighlightedVerse(verseFromQuery);
        }
    }, [initialBookSlug, initialChapter, searchParams, currentBook]);


    // Fetch Verses When Book/Chapter Changes
    useEffect(() => {
        // Auto-switch to Matthew if NT-only translation is selected on an OT book
        if (NT_ONLY_TRANSLATIONS.includes(translation)) {
            const isOT = BIBLE_BOOKS.OT.some(b => b.name === currentBook?.name);
            if (isOT) {
                const matthew = BIBLE_BOOKS.NT.find(b => b.name === "Matthew");
                if (matthew) {
                    setCurrentBook(matthew);
                    setCurrentChapter(1);
                    setTestament('NT');
                }
                return;
            }
        }

        if (currentBook && currentChapter) {
            fetchVerses(currentBook.name, currentChapter);
        }
    }, [currentBook, currentChapter, translation]);

    const fetchVerses = async (book: string, chapter: number) => {
        setLoading(true);
        setFetchError(null);
        try {
            const res = await fetch(`/api/bible/verses?book=${encodeURIComponent(book)}&chapter=${chapter}&translation=${translation}`);
            const data = await res.json();
            
            if (res.ok && data.verses) {
                setVerses(data.verses);
                if (data.verses.length === 0) {
                    setFetchError("NO_VERSES");
                }
            } else {
                setVerses([]);
                setFetchError(data.details || data.error || "Failed to load content");
            }
        } catch (error: any) {
            console.error("Bible Fetch Error:", error);
            setFetchError("System error connecting to Bible service.");
        } finally {
            setLoading(false);
        }
    };

    const handleBookSelect = (book: any) => {
        if (expandedBook === book.name) {
            setExpandedBook(null);
        } else {
            setExpandedBook(book.name);
        }
        
        if (currentBook?.name !== book.name) {
            setCurrentBook(book);
            setCurrentChapter(1);
            setVerses([]);
        }
    };

    const handleChapterSelect = (chapter: number) => {
        setCurrentChapter(chapter);
        setHighlightedVerse(null);
        setShowVersePopup(false);
        setIsMobileMenuOpen(false);
    };

    const nextChapter = () => {
        if (currentBook && currentChapter && currentChapter < currentBook.chapters) {
            setCurrentChapter(currentChapter + 1);
        }
    };

    const prevChapter = () => {
        if (currentBook && currentChapter && currentChapter > 1) {
            setCurrentChapter(currentChapter - 1);
        }
    };

    const handleSearch = (queryOverride?: string) => {
        const query = queryOverride || searchQuery;
        if (!query.trim()) return;
        
        // Supports "1 John", "John 3", and reverse-numbered books like "Samuel 1".
        const { book: bookMatch, chapter: chapterMatch } = parseSearchBookAndChapter(query);

        const allBooks = [...BIBLE_BOOKS.OT, ...BIBLE_BOOKS.NT];
        const foundBook = allBooks.find(b => b.name.toLowerCase() === bookMatch.toLowerCase() || b.abbr.toLowerCase() === bookMatch.toLowerCase());
        
        if (foundBook) {
            setCurrentBook(foundBook);
            setCurrentChapter(Math.min(chapterMatch, foundBook.chapters));
            setSearchQuery('');
        }
    };

    return (
        <div className="flex flex-col h-screen overflow-hidden bg-background text-foreground font-sans">
            {/* Primary Unified Header */}
            <header className="h-16 px-4 md:px-6 flex items-center justify-between border-b border-border bg-background/95 backdrop-blur-md z-40 sticky top-0 shadow-sm">
                <div className="flex items-center gap-4 shrink-0 pl-10 md:pl-24">
                    <div className="site-logo text-brand-navy hidden lg:block !text-[18px]">
                        DAILY <span className="gold">MANNA</span> AI
                    </div>
                    
                    <div className="flex items-center gap-2">
                        <a 
                            href="https://www.dailymannaai.com" 
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-navy text-white text-[10px] font-bold hover:bg-navy-3 transition-all shadow-md group border border-navy shadow-navy/10"
                        >
                            <Home size={12} className="group-hover:scale-110 transition-transform" />
                            <span className="hidden sm:inline">Home</span>
                        </a>
                        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-gold/30 bg-gold-pale/10 text-gold text-[10px] font-bold shadow-inner">
                            <BookOpen size={12} className="opacity-70" />
                            <span className="hidden sm:inline">Explorer</span>
                        </div>
                    </div>
                </div>

                {/* Centered Search Module - Now in Primary Header */}
                <div className="flex-1 flex items-center justify-center max-w-2xl mx-4">
                    <div className="flex-1 flex items-center gap-2 bg-card-bg border border-border/80 rounded-2xl pl-3 pr-1 py-1 group focus-within:border-gold/40 focus-within:ring-4 focus-within:ring-gold/5 transition-all shadow-sm">
                        <select 
                            value={translation}
                            onChange={(e) => setTranslation(e.target.value)}
                            className="bg-transparent text-[10px] font-black text-gold-2 uppercase tracking-tight outline-none cursor-pointer hover:text-gold transition-colors min-w-[50px] pl-1"
                        >
                            {['NIV', 'KJV', 'NKJV', 'ES', 'ZH', 'FR', 'PT', 'DE', 'AR', 'RU', 'KO', 'TE', 'TA', 'AFRIKAANS', 'BENGALI', 'ENGLISH', 'GUJARATI', 'HINDI', 'HUNGARIAN', 'INDONESIAN', 'KANNADA', 'KASHMIRI', 'MALAYALAM', 'MARATHI', 'NEPALI', 'ORIYA', 'PUNJABI', 'SEPEDI', 'XHOSA', 'ZULU', 'GREEK', 'HEBREW', 'URDU', 'DOGRI', 'ASSAMESE', 'MANIPURI', 'SANSKRIT', 'MAITHILI', 'JAPANESE', 'VIETNAMESE', 'TAGALOG', 'THAI', 'BURMESE', 'ITALIAN', 'POLISH', 'TURKISH', 'ROMANIAN', 'SWAHILI', 'DUTCH', 'UKRAINIAN', 'SWEDISH', 'FINNISH', 'DANISH', 'CZECH', 'CROATIAN', 'SERBIAN', 'MAORI', 'LATIN', 'ALBANIAN', 'NORWEGIAN BOKMAL', 'NORWEGIAN NYNORSK', 'ESTONIAN', 'LATVIAN', 'LITHUANIAN', 'BASQUE', 'ESPERANTO', 'SCOTTISH GAELIC', 'MANX GAELIC', 'BRETON', 'CALO', 'CHAMORRO', 'CHEROKEE', 'COPTIC', 'CHURCH SLAVONIC', 'DARI', 'EASTERN ARMENIAN', 'GOTHIC', 'KLINGON', 'KOINE GREEK', 'MALAGASY', 'MONGOLIAN', 'NORTHERN NDEBELE', 'SYRIAC', 'POHNPEIAN', 'POTAWATOMI', 'SHONA', 'TAUSUG', 'TOK PISIN', 'UMA', 'ANCIENT HEBREW', 'ICELANDIC', "CH'OL", 'KEYAGANA', 'DAWAWA', 'KUBE', 'SIROI', 'PAITE'].map(v => {
                                let val = v.toLowerCase();
                                if (val === 'kashmiri') val = 'ks';
                                if (val === 'greek') val = 'el';
                                if (val === 'hebrew') val = 'he';
                                if (val === 'japanese') val = 'ja';
                                if (val === 'vietnamese') val = 'vi';
                                if (val === 'tagalog') val = 'tl';
                                if (val === 'thai') val = 'th';
                                if (val === 'burmese') val = 'my';
                                if (val === 'italian') val = 'it';
                                if (val === 'polish') val = 'pl';
                                if (val === 'turkish') val = 'tr';
                                if (val === 'romanian') val = 'ro';
                                if (val === 'swahili') val = 'sw';
                                if (val === 'dutch') val = 'nl';
                                if (val === 'ukrainian') val = 'uk';
                                if (val === 'swedish') val = 'sv';
                                if (val === 'finnish') val = 'fi';
                                if (val === 'danish') val = 'da';
                                if (val === 'czech') val = 'cs';
                                if (val === 'croatian') val = 'hr';
                                if (val === 'serbian') val = 'sr';
                                if (val === 'maori') val = 'mi';
                                if (val === 'latin') val = 'la';
                                if (val === 'albanian') val = 'sq';
                                if (val === 'norwegian bokmal') val = 'nb';
                                if (val === 'norwegian nynorsk') val = 'nn';
                                if (val === 'estonian') val = 'et';
                                if (val === 'latvian') val = 'lv';
                                if (val === 'lithuanian') val = 'lt';
                                if (val === 'icelandic') val = 'isl';
                                if (val === "ch'ol") val = 'ctu';
                                if (val === 'keyagana') val = 'kyg';
                                if (val === 'dawawa') val = 'dww';
                                if (val === 'kube') val = 'kgf';
                                if (val === 'siroi') val = 'ssd';
                                if (val === 'paite') val = 'pck';
                                if (val === 'basque') val = 'eu';
                                if (val === 'esperanto') val = 'eo';
                                if (val === 'scottish gaelic') val = 'gd';
                                if (val === 'manx gaelic') val = 'gv';
                                if (val === 'breton') val = 'br';
                                if (val === 'calo') val = 'rmq';
                                if (val === 'chamorro') val = 'ch';
                                if (val === 'cherokee') val = 'chr';
                                if (val === 'coptic') val = 'cop';
                                if (val === 'church slavonic') val = 'cu';
                                if (val === 'dari') val = 'prs';
                                if (val === 'eastern armenian') val = 'hy';
                                if (val === 'gothic') val = 'got';
                                if (val === 'klingon') val = 'tlh';
                                if (val === 'koine greek') val = 'grc';
                                if (val === 'malagasy') val = 'mg';
                                if (val === 'mongolian') val = 'mn';
                                if (val === 'northern ndebele') val = 'nd';
                                if (val === 'syriac') val = 'syr';
                                if (val === 'pohnpeian') val = 'pon';
                                if (val === 'potawatomi') val = 'pot';
                                if (val === 'shona') val = 'sn';
                                if (val === 'tausug') val = 'tsg';
                                if (val === 'tok pisin') val = 'tpi';
                                if (val === 'uma') val = 'ppk';
                                if (val === 'ancient hebrew') val = 'hbo';
                                // Deep Search Combined Batch (Automated)
                                if (val === 'shi') val = 'shr';
                                if (val === 'tarifit') val = 'rifa';
                                if (val === 'belarusian') val = 'bel';
                                if (val === 'toma') val = 'tod';
                                if (val === 'lingála') val = 'lin';
                                if (val === 'yalunka') val = 'yal';
                                if (val === 'kituba') val = 'mkw';
                                if (val === 'susu') val = 'sus';
                                if (val === 'wolof') val = 'wolmbs';
                                if (val === 'português') val = 'poronbv';
                                if (val === 'chin, thaiphum') val = 'cth';
                                if (val === 'chin, matu') val = 'hlt';
                                if (val === 'luganda') val = 'lug';
                                if (val === 'chichewa') val = 'nya';
                                if (val === 'panjabi, eastern') val = 'pan';
                                if (val === 'sunwar') val = 'suzbl';
                                if (val === 'cebuano') val = 'cebulb';
                                if (val === 'central kurdish') val = 'ckb';
                                if (val === 'eʋegbe') val = 'ewe';
                                if (val === 'haitian') val = 'hatbsa';
                                if (val === 'chhattisgarhi') val = 'hne';
                                if (val === 'igbo') val = 'ibo';
                                if (val === 'dholuo') val = 'luo';
                                if (val === 'māori') val = 'mri2012';
                                if (val === 'ndebele') val = 'nde';
                                if (val === 'chishona') val = 'sna';
                                if (val === 'somali') val = 'som';
                                if (val === 'oromo, west central') val = 'gaz';
                                if (val === 'hawaiian') val = 'haw1868';
                                if (val === 'ilocano') val = 'iloulb';
                                if (val === 'tongan') val = 'ton';
                                if (val === 'guaraní, mbyá') val = 'gun';
                                if (val === 'gikuyu') val = 'kik';
                                if (val === 'san blas kuna') val = 'cuk';
                                if (val === 'twi') val = 'twi';
                                if (val === 'اردو') val = 'urdoucv';
                                if (val === 'chuukese') val = 'chk';
                                if (val === 'tiếng việt') val = 'vieovcb';
                                if (val === 'kauana') val = 'ksd';
                                if (val === 'नेपाली') val = 'npioncb';
                                if (val === 'kamano') val = 'kbq';
                                if (val === 'persian') val = 'pesopv';
                                if (val === 'motu') val = 'meu';
                                if (val === 'romani, carpathian') val = 'rmc';
                                if (val === 'hausa') val = 'hausa';
                                if (val === 'yorùbá') val = 'yor';
                                if (val === 'malagasy, tandroy-mahafaly') val = 'tdx';
                                if (val === 'मराठी') val = 'marc';
                                if (val === 'chin, eastern khumi') val = 'cekak';
                                if (val === 'azerbaijani, south') val = 'azb';
                                if (val === 'huichol') val = 'hch';
                                if (val === 'gujii') val = 'gax';
                                if (val === 'chin, thado') val = 'tczchongthu';
                                if (val === 'tibetan') val = 'bodn';
                                if (val === 'telugu') val = 'tel2017';
                                if (val === 'boko') val = 'bqcsim';
                                if (val === 'goofa') val = 'gofe';
                                if (val === 'gofa') val = 'gofl';
                                if (val === 'kosraean') val = 'kos';
                                if (val === 'മലയാളം') val = 'malc';
                                if (val === 'gamo') val = 'gmve';
                                if (val === 'motu, hiri') val = 'hmo';
                                if (val === 'ditammari') val = 'tbzsim';
                                if (val === 'quechua, huallaga huánuco') val = 'qub';
                                if (val === 'uyghur') val = 'uigara';
                                if (val === 'dawro') val = 'dwrent';
                                if (val === 'nahuatl, huasteca central') val = 'nchbl';
                                if (val === 'nahuatl, huasteca oriental') val = 'nhebl';
                                if (val === 'nahuatl,  huasteca occidental') val = 'nhwbl';
                                if (val === 'baatonum') val = 'bba';
                                if (val === 'kankanaey') val = 'kne';
                                if (val === 'male') val = 'mdyeth';
                                if (val === 'melanesian pidgin') val = 'tpi';
                                if (val === 'roviana') val = 'rug';
                                if (val === 'ilonggo') val = 'hil';
                                if (val === 'yapese') val = 'yap';
                                if (val === 'dadibi') val = 'mps';
                                if (val === 'kapingamarangi') val = 'kpg';
                                if (val === 'guajajára') val = 'gubbl';
                                if (val === 'kilivila') val = 'kij';
                                if (val === 'beami') val = 'beo';
                                if (val === 'huli') val = 'hui';
                                if (val === 'chuj') val = 'cac';
                                if (val === 'aruamu') val = 'msy2020';
                                if (val === 'iranian persian') val = 'pesopcb';
                                if (val === 'kriol') val = 'rop';
                                if (val === 'español') val = 'spaonbv';
                                if (val === 'wolaytta') val = 'wal';
                                if (val === 'busa') val = 'bqp';
                                if (val === 'lukpa') val = 'dop';
                                return <option key={v} value={val}>{v}</option>;
                            })}
                        </select>

                        <div className="h-4 w-px bg-border/60" />

                        <Search className="text-text-3 group-focus-within:text-gold transition-colors shrink-0" size={14} />
                        <input 
                            className="bg-transparent border-none outline-none text-xs font-medium text-text-1 placeholder:text-text-3 w-full" 
                            placeholder="Find Scripture..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                        />
                        
                        <div className="flex items-center gap-1 shrink-0">
                            <VoiceInput 
                                onTranscript={(text) => { setSearchQuery(text); handleSearch(text); }}
                                className="w-7 h-7 flex items-center justify-center text-text-3 hover:text-gold transition-colors rounded-full"
                            />
                            <button 
                                onClick={() => handleSearch()}
                                className="px-4 py-1.5 bg-navy dark:bg-gold text-white dark:text-navy rounded-xl text-[10px] font-black hover:bg-gold dark:hover:bg-gold-2 transition-all shadow-sm active:scale-95 uppercase tracking-wider"
                            >
                                Search
                            </button>
                        </div>
                    </div>
                </div>

                {/* Right side placeholder to keep search centered and avoid overlapping with fixed items */}
                <div className="flex items-center gap-3 shrink-0 w-[220px] justify-end">
                    {/* UserMenu and ThemeToggle are fixed in RootLayout at this position */}
                </div>
            </header>

            {/* Layout Main */}
            <main className="flex-1 flex overflow-hidden relative">
                {/* Column 1: Books & Chapters (Combined Side Navigation) */}
                <aside 
                    className={`border-r border-border bg-card-bg flex flex-col shrink-0 transition-all duration-300 ease-in-out fixed inset-y-0 left-0 z-40 md:relative md:translate-x-0 
                    ${leftSidebarOpen && !isZenMode ? 'w-80' : 'w-11 md:w-11 -translate-x-full md:translate-x-0'} 
                    ${isMobileMenuOpen ? 'w-full translate-x-0' : ''} overflow-hidden`}
                >
                    <div className="flex flex-col h-full w-80">
                        <div className={`transition-all duration-300 ease-in-out ${!leftSidebarOpen ? 'h-0 overflow-hidden opacity-0 p-0' : 'p-4 border-b border-border bg-background/50'}`}>
                            <div className="space-y-1.5">
                                <select 
                                    value={translation}
                                    onChange={(e) => setTranslation(e.target.value)}
                                    className="w-full bg-background border border-border rounded-lg px-3 py-2 text-[11px] font-bold text-text-2 focus:border-gold/50 outline-none cursor-pointer transition-all hover:border-gold/30 gold-focus shadow-sm"
                                >
                                    <optgroup label="Primary Bible Versions">
                                        {['NIV', 'KJV', 'NKJV'].map(v => (
                                            <option key={v} value={v}>{v}</option>
                                        ))}
                                        // Local XML Batch
                                        <option value="pck">Paite</option>
                                        <option value="arb-xml">Arabic (XML)</option>
                                        <option value="my-xml">Burmese (XML)</option>
                                        <option value="pes-xml">Farsi (XML)</option>
                                        <option value="tl-xml">Tagalog (XML)</option>
                                        <option value="tr-xml">Turkish (XML)</option>
                                    </optgroup>
                                    <optgroup label="Biblical Languages">











                                        <option value="el">Ελληνικά (Greek)</option>
                                        <option value="he">עִברִית (Hebrew)</option>
                                        <option value="hbo">Ancient Hebrew (Aleppo)</option>
                                        <option value="grc">Koine Greek (LXX)</option>
                                        <option value="syrp">Syriac (Peshitta) ❌ NT-Only</option>
                                        <option value="la">Latina (Latin)</option>
                                        <option value="cop">Coptic (Bohairic) ❌ NT-Only</option>
                                        <option value="cu">Church Slavonic</option>
                                        <option value="got">Gothic ❌ NT-Only</option>
                                    
                                    
                                    
                                    
                                    
                                    
                                    
                                    
                                    
                                    
                                    
                                    </optgroup>
                                    <optgroup label="Featured World Languages">
                                        <option value="english">English (WEB)</option>
                                        <option value="es">Español (RVR)</option>
                                        <option value="fr">Français (Crampon)</option>
                                        <option value="de">Deutsch (Textbibel)</option>
                                        <option value="pt">Português (Nova Bíblia)</option>
                                        <option value="it">Italiano (Riveduta)</option>
                                                 <option value="zh">中文 (Union)</option>
                                        <option value="ja">日本語 (Japanese) ❌ NT-Only</option>
                                        <option value="ar">العربية (Van Dyke)</option>
                                        <option value="hindi">हिन्दी (Hindi)</option>
                                        <option value="bengali">বাংলা (Bengali)</option>
                                        <option value="te">తెలుగు (Telugu)</option>
                                        <option value="ta">தமிழ் (Tamil)</option>
                                        <option value="kannada">ಕನ್ನಡ (Kannada)</option>
                                        <option value="malayalam">മലയാളം (Malayalam)</option>
                                        <option value="marathi">मराठी (Marathi)</option>
                                        <option value="gujarati">ગુજરાતી (Gujarati)</option>
                                        <option value="punjabi">ਪੰਜਾਬੀ (Punjabi)</option>
                                        <option value="nepali">नेपाली (Nepali)</option>
                                        <option value="tl">Tagalog (Ang Biblia)</option>
                                        <option value="vi">Tiếng Việt (Vietnamese)</option>
                                        <option value="th">ไทย (Thai)</option>
                                        <option value="my">မြန်မာစာ (Burmese)</option>
                                        <option value="indonesian">Bahasa Indonesia</option>
                                        <option value="tr">Türkçe (Turkish)</option>
                                        <option value="pl">Polski (Polish)</option>
                                        <option value="ro">Română (Romanian)</option>
                                        <option value="nl">Nederlands (Dutch)</option>
                                        <option value="sv">Svenska (Swedish)</option>
                                        <option value="fi">Suomi (Finnish) ❌ NT-Only</option>
                                        <option value="da">Dansk (Danish)</option>
                                        <option value="nb">Norsk (Norwegian) ❌ NT-Only</option>
                                        <option value="cs">Čeština (Czech)</option>
                                        <option value="hr">Hrvatski (Croatian)</option>
                                        <option value="sr">Српски (Serbian)</option>
                                        <option value="uk">Українська (Ukrainian)</option>
                                        <option value="et">Eesti (Estonian) ❌ NT-Only</option>
                                        <option value="lt">Lietuvių (Lithuanian) ❌ NT-Only</option>
                                        <option value="lv">Latviešu (Latvian) ❌ NT-Only</option>
                                        <option value="sq">Shqip (Albanian) ❌ NT-Only</option>
                                        <option value="el">Ελληνικά (Greek)</option>
                                        <option value="he">עברית (Hebrew)</option>
                                        <option value="sw">Kiswahili (Swahili)</option>
                                        <option value="afrikaans">Afrikaans ❌ NT-Only</option>
                                        <option value="eo">Esperanto</option>
                                    </optgroup>
                                    <optgroup label="New Languages (NT-Only)">
                                        <option value="isl">Icelandic ❌ NT-Only</option>
                                        <option value="ctu">Ch'ol (Maya) ❌ NT-Only</option>
                                        <option value="kyg">Keyagana ❌ NT-Only</option>
                                        <option value="dww">Dawawa ❌ NT-Only</option>
                                        <option value="kgf">Kube ❌ NT-Only</option>
                                        <option value="ssd">Siroi ❌ NT-Only</option>
                                        <option value="pck">Paite</option>
                                    </optgroup>
                                    <optgroup label="World Languages (Complete)">
                                        <option value="es">Español (RVR)</option>
                                        <option value="zh">中文 (Union)</option>
                                        <option value="ja">日本語 (Japanese)</option>
                                        <option value="ko">한국어 (Korean)</option>
                                        <option value="vi">Tiếng Việt (Vietnamese)</option>
                                        <option value="tl">Tagalog (Ang Biblia)</option>
                                        <option value="th">ไทย (Thai)</option>
                                        <option value="my">မြန်မာစာ (Burmese)</option>
                                        <option value="id">Indonesia (TB)</option>
                                        <option disabled>──────────</option>
                                        <option disabled>─── A ───</option>
                                        <option value="acunt">Achuar-shiwiar (acuNT)</option>
                                        <option value="agubl">Aguacateco (aguBl)</option>
                                        <option value="agr">Aguaruna (agr)</option>
                                        <option value="ahr">Ahirani (ahr)</option>
                                        <option value="aly">Alyawarr (aly)</option>
                                        <option value="aaz">Amarasi (aaz)</option>
                                        <option value="tvk">Ambrym, Southeast (tvk)</option>
                                        <option value="aey">Amele (aey)</option>
                                        <option value="boj2014">Anjam (boj2014)</option>
                                        <option value="ena">Apal (ena)</option>
                                        <option value="arb-vd">Arabic (arb-vd)</option>
                                        <option value="arbnav">Arabic, Standard (arbnav)</option>
                                        <option value="aer">Arrernte, Eastern (aer)</option>
                                        <option value="msy2020">Aruamu (msy2020)</option>
                                        <option value="cpy">Ashéninka, South Ucayali (cpy)</option>
                                        <option value="asmfb">Assamese (asmfb)</option>
                                        <option value="aii">Assyrian Neo-Aramaic (aii)</option>
                                        <option value="azb">Azerbaijani, South (azb)</option>
                                        <option disabled>─── B ───</option>
                                        <option value="bba">Baatonum (bba)</option>
                                        <option value="bsp">Baga Sitemu (bsp)</option>
                                        <option value="ptu">Bambam (ptu)</option>
                                        <option value="bbb">Barai (bbb)</option>
                                        <option value="bch">Bariai (bch)</option>
                                        <option value="byr">Baruya (byr)</option>
                                        <option value="beo">Beami (beo)</option>
                                        <option value="bel">Belarusian (bel)</option>
                                        <option value="benobcv">Bengali (benobcv)</option>
                                        <option value="benirv">Bengali (benirv)</option>
                                        <option value="bhl">Bimin (bhl)</option>
                                        <option value="bjr">Binumarien (bjr)</option>
                                        <option value="bps">Blaan, Sarangani (bps)</option>
                                        <option value="bqcsim">Boko (bqcsim)</option>
                                        <option value="bus">Bokobaru (bus)</option>
                                        <option value="bnp">Bola (bnp)</option>
                                        <option value="lbk">Bontok, Central (lbk)</option>
                                        <option value="ksr">Borong (ksr)</option>
                                        <option value="bzdntpo">Bribri (bzdNTpo)</option>
                                        <option value="bvr">Burarra (bvr)</option>
                                        <option value="myajvb">Burmese (myajvb)</option>
                                        <option value="mya">Burmese (mya)</option>
                                        <option value="bqp">Busa (bqp)</option>
                                        <option value="tteo">Bwanabwana (tteo)</option>
                                        <option disabled>─── C ───</option>
                                        <option value="cbunt">Candoshi-Shapra (cbuNT)</option>
                                        <option value="crxntpo">Carrier (crxNTpo)</option>
                                        <option value="cbrnt">Cashibo-Cacataibo (cbrNT)</option>
                                        <option value="cebulb">Cebuano (cebulb)</option>
                                        <option value="cebocb">Cebuano (cebocb)</option>
                                        <option value="ckb">Central Kurdish (ckb)</option>
                                        <option value="cbintpo">Chachi (cbiNTpo)</option>
                                        <option value="cha">Chamorro (cha)</option>
                                        <option value="cbtntpo">Chayahuita (cbtNTpo)</option>
                                        <option value="hne">Chhattisgarhi (hne)</option>
                                        <option value="nya">Chichewa (nya)</option>
                                        <option value="cekak">Chin, Eastern Khumi (cekak)</option>
                                        <option value="hlt">Chin, Matu (hlt)</option>
                                        <option value="hltmcsb">Chin, Matu (hltmcsb)</option>
                                        <option value="hltthb">Chin, Matu (hltthb)</option>
                                        <option value="tczchongthu">Chin, Thado (tczchongthu)</option>
                                        <option value="cth">Chin, Thaiphum (cth)</option>
                                        <option value="cmn-cu89s">Chinese (cmn-cu89s)</option>
                                        <option value="cmn-cu89t">Chinese (cmn-cu89t)</option>
                                        <option value="ctucti">Chol (ctucti)</option>
                                        <option value="caa">Chorti (caa)</option>
                                        <option value="cac">Chuj (cac)</option>
                                        <option value="chk">Chuukese (chk)</option>
                                        <option value="asg">Cishingini (asg)</option>
                                        <option value="conntpo">Cofán (conNTpo)</option>
                                        <option value="hrv">Croatian (hrv)</option>
                                        <option value="ces1613">Czech (ces1613)</option>
                                        <option value="sna">chiShona (sna)</option>
                                        <option disabled>─── D ───</option>
                                        <option value="mps">Dadibi (mps)</option>
                                        <option value="dan1931">Danish (dan1931)</option>
                                        <option value="dwrent">Dawro (dwrENT)</option>
                                        <option value="dwrl">Dawro (dwrl)</option>
                                        <option value="ded">Dedua (ded)</option>
                                        <option value="row">Dela-Oenale (row)</option>
                                        <option value="dhn">Dhanki (dhn)</option>
                                        <option value="nfa">Dhao (nfa)</option>
                                        <option value="luo">Dholuo (luo)</option>
                                        <option value="tbzsim">Ditammari (tbzsim)</option>
                                        <option value="djr">Djambarrpuyngu (djr)</option>
                                        <option value="dgrdognt">Dogrib (dgrDOGNT)</option>
                                        <option value="kqc">Doromu-Koki (kqc)</option>
                                        <option value="nldnbg">Dutch (nldnbg)</option>
                                        <option value="nld">Dutch (nld)</option>
                                        <option value="nld1939">Dutch (nld1939)</option>
                                        <option disabled>─── E ───</option>
                                        <option value="etr">Edolo (etr)</option>
                                        <option value="eka">Ekajuk (eka)</option>
                                        <option value="empntpo">Emberá, Northern (empNTpo)</option>
                                        <option value="engdra">English (engDRA)</option>
                                        <option value="engojb">English (engojb)</option>
                                        <option value="engfbv">English (engfbv)</option>
                                        <option value="englsv">English (englsv)</option>
                                        <option value="engwyc2017">English (engwyc2017)</option>
                                        <option value="engwyc2018">English (engwyc2018)</option>
                                        <option value="eng-web">English (eng-web)</option>
                                        <option value="eng-webbe">English (eng-webbe)</option>
                                        <option value="engwebp">English (engwebp)</option>
                                        <option value="engwebpb">English (engwebpb)</option>
                                        <option value="engwebu">English (engwebu)</option>
                                        <option value="engwmb">English (engwmb)</option>
                                        <option value="engwmbb">English (engwmbb)</option>
                                        <option value="eng-asv">English (eng-asv)</option>
                                        <option value="engbbe">English (engBBE)</option>
                                        <option value="eng-kjv">English (eng-kjv)</option>
                                        <option value="eng-kjv2006">English (eng-kjv2006)</option>
                                        <option value="engkjvcpb">English (engkjvcpb)</option>
                                        <option value="engmsb">English (engmsb)</option>
                                        <option value="engnet">English (engnet)</option>
                                        <option value="eng-rv">English (eng-rv)</option>
                                        <option value="engwebster">English (engwebster)</option>
                                        <option value="engylt">English (engylt)</option>
                                        <option value="engasvbt">English (engasvbt)</option>
                                        <option value="engdby">English (engDBY)</option>
                                        <option value="engulb">English (engULB)</option>
                                        <option value="enggnv">English (enggnv)</option>
                                        <option value="engbsb">English (engbsb)</option>
                                        <option value="eng-t4t">English (eng-t4t)</option>
                                        <option value="eng-web-c">English (eng-web-c)</option>
                                        <option value="engjps">English (engjps)</option>
                                        <option value="englee">English (englee)</option>
                                        <option value="eng-brenton">English (eng-Brenton)</option>
                                        <option value="eng-lxx2012">English (eng-lxx2012)</option>
                                        <option value="eng-uk-lxx2012">English (eng-uk-lxx2012)</option>
                                        <option value="englxxup">English (englxxup)</option>
                                        <option value="engnoy">English (engnoy)</option>
                                        <option value="engourb">English (engourb)</option>
                                        <option value="engoebcw">English (engoebcw)</option>
                                        <option value="engoebus">English (engoebus)</option>
                                        <option value="engwycliffe">English (engWycliffe)</option>
                                        <option value="engpev">English (engPEV)</option>
                                        <option value="engoke">English (engoke)</option>
                                        <option value="spaonbv">Español (spaonbv)</option>
                                        <option value="epo">Esperanto (epo)</option>
                                        <option value="ewe">eʋegbe (ewe)</option>
                                        <option disabled>─── F ───</option>
                                        <option value="francl">French (francl)</option>
                                        <option value="frajnd">French (frajnd)</option>
                                        <option value="fralsg">French (fraLSG)</option>
                                        <option value="fra_fob">French (fra_fob)</option>
                                        <option value="frasbl">French (frasbl)</option>
                                        <option disabled>─── G ───</option>
                                        <option value="gmve">Gamo (gmve)</option>
                                        <option value="gmvl">Gamo (gmvl)</option>
                                        <option value="pwg">Gapapaiwa (pwg)</option>
                                        <option value="nlg">Gela (nlg)</option>
                                        <option value="deuelbbk">German (deuelbbk)</option>
                                        <option value="deutkw">German, Standard (deutkw)</option>
                                        <option value="deu1912">German, Standard (deu1912)</option>
                                        <option value="deu1951">German, Standard (deu1951)</option>
                                        <option value="deuelo">German, Standard (deuelo)</option>
                                        <option value="kik">Gikuyu (kik)</option>
                                        <option value="tof">Gizrra (tof)</option>
                                        <option value="gofl">Gofa (gofl)</option>
                                        <option value="gofe">Goofa (gofe)</option>
                                        <option value="grcbrent">Greek, Ancient (grcbrent)</option>
                                        <option value="grclxx">Greek, Ancient (grclxx)</option>
                                        <option value="gubbl">Guajajára (gubBl)</option>
                                        <option value="gum">Guambiano (gum)</option>
                                        <option value="gun">Guaraní, Mbyá (gun)</option>
                                        <option value="guj2017">Gujarati (guj2017)</option>
                                        <option value="gnn">Gumatj (gnn)</option>
                                        <option value="gvs">Gumawana (gvs)</option>
                                        <option value="gup">Gunwinggu (gup)</option>
                                        <option value="gax">gujii (gax)</option>
                                        <option disabled>─── H ───</option>
                                        <option value="hatbsa">Haitian (hatbsa)</option>
                                        <option value="hat">Haitian (hat)</option>
                                        <option value="wos">Hanga Hundi (wos)</option>
                                        <option value="hausa">Hausa (hausa)</option>
                                        <option value="haw1868">Hawaiian (haw1868)</option>
                                        <option value="heb">Hebrew (heb)</option>
                                        <option value="hbo">Hebrew (hbo)</option>
                                        <option value="hbowlc">Hebrew (hboWLC)</option>
                                        <option value="hegntpo">Helong (hegNTpo)</option>
                                        <option value="hin2017">Hindi (hin2017)</option>
                                        <option value="hincv">Hindi (hincv)</option>
                                        <option value="hoy">Holiya (hoy)</option>
                                        <option value="hch">Huichol (hch)</option>
                                        <option value="hui">Huli (hui)</option>
                                        <option disabled>─── I ───</option>
                                        <option value="isl">Icelandic (isl)</option>
                                        <option value="ibo">Igbo (ibo)</option>
                                        <option value="iloulb">Ilocano (iloulb)</option>
                                        <option value="hil">Ilonggo (hil)</option>
                                        <option value="indayt">Indonesian (indayt)</option>
                                        <option value="ind">Indonesian (ind)</option>
                                        <option value="ipi">Ipili (ipi)</option>
                                        <option value="pesopcb">Iranian Persian (pesopcb)</option>
                                        <option value="ita1927">Italian (ita1927)</option>
                                        <option value="ita1885">Italian (ita1885)</option>
                                        <option disabled>─── K ───</option>
                                        <option value="mwp">Kala Lagaw Ya (mwp)</option>
                                        <option value="bco">Kaluli (bco)</option>
                                        <option value="kbq">Kamano (kbq)</option>
                                        <option value="xla">Kamula (xla)</option>
                                        <option value="soq">Kanasi (soq)</option>
                                        <option value="kne">Kankanaey (kne)</option>
                                        <option value="kanokcv">Kannada (kanokcv)</option>
                                        <option value="kanirv">Kannada (kanirv)</option>
                                        <option value="kpg">Kapingamarangi (kpg)</option>
                                        <option value="ksd">Kauana (ksd)</option>
                                        <option value="kyg">Keyagana (kyg)</option>
                                        <option value="kij">Kilivila (kij)</option>
                                        <option value="mkw">Kituba (mkw)</option>
                                        <option value="yom">Kiyombi (yom)</option>
                                        <option value="zajp">Kizalamo (zajp)</option>
                                        <option value="kpr">Korafe (kpr)</option>
                                        <option value="kor">Korean (kor)</option>
                                        <option value="kos">Kosraean (kos)</option>
                                        <option value="eko">Kote (eko)</option>
                                        <option value="rop">Kriol (rop)</option>
                                        <option value="kgf">Kube (kgf)</option>
                                        <option value="gvn">Kuku-Yalanji (gvn)</option>
                                        <option value="kvg">Kuni-Boazi (kvg)</option>
                                        <option value="mkn">Kupang Malay (mkn)</option>
                                        <option value="kdc">Kutu (kdc)</option>
                                        <option value="kwf">Kwara'ae (kwf)</option>
                                        <option value="cwe">Kwere (cwe)</option>
                                        <option value="kyc">Kyaka Enga (kyc)</option>
                                        <option disabled>─── L ───</option>
                                        <option value="latvuc">Latin (latVUC)</option>
                                        <option value="lin">Lingála (lin)</option>
                                        <option value="lit">Lithuanian (lit)</option>
                                        <option value="lbm">Lodhi (lbm)</option>
                                        <option value="llg">Lole (llg)</option>
                                        <option value="lex">Luang (lex)</option>
                                        <option value="lug">Luganda (lug)</option>
                                        <option value="dop">Lukpa (dop)</option>
                                        <option value="lga">Lungga (lga)</option>
                                        <option disabled>─── M ───</option>
                                        <option value="mmx">Madak (mmx)</option>
                                        <option value="kde">Makonde (kde)</option>
                                        <option value="tdx">Malagasy, Tandroy-Mahafaly (tdx)</option>
                                        <option value="mal">Malayalam (mal)</option>
                                        <option value="mal2015">Malayalam (mal2015)</option>
                                        <option value="mdyeth">Male (mdyeth)</option>
                                        <option value="cmncbs">Mandarin Chinese (cmncbs)</option>
                                        <option value="cmncbt">Mandarin Chinese (cmncbt)</option>
                                        <option value="knf">Mankanya (knf)</option>
                                        <option value="mbs">Manobo, Sarangani (mbs)</option>
                                        <option value="mbbot">Manobo, Western Bukidnon (mbbOT)</option>
                                        <option value="mar">Marathi (mar)</option>
                                        <option value="met">Mato (met)</option>
                                        <option value="mfo">Mbe (mfo)</option>
                                        <option value="mna">Mbula (mna)</option>
                                        <option value="mbu">Mbula-Bwazza (mbu)</option>
                                        <option value="tpi">Melanesian Pidgin (tpi)</option>
                                        <option value="tpiotnt">Melanesian Pidgin (tpiOTNT)</option>
                                        <option value="mpp">Migabac (mpp)</option>
                                        <option value="mpx">Misima-Paneati (mpx)</option>
                                        <option value="meu">Motu (meu)</option>
                                        <option value="hmo">Motu, Hiri (hmo)</option>
                                        <option value="emi">Mussau-Emira (emi)</option>
                                        <option value="tuc-t">Mutu (tuc-t)</option>
                                        <option value="tuc-o">Mutu (tuc-o)</option>
                                        <option value="mri2012">Māori (mri2012)</option>
                                        <option disabled>─── N ───</option>
                                        <option value="nas">Naasioi (nas)</option>
                                        <option value="nhwbl">Nahuatl,  Huasteca Occidental (nhwBl)</option>
                                        <option value="nchbl">Nahuatl, Huasteca Central (nchBl)</option>
                                        <option value="nhebl">Nahuatl, Huasteca Oriental (nheBl)</option>
                                        <option value="nss">Nali (nss)</option>
                                        <option value="ntu">Natügu (ntu)</option>
                                        <option value="nde">Ndebele (nde)</option>
                                        <option value="npiulb">Nepali (npiulb)</option>
                                        <option value="ntj">Ngaanyatjarra (ntj)</option>
                                        <option value="nop">Numanggang (nop)</option>
                                        <option value="nuy">Nunggubuyu (nuy)</option>
                                        <option value="lid">Nyindrou (lid)</option>
                                        <option disabled>─── O ───</option>
                                        <option value="ory">Oriya (ory)</option>
                                        <option value="gaz">Oromo, West Central (gaz)</option>
                                        <option value="gaze">Oromo, West Central (gaze)</option>
                                        <option disabled>─── P ───</option>
                                        <option value="pma">Paama (pma)</option>
                                        <option value="pan">Panjabi, Eastern (pan)</option>
                                        <option value="gfk">Patpatar (gfk)</option>
                                        <option value="ata">Pele-Ata (ata)</option>
                                        <option value="pesopv">Persian (pesOPV)</option>
                                        <option value="piu2006">Pintupi-Luritja (piu2006)</option>
                                        <option value="pjt">Pitjantjatjara (pjt)</option>
                                        <option value="pon2006">Pohnpeian (pon2006)</option>
                                        <option value="pon2006a">Pohnpeian (pon2006a)</option>
                                        <option value="pon">Pohnpeian (pon)</option>
                                        <option value="pon-pdn">Pohnpeian (pon-pdn)</option>
                                        <option value="polubg">Polish (polubg)</option>
                                        <option value="porbrbsl">Portuguese (porbrbsl)</option>
                                        <option value="porbr2018">Portuguese (porbr2018)</option>
                                        <option value="poronbv">Português (poronbv)</option>
                                        <option disabled>─── Q ───</option>
                                        <option value="byx">Qaqet (byx)</option>
                                        <option value="qub">Quechua, Huallaga Huánuco (qub)</option>
                                        <option value="qvsnt">Quechua, San Martín (qvsNT)</option>
                                        <option disabled>─── R ───</option>
                                        <option value="rai">Ramoaaina (rai)</option>
                                        <option value="rgu">Rikou (rgu)</option>
                                        <option value="rhg">Rohingya (rhg)</option>
                                        <option value="rmc">Romani, Carpathian (rmc)</option>
                                        <option value="ronbtf">Romanian (ronbtf)</option>
                                        <option value="ron1924">Romanian (ron1924)</option>
                                        <option value="rug">Roviana (rug)</option>
                                        <option value="russyn">Russian (russyn)</option>
                                        <option disabled>─── S ───</option>
                                        <option value="sav">Saafi-Saafi (sav)</option>
                                        <option value="cuk">San Blas Kuna (cuk)</option>
                                        <option value="msc">Sankaran Maninka (msc)</option>
                                        <option value="sps">Saposa (sps)</option>
                                        <option value="ssx">Sembeleke (ssx)</option>
                                        <option value="srp1865">Serbian (srp1865)</option>
                                        <option value="srp1868">Serbian (srp1868)</option>
                                        <option value="srponspc">Serbian (srponspc)</option>
                                        <option value="srponstl">Serbian (srponstl)</option>
                                        <option value="shr">Shi (shr)</option>
                                        <option value="shpntpo">Shipibo-Conibo (shpNTpo)</option>
                                        <option value="xsi">Sio (xsi)</option>
                                        <option value="ssd">Siroi (ssd)</option>
                                        <option value="som">Somali (som)</option>
                                        <option value="bmu">Somba-Siawari or Burum-Mindik (bmu)</option>
                                        <option value="sparv1909">Spanish (spaRV1909)</option>
                                        <option value="sparvg">Spanish (sparvg)</option>
                                        <option value="spavbl">Spanish (spavbl)</option>
                                        <option value="spabes">Spanish (spabes)</option>
                                        <option value="spablm">Spanish (spablm)</option>
                                        <option value="spav1602p">Spanish (spav1602p)</option>
                                        <option value="spapddpt">Spanish (spapddpt)</option>
                                        <option value="swp">Suau (swp)</option>
                                        <option value="tgo">Sudest (tgo)</option>
                                        <option value="suzbl">Sunwar (suzBl)</option>
                                        <option value="sus">Susu (sus)</option>
                                        <option value="susa">Susu (susa)</option>
                                        <option value="swhonen">Swahili (swhonen)</option>
                                        <option value="swhonmm">Swahili (swhonmm)</option>
                                        <option value="swhulb">Swahili (swhulb)</option>
                                        <option value="swe">Swedish (swe)</option>
                                        <option value="swef">Swedish (swef)</option>
                                        <option value="myk">Sénoufo, Mamara (myk)</option>
                                        <option value="spp">Sénoufo, Supyire (spp)</option>
                                        <option disabled>─── T ───</option>
                                        <option value="tap">Taabwa (tap)</option>
                                        <option value="bgs">Tagabawa (bgs)</option>
                                        <option value="tglulb">Tagalog (tglulb)</option>
                                        <option value="tbg">Tairora (tbg)</option>
                                        <option value="tam2017">Tamil (tam2017)</option>
                                        <option value="tamtcv">Tamil (tamtcv)</option>
                                        <option value="rifa">Tarifit (rifa)</option>
                                        <option value="rifl">Tarifit (rifl)</option>
                                        <option value="rift">Tarifit (rift)</option>
                                        <option value="yer">Tarok (yer)</option>
                                        <option value="tel2017">Telugu (tel2017)</option>
                                        <option value="telotsa">Telugu (telotsa)</option>
                                        <option value="tfrntpo">Teribe (tfrNTpo)</option>
                                        <option value="tet">Tetun (tet)</option>
                                        <option value="tdt">Tetun Dili (tdt)</option>
                                        <option value="thakjv">Thai (thaKJV)</option>
                                        <option value="lth">Thur (lth)</option>
                                        <option value="bodn">Tibetan (bodn)</option>
                                        <option value="txq">Tii (txq)</option>
                                        <option value="vieovcb">Tiếng Việt (vieovcb)</option>
                                        <option value="tod">Toma (tod)</option>
                                        <option value="ton">Tongan (ton)</option>
                                        <option value="tcs">Torres Strait Creole (tcs)</option>
                                        <option value="tkr">Tsakhur (tkr)</option>
                                        <option value="tuont">Tucano (tuoNT)</option>
                                        <option value="iou">Tuma-Irumu (iou)</option>
                                        <option value="lcm">Tungag (lcm)</option>
                                        <option value="turytc">Turkish (turytc)</option>
                                        <option value="twi">Twi (twi)</option>
                                        <option value="twiasante">Twi (twiasante)</option>
                                        <option disabled>─── U ───</option>
                                        <option value="ubr">Ubir (ubr)</option>
                                        <option value="udu">Uduk (udu)</option>
                                        <option value="ukr1871">Ukrainian (ukr1871)</option>
                                        <option value="ukr1996">Ukrainian (ukr1996)</option>
                                        <option value="ukrfb">Ukrainian (ukrfb)</option>
                                        <option value="ukronpu">Ukranian (ukronpu)</option>
                                        <option value="urd">Urdu (urd)</option>
                                        <option value="urdgvh">Urdu (urdgvh)</option>
                                        <option value="urdgvr">Urdu (urdgvr)</option>
                                        <option value="urdgvu">Urdu (urdgvu)</option>
                                        <option value="usa">Usarufa (usa)</option>
                                        <option value="uigara">Uyghur (uigara)</option>
                                        <option value="uigcyr">Uyghur (uigcyr)</option>
                                        <option value="uiglat">Uyghur (uiglat)</option>
                                        <option value="uigpin">Uyghur (uigpin)</option>
                                        <option value="gel">ut-Ma'in (gel)</option>
                                        <option disabled>─── V ───</option>
                                        <option value="vid">Vidunda (vid)</option>
                                        <option value="vie1934">Vietnamese (vie1934)</option>
                                        <option disabled>─── W ───</option>
                                        <option value="wnc">Wantoat (wnc)</option>
                                        <option value="wrs">Waris (wrs)</option>
                                        <option value="wbp">Warlpiri (wbp)</option>
                                        <option value="wsk">Waskia (wsk)</option>
                                        <option value="kew">West Kewa (kew)</option>
                                        <option value="wal">Wolaytta (wal)</option>
                                        <option value="wlo">Wolio (wlo)</option>
                                        <option value="wolmbs">Wolof (wolmbs)</option>
                                        <option disabled>─── Y ───</option>
                                        <option value="jae">Yabem (jae)</option>
                                        <option value="yka">Yakan (yka)</option>
                                        <option value="yal">Yalunka (yal)</option>
                                        <option value="yap">Yapese (yap)</option>
                                        <option value="yvant">Yawa (yvaNT)</option>
                                        <option value="yon">Yongkom (yon)</option>
                                        <option value="yut">Yopno (yut)</option>
                                        <option value="yor">Yorùbá (yor)</option>
                                        <option disabled>─── Z ───</option>
                                        <option value="zarnt">Zapotec, Rincón (zarNT)</option>
                                        <option value="zatntps">Zapotec, Tabaa (zatNTps)</option>
                                        <option value="ztyntps">Zapotec, Yatee (ztyNTps)</option>
                                        <option disabled>─── Б ───</option>
                                        <option value="beln">беларуская (beln)</option>
                                        <option disabled>─── ע ───</option>
                                        <option value="hebwlc">עברית (hebwlc)</option>
                                        <option disabled>─── ا ───</option>
                                        <option value="urdoucv">اردو (urdoucv)</option>
                                        <option disabled>─── न ───</option>
                                        <option value="npioncb">नेपाली (npioncb)</option>
                                        <option disabled>─── म ───</option>
                                        <option value="marc">मराठी (marc)</option>
                                        <option disabled>─── മ ───</option>
                                        <option value="malc">മലയാളം (malc)</option>
                                    </optgroup>
                                    <optgroup label="New Testament Only">
                                        <option disabled>─── ' ───</option>
                                        <option value="kud">'Auhelawa (kud)</option>
                                        <option disabled>─── A ───</option>
                                        <option value="aau">Abau (aau)</option>
                                        <option value="acrnnt">Achi (acrNNT)</option>
                                        <option value="acrtnt">Achi (acrTNT)</option>
                                        <option value="acr-acc">Achi (acr-acc)</option>
                                        <option value="agd">Agarabi (agd)</option>
                                        <option value="dgc">Agta, Casiguran Dumagat (dgc)</option>
                                        <option value="agt">Agta, Central Cagayan (agt)</option>
                                        <option value="agn">Agutaynen (agn)</option>
                                        <option value="cpcnt">Ajyíninka Apurucayali (cpcNT)</option>
                                        <option value="knjnt">Akateko (knjNT)</option>
                                        <option value="akent">Akawaio (akeNT)</option>
                                        <option value="bssnt">Akoose (bssNT)</option>
                                        <option value="alw">Alaba-K'abeena (alw)</option>
                                        <option value="amp">Alamblak (amp)</option>
                                        <option value="gah">Alekano or Gahuku (gah)</option>
                                        <option value="alqalgnt">Algonquin (alqALGNT)</option>
                                        <option value="alpnt">Alune (alpNT)</option>
                                        <option value="amm">Ama (amm)</option>
                                        <option value="amn-amanab">Amanab (amn-amanab)</option>
                                        <option value="amn-n">Amanab (amn-n)</option>
                                        <option value="amrnt">Amarakaeri (amrNT)</option>
                                        <option value="amk">Ambai (amk)</option>
                                        <option value="abt-maprik">Ambulas (abt-maprik)</option>
                                        <option value="amh">Amharic (amh)</option>
                                        <option value="amo">Amo (amo)</option>
                                        <option value="amunt">Amuzgo, Guerrero (amuNT)</option>
                                        <option value="azgnt">Amuzgo, San Pedro Amuzgos (azgNT)</option>
                                        <option value="aby">Aneme Wake (aby)</option>
                                        <option value="agm">Angaataha (agm)</option>
                                        <option value="agg">Angor (agg)</option>
                                        <option value="boj">Anjam (boj)</option>
                                        <option value="aak">Ankave (aak)</option>
                                        <option value="apwnt">Apache, Western (apwNT)</option>
                                        <option value="apnnt">Apinayé (apnNT)</option>
                                        <option value="apunt">Apurinã (apuNT)</option>
                                        <option value="arlnt">Arabela (arlNT)</option>
                                        <option value="aon">Arapesh (aon)</option>
                                        <option value="apr">Arop-Lokep (apr)</option>
                                        <option value="aia">Arosi (aia)</option>
                                        <option value="are">Arrarnta, Western (are)</option>
                                        <option value="msy">Aruamu (msy)</option>
                                        <option value="cnint">Asháninka (cniNT)</option>
                                        <option value="cjont">Ashéninka Pajonal (cjoNT)</option>
                                        <option value="cpunt">Ashéninka, Pichis (cpuNT)</option>
                                        <option value="cpbnt">Ashéninka, Ucayali-yurúa (cpbNT)</option>
                                        <option value="att">Atta, Pamplona (att)</option>
                                        <option value="avt">Au (avt)</option>
                                        <option value="awb">Awa (awb)</option>
                                        <option value="kwi">Awa-Cuaiquer (kwi)</option>
                                        <option value="auy">Awiyaana (auy)</option>
                                        <option value="sgb">Ayta, Mag-antsi (sgb)</option>
                                        <option disabled>─── B ───</option>
                                        <option value="bvd">Baeggu (bvd)</option>
                                        <option value="bswe">Baiso (bswe)</option>
                                        <option value="bswl">Baiso (bswl)</option>
                                        <option value="bkqnt">Bakairí (bkqNT)</option>
                                        <option value="bki">Baki (bki)</option>
                                        <option value="blw">Balangao (blw)</option>
                                        <option value="blznt">Balantak (blzNT)</option>
                                        <option value="bsj">Bangwinji (bsj)</option>
                                        <option value="bsnnt">Barasana-Eduria (bsnNT)</option>
                                        <option value="mlp">Bargam (mlp)</option>
                                        <option value="bjk">Barok (bjk)</option>
                                        <option value="bjz">Baruga (bjz)</option>
                                        <option value="bjvnt">Bedjond (bjvNT)</option>
                                        <option value="bkw">Bekwel (bkw)</option>
                                        <option value="bzj">Belize Kriol English (bzj)</option>
                                        <option value="bef">Benabena (bef)</option>
                                        <option value="bhd">Bhadrawahi (bhd)</option>
                                        <option value="bht">Bhattiyali (bht)</option>
                                        <option value="bhi">Bhilali (bhi)</option>
                                        <option value="bhu">Bhunjia (bhu)</option>
                                        <option value="big">Biangai (big)</option>
                                        <option value="big2013">Biangai (big2013)</option>
                                        <option value="bhg">Binandere (bhg)</option>
                                        <option value="bon">Bine (bon)</option>
                                        <option value="bkd">Binukid (bkd)</option>
                                        <option value="bpr">Blaan, Koronadal (bpr)</option>
                                        <option value="mux">Bo-Ung (mux)</option>
                                        <option value="bdv">Bodo Parja (bdv)</option>
                                        <option value="smknt">Bolinao (smkNT)</option>
                                        <option value="ebk">Bontok, Eastern (ebk)</option>
                                        <option value="boant">Bora (boaNT)</option>
                                        <option value="gai">Borei (gai)</option>
                                        <option value="bwo">Borna (bwo)</option>
                                        <option value="jid">Bu (jid)</option>
                                        <option value="boxnt">Buamu (boxNT)</option>
                                        <option value="bzh">Buang (bzh)</option>
                                        <option value="mmo">Buang, Mangga (mmo)</option>
                                        <option value="bgt">Bughotu (bgt)</option>
                                        <option value="sabnt">Buglere (sabNT)</option>
                                        <option value="bgg">Bugun (bgg)</option>
                                        <option value="buk">Bukawa (buk)</option>
                                        <option value="apeb">Bukiyip (apeB)</option>
                                        <option value="apec">Bukiyip (apec)</option>
                                        <option value="bdd">Bunama (bdd)</option>
                                        <option value="bwd">Bwaidoka (bwd)</option>
                                        <option value="tte">Bwanabwana (tte)</option>
                                        <option disabled>─── C ───</option>
                                        <option value="cbv">Cacua (cbv)</option>
                                        <option value="clu">Caluyanun (clu)</option>
                                        <option value="kbh">Camsá (kbh)</option>
                                        <option value="kaqnt">Capanahua (kaqNT)</option>
                                        <option value="cotnt">Caquinte (cotNT)</option>
                                        <option value="cbcnt">Carapana (cbcNT)</option>
                                        <option value="cafnt">Carrier, Southern (cafNT)</option>
                                        <option value="cavnt">Cavineña (cavNT)</option>
                                        <option value="cment">Cerma (cmeNT)</option>
                                        <option value="cya">Chatino, Nopala (cya)</option>
                                        <option value="ctant">Chatino, Tataltepec (ctaNT)</option>
                                        <option value="ctpnt">Chatino, Western Highland (ctpNT)</option>
                                        <option value="cbk">Chavacano (cbk)</option>
                                        <option value="dao">Chin, Daai (dao)</option>
                                        <option value="csy">Chin, Siyin (csy)</option>
                                        <option value="zypnt">Chin, Zyphe (zypNT)</option>
                                        <option value="ccont">Chinantec, Comaltepec (ccoNT)</option>
                                        <option value="cnlnt">Chinantec, Lalana (cnlNT)</option>
                                        <option value="clent">Chinantec, Lealao (cleNT)</option>
                                        <option value="chzntps">Chinantec, Ozumacín (chzNTps)</option>
                                        <option value="cpant">Chinantec, Palantla (cpaNT)</option>
                                        <option value="chqnt">Chinantec, Quiotepec (chqNT)</option>
                                        <option value="csont">Chinantec, Sochiapam (csoNT)</option>
                                        <option value="cntnt">Chinantec, Tepetotutla (cntNT)</option>
                                        <option value="cucnt">Chinantec, Usila (cucNT)</option>
                                        <option value="cmnfeb">Chinese (cmnfeb)</option>
                                        <option value="capnt">Chipaya (capNT)</option>
                                        <option value="caxnt">Chiquitano (caxNT)</option>
                                        <option value="yao">Chiyawo (yao)</option>
                                        <option value="ctubl">Chol (ctuBl)</option>
                                        <option value="ctu76">Chol (ctu76)</option>
                                        <option value="chdnt">Chontal, Highland Oaxaca (chdNT)</option>
                                        <option value="chfnt">Chontal, Tabasco (chfNT)</option>
                                        <option value="cjv">Chuave (cjv)</option>
                                        <option value="ncunt">Chumburung (ncuNT)</option>
                                        <option value="caont">Chácobo (caoNT)</option>
                                        <option value="cofnt">Colorado (cofNT)</option>
                                        <option value="copcnt">Coptic (copcnt)</option>
                                        <option value="copbhc">Coptic (copbhc)</option>
                                        <option value="copshc">Coptic (copshc)</option>
                                        <option value="crnnt">Cora, El Nayar (crnNT)</option>
                                        <option value="cubnt">Cubeo (cubNT)</option>
                                        <option value="cui">Cuiba (cui)</option>
                                        <option value="cuxnt">Cuicatec, Tepeuxila (cuxNT)</option>
                                        <option value="cutnt">Cuicatec, Teutila (cutNT)</option>
                                        <option value="cug">Cung (cug)</option>
                                        <option value="cesnkb">Czech (cesnkb)</option>
                                        <option value="ceslb">Czech (ceslb)</option>
                                        <option disabled>─── D ───</option>
                                        <option value="dgz">Daga (dgz)</option>
                                        <option value="daant">Dangaléat (daaNT)</option>
                                        <option value="aso">Dano (aso)</option>
                                        <option value="dnv">Danu (dnv)</option>
                                        <option value="dww">Dawawa (dww)</option>
                                        <option value="dwrnt">Dawro (dwrNT)</option>
                                        <option value="anvnt">Denya (anvNT)</option>
                                        <option value="dso">Desiya (dso)</option>
                                        <option value="dif">Dieri (dif)</option>
                                        <option value="diknt">Dinka, Southwestern (dikNT)</option>
                                        <option value="dob">Dobu (dob)</option>
                                        <option value="dov">Dombe (dov)</option>
                                        <option value="sce">Dongxiang (sce)</option>
                                        <option value="ldb">Duya (ldb)</option>
                                        <option disabled>─── E ───</option>
                                        <option value="kjs">East Kewa (kjs)</option>
                                        <option value="djknt">Eastern Maroon Creole (djkNT)</option>
                                        <option value="enq2">Enga (enq2)</option>
                                        <option value="engtnt">English (engtnt)</option>
                                        <option value="engemtv">English (engemtv)</option>
                                        <option value="engtcent">English (engtcent)</option>
                                        <option value="engf35">English (engf35)</option>
                                        <option value="sjant">Epena (sjaNT)</option>
                                        <option value="esent">Ese Ejja (eseNT)</option>
                                        <option value="mcq">Ese or Managalasi (mcq)</option>
                                        <option value="ekk">Estonian, Standard (ekk)</option>
                                        <option value="utr">Etulo (utr)</option>
                                        <option value="nou">Ewage-Notu (nou)</option>
                                        <option disabled>─── F ───</option>
                                        <option value="fai">Faiwol (fai)</option>
                                        <option value="bjp">Fanamaket (bjp)</option>
                                        <option value="faa">Fasu (faa)</option>
                                        <option value="far">Fataleka (far)</option>
                                        <option value="aoj-filifita">Filifita dialect of Mufian (aoj-filifita)</option>
                                        <option value="fin">Finnish (fin)</option>
                                        <option value="ppo">Folopa (ppo)</option>
                                        <option value="for">Fore (for)</option>
                                        <option value="ffm">Fulfulde, Maasina (ffm)</option>
                                        <option value="fuhbkf">Fulfulde, Western Niger (fuhbkf)</option>
                                        <option disabled>─── G ───</option>
                                        <option value="gbl">Gamit (gbl)</option>
                                        <option value="gmvrnt">Gamo (gmvRNT)</option>
                                        <option value="gmvggm">Gamotso (gmvggm)</option>
                                        <option value="cabnt">Garifuna (cabNT)</option>
                                        <option value="gaq">Gata' (gaq)</option>
                                        <option value="gyl">Gayil (gyl)</option>
                                        <option value="gyz">Geji (gyz)</option>
                                        <option value="ghn">Ghanongga (ghn)</option>
                                        <option value="bbr">Girawa (bbr)</option>
                                        <option value="bbr2013">Girawa (bbr2013)</option>
                                        <option value="gofent">Gofa (gofENT)</option>
                                        <option value="gofrnt">Gofa (gofRNT)</option>
                                        <option value="gofwftw">Gofa (gofwftw)</option>
                                        <option value="gvf">Golin (gvf)</option>
                                        <option value="gux">Gourmanchéma (gux)</option>
                                        <option value="guxg">Gourmanchéma (guxg)</option>
                                        <option value="goj">Gowlan (goj)</option>
                                        <option value="gok">Gowli (gok)</option>
                                        <option value="grcsr">Greek, Ancient (grcsr)</option>
                                        <option value="grcbyz">Greek, Ancient (grcbyz)</option>
                                        <option value="grcmt">Greek, Ancient (grcmt)</option>
                                        <option value="grctr">Greek, Ancient (grctr)</option>
                                        <option value="grcf35">Greek, Ancient (grcf35)</option>
                                        <option value="grctcgnt">Greek, Ancient (grctcgnt)</option>
                                        <option value="grcsbl">Greek, Ancient (grcsbl)</option>
                                        <option value="grc-tisch">Greek, Ancient (grc-tisch)</option>
                                        <option value="guh">Guahibo (guh)</option>
                                        <option value="gvc">Guanano (gvc)</option>
                                        <option value="guint">Guaraní, Eastern Bolivian (guiNT)</option>
                                        <option value="gnwnt">Guaraní, Western Bolivian (gnwNT)</option>
                                        <option value="gyrnt">Guarayu (gyrNT)</option>
                                        <option value="guont">Guayabero (guoNT)</option>
                                        <option value="ghs">Guhu-Samane (ghs)</option>
                                        <option value="dah">Gwahatike (dah)</option>
                                        <option value="gwint">Gwich'in (gwiNT)</option>
                                        <option disabled>─── H ───</option>
                                        <option value="hlb">Halbi (hlb)</option>
                                        <option value="hla">Halia (hla)</option>
                                        <option value="amf">Hamer-Banna (amf)</option>
                                        <option value="tmd">Haruai (tmd)</option>
                                        <option value="bgc">Haryanvi (bgc)</option>
                                        <option value="hauulb">Hausa (hauulb)</option>
                                        <option value="xed">Hdi (xed)</option>
                                        <option value="hebsg">Hebrew (hebsg)</option>
                                        <option value="heblb">Hebrew (heblb)</option>
                                        <option value="hnsnt">Hindustani, Caribbean (hnsNT)</option>
                                        <option value="hixnt">Hixkaryána (hixNT)</option>
                                        <option value="hopnt">Hopi (hopNT)</option>
                                        <option value="hrebt">Hre (hrebt)</option>
                                        <option value="hrvbib">Hrvatski (hrvbib)</option>
                                        <option value="hubnt">Huambisa (hubNT)</option>
                                        <option value="husnt1971">Huastec (husNT1971)</option>
                                        <option value="husnt2005">Huastec (husNT2005)</option>
                                        <option value="huvnt">Huave, San Mateo Del Mar (huvNT)</option>
                                        <option value="hchnt">Huichol (hchNT)</option>
                                        <option value="hto">Huitoto, Minica (hto)</option>
                                        <option value="huunt">Huitoto, Murui (huuNT)</option>
                                        <option value="hwo">Hwana (hwo)</option>
                                        <option disabled>─── I ───</option>
                                        <option value="yml">Iamalele (yml)</option>
                                        <option value="ian">Iatmul (ian)</option>
                                        <option value="viv">Iduna (viv)</option>
                                        <option value="ignnt">Ignaciano (ignNT)</option>
                                        <option value="ikknt">Ika (ikkNT)</option>
                                        <option value="ikz">Ikizu (ikz)</option>
                                        <option value="ikwnt">Ikwere (ikwNT)</option>
                                        <option value="imo">Imbo Ungu (imo)</option>
                                        <option value="abx">Inabaknon (abx)</option>
                                        <option value="indags">Indonesian (indags)</option>
                                        <option value="inb">Inga (inb)</option>
                                        <option value="ino">Inoke-Yate (ino)</option>
                                        <option value="ino2013">Inoke-Yate (ino2013)</option>
                                        <option value="isn">Isanzu (isn)</option>
                                        <option value="atgnt">Ivbie North-Okpela-Arhe (atgNT)</option>
                                        <option value="kbm">Iwal (kbm)</option>
                                        <option value="iws">Iwam, Sepik (iws)</option>
                                        <option value="ixlnnt">Ixil (ixlNNT)</option>
                                        <option value="ixlcnt">Ixil (ixlCNT)</option>
                                        <option value="nca">Iyo (nca)</option>
                                        <option disabled>─── J ───</option>
                                        <option value="jacnt">Jakalteko (jacNT)</option>
                                        <option value="jni">Janji (jni)</option>
                                        <option value="jpn1965">Japanese (jpn1965)</option>
                                        <option value="jvnnt">Javanese, Caribbean (jvnNT)</option>
                                        <option value="juy">Juray (juy)</option>
                                        <option disabled>─── K ───</option>
                                        <option value="quctt">K'iche' (quctt)</option>
                                        <option value="qucnnt">K'iche' (qucNNT)</option>
                                        <option value="quctnt">K'iche' (qucTNT)</option>
                                        <option value="urbnt">Kaapor (urbNT)</option>
                                        <option value="kbcnt">Kadiwéu (kbcNT)</option>
                                        <option value="cgc">Kagayanen (cgc)</option>
                                        <option value="kgpnt">Kaingang (kgpNT)</option>
                                        <option value="kgknt">Kaiwá (kgkNT)</option>
                                        <option value="kmh">Kalam (kmh)</option>
                                        <option value="kmk">Kalinga, Limos (kmk)</option>
                                        <option value="kms">Kamasau (kms)</option>
                                        <option value="gam">Kandawo (gam)</option>
                                        <option value="kmu">Kanite (kmu)</option>
                                        <option value="xnn">Kankanay, Northern (xnn)</option>
                                        <option value="tbx">Kapin (tbx)</option>
                                        <option value="caksnt">Kaqchikel (cakSNT)</option>
                                        <option value="cak">Kaqchikel (cak)</option>
                                        <option value="cakwnt">Kaqchikel (cakWNT)</option>
                                        <option value="caknt">Kaqchikel (cakNT)</option>
                                        <option value="cakynt">Kaqchikel (cakYNT)</option>
                                        <option value="cakcnt">Kaqchikel (cakCNT)</option>
                                        <option value="cakent">Kaqchikel (cakENT)</option>
                                        <option value="reg">Kara (reg)</option>
                                        <option value="leu">Kara (leu)</option>
                                        <option value="kpjnt">Karajá (kpjNT)</option>
                                        <option value="yuj">Karkar-Yuri (yuj)</option>
                                        <option value="cbsnt">Kashinawa (cbsNT)</option>
                                        <option value="khs">Kasua (khs)</option>
                                        <option value="kmg">Kate (kmg)</option>
                                        <option value="kyznt">Kayabí (kyzNT)</option>
                                        <option value="txunt">Kayapó (txuNT)</option>
                                        <option value="khz">Keapara (khz)</option>
                                        <option value="bmh">Kein (bmh)</option>
                                        <option value="kyq">Kenga (kyq)</option>
                                        <option value="kennt">Kenyang (kenNT)</option>
                                        <option value="zgam">Kinga (zgam)</option>
                                        <option value="geb">Kire (geb)</option>
                                        <option value="kjent">Kisar (kjeNT)</option>
                                        <option value="kiz">Kisi (kiz)</option>
                                        <option value="kpw">Kobon (kpw)</option>
                                        <option value="kpx">Koiali, Mountain (kpx)</option>
                                        <option value="nit">Kolami, Southeastern (nit)</option>
                                        <option value="kpf">Komba (kpf)</option>
                                        <option value="kxw">Konai (kxw)</option>
                                        <option value="kfcp">Konda-Dora (kfcp)</option>
                                        <option value="xon">Konkomba (xon)</option>
                                        <option value="kze">Kosena (kze)</option>
                                        <option value="kyf">Kouya (kyf)</option>
                                        <option value="kff">Koya (kff)</option>
                                        <option value="sbs">Kuhane (sbs)</option>
                                        <option value="kue">Kuman (kue)</option>
                                        <option value="kvnnt">Kuna, Border (kvnNT)</option>
                                        <option value="cuk09">Kuna, San Blas (cuk09)</option>
                                        <option value="kup">Kunimaipa (kup)</option>
                                        <option value="kto">Kuot (kto)</option>
                                        <option value="kdc2014">Kutu (kdc2014)</option>
                                        <option value="kxv">Kuvi (kxv)</option>
                                        <option value="kwd">Kwaio (kwd)</option>
                                        <option value="kwj">Kwanga (kwj)</option>
                                        <option value="kmo">Kwoma (kmo)</option>
                                        <option disabled>─── L ───</option>
                                        <option value="lbb">Label (lbb)</option>
                                        <option value="lacnt">Lacandon (lacNT)</option>
                                        <option value="nrz">Lala (nrz)</option>
                                        <option value="lww">Lewo (lww)</option>
                                        <option value="lifnt">Limbu (lifNT)</option>
                                        <option value="lifnt2">Limbu (lifNT2)</option>
                                        <option value="uvl">Lote (uvl)</option>
                                        <option value="ruf">Luguru (ruf)</option>
                                        <option value="lyn">Luyana (lyn)</option>
                                        <option disabled>─── M ───</option>
                                        <option value="mcbnt">Machiguenga (mcbNT)</option>
                                        <option value="myy">Macuna (myy)</option>
                                        <option value="mbcnt">Macushi (mbcNT)</option>
                                        <option value="hun">Magyar (hun)</option>
                                        <option value="mti">Maiwa (mti)</option>
                                        <option value="mca">Maka (mca)</option>
                                        <option value="mcp">Makaa (mcp)</option>
                                        <option value="mgh2016">Makhuwa-Meetto (mgh2016)</option>
                                        <option value="zlmkszi">Malay (zlmKSZI)</option>
                                        <option value="mdybse">Male (mdybse)</option>
                                        <option value="hot">Malei-Hote (hot)</option>
                                        <option value="mamnt">Mam (mamNT)</option>
                                        <option value="mamc">Mam (mamC)</option>
                                        <option value="mqjnt">Mamasa (mqjNT)</option>
                                        <option value="mva">Manam (mva)</option>
                                        <option value="mle">Manambu (mle)</option>
                                        <option value="tbf">Mandara (tbf)</option>
                                        <option value="mbh">Mangseng (mbh)</option>
                                        <option value="msmnt">Manobo, Agusan (msmNT)</option>
                                        <option value="atdnt">Manobo, Ata (atdNT)</option>
                                        <option value="mbtnt">Manobo, Matigsalug (mbtNT)</option>
                                        <option value="obont">Manobo, Obo (oboNT)</option>
                                        <option value="msk">Mansaka (msk)</option>
                                        <option value="mlh">Mape (mlh)</option>
                                        <option value="arnnt">Mapudungun (arnNT)</option>
                                        <option value="mfm">Marghi South (mfm)</option>
                                        <option value="dad">Marik (dad)</option>
                                        <option value="mpj">Martu Wangka (mpj)</option>
                                        <option value="msb">Masbatenyo (msb)</option>
                                        <option value="klv">Maskelynes (klv)</option>
                                        <option value="mgv">Matengo (mgv)</option>
                                        <option value="mcfnt">Matsés (mcfNT)</option>
                                        <option value="mgw">Matumbi (mgw)</option>
                                        <option value="mhl">Mauwake (mhl)</option>
                                        <option value="mblnt">Maxakalí (mblNT)</option>
                                        <option value="mopnt">Maya, Mopán (mopNT)</option>
                                        <option value="maznt">Mazahua, Central (mazNT)</option>
                                        <option value="maqnt">Mazatec, Chiquihuitlán (maqNT)</option>
                                        <option value="maunt">Mazatec, Huautla (mauNT)</option>
                                        <option value="majnt">Mazatec, Jalapa de Díaz (majNT)</option>
                                        <option value="maant">Mazatec, San Jerónimo Tecóatl (maaNT)</option>
                                        <option value="vmynt">Mazateco, Ayautla (vmyNT)</option>
                                        <option value="mqbnt">Mbuko (mqbNT)</option>
                                        <option value="mni">Meitei (mni)</option>
                                        <option value="mek">Mekeo (mek)</option>
                                        <option value="mfxe">Melo (mfxe)</option>
                                        <option value="mfxl">Melo (mfxl)</option>
                                        <option value="med">Melpa (med)</option>
                                        <option value="sim">Mende (sim)</option>
                                        <option value="mee">Mengen (mee)</option>
                                        <option value="mcr">Menya (mcr)</option>
                                        <option value="mxm">Meramera (mxm)</option>
                                        <option value="meq">Merey (meq)</option>
                                        <option value="micmiqnt">Mi'kmaq (micMIQNT)</option>
                                        <option value="mpt">Mian (mpt)</option>
                                        <option value="mvn">Minaveha (mvn)</option>
                                        <option value="aai">Miniafia (aai)</option>
                                        <option value="kmh-m">Minimib dialect of Kalam (kmh-m)</option>
                                        <option value="mcont">Mixe, Coatlán (mcoNT)</option>
                                        <option value="mirnt">Mixe, Isthmus (mirNT)</option>
                                        <option value="mxqnt">Mixe, Juquila (mxqNT)</option>
                                        <option value="mxpnt">Mixe, Tlahuitoltepec (mxpNT)</option>
                                        <option value="mtont">Mixe, Totontepec (mtoNT)</option>
                                        <option value="mibnt">Mixtec, Atatláhuca (mibNT)</option>
                                        <option value="mihnt">Mixtec, Chayuco (mihNT)</option>
                                        <option value="miznt">Mixtec, Coatzospan (mizNT)</option>
                                        <option value="xtdnt">Mixtec, Diuxi-tilantongo (xtdNT)</option>
                                        <option value="mxtnt">Mixtec, Jamiltepec (mxtNT)</option>
                                        <option value="xtmntpp">Mixtec, Magdalena Peñasco (xtmNTpp)</option>
                                        <option value="mient">Mixtec, Ocotepec (mieNT)</option>
                                        <option value="milnt">Mixtec, Peñoles (milNT)</option>
                                        <option value="miont">Mixtec, Pinotepa Nacional (mioNT)</option>
                                        <option value="mjcnt">Mixtec, San Juan Colorado (mjcNT)</option>
                                        <option value="mignt">Mixtec, San Miguel el Grande (migNT)</option>
                                        <option value="mksnt">Mixtec, Silacayoapan (mksNT)</option>
                                        <option value="mitnt">Mixtec, Southern Puebla (mitNT)</option>
                                        <option value="mxbnt">Mixtec, Tezoatlán (mxbNT)</option>
                                        <option value="mpmnt">Mixtec, Yosondúa (mpmNT)</option>
                                        <option value="soy">Miyobe (soy)</option>
                                        <option value="mkj">Mokilese (mkj)</option>
                                        <option value="mkl">Mokole (mkl)</option>
                                        <option value="mox">Molima (mox)</option>
                                        <option value="mpa">Mpoto (mpa)</option>
                                        <option value="aoj">Mufian (aoj)</option>
                                        <option value="bmrnt">Muinane (bmrNT)</option>
                                        <option value="unx">Munda (unx)</option>
                                        <option value="myu">Mundurukú (myu)</option>
                                        <option value="muy">Muyang (muy)</option>
                                        <option value="myw">Muyuw (myw)</option>
                                        <option value="wmw">Mwani (wmw)</option>
                                        <option value="mwe">Mwera (mwe)</option>
                                        <option value="mri">Māori (mri)</option>
                                        <option disabled>─── N ───</option>
                                        <option value="naf">Nabak (naf)</option>
                                        <option value="mbjnt">Nadeb (mbjNT)</option>
                                        <option value="tnk">Nafe (tnk)</option>
                                        <option value="nag">Naga Pidgin (nag)</option>
                                        <option value="kfw">Naga, Kharam (kfw)</option>
                                        <option value="tvt">Naga, Tutsa (tvt)</option>
                                        <option value="nhent">Nahuatl,  Huasteca Oriental (nheNT)</option>
                                        <option value="ngunt">Nahuatl, Guerrero (nguNT)</option>
                                        <option value="azznt">Nahuatl, Highland Puebla (azzNT)</option>
                                        <option value="nclnt">Nahuatl, Michoacán (nclNT)</option>
                                        <option value="nhynt">Nahuatl, Northern Oaxaca (nhyNT)</option>
                                        <option value="ncjnt">Nahuatl, Northern Puebla (ncjNT)</option>
                                        <option value="nplnt">Nahuatl, Southeastern Puebla (nplNT)</option>
                                        <option value="nhgnt">Nahuatl, Tetelcingo (nhgNT)</option>
                                        <option value="nhint">Nahuatl, Zacatlán-Ahuacatlán-Tepetzintla (nhiNT)</option>
                                        <option value="nak">Nakanai (nak)</option>
                                        <option value="nal">Nalik (nal)</option>
                                        <option value="nabnt">Nambikuára, Southern (nabNT)</option>
                                        <option value="nvm">Namiae (nvm)</option>
                                        <option value="nhr">Naro (nhr)</option>
                                        <option value="ncr">Ncane (ncr)</option>
                                        <option value="ndj">Ndamba (ndj)</option>
                                        <option value="dne">Ndendeule (dne)</option>
                                        <option value="ndg">Ndengereko (ndg)</option>
                                        <option value="nww">Ndwewe (nww)</option>
                                        <option value="nldgbv">Nederlands (nldgbv)</option>
                                        <option value="nsn">Nehan (nsn)</option>
                                        <option value="gngnt">Ngangam (gngNT)</option>
                                        <option value="nnq">Ngindo (nnq)</option>
                                        <option value="xnj">Ngoni (xnj)</option>
                                        <option value="ngp">Nguu (ngp)</option>
                                        <option value="gymnt">Ngäbere (gymNT)</option>
                                        <option value="nii">Nii (nii)</option>
                                        <option value="ninnt">Ninzo (ninNT)</option>
                                        <option value="nkn">Nkangala (nkn)</option>
                                        <option value="nkont">Nkonya (nkoNT)</option>
                                        <option value="gaw">Nobonob (gaw)</option>
                                        <option value="notnt">Nomatsiguenga (notNT)</option>
                                        <option value="nhunt">Noone (nhuNT)</option>
                                        <option value="tnn">North Tanna (tnn)</option>
                                        <option value="esknt">Northwest Alaska Eskimo (eskNT)</option>
                                        <option value="noblb">Norwegian (noblb)</option>
                                        <option value="ncf">Notsi (ncf)</option>
                                        <option value="nuq">Nukumanu (nuq)</option>
                                        <option disabled>─── O ───</option>
                                        <option value="kkc">Odoodee (kkc)</option>
                                        <option value="eri">Ogea (eri)</option>
                                        <option value="opm">Oksapmin (opm)</option>
                                        <option value="ong">Olo (ong)</option>
                                        <option value="aom">Omie (aom)</option>
                                        <option value="ons">Ono (ons)</option>
                                        <option value="okv">Orokaiva (okv)</option>
                                        <option value="okvh">Orokaiva (okvh)</option>
                                        <option value="otmnt">Otomi, Eastern Highland (otmNT)</option>
                                        <option value="otsnt">Otomi, Estado de México (otsNT)</option>
                                        <option value="otent">Otomi, Mezquital (oteNT)</option>
                                        <option value="otqnt">Otomi, Querétaro (otqNT)</option>
                                        <option value="otnnt">Otomi, Tenango (otnNT)</option>
                                        <option value="oyde">Oyda (oyde)</option>
                                        <option value="oydl">Oyda (oydl)</option>
                                        <option disabled>─── P ───</option>
                                        <option value="bfz">Pahari, Mahasu (bfz)</option>
                                        <option value="print">Paicî (priNT)</option>
                                        <option value="paont">Paiute, Northern (paoNT)</option>
                                        <option value="plu">Palikúr (plu)</option>
                                        <option value="prfnt">Paranan (prfNT)</option>
                                        <option value="pabnt">Parecís (pabNT)</option>
                                        <option value="ptp">Patep (ptp)</option>
                                        <option value="gfkh">Patpatar (gfkh)</option>
                                        <option value="gfks">Patpatar (gfks)</option>
                                        <option value="padnt">Paumarí (padNT)</option>
                                        <option value="peg">Pengo (peg)</option>
                                        <option value="piont">Piapoco (pioNT)</option>
                                        <option value="pirnt">Piratapuyo (pirNT)</option>
                                        <option value="poy">Pogolo (poy)</option>
                                        <option value="plj">Polci (plj)</option>
                                        <option value="polsz">Polish (polsz)</option>
                                        <option value="poent">Popoloca, San Juan Atzingo (poeNT)</option>
                                        <option value="plsnt">Popoloca, San Marcos Tlalcoyalco (plsNT)</option>
                                        <option value="point">Popoluca, Highland (poiNT)</option>
                                        <option value="pohnt">Poqomchi' (pohNT)</option>
                                        <option value="portft">Portuguese (portft)</option>
                                        <option value="porblt">Português (porblt)</option>
                                        <option value="pwr">Powari (pwr)</option>
                                        <option value="fuf">Pular (fuf)</option>
                                        <option disabled>─── Q ───</option>
                                        <option value="keknt">Q'eqchi' (kekNT)</option>
                                        <option value="qvcnt">Quechua, Cajamarca (qvcNT)</option>
                                        <option value="qvent">Quechua, Eastern Apurímac (qveNT)</option>
                                        <option value="qvhnt">Quechua, Huamalíes-Dos de Mayo Huánuco (qvhNT)</option>
                                        <option value="qwhnt">Quechua, Huaylas Ancash (qwhNT)</option>
                                        <option value="qvwnt">Quechua, Huaylla Wanca (qvwNT)</option>
                                        <option value="qufnt">Quechua, Lambayeque (qufNT)</option>
                                        <option value="qvmnt">Quechua, Margos-Yarowilca-Lauricocha (qvmNT)</option>
                                        <option value="qulnt">Quechua, North Bolivian (qulNT)</option>
                                        <option value="qvnnt">Quechua, North Junín (qvnNT)</option>
                                        <option value="qxnnt">Quechua, Northern Conchucos Ancash (qxnNT)</option>
                                        <option value="qxhnt">Quechua, Panao Huánuco (qxhNT)</option>
                                        <option value="quhnt">Quechua, South Bolivian (quhNT)</option>
                                        <option value="qxont">Quechua, Southern Conchucos Ancash (qxoNT)</option>
                                        <option value="qupnt">Quechua, Southern Pastaza (qupNT)</option>
                                        <option value="qvznt">Quichua, Northern Pastaza (qvzNT)</option>
                                        <option disabled>─── R ───</option>
                                        <option value="rki">Rakhine (rki)</option>
                                        <option value="lag">Rangi (lag)</option>
                                        <option value="rwo-karo">Rawa (rwo-karo)</option>
                                        <option value="rwo-rawa">Rawa (rwo-rawa)</option>
                                        <option value="rkbnt">Rikbaktsa (rkbNT)</option>
                                        <option value="rhgc">Rohingya (rhgc)</option>
                                        <option value="rmna">Romani (rmna)</option>
                                        <option value="rmychergash">Romani, Vlax (rmyChergash)</option>
                                        <option value="rmygurbet">Romani, Vlax (rmyGurbet)</option>
                                        <option value="ronlsb">Romanian (ronlsb)</option>
                                        <option value="roo">Rotokas (roo)</option>
                                        <option disabled>─── S ───</option>
                                        <option value="apb">Sa'a (apb)</option>
                                        <option value="spynt">Sabaot (spyNT)</option>
                                        <option value="apz">Safeyoka (apz)</option>
                                        <option value="sbk">Safwa (sbk)</option>
                                        <option value="acfnt">Saint Lucian Creole French (acfNT)</option>
                                        <option value="sch">Sakachep (sch)</option>
                                        <option value="sbe">Saliba (sbe)</option>
                                        <option value="sll">Salt-Yui (sll)</option>
                                        <option value="sny">Saniyo-Hiyewe (sny)</option>
                                        <option value="sanasm">Sanskrit (sanasm)</option>
                                        <option value="sanben">Sanskrit (sanben)</option>
                                        <option value="sanbur">Sanskrit (sanbur)</option>
                                        <option value="sancol">Sanskrit (sancol)</option>
                                        <option value="sandev">Sanskrit (sandev)</option>
                                        <option value="sanguj">Sanskrit (sanguj)</option>
                                        <option value="sanhk">Sanskrit (sanhk)</option>
                                        <option value="sanias">Sanskrit (sanias)</option>
                                        <option value="saniso">Sanskrit (saniso)</option>
                                        <option value="sanitr">Sanskrit (sanitr)</option>
                                        <option value="srmnt">Saramaccan (srmNT)</option>
                                        <option value="asj">Sari (asj)</option>
                                        <option value="mavnt">Sateré-Mawé (mavNT)</option>
                                        <option value="sankan">Saṃskṛtam (sankan)</option>
                                        <option value="sankhm">Saṃskṛtam (sankhm)</option>
                                        <option value="sanmal">Saṃskṛtam (sanmal)</option>
                                        <option value="sanori">Saṃskṛtam (sanori)</option>
                                        <option value="sanpun">Saṃskṛtam (sanpun)</option>
                                        <option value="sansin">Saṃskṛtam (sansin)</option>
                                        <option value="santam">Saṃskṛtam (santam)</option>
                                        <option value="santel">Saṃskṛtam (santel)</option>
                                        <option value="santha">Saṃskṛtam (santha)</option>
                                        <option value="santib">Saṃskṛtam (santib)</option>
                                        <option value="sanurd">Saṃskṛtam (sanurd)</option>
                                        <option value="sanvel">Saṃskṛtam (sanvel)</option>
                                        <option value="gulnt">Sea Island Creole English (gulNT)</option>
                                        <option value="seynt">Secoya (seyNT)</option>
                                        <option value="ssg">Seimat (ssg)</option>
                                        <option value="spl">Selepet (spl)</option>
                                        <option value="tsn">Setswana (tsn)</option>
                                        <option value="mcdnt">Sharanahua (mcdNT)</option>
                                        <option value="sle">Sholaga (sle)</option>
                                        <option value="jivnt">Shuar (jivNT)</option>
                                        <option value="snp">Siane (snp)</option>
                                        <option value="snp-lambau">Siane (snp-lambau)</option>
                                        <option value="snc">Sinaugoro (snc)</option>
                                        <option value="snnnt">Siona (snnNT)</option>
                                        <option value="sri">Siriano (sri)</option>
                                        <option value="srqnt">Sirionó (srqNT)</option>
                                        <option value="slk">Slovak (slk)</option>
                                        <option value="sby">Soli (sby)</option>
                                        <option value="nwi">Southwest Tanna (nwi)</option>
                                        <option value="srnnt">Sranan (srnNT)</option>
                                        <option value="sxbnt">Suba (sxbNT)</option>
                                        <option value="sue">Suena (sue)</option>
                                        <option value="sua">Sulka (sua)</option>
                                        <option value="sgz">Sursurunga (sgz)</option>
                                        <option value="swh1850">Swahili (swh1850)</option>
                                        <option disabled>─── T ───</option>
                                        <option value="knv-aramia">Tabo (knv-aramia)</option>
                                        <option value="knv-fly_river">Tabo (knv-fly_river)</option>
                                        <option value="tnant">Tacana (tnaNT)</option>
                                        <option value="klg">Tagakaulo (klg)</option>
                                        <option value="tgj">Tagin (tgj)</option>
                                        <option value="taw">Tai (taw)</option>
                                        <option value="omw">Tairora, South (omw)</option>
                                        <option value="tbc">Takia (tbc)</option>
                                        <option value="nho">Takuu (nho)</option>
                                        <option value="taj">Tamang, Eastern (taj)</option>
                                        <option value="tgp">Tangoa (tgp)</option>
                                        <option value="tacnt">Tarahumara, Western (tacNT)</option>
                                        <option value="tav">Tatuyo (tav)</option>
                                        <option value="tvn">Tavoyan (tvn)</option>
                                        <option value="tbo">Tawala (tbo)</option>
                                        <option value="tyx">Teke-Tyee (tyx)</option>
                                        <option value="ttcnt">Tektiteko (ttcNT)</option>
                                        <option value="tlf">Telefol (tlf)</option>
                                        <option value="pahnt">Tenharim (pahNT)</option>
                                        <option value="teent">Tepehua, Huehuetla (teeNT)</option>
                                        <option value="tptnt">Tepehua, Tlachichilco (tptNT)</option>
                                        <option value="ntpnt">Tepehuan, Northern (ntpNT)</option>
                                        <option value="stpnt">Tepehuan, Southeastern (stpNT)</option>
                                        <option value="ternt">Terêna (terNT)</option>
                                        <option value="thr">Tharu, Rana (thr)</option>
                                        <option value="tcant">Ticuna (tcaNT)</option>
                                        <option value="tif">Tifal (tif)</option>
                                        <option value="tim">Timbe (tim)</option>
                                        <option value="tpz">Tinputz (tpz)</option>
                                        <option value="tiy">Tiruray (tiy)</option>
                                        <option value="oodnt">Tohono O'odham (oodNT)</option>
                                        <option value="tojnt">Tojolabal (tojNT)</option>
                                        <option value="jicnt">Tol (jicNT)</option>
                                        <option value="tocnt">Totonac, Coyutla (tocNT)</option>
                                        <option value="tosnt">Totonac, Highland (tosNT)</option>
                                        <option value="topnt">Totonac, Papantla (topNT)</option>
                                        <option value="tkunt">Totonac, Upper Necaxa (tkuNT)</option>
                                        <option value="toont">Totonac, Xicotepec De Juárez (tooNT)</option>
                                        <option value="trcnt">Triqui, Copala (trcNT)</option>
                                        <option value="kdlnt">Tsikimba (kdlNT)</option>
                                        <option value="tswnt">Tsishingini (tswNT)</option>
                                        <option value="tuf">Tunebo, Central (tuf)</option>
                                        <option value="turobt">Turkish (turobt)</option>
                                        <option value="tue">Tuyuca (tue)</option>
                                        <option value="tzjnt">Tz'utujil (tzjNT)</option>
                                        <option value="tzje">Tz'utujil (tzjE)</option>
                                        <option value="tzotzc">Tzotzil (tzotzc)</option>
                                        <option value="tzont">Tzotzil (tzoNT)</option>
                                        <option value="tzotze">Tzotzil (tzotze)</option>
                                        <option value="tzoznt">Tzotzil (tzoZNT)</option>
                                        <option value="tzosa">Tzotzil (tzoSA)</option>
                                        <option disabled>─── U ───</option>
                                        <option value="ksj">Uare (ksj)</option>
                                        <option value="uli">Ulithian (uli)</option>
                                        <option value="gdn">Umanakaina (gdn)</option>
                                        <option value="ubu-kala">Umbu-Ungu (ubu-kala)</option>
                                        <option value="ubu-nopenge">Umbu-Ungu (ubu-nopenge)</option>
                                        <option value="ubu-andelale">Umbu-Ungu (ubu-andelale)</option>
                                        <option value="uro">Ura (uro)</option>
                                        <option value="urant">Urarina (uraNT)</option>
                                        <option value="urt">Urat (urt)</option>
                                        <option value="uvh">Uri (uvh)</option>
                                        <option value="urim">Urim (urim)</option>
                                        <option value="upv">Uripiv-Wala-Rano-Atchin (upv)</option>
                                        <option value="wnu">Usan (wnu)</option>
                                        <option value="uspnt">Uspanteko (uspNT)</option>
                                        <option disabled>─── V ───</option>
                                        <option value="vaa">Vaagri Booli (vaa)</option>
                                        <option value="vgr">Vaghri (vgr)</option>
                                        <option value="wiv">Vitu (wiv)</option>
                                        <option value="wbi">Vwanji (wbi)</option>
                                        <option disabled>─── W ───</option>
                                        <option value="waj">Waffa (waj)</option>
                                        <option value="rro">Waima (rro)</option>
                                        <option value="baont">Waimaha (baoNT)</option>
                                        <option value="lgl">Wala (lgl)</option>
                                        <option value="aucnt">Waorani (aucNT)</option>
                                        <option value="wapnt">Wapishana (wapNT)</option>
                                        <option value="hrw">Warwar Feni (hrw)</option>
                                        <option value="wer">Weri (wer)</option>
                                        <option value="tnp">Whitesands (tnp)</option>
                                        <option value="wim">Wik-Mungkan (wim)</option>
                                        <option value="gdr">Wipi (gdr)</option>
                                        <option value="wiu">Wiru (wiu)</option>
                                        <option value="wol2010">Wolof (wol2010)</option>
                                        <option value="abt-wosera">Wosera-Kamu dialect of Ambulas (abt-wosera)</option>
                                        <option value="noae">Woun Meu (noaE)</option>
                                        <option value="noah">Woun Meu (noaH)</option>
                                        <option value="wuv">Wuvalu-Aua (wuv)</option>
                                        <option disabled>─── X ───</option>
                                        <option value="xavnt">Xavánte (xavNT)</option>
                                        <option disabled>─── Y ───</option>
                                        <option value="yadnt">Yagua (yadNT)</option>
                                        <option value="iyx">Yaka (iyx)</option>
                                        <option value="yaf">Yaka (yaf)</option>
                                        <option value="yaant">Yaminahua (yaaNT)</option>
                                        <option value="ament">Yanesha' (ameNT)</option>
                                        <option value="yns">Yansi (yns)</option>
                                        <option value="yrent">Yaouré (yreNT)</option>
                                        <option value="yaqnt">Yaqui (yaqNT)</option>
                                        <option value="yrb">Yareba (yrb)</option>
                                        <option value="yuw">Yau (yuw)</option>
                                        <option value="yby">Yaweyuha (yby)</option>
                                        <option value="yle">Yele (yle)</option>
                                        <option value="jnje">Yemsa (jnje)</option>
                                        <option value="jnjl">Yemsa (jnjl)</option>
                                        <option value="yss-yamano">Yessan-Mayo (yss-yamano)</option>
                                        <option value="yss-yawu">Yessan-Mayo (yss-yawu)</option>
                                        <option value="ydd">Yiddish, Eastern (ydd)</option>
                                        <option value="pibnt">Yine (pibNT)</option>
                                        <option value="ycn">Yucuna (ycn)</option>
                                        <option disabled>─── Z ───</option>
                                        <option value="atbnt">Zaiwa (atbNT)</option>
                                        <option value="zak">Zanaki (zak)</option>
                                        <option value="zpont">Zapotec, Amatlán (zpoNT)</option>
                                        <option value="zadnt">Zapotec, Cajonos (zadNT)</option>
                                        <option value="zpvnt">Zapotec, Chichicapan (zpvNT)</option>
                                        <option value="zpcnt">Zapotec, Choapan (zpcNT)</option>
                                        <option value="zcant">Zapotec, Coatecas Altas (zcaNT)</option>
                                        <option value="zaint">Zapotec, Isthmus (zaiNT)</option>
                                        <option value="zplnt">Zapotec, Lachixío (zplNT)</option>
                                        <option value="ztp">Zapotec, Loxicha (ztp)</option>
                                        <option value="zamnt">Zapotec, Miahuatlán (zamNT)</option>
                                        <option value="zawnt">Zapotec, Mitla (zawNT)</option>
                                        <option value="zpmnt">Zapotec, Mixtepec (zpmNT)</option>
                                        <option value="zacnt">Zapotec, Ocotlán (zacNT)</option>
                                        <option value="zaont">Zapotec, Ozolotepec (zaoNT)</option>
                                        <option value="ztqnt">Zapotec, Quioquitani-Quierí (ztqNT)</option>
                                        <option value="zabnt">Zapotec, San Juan Guelavía (zabNT)</option>
                                        <option value="zapnt">Zapotec, Santa María Quiegolani (zapNT)</option>
                                        <option value="zasnt">Zapotec, Santo Domingo Albarradas (zasNT)</option>
                                        <option value="zaant">Zapotec, Sierra de Juárez (zaaNT)</option>
                                        <option value="zsrnt">Zapotec, Southern Rincon (zsrNT)</option>
                                        <option value="zpzntpp">Zapotec, Texmelucan (zpzNTpp)</option>
                                        <option value="zpunt">Zapotec, Yalálag (zpuNT)</option>
                                        <option value="zavnt">Zapotec, Yatzachi (zavNT)</option>
                                        <option value="zpqnt">Zapotec, Zoogocho (zpqNT)</option>
                                        <option value="zaj">Zaramo (zaj)</option>
                                        <option value="zia">Zia (zia)</option>
                                        <option value="ziw">Zigua (ziw)</option>
                                        <option value="zin">Zinza (zin)</option>
                                        <option value="zosnt">Zoque, Francisco León (zosNT)</option>
                                        <option disabled>─── ಕ ───</option>
                                        <option value="kans">ಕನ್ನಡ (kans)</option>
                                        <option disabled>─── ’ ───</option>
                                        <option value="kud2014">’Auhelawa (kud2014)</option>
                                    </optgroup>
                                    
                                    <optgroup label="Regional">
                                        <option value="te">తెలుగు (Telugu)</option>
                                        <option value="ta">தமிழ் (Tamil)</option>
                                        // Local XML Batch
                                        <option value="pck">Paite</option>
                                        <option value="arb-xml">Arabic (XML)</option>
                                        <option value="my-xml">Burmese (XML)</option>
                                        <option value="pes-xml">Farsi (XML)</option>
                                        <option value="tl-xml">Tagalog (XML)</option>
                                        <option value="tr-xml">Turkish (XML)</option>
                                    </optgroup>
                                    <optgroup label="Global (Database)">
                                        <option value="afrikaans">Afrikaans</option>
                                        <option value="assamese">অসমীয়া (Assamese)</option>
                                        <option value="bengali">Bengali</option>
                                        <option value="ch">Chamorro</option>
                                        <option value="chr">Cherokee</option>
                                        <option value="dogri">Dogri</option>
                                        <option value="english">English (Global)</option>
                                        <option value="gujarati">Gujarati</option>
                                        <option value="hindi">Hindi</option>
                                        <option value="hungarian">Hungarian</option>
                                        <option value="indonesian">Indonesian</option>
                                        <option value="kannada">Kannada</option>
                                        <option value="ks">کٲشُر (Kashmiri)</option>
                                        <option value="tlh">Klingon</option>
                                        <option value="mg">Malagasy</option>
                                        <option value="malayalam">Malayalam</option>
                                        <option value="maithili">मैथिली (Maithili)</option>
                                        <option value="mi">Te Reo (Maori)</option>
                                        <option value="manipuri">Manipuri (Meitei)</option>
                                        <option value="marathi">Marathi</option>
                                        <option value="nd">Northern Ndebele</option>
                                        <option value="nepali">Nepali</option>
                                        <option value="oriya">Oriya</option>
                                        <option value="pon">Pohnpeian</option>
                                        <option value="pot">Potawatomi</option>
                                        <option value="punjabi">Punjabi</option>
                                        <option value="sanskrit">संस्कृतम् (Sanskrit)</option>
                                        <option value="sepedi">Sepedi</option>
                                        <option value="sn">Shona</option>
                                        <option value="tsg">Tausug</option>
                                        <option value="tpi">Tok Pisin</option>
                                        <option value="ppk">Uma</option>
                                        <option value="urdu">اردو (Urdu)</option>
                                        <option value="xhosa">Xhosa</option>
                                        <option value="zulu">Zulu</option>
                                        // Deep Search Combined Batch (Automated)
                                        <option value="shr">Shi</option>
                                        <option value="rifa">Tarifit</option>
                                        <option value="bel">Belarusian</option>
                                        <option value="tod">Toma</option>
                                        <option value="lin">Lingála</option>
                                        <option value="yal">Yalunka</option>
                                        <option value="mkw">Kituba</option>
                                        <option value="sus">Susu</option>
                                        <option value="wolmbs">Wolof</option>
                                        <option value="poronbv">Português</option>
                                        <option value="cth">Chin, Thaiphum</option>
                                        <option value="hlt">Chin, Matu</option>
                                        <option value="lug">Luganda</option>
                                        <option value="nya">Chichewa</option>
                                        <option value="pan">Panjabi, Eastern</option>
                                        <option value="suzbl">Sunwar</option>
                                        <option value="cebulb">Cebuano</option>
                                        <option value="ckb">Central Kurdish</option>
                                        <option value="ewe">eʋegbe</option>
                                        <option value="hatbsa">Haitian</option>
                                        <option value="hne">Chhattisgarhi</option>
                                        <option value="ibo">Igbo</option>
                                        <option value="luo">Dholuo</option>
                                        <option value="mri2012">Māori</option>
                                        <option value="nde">Ndebele</option>
                                        <option value="sna">chiShona</option>
                                        <option value="som">Somali</option>
                                        <option value="gaz">Oromo, West Central</option>
                                        <option value="haw1868">Hawaiian</option>
                                        <option value="iloulb">Ilocano</option>
                                        <option value="ton">Tongan</option>
                                        <option value="gun">Guaraní, Mbyá</option>
                                        <option value="kik">Gikuyu</option>
                                        <option value="cuk">San Blas Kuna</option>
                                        <option value="twi">Twi</option>
                                        <option value="urdoucv">اردو</option>
                                        <option value="chk">Chuukese</option>
                                        <option value="vieovcb">Tiếng Việt</option>
                                        <option value="ksd">Kauana</option>
                                        <option value="npioncb">नेपाली</option>
                                        <option value="kbq">Kamano</option>
                                        <option value="pesopv">Persian</option>
                                        <option value="meu">Motu</option>
                                        <option value="rmc">Romani, Carpathian</option>
                                        <option value="hausa">Hausa</option>
                                        <option value="yor">Yorùbá</option>
                                        <option value="tdx">Malagasy, Tandroy-Mahafaly</option>
                                        <option value="marc">मराठी</option>
                                        <option value="cekak">Chin, Eastern Khumi</option>
                                        <option value="azb">Azerbaijani, South</option>
                                        <option value="hch">Huichol</option>
                                        <option value="gax">gujii</option>
                                        <option value="tczchongthu">Chin, Thado</option>
                                        <option value="bodn">Tibetan</option>
                                        <option value="tel2017">Telugu</option>
                                        <option value="bqcsim">Boko</option>
                                        <option value="gofe">Goofa</option>
                                        <option value="gofl">Gofa</option>
                                        <option value="kos">Kosraean</option>
                                        <option value="malc">മലയാളം</option>
                                        <option value="gmve">Gamo</option>
                                        <option value="hmo">Motu, Hiri</option>
                                        <option value="tbzsim">Ditammari</option>
                                        <option value="qub">Quechua, Huallaga Huánuco</option>
                                        <option value="uigara">Uyghur</option>
                                        <option value="dwrent">Dawro</option>
                                        <option value="nchbl">Nahuatl, Huasteca Central</option>
                                        <option value="nhebl">Nahuatl, Huasteca Oriental</option>
                                        <option value="nhwbl">Nahuatl,  Huasteca Occidental</option>
                                        <option value="bba">Baatonum</option>
                                        <option value="kne">Kankanaey</option>
                                        <option value="mdyeth">Male</option>
                                        <option value="tpi">Melanesian Pidgin</option>
                                        <option value="rug">Roviana</option>
                                        <option value="hil">Ilonggo</option>
                                        <option value="yap">Yapese</option>
                                        <option value="mps">Dadibi</option>
                                        <option value="kpg">Kapingamarangi</option>
                                        <option value="gubbl">Guajajára</option>
                                        <option value="kij">Kilivila</option>
                                        <option value="beo">Beami</option>
                                        <option value="hui">Huli</option>
                                        <option value="cac">Chuj</option>
                                        <option value="msy2020">Aruamu</option>
                                        <option value="pesopcb">Iranian Persian</option>
                                        <option value="rop">Kriol</option>
                                        <option value="spaonbv">Español</option>
                                        <option value="wal">Wolaytta</option>
                                        <option value="bqp">Busa</option>
                                        <option value="dop">Lukpa</option>
                                        // Local XML Batch
                                        <option value="pck">Paite</option>
                                        <option value="arb-xml">Arabic (XML)</option>
                                        <option value="my-xml">Burmese (XML)</option>
                                        <option value="pes-xml">Farsi (XML)</option>
                                        <option value="tl-xml">Tagalog (XML)</option>
                                        <option value="tr-xml">Turkish (XML)</option>
                                    </optgroup>
                                </select>
                            </div>
                        </div>

                        <div className={`p-3.5 border-b border-border flex items-center justify-between shrink-0 bg-muted/5 transition-opacity duration-200 ${!leftSidebarOpen ? 'opacity-0 h-0 p-0 overflow-hidden' : 'opacity-100'}`}>
                            <h4 className="font-title text-[8px] font-bold uppercase tracking-[0.22em] text-gold">Scripture Index</h4>
                            <div className="flex items-center gap-1.5">
                                <button 
                                    onClick={() => setLeftSidebarOpen(!leftSidebarOpen)} 
                                    className="w-7 h-7 rounded bg-background border border-border flex items-center justify-center text-text-3 hover:text-text-1 hover:bg-muted/10 transition-all shadow-sm"
                                    title="Collapse/Expand Sidebar"
                                >
                                    <ChevronLeft size={14} className={`transition-transform duration-300 ${!leftSidebarOpen ? 'rotate-180' : ''}`} />
                                </button>
                                <div className="group relative">
                                    <Info size={12} className="text-gold/40 hover:text-gold cursor-help transition-colors" />
                                    <div className="absolute bottom-full right-0 mb-2 w-40 p-2 bg-navy text-white text-[10px] rounded-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-2xl border border-gold/20 leading-relaxed z-50">
                                        <div className="font-black text-gold mb-1 uppercase tracking-widest text-[8px]">Pro Tip</div>
                                        Click the arrow to collapse the sidebar and maximize your reading space.
                                    </div>
                                </div>
                            </div>
                        </div>

                        {!leftSidebarOpen ? (
                             <div className="flex flex-col items-center gap-2 py-4">
                                <button onClick={() => setLeftSidebarOpen(true)} className="w-8 h-8 rounded-lg bg-background border border-border flex items-center justify-center text-gold hover:bg-gold-pale/20">
                                    <Book size={14} />
                                </button>
                                <div className="h-px w-4 bg-border" />
                                <div className="text-[10px] font-bold text-gold/40 vertical-text py-2">INDEX</div>
                             </div>
                        ) : (
                            <>
                                <div className="flex p-3 px-3.5 gap-2 shrink-0">
                                    <button 
                                        onClick={() => setTestament('OT')}
                                        className={`flex-1 py-1.5 rounded-lg text-[10px] font-bold tracking-wider transition-all border-1.5 ${testament === 'OT' ? 'bg-navy border-navy text-white shadow-sm' : 'bg-background border-border text-text-3 hover:border-gold/40 hover:text-text-1'}`}
                                    >
                                        OLD (39)
                                    </button>
                                    <button 
                                        onClick={() => setTestament('NT')}
                                        className={`flex-1 py-1.5 rounded-lg text-[10px] font-bold tracking-wider transition-all border-1.5 ${testament === 'NT' ? 'bg-navy border-navy text-white shadow-sm' : 'text-muted-foreground hover:bg-muted/10'}`}
                                    >
                                        NEW (27)
                                    </button>
                                </div>

                                <div className="flex-1 overflow-y-auto custom-scrollbar">
                                    {BIBLE_BOOKS[testament].map((book) => (
                                        <div key={book.name} className="border-b border-border/40">
                                            <button
                                                onClick={() => handleBookSelect(book)}
                                                className={`w-full flex items-center justify-between px-4 py-3.5 text-sm transition-all ${expandedBook === book.name ? 'bg-gold-pale/20' : 'hover:bg-muted/5'}`}
                                            >
                                                <div className="flex flex-col items-start">
                                                    <span className={`text-[13px] font-medium ${currentBook?.name === book.name ? 'text-gold font-bold' : 'text-text-1'}`}>{book.name}</span>
                                                    <span className={`text-[9px] font-bold tracking-widest uppercase ${currentBook?.name === book.name ? 'text-gold/60' : 'text-text-3'}`}>{book.abbr}</span>
                                                </div>
                                                <ChevronRight size={12} className={`text-text-3 transition-transform duration-200 ${expandedBook === book.name ? 'rotate-90 text-gold' : ''}`} />
                                            </button>
                                            
                                            {expandedBook === book.name && (
                                                <div className="grid grid-cols-6 gap-1 p-3 pt-0 animate-in fade-in slide-in-from-top-1 duration-200">
                                                    {Array.from({ length: book.chapters }, (_, i) => i + 1).map((ch) => (
                                                        <button
                                                            key={ch}
                                                            onClick={() => handleChapterSelect(ch)}
                                                            className={`aspect-square rounded border flex items-center justify-center text-[11px] font-bold transition-all ${currentBook?.name === book.name && currentChapter === ch ? 'bg-navy border-navy text-white shadow-sm' : 'bg-background border-border/60 hover:border-gold/30 hover:bg-gold-pale/20 text-text-2 hover:text-gold'}`}
                                                        >
                                                            {ch}
                                                        </button>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </>
                        )}
                    </div>
                </aside>

                {/* Column 3: Reader Area */}
                <section className="flex-1 flex flex-col bg-background relative transition-all duration-500 overflow-hidden">
                    {/* Collapsed Sidebars Triggers */}
                    {!leftSidebarOpen && !isZenMode && (
                        <button 
                            onClick={() => setLeftSidebarOpen(true)}
                            className="hidden md:flex absolute top-1/2 -left-1 -translate-y-1/2 z-30 p-2 bg-background border border-border rounded-r-xl shadow-lg hover:left-0 transition-all text-gold hover:text-gold-2"
                            title="Expand Index"
                        >
                            <PanelLeftOpen size={18} />
                        </button>
                    )}


                    {currentBook && currentChapter ? (
                        <>
                            <div className="sticky top-0 bg-background/95 backdrop-blur-xl border-b border-border px-4 md:px-6 py-2 flex items-center justify-between z-20 h-14">
                                <div className="flex items-center gap-2 md:gap-4">
                                    <button 
                                        onClick={prevChapter} 
                                        disabled={currentChapter === 1} 
                                        className="h-9 px-3 md:px-4 rounded-xl border border-border bg-card-bg/50 text-[10px] font-bold hover:bg-navy hover:text-white disabled:opacity-20 transition-all flex items-center gap-1.5 shadow-sm"
                                    >
                                        <ChevronLeft size={14} /> <span className="hidden md:inline">Prev</span>
                                    </button>

                                    <div className="flex flex-col md:flex-row md:items-center gap-0 md:gap-2 px-2 md:px-4 border-l border-r border-border/40">
                                        <div className="flex items-center gap-2">
                                            <span className="font-title text-[11px] md:text-[13px] font-bold text-brand-navy tracking-tight uppercase truncate max-w-[100px] md:max-w-none">{currentBook.name}</span>
                                            <span className="text-[11px] md:text-[13px] font-medium text-text-3">Ch {currentChapter}</span>
                                        </div>
                                        <span className="hidden md:inline text-border/60">·</span>
                                        <span className="px-2 py-0.5 bg-gold-pale/30 border border-gold/10 rounded-full text-[8px] md:text-[9px] font-bold text-gold uppercase tracking-tighter w-fit">{verses.length} Verses</span>
                                    </div>

                                    <button 
                                        onClick={nextChapter} 
                                        disabled={currentChapter === currentBook.chapters} 
                                        className="h-9 px-3 md:px-4 rounded-xl border border-border bg-card-bg/50 text-[10px] font-bold hover:bg-navy hover:text-white disabled:opacity-20 transition-all flex items-center gap-1.5 shadow-sm"
                                    >
                                        <span className="hidden md:inline">Next</span> <ChevronRight size={14} />
                                    </button>
                                </div>
                                
                                <div className="flex items-center gap-2 md:gap-3">
                                    <div className="hidden sm:flex items-center bg-card-bg rounded-lg border border-border p-0.5">
                                        <button onClick={() => setFontSize(Math.max(12, fontSize - 1))} className="w-7 h-7 flex items-center justify-center hover:bg-muted/10 rounded-full transition-colors text-xs font-bold text-text-2">−</button>
                                        <div className="px-1 text-[9px] font-black text-text-1 min-w-[20px] text-center">{fontSize}</div>
                                        <button onClick={() => setFontSize(Math.min(32, fontSize + 1))} className="w-7 h-7 flex items-center justify-center hover:bg-muted/10 rounded-full transition-colors text-xs font-bold text-text-2">+</button>
                                    </div>

                                    <select 
                                        value={translation}
                                        onChange={(e) => setTranslation(e.target.value)}
                                        className="bg-card-bg border border-border rounded-lg px-2 py-1.5 text-[10px] font-bold text-text-2 tracking-tight outline-none cursor-pointer hover:border-gold/30 transition-all font-sans hidden md:block"
                                    >
                                        {['NIV', 'KJV', 'NKJV', 'ENGLISH', 'ES', 'FR', 'DE', 'PT', 'IT', 'RU', 'ZH', 'KO', 'JA', 'AR', 'HINDI', 'BENGALI', 'TE', 'TA', 'KANNADA', 'MALAYALAM', 'MARATHI', 'GUJARATI', 'PUNJABI', 'NEPALI', 'ORIYA', 'TL', 'VI', 'TH', 'MY', 'INDONESIAN', 'TR', 'PL', 'RO', 'NL', 'SV', 'FI', 'DA', 'NB', 'CS', 'HR', 'SR', 'UK', 'ET', 'LT', 'LV', 'SQ', 'EL', 'HE', 'SW', 'AFRIKAANS', 'ISL', 'EO', 'CTU', 'KYG', 'DWW', 'KGF', 'SSD', 'PCK', 'GRC', 'HBO', 'LA', 'CU', 'GOT', 'COP', 'SYR', 'HUNGARIAN', 'SEPEDI', 'XHOSA', 'ZULU'].map(t => (
                                            <option key={t} value={t.toLowerCase()}>{t}</option>
                                        ))}

                                    </select>

                                    <div className="flex items-center gap-1 border-l border-border/40 pl-2 md:pl-3">

                                        
                                        <button 
                                            onClick={() => setIsZenMode(!isZenMode)} 
                                            className={`w-9 h-9 flex items-center justify-center rounded-lg transition-all ${isZenMode ? 'bg-gold text-white shadow-lg' : 'bg-card-bg border border-border text-text-3 hover:border-gold/30'}`}
                                            title={isZenMode ? "Exit Fullscreen/Zen Mode" : "Maximize Reading View (Zen Mode)"}
                                        >
                                            {isZenMode ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Scripture Content */}
                            <div className={`flex-1 overflow-y-auto px-6 md:px-16 py-12 custom-scrollbar transition-all duration-700 bg-background`}>
                                <div className={`mx-auto transition-all duration-700 ${isZenMode ? 'max-w-6xl' : 'max-w-4xl lg:max-w-5xl'}`}>
                                    <div className="text-center mb-12">
                                        <div className="font-title text-[10px] letter-spacing-[0.25em] text-gold uppercase mb-2">{currentBook.name}</div>
                                        <div className="font-serif text-4xl font-medium text-brand-navy">Chapter {currentChapter}</div>
                                        <div className="w-10 h-0.5 bg-gold/30 mx-auto mt-3" />
                                    </div>

                                    {loading ? (
                                        <div className="text-center py-40 animate-pulse">
                                            <div className="w-16 h-16 rounded-full border-2 border-gold/10 border-t-gold animate-spin mx-auto mb-6" />
                                            <p className="font-serif italic text-muted-foreground text-lg">Drawing from the well of living water...</p>
                                        </div>
                                    ) : verses.length > 0 ? (
                                        <div className="space-y-1">
                                            {verses.map((v) => (
                                                <div 
                                                    key={v.verse || v.pk} 
                                                    onClick={() => {
                                                        setHighlightedVerse(v.verse);
                                                        setPopupVerse(v.verse);
                                                        setShowVersePopup(true);
                                                    }}
                                                    className={`group flex items-start gap-3 p-3 md:p-4 rounded-xl transition-all cursor-pointer border-l-[3px] ${highlightedVerse === v.verse ? 'bg-gold-pale/20 border-gold' : 'hover:bg-gold-pale/10 border-transparent'}`}
                                                >
                                                    <span className={`shrink-0 w-8 text-right font-bold text-[9px] transition-colors ${highlightedVerse === v.verse ? 'text-gold' : 'text-gold opacity-50'} pt-2`}>
                                                        {v.verse}
                                                    </span>
                                                    <p 
                                                        className={`font-serif leading-[1.9] text-text-1 selection:bg-gold/20 ${['ar', 'he', 'urdu', 'ks'].includes(translation) ? 'text-right' : ''} ${translation === 'he' ? 'tracking-wide' : ''}`}
                                                        style={{ fontSize: `${translation === 'he' ? fontSize + 2 : fontSize}px` }}
                                                        dir={['ar', 'he', 'urdu', 'ks'].includes(translation) ? 'rtl' : 'ltr'}
                                                    >
                                                        {v.text}
                                                    </p>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-center py-32 space-y-6 max-w-md mx-auto">
                                            <div className="p-4 rounded-full bg-gold/5 w-fit mx-auto mb-2">
                                                <Info size={40} className="text-gold/40" />
                                            </div>
                                            
                                            <div className="space-y-2">
                                                <h3 className="font-serif text-xl italic text-brand-navy">
                                                    {fetchError === "NO_VERSES" ? "Content not available" : "Seeking the Word..."}
                                                </h3>
                                                <p className="text-text-2 text-xs leading-relaxed">
                                                    {fetchError === "NO_VERSES" 
                                                        ? `This translation may only include the New Testament or specific books. Please try a different version for ${currentBook.name}.`
                                                        : fetchError || "The selected content could not be retrieved at this time."}
                                                </p>
                                            </div>

                                            <div className="flex flex-wrap justify-center gap-2 pt-4">
                                                {['KJV', 'NIV', 'NKJV'].map(v => (
                                                    <button 
                                                        key={v}
                                                        onClick={() => setTranslation(v)}
                                                        className="px-4 py-1.5 rounded-full border border-border bg-card-bg text-[9px] font-bold hover:border-gold transition-all"
                                                    >
                                                        Try {v}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Bottom Reader Nav */}
                                    <div className="mt-20 pt-10 border-t border-border flex items-center justify-between text-text-3 pb-20">
                                        <div className="text-[11px] font-bold">
                                            READING <strong>{currentBook.name.toUpperCase()} {currentChapter}</strong>
                                        </div>
                                        <div className="flex gap-2">
                                            <button onClick={prevChapter} disabled={currentChapter === 1} className="flex items-center gap-2 px-5 py-2 rounded-full border border-border bg-card-bg text-[11px] font-bold hover:bg-navy hover:text-white disabled:opacity-30 transition-all">
                                                <ChevronLeft size={16} /> Previous
                                            </button>
                                            <button onClick={nextChapter} disabled={currentChapter === currentBook.chapters} className="flex items-center gap-2 px-5 py-2 rounded-full border border-border bg-card-bg text-[11px] font-bold hover:bg-navy hover:text-white disabled:opacity-30 transition-all">
                                                Next <ChevronRight size={16} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-center p-12 space-y-10 animate-in fade-in zoom-in-95 duration-1000 ease-out">
                             <div className="relative group">
                                <div className="absolute -inset-8 bg-gold/10 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
                                <div className="p-10 rounded-[4rem] bg-gradient-to-b from-card-bg to-background ring-1 ring-gold/10 shadow-2xl relative">
                                    <BookOpen size={80} className="text-gold/40" strokeWidth={1} />
                                </div>
                             </div>
                             <div className="space-y-4 max-w-sm">
                                <h1 className="font-title text-2xl tracking-[0.4em] text-gold uppercase font-light">Bible Explorer</h1>
                                <p className="font-serif text-lg italic text-muted-foreground leading-relaxed">Select a volume of truth to begin your sacred journey through the Word.</p>
                             </div>
                             <div className="flex flex-wrap justify-center gap-2 pt-6">
                                {['GENESIS 1', 'PSALM 23', 'JOHN 3', 'ROMANS 8', 'REVELATION 21'].map((s) => (
                                    <button 
                                        key={s} 
                                        onClick={() => { setSearchQuery(s); handleSearch(s); }}
                                        className="px-6 py-2.5 rounded-full border border-border bg-card-bg text-[10px] font-black tracking-[0.15em] hover:border-gold hover:text-gold hover:shadow-lg hover:shadow-gold/5 transition-all uppercase"
                                    >
                                        {s}
                                    </button>
                                ))}
                             </div>
                        </div>
                    )}
                </section>


            </main>

            {/* Footer */}
            <footer className="h-10 border-t border-border bg-card-bg px-6 flex items-center justify-between shrink-0 z-20">
                <p className="text-[10px] font-bold text-text-3 uppercase tracking-widest">© 2026 DailyMannaAI — Built with Prayer ✦</p>
                <div className="flex gap-6">
                    <button className="text-[10px] font-bold text-text-3 hover:text-gold transition-colors uppercase tracking-widest">About Us</button>
                    <button className="text-[10px] font-bold text-text-3 hover:text-gold transition-colors uppercase tracking-widest">Privacy Policy</button>
                </div>
            </footer>

            {/* Verse Action Popup */}
            <div className={`fixed bottom-8 left-1/2 -translate-x-1/2 z-[100] transition-all duration-300 transform ${showVersePopup ? 'translate-y-0 opacity-100' : 'translate-y-20 opacity-0 pointer-events-none'}`}>
                <div className="bg-navy border border-gold/20 rounded-2xl shadow-2xl p-2 flex items-center gap-2 px-4 py-2.5">
                    <span className="text-[10px] font-bold text-gold/60 mr-2">v.{popupVerse}</span>
                    <button className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-white/10 hover:bg-white/10 transition-all text-white/80 text-[11px] font-medium">
                        <Check size={12} className="text-gold" /> Highlight
                    </button>
                    <button className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-white/10 hover:bg-white/10 transition-all text-white/80 text-[11px] font-medium">
                        <Heart size={12} className="text-gold" /> Save
                    </button>
                    <button className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-white/10 hover:bg-white/10 transition-all text-white/80 text-[11px] font-medium">
                        <Share2 size={12} className="text-gold" /> Share
                    </button>
                    <button 
                        onClick={() => setShowVersePopup(false)}
                        className="w-7 h-7 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/20 text-white/40 hover:text-white transition-all ml-1"
                    >
                        ✕
                    </button>
                </div>
            </div>
        </div>
    );
}
