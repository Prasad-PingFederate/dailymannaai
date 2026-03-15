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
    PanelRightClose, PanelRightOpen,
    Maximize2, Minimize2,
    Type, Home
} from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/hooks/useAuth';
import VoiceInput from '@/components/notebook/VoiceInput';

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

export default function BibleExplorer() {
    const { theme, isDark } = useTheme();
    const { user } = useAuth();
    
    // State
    const [testament, setTestament] = useState<'OT' | 'NT'>('OT');
    const [currentBook, setCurrentBook] = useState<any>(null);
    const [currentChapter, setCurrentChapter] = useState<number | null>(null);
    const [verses, setVerses] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [fetchError, setFetchError] = useState<string | null>(null);
    const [translation, setTranslation] = useState('KJV');
    const [activeToolTab, setActiveToolTab] = useState('crossref');
    const [searchQuery, setSearchQuery] = useState('');
    const [highlightedVerse, setHighlightedVerse] = useState<number | null>(null);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    
    // New UX State for Space
    const [leftSidebarOpen, setLeftSidebarOpen] = useState(true);
    const [rightSidebarOpen, setRightSidebarOpen] = useState(true);
    const [fontSize, setFontSize] = useState(19);
    const [isZenMode, setIsZenMode] = useState(false);
    
    // New UX State for Inline Chapters
    const [expandedBook, setExpandedBook] = useState<string | null>(null);
    const [showVersePopup, setShowVersePopup] = useState(false);
    const [popupVerse, setPopupVerse] = useState<number | null>(null);

    // Fetch Verses When Book/Chapter Changes
    useEffect(() => {
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
        setCurrentBook(book);
        setCurrentChapter(null);
        setVerses([]);
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
        
        // Basic parsing for "Book Chapter" or "Book Chapter:Verse"
        const parts = query.trim().split(/\s+/);
        let bookMatch = "";
        let chapterMatch = 1;

        // Handle cases like "1 John"
        if (['1', '2', '3'].includes(parts[0]) && parts[1]) {
            bookMatch = `${parts[0]} ${parts[1]}`;
            chapterMatch = parseInt(parts[2]?.split(':')[0]) || 1;
        } else {
            bookMatch = parts[0];
            chapterMatch = parseInt(parts[1]?.split(':')[0]) || 1;
        }

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
                <div className="flex items-center gap-4 shrink-0">
                    <div className="site-logo text-brand-navy hidden lg:block">
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
                            {['NIV', 'KJV', 'NKJV', 'ES', 'ZH', 'FR', 'PT', 'DE', 'AR', 'RU', 'KO', 'TE', 'TA', 'AFRIKAANS', 'BENGALI', 'ENGLISH', 'GUJARATI', 'HINDI', 'HUNGARIAN', 'INDONESIAN', 'KANNADA', 'KASHMIRI', 'MALAYALAM', 'MARATHI', 'NEPALI', 'ORIYA', 'PUNJABI', 'SEPEDI', 'XHOSA', 'ZULU', 'GREEK', 'HEBREW', 'URDU', 'DOGRI', 'ASSAMESE', 'MANIPURI', 'SANSKRIT', 'MAITHILI', 'JAPANESE', 'VIETNAMESE', 'TAGALOG', 'THAI', 'BURMESE', 'ITALIAN', 'POLISH', 'TURKISH', 'ROMANIAN', 'SWAHILI', 'DUTCH', 'UKRAINIAN', 'SWEDISH', 'FINNISH', 'DANISH', 'CZECH', 'CROATIAN', 'SERBIAN', 'MAORI', 'LATIN', 'ALBANIAN', 'NORWEGIAN BOKMAL', 'NORWEGIAN NYNORSK', 'ESTONIAN', 'LATVIAN', 'LITHUANIAN', 'BASQUE', 'ESPERANTO', 'SCOTTISH GAELIC', 'MANX GAELIC', 'BRETON', 'CALO', 'CHAMORRO', 'CHEROKEE', 'COPTIC', 'CHURCH SLAVONIC', 'DARI', 'EASTERN ARMENIAN', 'GOTHIC', 'KLINGON', 'KOINE GREEK', 'MALAGASY', 'MONGOLIAN', 'NORTHERN NDEBELE', 'SYRIAC', 'POHNPEIAN', 'POTAWATOMI', 'SHONA', 'TAUSUG', 'TOK PISIN', 'UMA', 'ANCIENT HEBREW'].map(v => {
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
                                className="px-4 py-1.5 bg-brand-navy-2 text-white rounded-xl text-[10px] font-black hover:bg-gold transition-all shadow-sm active:scale-95 uppercase tracking-wider"
                            >
                                Search
                            </button>
                        </div>
                    </div>
                </div>

                {/* Right side placeholder to keep search centered */}
                <div className="flex items-center gap-3 shrink-0 w-[120px] justify-end">
                    {/* Handled by global layout */}
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
                                    <optgroup label="Primary">
                                        {['NIV', 'KJV', 'NKJV'].map(v => (
                                            <option key={v} value={v}>{v} Version</option>
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
                                        <option value="syr">Syriac (Peshitta)</option>
                                        <option value="la">Latina (Latin)</option>
                                        <option value="cop">Coptic (Bohairic)</option>
                                        <option value="cu">Church Slavonic</option>
                                        <option value="got">Gothic</option>
                                    
                                    
                                    
                                    
                                    
                                    
                                    
                                    
                                    
                                    
                                    
                                    </optgroup>
                                    <optgroup label="World Languages">
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
                                        <option disabled>LOCAL XML</option>
                                        <option value="pck">Paite</option>
                                        <option value="arb-xml">Arabic (XML)</option>
                                        <option value="my-xml">Burmese (XML)</option>
                                        <option value="pes-xml">Farsi (XML)</option>
                                        <option value="tl-xml">Tagalog (XML)</option>
                                        <option value="tr-xml">Turkish (XML)</option>
                                        <option value="tam-repo">Tamil (Special)</option>
                                        <option value="tel-repo">Telugu (Special)</option>
                                        <option disabled>──────────</option>
                                        <option disabled>EBIBLE.ORG COLLECTIONS</option>
                                        <option disabled>─── ' ───</option>
                                        <option value="kud">'Auhelawa (kud)</option>
                                        <option disabled>─── A ───</option>
                                        <option value="arb-vd">Arabic (arb-vd)</option>
                                        <option value="arbnav">Arabic, Standard (arbnav)</option>
                                        <option value="asmfb">Assamese (asmfb)</option>
                                        <option value="azb">Azerbaijani, South (azb)</option>
                                        <option value="msy2020">Aruamu (msy2020)</option>
                                        <option value="agubl">Aguacateco (agubl)</option>
                                        <option value="agr">Aguaruna (agr)</option>
                                        <option value="ahr">Ahirani (ahr)</option>
                                        <option value="acunt">Achuar-shiwiar (acunt)</option>
                                        <option value="cpy">Ashéninka, South Ucayali (cpy)</option>
                                        <option value="aii">Assyrian Neo-Aramaic (aii)</option>
                                        <option value="ena">Apal (ena)</option>
                                        <option value="boj2014">Anjam (boj2014)</option>
                                        <option value="aer">Arrernte, Eastern (aer)</option>
                                        <option value="aey">Amele (aey)</option>
                                        <option value="aaz">Amarasi (aaz)</option>
                                        <option value="aly">Alyawarr (aly)</option>
                                        <option value="tvk">Ambrym, Southeast (tvk)</option>
                                        <option value="att">Atta, Pamplona (att)</option>
                                        <option value="acrnnt">Achi (acrnnt)</option>
                                        <option value="acrtnt">Achi (acrtnt)</option>
                                        <option value="cpbnt">Ashéninka, Ucayali-yurúa (cpbnt)</option>
                                        <option value="cpcnt">Ajyíninka Apurucayali (cpcnt)</option>
                                        <option value="cpunt">Ashéninka, Pichis (cpunt)</option>
                                        <option value="amo">Amo (amo)</option>
                                        <option value="apunt">Apurinã (apunt)</option>
                                        <option value="apwnt">Apache, Western (apwnt)</option>
                                        <option value="amunt">Amuzgo, Guerrero (amunt)</option>
                                        <option value="agn">Agutaynen (agn)</option>
                                        <option value="sgb">Ayta, Mag-antsi (sgb)</option>
                                        <option value="akent">Akawaio (akent)</option>
                                        <option value="azgnt">Amuzgo, San Pedro Amuzgos (azgnt)</option>
                                        <option value="awb">Awa (awb)</option>
                                        <option value="aau">Abau (aau)</option>
                                        <option value="bssnt">Akoose (bssnt)</option>
                                        <option value="acr-acc">Achi (acr-acc)</option>
                                        <option value="alqalgnt">Algonquin (alqalgnt)</option>
                                        <option value="knjnt">Akateko (knjnt)</option>
                                        <option value="agd">Agarabi (agd)</option>
                                        <option value="alw">Alaba-K'abeena (alw)</option>
                                        <option value="are">Arrarnta, Western (are)</option>
                                        <option value="kwi">Awa-Cuaiquer (kwi)</option>
                                        <option value="amn-amanab">Amanab (amn-amanab)</option>
                                        <option value="amn-n">Amanab (amn-n)</option>
                                        <option value="arlnt">Arabela (arlnt)</option>
                                        <option value="amm">Ama (amm)</option>
                                        <option value="amk">Ambai (amk)</option>
                                        <option value="agm">Angaataha (agm)</option>
                                        <option value="apr">Arop-Lokep (apr)</option>
                                        <option value="gah">Alekano or Gahuku (gah)</option>
                                        <option value="avt">Au (avt)</option>
                                        <option value="dgc">Agta, Casiguran Dumagat (dgc)</option>
                                        <option value="alpnt">Alune (alpnt)</option>
                                        <option value="aia">Arosi (aia)</option>
                                        <option value="aon">Arapesh (aon)</option>
                                        <option value="amp">Alamblak (amp)</option>
                                        <option value="agg">Angor (agg)</option>
                                        <option value="aak">Ankave (aak)</option>
                                        <option value="auy">Awiyaana (auy)</option>
                                        <option value="cnint">Asháninka (cnint)</option>
                                        <option value="cjont">Ashéninka Pajonal (cjont)</option>
                                        <option value="msy">Aruamu (msy)</option>
                                        <option value="boj">Anjam (boj)</option>
                                        <option value="amrnt">Amarakaeri (amrnt)</option>
                                        <option value="agt">Agta, Central Cagayan (agt)</option>
                                        <option value="abt-maprik">Ambulas (abt-maprik)</option>
                                        <option value="amh">Amharic (amh)</option>
                                        <option value="apnnt">Apinayé (apnnt)</option>
                                        <option value="aby">Aneme Wake (aby)</option>
                                        <option disabled>─── B ───</option>
                                        <option value="bel">Belarusian (bel)</option>
                                        <option value="myajvb">Burmese (myajvb)</option>
                                        <option value="benobcv">Bengali (benobcv)</option>
                                        <option value="benirv">Bengali (benirv)</option>
                                        <option value="bqcsim">Boko (bqcsim)</option>
                                        <option value="bba">Baatonum (bba)</option>
                                        <option value="beo">Beami (beo)</option>
                                        <option value="mya">Burmese (mya)</option>
                                        <option value="bqp">Busa (bqp)</option>
                                        <option value="bus">Bokobaru (bus)</option>
                                        <option value="bnp">Bola (bnp)</option>
                                        <option value="bjr">Binumarien (bjr)</option>
                                        <option value="bps">Blaan, Sarangani (bps)</option>
                                        <option value="bsp">Baga Sitemu (bsp)</option>
                                        <option value="bch">Bariai (bch)</option>
                                        <option value="bbb">Barai (bbb)</option>
                                        <option value="bzdntpo">Bribri (bzdntpo)</option>
                                        <option value="ksr">Borong (ksr)</option>
                                        <option value="bhl">Bimin (bhl)</option>
                                        <option value="lbk">Bontok, Central (lbk)</option>
                                        <option value="ptu">Bambam (ptu)</option>
                                        <option value="bvr">Burarra (bvr)</option>
                                        <option value="byr">Baruya (byr)</option>
                                        <option value="bdv">Bodo Parja (bdv)</option>
                                        <option value="bhi">Bhilali (bhi)</option>
                                        <option value="bhu">Bhunjia (bhu)</option>
                                        <option value="blznt">Balantak (blznt)</option>
                                        <option value="mmo">Buang, Mangga (mmo)</option>
                                        <option value="bjvnt">Bedjond (bjvnt)</option>
                                        <option value="jid">Bu (jid)</option>
                                        <option value="bkw">Bekwel (bkw)</option>
                                        <option value="bswe">Baiso (bswe)</option>
                                        <option value="bwo">Borna (bwo)</option>
                                        <option value="bzh">Buang (bzh)</option>
                                        <option value="ebk">Bontok, Eastern (ebk)</option>
                                        <option value="bpr">Blaan, Koronadal (bpr)</option>
                                        <option value="bhd">Bhadrawahi (bhd)</option>
                                        <option value="bon">Bine (bon)</option>
                                        <option value="boxnt">Buamu (boxnt)</option>
                                        <option value="bgg">Bugun (bgg)</option>
                                        <option value="bjk">Barok (bjk)</option>
                                        <option value="blw">Balangao (blw)</option>
                                        <option value="smknt">Bolinao (smknt)</option>
                                        <option value="bvd">Baeggu (bvd)</option>
                                        <option value="bht">Bhattiyali (bht)</option>
                                        <option value="bdd">Bunama (bdd)</option>
                                        <option value="bwd">Bwaidoka (bwd)</option>
                                        <option value="bkd">Binukid (bkd)</option>
                                        <option value="gai">Borei (gai)</option>
                                        <option value="bgt">Bughotu (bgt)</option>
                                        <option value="big">Biangai (big)</option>
                                        <option value="big2013">Biangai (big2013)</option>
                                        <option value="bef">Benabena (bef)</option>
                                        <option value="bzj">Belize Kriol English (bzj)</option>
                                        <option value="apeb">Bukiyip (apeb)</option>
                                        <option value="bki">Baki (bki)</option>
                                        <option value="apec">Bukiyip (apec)</option>
                                        <option value="bsj">Bangwinji (bsj)</option>
                                        <option value="bkqnt">Bakairí (bkqnt)</option>
                                        <option value="buk">Bukawa (buk)</option>
                                        <option value="mlp">Bargam (mlp)</option>
                                        <option value="tte">Bwanabwana (tte)</option>
                                        <option value="mux">Bo-Ung (mux)</option>
                                        <option value="boant">Bora (boant)</option>
                                        <option value="bjz">Baruga (bjz)</option>
                                        <option value="bsnnt">Barasana-Eduria (bsnnt)</option>
                                        <option value="sabnt">Buglere (sabnt)</option>
                                        <option value="tteo">Bwanabwana (tteo)</option>
                                        <option value="bswl">Baiso (bswl)</option>
                                        <option value="bhg">Binandere (bhg)</option>
                                        <option disabled>─── C ───</option>
                                        <option value="ces1613">Czech (ces1613)</option>
                                        <option value="hrv">Croatian (hrv)</option>
                                        <option value="cth">Chin, Thaiphum (cth)</option>
                                        <option value="hlt">Chin, Matu (hlt)</option>
                                        <option value="hltmcsb">Chin, Matu (hltmcsb)</option>
                                        <option value="nya">Chichewa (nya)</option>
                                        <option value="cebulb">Cebuano (cebulb)</option>
                                        <option value="ckb">Central Kurdish (ckb)</option>
                                        <option value="hne">Chhattisgarhi (hne)</option>
                                        <option value="sna">chiShona (sna)</option>
                                        <option value="chk">Chuukese (chk)</option>
                                        <option value="cekak">Chin, Eastern Khumi (cekak)</option>
                                        <option value="tczchongthu">Chin, Thado (tczchongthu)</option>
                                        <option value="cmn-cu89s">Chinese (cmn-cu89s)</option>
                                        <option value="cmn-cu89t">Chinese (cmn-cu89t)</option>
                                        <option value="cebocb">Cebuano (cebocb)</option>
                                        <option value="cac">Chuj (cac)</option>
                                        <option value="asg">Cishingini (asg)</option>
                                        <option value="cbunt">Candoshi-Shapra (cbunt)</option>
                                        <option value="hltthb">Chin, Matu (hltthb)</option>
                                        <option value="cbintpo">Chachi (cbintpo)</option>
                                        <option value="caa">Chorti (caa)</option>
                                        <option value="crxntpo">Carrier (crxntpo)</option>
                                        <option value="conntpo">Cofán (conntpo)</option>
                                        <option value="cbrnt">Cashibo-Cacataibo (cbrnt)</option>
                                        <option value="cbtntpo">Chayahuita (cbtntpo)</option>
                                        <option value="ctucti">Chol (ctucti)</option>
                                        <option value="clent">Chinantec, Lealao (clent)</option>
                                        <option value="cmnfeb">Chinese (cmnfeb)</option>
                                        <option value="csy">Chin, Siyin (csy)</option>
                                        <option value="yao">Chiyawo (yao)</option>
                                        <option value="chzntps">Chinantec, Ozumacín (chzntps)</option>
                                        <option value="cpant">Chinantec, Palantla (cpant)</option>
                                        <option value="cya">Chatino, Nopala (cya)</option>
                                        <option value="copcnt">Coptic (copcnt)</option>
                                        <option value="csont">Chinantec, Sochiapam (csont)</option>
                                        <option value="copbhc">Coptic (copbhc)</option>
                                        <option value="cuxnt">Cuicatec, Tepeuxila (cuxnt)</option>
                                        <option value="cesnkb">Czech (cesnkb)</option>
                                        <option value="cug">Cung (cug)</option>
                                        <option value="zypnt">Chin, Zyphe (zypnt)</option>
                                        <option value="cnlnt">Chinantec, Lalana (cnlnt)</option>
                                        <option value="cucnt">Chinantec, Usila (cucnt)</option>
                                        <option value="cafnt">Carrier, Southern (cafnt)</option>
                                        <option value="cntnt">Chinantec, Tepetotutla (cntnt)</option>
                                        <option value="copshc">Coptic (copshc)</option>
                                        <option value="cbk">Chavacano (cbk)</option>
                                        <option value="caxnt">Chiquitano (caxnt)</option>
                                        <option value="ctubl">Chol (ctubl)</option>
                                        <option value="chfnt">Chontal, Tabasco (chfnt)</option>
                                        <option value="ctu76">Chol (ctu76)</option>
                                        <option value="dao">Chin, Daai (dao)</option>
                                        <option value="kaqnt">Capanahua (kaqnt)</option>
                                        <option value="cment">Cerma (cment)</option>
                                        <option value="cotnt">Caquinte (cotnt)</option>
                                        <option value="ctant">Chatino, Tataltepec (ctant)</option>
                                        <option value="ctpnt">Chatino, Western Highland (ctpnt)</option>
                                        <option value="caont">Chácobo (caont)</option>
                                        <option value="capnt">Chipaya (capnt)</option>
                                        <option value="kbh">Camsá (kbh)</option>
                                        <option value="ccont">Chinantec, Comaltepec (ccont)</option>
                                        <option value="chqnt">Chinantec, Quiotepec (chqnt)</option>
                                        <option value="cui">Cuiba (cui)</option>
                                        <option value="clu">Caluyanun (clu)</option>
                                        <option value="chdnt">Chontal, Highland Oaxaca (chdnt)</option>
                                        <option value="cjv">Chuave (cjv)</option>
                                        <option value="cutnt">Cuicatec, Teutila (cutnt)</option>
                                        <option value="cavnt">Cavineña (cavnt)</option>
                                        <option value="cubnt">Cubeo (cubnt)</option>
                                        <option value="cbcnt">Carapana (cbcnt)</option>
                                        <option value="crnnt">Cora, El Nayar (crnnt)</option>
                                        <option value="cbv">Cacua (cbv)</option>
                                        <option value="ncunt">Chumburung (ncunt)</option>
                                        <option value="cofnt">Colorado (cofnt)</option>
                                        <option value="ceslb">Czech (ceslb)</option>
                                        <option value="cha">Chamorro (cha)</option>
                                        <option disabled>─── D ───</option>
                                        <option value="nldnbg">Dutch (nldnbg)</option>
                                        <option value="dan1931">Danish (dan1931)</option>
                                        <option value="luo">Dholuo (luo)</option>
                                        <option value="nld">Dutch (nld)</option>
                                        <option value="tbzsim">Ditammari (tbzsim)</option>
                                        <option value="dwrent">Dawro (dwrent)</option>
                                        <option value="dwrl">Dawro (dwrl)</option>
                                        <option value="nld1939">Dutch (nld1939)</option>
                                        <option value="mps">Dadibi (mps)</option>
                                        <option value="dhn">Dhanki (dhn)</option>
                                        <option value="ded">Dedua (ded)</option>
                                        <option value="dgrdognt">Dogrib (dgrdognt)</option>
                                        <option value="nfa">Dhao (nfa)</option>
                                        <option value="row">Dela-Oenale (row)</option>
                                        <option value="kqc">Doromu-Koki (kqc)</option>
                                        <option value="dif">Dieri (dif)</option>
                                        <option value="dso">Desiya (dso)</option>
                                        <option value="dov">Dombe (dov)</option>
                                        <option value="anvnt">Denya (anvnt)</option>
                                        <option value="dnv">Danu (dnv)</option>
                                        <option value="ldb">Duya (ldb)</option>
                                        <option value="sce">Dongxiang (sce)</option>
                                        <option value="daant">Dangaléat (daant)</option>
                                        <option value="diknt">Dinka, Southwestern (diknt)</option>
                                        <option value="dob">Dobu (dob)</option>
                                        <option value="dww">Dawawa (dww)</option>
                                        <option value="dgz">Daga (dgz)</option>
                                        <option value="dwrnt">Dawro (dwrnt)</option>
                                        <option value="djr">Djambarrpuyngu (djr)</option>
                                        <option value="aso">Dano (aso)</option>
                                        <option disabled>─── E ───</option>
                                        <option value="engdra">English (engdra)</option>
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
                                        <option value="ewe">eʋegbe (ewe)</option>
                                        <option value="eng-asv">English (eng-asv)</option>
                                        <option value="engbbe">English (engbbe)</option>
                                        <option value="eng-kjv">English (eng-kjv)</option>
                                        <option value="eng-kjv2006">English (eng-kjv2006)</option>
                                        <option value="engkjvcpb">English (engkjvcpb)</option>
                                        <option value="engmsb">English (engmsb)</option>
                                        <option value="engnet">English (engnet)</option>
                                        <option value="eng-rv">English (eng-rv)</option>
                                        <option value="engwebster">English (engwebster)</option>
                                        <option value="engylt">English (engylt)</option>
                                        <option value="epo">Esperanto (epo)</option>
                                        <option value="engasvbt">English (engasvbt)</option>
                                        <option value="engdby">English (engdby)</option>
                                        <option value="engulb">English (engulb)</option>
                                        <option value="enggnv">English (enggnv)</option>
                                        <option value="engbsb">English (engbsb)</option>
                                        <option value="eng-t4t">English (eng-t4t)</option>
                                        <option value="eng-web-c">English (eng-web-c)</option>
                                        <option value="spaonbv">Español (spaonbv)</option>
                                        <option value="engjps">English (engjps)</option>
                                        <option value="englee">English (englee)</option>
                                        <option value="eng-brenton">English (eng-brenton)</option>
                                        <option value="eng-lxx2012">English (eng-lxx2012)</option>
                                        <option value="eng-uk-lxx2012">English (eng-uk-lxx2012)</option>
                                        <option value="englxxup">English (englxxup)</option>
                                        <option value="engnoy">English (engnoy)</option>
                                        <option value="eka">Ekajuk (eka)</option>
                                        <option value="engourb">English (engourb)</option>
                                        <option value="engoebcw">English (engoebcw)</option>
                                        <option value="engoebus">English (engoebus)</option>
                                        <option value="empntpo">Emberá, Northern (empntpo)</option>
                                        <option value="engwycliffe">English (engwycliffe)</option>
                                        <option value="utr">Etulo (utr)</option>
                                        <option value="ekk">Estonian, Standard (ekk)</option>
                                        <option value="engtnt">English (engtnt)</option>
                                        <option value="engemtv">English (engemtv)</option>
                                        <option value="engtcent">English (engtcent)</option>
                                        <option value="engf35">English (engf35)</option>
                                        <option value="mcq">Ese or Managalasi (mcq)</option>
                                        <option value="sjant">Epena (sjant)</option>
                                        <option value="kjs">East Kewa (kjs)</option>
                                        <option value="djknt">Eastern Maroon Creole (djknt)</option>
                                        <option value="esent">Ese Ejja (esent)</option>
                                        <option value="nou">Ewage-Notu (nou)</option>
                                        <option value="enq2">Enga (enq2)</option>
                                        <option value="engpev">English (engpev)</option>
                                        <option value="engoke">English (engoke)</option>
                                        <option value="etr">Edolo (etr)</option>
                                        <option disabled>─── F ───</option>
                                        <option value="francl">French (francl)</option>
                                        <option value="frajnd">French (frajnd)</option>
                                        <option value="fralsg">French (fralsg)</option>
                                        <option value="fra_fob">French (fra_fob)</option>
                                        <option value="frasbl">French (frasbl)</option>
                                        <option value="fuhbkf">Fulfulde, Western Niger (fuhbkf)</option>
                                        <option value="fai">Faiwol (fai)</option>
                                        <option value="ffm">Fulfulde, Maasina (ffm)</option>
                                        <option value="bjp">Fanamaket (bjp)</option>
                                        <option value="for">Fore (for)</option>
                                        <option value="far">Fataleka (far)</option>
                                        <option value="faa">Fasu (faa)</option>
                                        <option value="aoj-filifita">Filifita dialect of Mufian (aoj-filifita)</option>
                                        <option value="ppo">Folopa (ppo)</option>
                                        <option value="fin">Finnish (fin)</option>
                                        <option disabled>─── G ───</option>
                                        <option value="deuelbbk">German (deuelbbk)</option>
                                        <option value="deutkw">German, Standard (deutkw)</option>
                                        <option value="guj2017">Gujarati (guj2017)</option>
                                        <option value="deu1912">German, Standard (deu1912)</option>
                                        <option value="deu1951">German, Standard (deu1951)</option>
                                        <option value="deuelo">German, Standard (deuelo)</option>
                                        <option value="gun">Guaraní, Mbyá (gun)</option>
                                        <option value="kik">Gikuyu (kik)</option>
                                        <option value="gax">gujii (gax)</option>
                                        <option value="gofe">Goofa (gofe)</option>
                                        <option value="gofl">Gofa (gofl)</option>
                                        <option value="gmve">Gamo (gmve)</option>
                                        <option value="gmvl">Gamo (gmvl)</option>
                                        <option value="gubbl">Guajajára (gubbl)</option>
                                        <option value="grcbrent">Greek, Ancient (grcbrent)</option>
                                        <option value="grclxx">Greek, Ancient (grclxx)</option>
                                        <option value="nlg">Gela (nlg)</option>
                                        <option value="gnn">Gumatj (gnn)</option>
                                        <option value="gvs">Gumawana (gvs)</option>
                                        <option value="gup">Gunwinggu (gup)</option>
                                        <option value="gum">Guambiano (gum)</option>
                                        <option value="pwg">Gapapaiwa (pwg)</option>
                                        <option value="tof">Gizrra (tof)</option>
                                        <option value="grcsr">Greek, Ancient (grcsr)</option>
                                        <option value="gaq">Gata' (gaq)</option>
                                        <option value="goj">Gowlan (goj)</option>
                                        <option value="grcbyz">Greek, Ancient (grcbyz)</option>
                                        <option value="grcmt">Greek, Ancient (grcmt)</option>
                                        <option value="grctr">Greek, Ancient (grctr)</option>
                                        <option value="gux">Gourmanchéma (gux)</option>
                                        <option value="grcf35">Greek, Ancient (grcf35)</option>
                                        <option value="grctcgnt">Greek, Ancient (grctcgnt)</option>
                                        <option value="gyl">Gayil (gyl)</option>
                                        <option value="ghn">Ghanongga (ghn)</option>
                                        <option value="cabnt">Garifuna (cabnt)</option>
                                        <option value="gok">Gowli (gok)</option>
                                        <option value="guxg">Gourmanchéma (guxg)</option>
                                        <option value="grcsbl">Greek, Ancient (grcsbl)</option>
                                        <option value="grc-tisch">Greek, Ancient (grc-tisch)</option>
                                        <option value="gofent">Gofa (gofent)</option>
                                        <option value="gofrnt">Gofa (gofrnt)</option>
                                        <option value="gofwftw">Gofa (gofwftw)</option>
                                        <option value="gbl">Gamit (gbl)</option>
                                        <option value="gnwnt">Guaraní, Western Bolivian (gnwnt)</option>
                                        <option value="guint">Guaraní, Eastern Bolivian (guint)</option>
                                        <option value="gvf">Golin (gvf)</option>
                                        <option value="gyrnt">Guarayu (gyrnt)</option>
                                        <option value="guh">Guahibo (guh)</option>
                                        <option value="gwint">Gwich'in (gwint)</option>
                                        <option value="gmvrnt">Gamo (gmvrnt)</option>
                                        <option value="gmvggm">Gamotso (gmvggm)</option>
                                        <option value="guont">Guayabero (guont)</option>
                                        <option value="gvc">Guanano (gvc)</option>
                                        <option value="dah">Gwahatike (dah)</option>
                                        <option value="bbr">Girawa (bbr)</option>
                                        <option value="bbr2013">Girawa (bbr2013)</option>
                                        <option value="ghs">Guhu-Samane (ghs)</option>
                                        <option value="gyz">Geji (gyz)</option>
                                        <option disabled>─── H ───</option>
                                        <option value="hin2017">Hindi (hin2017)</option>
                                        <option value="hatbsa">Haitian (hatbsa)</option>
                                        <option value="hat">Haitian (hat)</option>
                                        <option value="haw1868">Hawaiian (haw1868)</option>
                                        <option value="heb">Hebrew (heb)</option>
                                        <option value="hausa">Hausa (hausa)</option>
                                        <option value="hincv">Hindi (hincv)</option>
                                        <option value="hch">Huichol (hch)</option>
                                        <option value="hui">Huli (hui)</option>
                                        <option value="hbo">Hebrew (hbo)</option>
                                        <option value="hbowlc">Hebrew (hbowlc)</option>
                                        <option value="hoy">Holiya (hoy)</option>
                                        <option value="hegntpo">Helong (hegntpo)</option>
                                        <option value="hauulb">Hausa (hauulb)</option>
                                        <option value="hlb">Halbi (hlb)</option>
                                        <option value="huvnt">Huave, San Mateo Del Mar (huvnt)</option>
                                        <option value="hebsg">Hebrew (hebsg)</option>
                                        <option value="hchnt">Huichol (hchnt)</option>
                                        <option value="hwo">Hwana (hwo)</option>
                                        <option value="hrebt">Hre (hrebt)</option>
                                        <option value="husnt1971">Huastec (husnt1971)</option>
                                        <option value="xed">Hdi (xed)</option>
                                        <option value="hrvbib">Hrvatski (hrvbib)</option>
                                        <option value="husnt2005">Huastec (husnt2005)</option>
                                        <option value="hto">Huitoto, Minica (hto)</option>
                                        <option value="hopnt">Hopi (hopnt)</option>
                                        <option value="bgc">Haryanvi (bgc)</option>
                                        <option value="wos">Hanga Hundi (wos)</option>
                                        <option value="amf">Hamer-Banna (amf)</option>
                                        <option value="hnsnt">Hindustani, Caribbean (hnsnt)</option>
                                        <option value="hixnt">Hixkaryána (hixnt)</option>
                                        <option value="huunt">Huitoto, Murui (huunt)</option>
                                        <option value="hubnt">Huambisa (hubnt)</option>
                                        <option value="tmd">Haruai (tmd)</option>
                                        <option value="heblb">Hebrew (heblb)</option>
                                        <option value="hla">Halia (hla)</option>
                                        <option disabled>─── I ───</option>
                                        <option value="ibo">Igbo (ibo)</option>
                                        <option value="iloulb">Ilocano (iloulb)</option>
                                        <option value="indayt">Indonesian (indayt)</option>
                                        <option value="ita1927">Italian (ita1927)</option>
                                        <option value="ita1885">Italian (ita1885)</option>
                                        <option value="hil">Ilonggo (hil)</option>
                                        <option value="pesopcb">Iranian Persian (pesopcb)</option>
                                        <option value="ind">Indonesian (ind)</option>
                                        <option value="isl">Icelandic (isl)</option>
                                        <option value="ikwnt">Ikwere (ikwnt)</option>
                                        <option value="indags">Indonesian (indags)</option>
                                        <option value="ikknt">Ika (ikknt)</option>
                                        <option value="ixlnnt">Ixil (ixlnnt)</option>
                                        <option value="ikz">Ikizu (ikz)</option>
                                        <option value="iws">Iwam, Sepik (iws)</option>
                                        <option value="isn">Isanzu (isn)</option>
                                        <option value="atgnt">Ivbie North-Okpela-Arhe (atgnt)</option>
                                        <option value="inb">Inga (inb)</option>
                                        <option value="nca">Iyo (nca)</option>
                                        <option value="abx">Inabaknon (abx)</option>
                                        <option value="ixlcnt">Ixil (ixlcnt)</option>
                                        <option value="kbm">Iwal (kbm)</option>
                                        <option value="imo">Imbo Ungu (imo)</option>
                                        <option value="ian">Iatmul (ian)</option>
                                        <option value="viv">Iduna (viv)</option>
                                        <option value="ignnt">Ignaciano (ignnt)</option>
                                        <option value="ino">Inoke-Yate (ino)</option>
                                        <option value="ino2013">Inoke-Yate (ino2013)</option>
                                        <option value="yml">Iamalele (yml)</option>
                                        <option value="ipi">Ipili (ipi)</option>
                                        <option disabled>─── J ───</option>
                                        <option value="juy">Juray (juy)</option>
                                        <option value="jni">Janji (jni)</option>
                                        <option value="jpn1965">Japanese (jpn1965)</option>
                                        <option value="jacnt">Jakalteko (jacnt)</option>
                                        <option value="jvnnt">Javanese, Caribbean (jvnnt)</option>
                                        <option disabled>─── K ───</option>
                                        <option value="mkw">Kituba (mkw)</option>
                                        <option value="ksd">Kauana (ksd)</option>
                                        <option value="kbq">Kamano (kbq)</option>
                                        <option value="kanokcv">Kannada (kanokcv)</option>
                                        <option value="kanirv">Kannada (kanirv)</option>
                                        <option value="kor">Korean (kor)</option>
                                        <option value="kos">Kosraean (kos)</option>
                                        <option value="kne">Kankanaey (kne)</option>
                                        <option value="kpg">Kapingamarangi (kpg)</option>
                                        <option value="kij">Kilivila (kij)</option>
                                        <option value="rop">Kriol (rop)</option>
                                        <option value="kdc">Kutu (kdc)</option>
                                        <option value="kyc">Kyaka Enga (kyc)</option>
                                        <option value="cwe">Kwere (cwe)</option>
                                        <option value="zajp">Kizalamo (zajp)</option>
                                        <option value="soq">Kanasi (soq)</option>
                                        <option value="yom">Kiyombi (yom)</option>
                                        <option value="kgf">Kube (kgf)</option>
                                        <option value="kpr">Korafe (kpr)</option>
                                        <option value="xla">Kamula (xla)</option>
                                        <option value="kyg">Keyagana (kyg)</option>
                                        <option value="mkn">Kupang Malay (mkn)</option>
                                        <option value="kwf">Kwara'ae (kwf)</option>
                                        <option value="bco">Kaluli (bco)</option>
                                        <option value="gvn">Kuku-Yalanji (gvn)</option>
                                        <option value="kvg">Kuni-Boazi (kvg)</option>
                                        <option value="kdc2014">Kutu (kdc2014)</option>
                                        <option value="kff">Koya (kff)</option>
                                        <option value="kue">Kuman (kue)</option>
                                        <option value="caksnt">Kaqchikel (caksnt)</option>
                                        <option value="cuk09">Kuna, San Blas (cuk09)</option>
                                        <option value="cak">Kaqchikel (cak)</option>
                                        <option value="quctt">K'iche' (quctt)</option>
                                        <option value="cakwnt">Kaqchikel (cakwnt)</option>
                                        <option value="qucnnt">K'iche' (qucnnt)</option>
                                        <option value="quctnt">K'iche' (quctnt)</option>
                                        <option value="reg">Kara (reg)</option>
                                        <option value="caknt">Kaqchikel (caknt)</option>
                                        <option value="khz">Keapara (khz)</option>
                                        <option value="cakynt">Kaqchikel (cakynt)</option>
                                        <option value="cakcnt">Kaqchikel (cakcnt)</option>
                                        <option value="cakent">Kaqchikel (cakent)</option>
                                        <option value="kennt">Kenyang (kennt)</option>
                                        <option value="kiz">Kisi (kiz)</option>
                                        <option value="kwj">Kwanga (kwj)</option>
                                        <option value="kxw">Konai (kxw)</option>
                                        <option value="kyq">Kenga (kyq)</option>
                                        <option value="kvnnt">Kuna, Border (kvnnt)</option>
                                        <option value="nit">Kolami, Southeastern (nit)</option>
                                        <option value="sbs">Kuhane (sbs)</option>
                                        <option value="kgpnt">Kaingang (kgpnt)</option>
                                        <option value="kmk">Kalinga, Limos (kmk)</option>
                                        <option value="zgam">Kinga (zgam)</option>
                                        <option value="xon">Konkomba (xon)</option>
                                        <option value="cgc">Kagayanen (cgc)</option>
                                        <option value="kfcp">Konda-Dora (kfcp)</option>
                                        <option value="kyf">Kouya (kyf)</option>
                                        <option value="kwd">Kwaio (kwd)</option>
                                        <option value="leu">Kara (leu)</option>
                                        <option value="kms">Kamasau (kms)</option>
                                        <option value="kxv">Kuvi (kxv)</option>
                                        <option value="kbcnt">Kadiwéu (kbcnt)</option>
                                        <option value="kpf">Komba (kpf)</option>
                                        <option value="khs">Kasua (khs)</option>
                                        <option value="kmo">Kwoma (kmo)</option>
                                        <option value="yuj">Karkar-Yuri (yuj)</option>
                                        <option value="kjent">Kisar (kjent)</option>
                                        <option value="geb">Kire (geb)</option>
                                        <option value="kto">Kuot (kto)</option>
                                        <option value="kpx">Koiali, Mountain (kpx)</option>
                                        <option value="gam">Kandawo (gam)</option>
                                        <option value="xnn">Kankanay, Northern (xnn)</option>
                                        <option value="kze">Kosena (kze)</option>
                                        <option value="urbnt">Kaapor (urbnt)</option>
                                        <option value="kpw">Kobon (kpw)</option>
                                        <option value="bmh">Kein (bmh)</option>
                                        <option value="txunt">Kayapó (txunt)</option>
                                        <option value="kgknt">Kaiwá (kgknt)</option>
                                        <option value="kpjnt">Karajá (kpjnt)</option>
                                        <option value="kyznt">Kayabí (kyznt)</option>
                                        <option value="kmu">Kanite (kmu)</option>
                                        <option value="kup">Kunimaipa (kup)</option>
                                        <option value="cbsnt">Kashinawa (cbsnt)</option>
                                        <option value="kmh">Kalam (kmh)</option>
                                        <option value="eko">Kote (eko)</option>
                                        <option value="kmg">Kate (kmg)</option>
                                        <option value="mwp">Kala Lagaw Ya (mwp)</option>
                                        <option value="tbx">Kapin (tbx)</option>
                                        <option disabled>─── L ───</option>
                                        <option value="latvuc">Latin (latvuc)</option>
                                        <option value="lin">Lingála (lin)</option>
                                        <option value="lug">Luganda (lug)</option>
                                        <option value="dop">Lukpa (dop)</option>
                                        <option value="lbm">Lodhi (lbm)</option>
                                        <option value="lex">Luang (lex)</option>
                                        <option value="lga">Lungga (lga)</option>
                                        <option value="llg">Lole (llg)</option>
                                        <option value="lyn">Luyana (lyn)</option>
                                        <option value="nrz">Lala (nrz)</option>
                                        <option value="ruf">Luguru (ruf)</option>
                                        <option value="lacnt">Lacandon (lacnt)</option>
                                        <option value="uvl">Lote (uvl)</option>
                                        <option value="lbb">Label (lbb)</option>
                                        <option value="lifnt">Limbu (lifnt)</option>
                                        <option value="lifnt2">Limbu (lifnt2)</option>
                                        <option value="lww">Lewo (lww)</option>
                                        <option value="lit">Lithuanian (lit)</option>
                                        <option disabled>─── M ───</option>
                                        <option value="mri2012">Māori (mri2012)</option>
                                        <option value="mal">Malayalam (mal)</option>
                                        <option value="mal2015">Malayalam (mal2015)</option>
                                        <option value="meu">Motu (meu)</option>
                                        <option value="mar">Marathi (mar)</option>
                                        <option value="tdx">Malagasy, Tandroy-Mahafaly (tdx)</option>
                                        <option value="cmncbs">Mandarin Chinese (cmncbs)</option>
                                        <option value="cmncbt">Mandarin Chinese (cmncbt)</option>
                                        <option value="hmo">Motu, Hiri (hmo)</option>
                                        <option value="mdyeth">Male (mdyeth)</option>
                                        <option value="tpi">Melanesian Pidgin (tpi)</option>
                                        <option value="tpiotnt">Melanesian Pidgin (tpiotnt)</option>
                                        <option value="mbbot">Manobo, Western Bukidnon (mbbot)</option>
                                        <option value="mbu">Mbula-Bwazza (mbu)</option>
                                        <option value="mna">Mbula (mna)</option>
                                        <option value="tuc-t">Mutu (tuc-t)</option>
                                        <option value="tuc-o">Mutu (tuc-o)</option>
                                        <option value="mpx">Misima-Paneati (mpx)</option>
                                        <option value="mmx">Madak (mmx)</option>
                                        <option value="kde">Makonde (kde)</option>
                                        <option value="knf">Mankanya (knf)</option>
                                        <option value="met">Mato (met)</option>
                                        <option value="mbs">Manobo, Sarangani (mbs)</option>
                                        <option value="mfo">Mbe (mfo)</option>
                                        <option value="emi">Mussau-Emira (emi)</option>
                                        <option value="mgv">Matengo (mgv)</option>
                                        <option value="mpa">Mpoto (mpa)</option>
                                        <option value="mwe">Mwera (mwe)</option>
                                        <option value="vmynt">Mazateco, Ayautla (vmynt)</option>
                                        <option value="wmw">Mwani (wmw)</option>
                                        <option value="majnt">Mazatec, Jalapa de Díaz (majnt)</option>
                                        <option value="mca">Maka (mca)</option>
                                        <option value="mksnt">Mixtec, Silacayoapan (mksnt)</option>
                                        <option value="mxbnt">Mixtec, Tezoatlán (mxbnt)</option>
                                        <option value="unx">Munda (unx)</option>
                                        <option value="zlmkszi">Malay (zlmkszi)</option>
                                        <option value="hun">Magyar (hun)</option>
                                        <option value="maunt">Mazatec, Huautla (maunt)</option>
                                        <option value="mgh2016">Makhuwa-Meetto (mgh2016)</option>
                                        <option value="mignt">Mixtec, San Miguel el Grande (mignt)</option>
                                        <option value="mri">Māori (mri)</option>
                                        <option value="mxqnt">Mixe, Juquila (mxqnt)</option>
                                        <option value="mcp">Makaa (mcp)</option>
                                        <option value="mient">Mixtec, Ocotepec (mient)</option>
                                        <option value="miznt">Mixtec, Coatzospan (miznt)</option>
                                        <option value="aai">Miniafia (aai)</option>
                                        <option value="xtmntpp">Mixtec, Magdalena Peñasco (xtmntpp)</option>
                                        <option value="mibnt">Mixtec, Atatláhuca (mibnt)</option>
                                        <option value="mva">Manam (mva)</option>
                                        <option value="mtont">Mixe, Totontepec (mtont)</option>
                                        <option value="meq">Merey (meq)</option>
                                        <option value="maant">Mazatec, San Jerónimo Tecóatl (maant)</option>
                                        <option value="soy">Miyobe (soy)</option>
                                        <option value="maqnt">Mazatec, Chiquihuitlán (maqnt)</option>
                                        <option value="mamnt">Mam (mamnt)</option>
                                        <option value="mdybse">Male (mdybse)</option>
                                        <option value="dad">Marik (dad)</option>
                                        <option value="tbf">Mandara (tbf)</option>
                                        <option value="mfxe">Melo (mfxe)</option>
                                        <option value="mfxl">Melo (mfxl)</option>
                                        <option value="mhl">Mauwake (mhl)</option>
                                        <option value="mlh">Mape (mlh)</option>
                                        <option value="muy">Muyang (muy)</option>
                                        <option value="mee">Mengen (mee)</option>
                                        <option value="mti">Maiwa (mti)</option>
                                        <option value="obont">Manobo, Obo (obont)</option>
                                        <option value="mxpnt">Mixe, Tlahuitoltepec (mxpnt)</option>
                                        <option value="bmrnt">Muinane (bmrnt)</option>
                                        <option value="mihnt">Mixtec, Chayuco (mihnt)</option>
                                        <option value="mni">Meitei (mni)</option>
                                        <option value="msb">Masbatenyo (msb)</option>
                                        <option value="mbtnt">Manobo, Matigsalug (mbtnt)</option>
                                        <option value="miont">Mixtec, Pinotepa Nacional (miont)</option>
                                        <option value="arnnt">Mapudungun (arnnt)</option>
                                        <option value="mjcnt">Mixtec, San Juan Colorado (mjcnt)</option>
                                        <option value="mopnt">Maya, Mopán (mopnt)</option>
                                        <option value="mqbnt">Mbuko (mqbnt)</option>
                                        <option value="mxm">Meramera (mxm)</option>
                                        <option value="mxtnt">Mixtec, Jamiltepec (mxtnt)</option>
                                        <option value="micmiqnt">Mi'kmaq (micmiqnt)</option>
                                        <option value="klv">Maskelynes (klv)</option>
                                        <option value="mblnt">Maxakalí (mblnt)</option>
                                        <option value="milnt">Mixtec, Peñoles (milnt)</option>
                                        <option value="mbh">Mangseng (mbh)</option>
                                        <option value="mkl">Mokole (mkl)</option>
                                        <option value="mpmnt">Mixtec, Yosondúa (mpmnt)</option>
                                        <option value="xtdnt">Mixtec, Diuxi-tilantongo (xtdnt)</option>
                                        <option value="mpp">Migabac (mpp)</option>
                                        <option value="mqjnt">Mamasa (mqjnt)</option>
                                        <option value="mamc">Mam (mamc)</option>
                                        <option value="mbcnt">Macushi (mbcnt)</option>
                                        <option value="mcbnt">Machiguenga (mcbnt)</option>
                                        <option value="mcont">Mixe, Coatlán (mcont)</option>
                                        <option value="atdnt">Manobo, Ata (atdnt)</option>
                                        <option value="maznt">Mazahua, Central (maznt)</option>
                                        <option value="mcfnt">Matsés (mcfnt)</option>
                                        <option value="myy">Macuna (myy)</option>
                                        <option value="msmnt">Manobo, Agusan (msmnt)</option>
                                        <option value="mvn">Minaveha (mvn)</option>
                                        <option value="mox">Molima (mox)</option>
                                        <option value="aoj">Mufian (aoj)</option>
                                        <option value="mek">Mekeo (mek)</option>
                                        <option value="msk">Mansaka (msk)</option>
                                        <option value="sim">Mende (sim)</option>
                                        <option value="mitnt">Mixtec, Southern Puebla (mitnt)</option>
                                        <option value="mpt">Mian (mpt)</option>
                                        <option value="kmh-m">Minimib dialect of Kalam (kmh-m)</option>
                                        <option value="hot">Malei-Hote (hot)</option>
                                        <option value="mcr">Menya (mcr)</option>
                                        <option value="myu">Mundurukú (myu)</option>
                                        <option value="mirnt">Mixe, Isthmus (mirnt)</option>
                                        <option value="med">Melpa (med)</option>
                                        <option value="mle">Manambu (mle)</option>
                                        <option value="myw">Muyuw (myw)</option>
                                        <option value="mkj">Mokilese (mkj)</option>
                                        <option value="mfm">Marghi South (mfm)</option>
                                        <option value="mgw">Matumbi (mgw)</option>
                                        <option value="mpj">Martu Wangka (mpj)</option>
                                        <option disabled>─── N ───</option>
                                        <option value="nde">Ndebele (nde)</option>
                                        <option value="npiulb">Nepali (npiulb)</option>
                                        <option value="nchbl">Nahuatl, Huasteca Central (nchbl)</option>
                                        <option value="nhebl">Nahuatl, Huasteca Oriental (nhebl)</option>
                                        <option value="nhwbl">Nahuatl,  Huasteca Occidental (nhwbl)</option>
                                        <option value="nop">Numanggang (nop)</option>
                                        <option value="ntj">Ngaanyatjarra (ntj)</option>
                                        <option value="ntu">Natügu (ntu)</option>
                                        <option value="lid">Nyindrou (lid)</option>
                                        <option value="nuy">Nunggubuyu (nuy)</option>
                                        <option value="nss">Nali (nss)</option>
                                        <option value="nas">Naasioi (nas)</option>
                                        <option value="dne">Ndendeule (dne)</option>
                                        <option value="nag">Naga Pidgin (nag)</option>
                                        <option value="nhint">Nahuatl, Zacatlán-Ahuacatlán-Tepetzintla (nhint)</option>
                                        <option value="nnq">Ngindo (nnq)</option>
                                        <option value="nww">Ndwewe (nww)</option>
                                        <option value="xnj">Ngoni (xnj)</option>
                                        <option value="ndj">Ndamba (ndj)</option>
                                        <option value="ngp">Nguu (ngp)</option>
                                        <option value="nplnt">Nahuatl, Southeastern Puebla (nplnt)</option>
                                        <option value="ninnt">Ninzo (ninnt)</option>
                                        <option value="kfw">Naga, Kharam (kfw)</option>
                                        <option value="nhent">Nahuatl,  Huasteca Oriental (nhent)</option>
                                        <option value="ncr">Ncane (ncr)</option>
                                        <option value="nhunt">Noone (nhunt)</option>
                                        <option value="nhynt">Nahuatl, Northern Oaxaca (nhynt)</option>
                                        <option value="azznt">Nahuatl, Highland Puebla (azznt)</option>
                                        <option value="gngnt">Ngangam (gngnt)</option>
                                        <option value="ndg">Ndengereko (ndg)</option>
                                        <option value="nldgbv">Nederlands (nldgbv)</option>
                                        <option value="ncf">Notsi (ncf)</option>
                                        <option value="nclnt">Nahuatl, Michoacán (nclnt)</option>
                                        <option value="nhr">Naro (nhr)</option>
                                        <option value="ncjnt">Nahuatl, Northern Puebla (ncjnt)</option>
                                        <option value="ngunt">Nahuatl, Guerrero (ngunt)</option>
                                        <option value="nal">Nalik (nal)</option>
                                        <option value="esknt">Northwest Alaska Eskimo (esknt)</option>
                                        <option value="nhgnt">Nahuatl, Tetelcingo (nhgnt)</option>
                                        <option value="tnk">Nafe (tnk)</option>
                                        <option value="tvt">Naga, Tutsa (tvt)</option>
                                        <option value="nuq">Nukumanu (nuq)</option>
                                        <option value="nak">Nakanai (nak)</option>
                                        <option value="mbjnt">Nadeb (mbjnt)</option>
                                        <option value="nsn">Nehan (nsn)</option>
                                        <option value="tnn">North Tanna (tnn)</option>
                                        <option value="nkont">Nkonya (nkont)</option>
                                        <option value="notnt">Nomatsiguenga (notnt)</option>
                                        <option value="gaw">Nobonob (gaw)</option>
                                        <option value="gymnt">Ngäbere (gymnt)</option>
                                        <option value="nii">Nii (nii)</option>
                                        <option value="noblb">Norwegian (noblb)</option>
                                        <option value="naf">Nabak (naf)</option>
                                        <option value="nabnt">Nambikuára, Southern (nabnt)</option>
                                        <option value="nvm">Namiae (nvm)</option>
                                        <option value="nkn">Nkangala (nkn)</option>
                                        <option disabled>─── O ───</option>
                                        <option value="ory">Oriya (ory)</option>
                                        <option value="gaz">Oromo, West Central (gaz)</option>
                                        <option value="gaze">Oromo, West Central (gaze)</option>
                                        <option value="otqnt">Otomi, Querétaro (otqnt)</option>
                                        <option value="otent">Otomi, Mezquital (otent)</option>
                                        <option value="ons">Ono (ons)</option>
                                        <option value="otnnt">Otomi, Tenango (otnnt)</option>
                                        <option value="oyde">Oyda (oyde)</option>
                                        <option value="oydl">Oyda (oydl)</option>
                                        <option value="otsnt">Otomi, Estado de México (otsnt)</option>
                                        <option value="aom">Omie (aom)</option>
                                        <option value="eri">Ogea (eri)</option>
                                        <option value="ong">Olo (ong)</option>
                                        <option value="otmnt">Otomi, Eastern Highland (otmnt)</option>
                                        <option value="okv">Orokaiva (okv)</option>
                                        <option value="okvh">Orokaiva (okvh)</option>
                                        <option value="opm">Oksapmin (opm)</option>
                                        <option value="kkc">Odoodee (kkc)</option>
                                        <option disabled>─── P ───</option>
                                        <option value="poronbv">Português (poronbv)</option>
                                        <option value="pan">Panjabi, Eastern (pan)</option>
                                        <option value="porbrbsl">Portuguese (porbrbsl)</option>
                                        <option value="polubg">Polish (polubg)</option>
                                        <option value="porbr2018">Portuguese (porbr2018)</option>
                                        <option value="pesopv">Persian (pesopv)</option>
                                        <option value="pon2006">Pohnpeian (pon2006)</option>
                                        <option value="pon2006a">Pohnpeian (pon2006a)</option>
                                        <option value="pma">Paama (pma)</option>
                                        <option value="pjt">Pitjantjatjara (pjt)</option>
                                        <option value="pon">Pohnpeian (pon)</option>
                                        <option value="pon-pdn">Pohnpeian (pon-pdn)</option>
                                        <option value="gfk">Patpatar (gfk)</option>
                                        <option value="ata">Pele-Ata (ata)</option>
                                        <option value="porblt">Português (porblt)</option>
                                        <option value="poy">Pogolo (poy)</option>
                                        <option value="pabnt">Parecís (pabnt)</option>
                                        <option value="pohnt">Poqomchi' (pohnt)</option>
                                        <option value="poent">Popoloca, San Juan Atzingo (poent)</option>
                                        <option value="point">Popoluca, Highland (point)</option>
                                        <option value="bfz">Pahari, Mahasu (bfz)</option>
                                        <option value="plsnt">Popoloca, San Marcos Tlalcoyalco (plsnt)</option>
                                        <option value="plu">Palikúr (plu)</option>
                                        <option value="fuf">Pular (fuf)</option>
                                        <option value="prfnt">Paranan (prfnt)</option>
                                        <option value="ptp">Patep (ptp)</option>
                                        <option value="polsz">Polish (polsz)</option>
                                        <option value="portft">Portuguese (portft)</option>
                                        <option value="piont">Piapoco (piont)</option>
                                        <option value="peg">Pengo (peg)</option>
                                        <option value="padnt">Paumarí (padnt)</option>
                                        <option value="pirnt">Piratapuyo (pirnt)</option>
                                        <option value="gfkh">Patpatar (gfkh)</option>
                                        <option value="gfks">Patpatar (gfks)</option>
                                        <option value="print">Paicî (print)</option>
                                        <option value="piu2006">Pintupi-Luritja (piu2006)</option>
                                        <option value="paont">Paiute, Northern (paont)</option>
                                        <option value="plj">Polci (plj)</option>
                                        <option value="pwr">Powari (pwr)</option>
                                        <option disabled>─── Q ───</option>
                                        <option value="qub">Quechua, Huallaga Huánuco (qub)</option>
                                        <option value="qvsnt">Quechua, San Martín (qvsnt)</option>
                                        <option value="qvent">Quechua, Eastern Apurímac (qvent)</option>
                                        <option value="keknt">Q'eqchi' (keknt)</option>
                                        <option value="qulnt">Quechua, North Bolivian (qulnt)</option>
                                        <option value="qvnnt">Quechua, North Junín (qvnnt)</option>
                                        <option value="qxnnt">Quechua, Northern Conchucos Ancash (qxnnt)</option>
                                        <option value="quhnt">Quechua, South Bolivian (quhnt)</option>
                                        <option value="qwhnt">Quechua, Huaylas Ancash (qwhnt)</option>
                                        <option value="byx">Qaqet (byx)</option>
                                        <option value="qufnt">Quechua, Lambayeque (qufnt)</option>
                                        <option value="qvznt">Quichua, Northern Pastaza (qvznt)</option>
                                        <option value="qvcnt">Quechua, Cajamarca (qvcnt)</option>
                                        <option value="qxhnt">Quechua, Panao Huánuco (qxhnt)</option>
                                        <option value="qupnt">Quechua, Southern Pastaza (qupnt)</option>
                                        <option value="qvwnt">Quechua, Huaylla Wanca (qvwnt)</option>
                                        <option value="qxont">Quechua, Southern Conchucos Ancash (qxont)</option>
                                        <option value="qvhnt">Quechua, Huamalíes-Dos de Mayo Huánuco (qvhnt)</option>
                                        <option value="qvmnt">Quechua, Margos-Yarowilca-Lauricocha (qvmnt)</option>
                                        <option disabled>─── R ───</option>
                                        <option value="russyn">Russian (russyn)</option>
                                        <option value="ronbtf">Romanian (ronbtf)</option>
                                        <option value="rmc">Romani, Carpathian (rmc)</option>
                                        <option value="ron1924">Romanian (ron1924)</option>
                                        <option value="rug">Roviana (rug)</option>
                                        <option value="rai">Ramoaaina (rai)</option>
                                        <option value="rgu">Rikou (rgu)</option>
                                        <option value="rmychergash">Romani, Vlax (rmychergash)</option>
                                        <option value="rmygurbet">Romani, Vlax (rmygurbet)</option>
                                        <option value="rhgc">Rohingya (rhgc)</option>
                                        <option value="ronlsb">Romanian (ronlsb)</option>
                                        <option value="lag">Rangi (lag)</option>
                                        <option value="rmna">Romani (rmna)</option>
                                        <option value="rki">Rakhine (rki)</option>
                                        <option value="roo">Rotokas (roo)</option>
                                        <option value="rkbnt">Rikbaktsa (rkbnt)</option>
                                        <option value="rwo-karo">Rawa (rwo-karo)</option>
                                        <option value="rwo-rawa">Rawa (rwo-rawa)</option>
                                        <option value="rhg">Rohingya (rhg)</option>
                                        <option disabled>─── S ───</option>
                                        <option value="shr">Shi (shr)</option>
                                        <option value="swe">Swedish (swe)</option>
                                        <option value="sus">Susu (sus)</option>
                                        <option value="susa">Susu (susa)</option>
                                        <option value="swef">Swedish (swef)</option>
                                        <option value="srp1865">Serbian (srp1865)</option>
                                        <option value="srp1868">Serbian (srp1868)</option>
                                        <option value="suzbl">Sunwar (suzbl)</option>
                                        <option value="som">Somali (som)</option>
                                        <option value="swhonen">Swahili (swhonen)</option>
                                        <option value="swhonmm">Swahili (swhonmm)</option>
                                        <option value="sparv1909">Spanish (sparv1909)</option>
                                        <option value="sparvg">Spanish (sparvg)</option>
                                        <option value="spavbl">Spanish (spavbl)</option>
                                        <option value="srponspc">Serbian (srponspc)</option>
                                        <option value="srponstl">Serbian (srponstl)</option>
                                        <option value="spabes">Spanish (spabes)</option>
                                        <option value="swhulb">Swahili (swhulb)</option>
                                        <option value="cuk">San Blas Kuna (cuk)</option>
                                        <option value="spablm">Spanish (spablm)</option>
                                        <option value="spav1602p">Spanish (spav1602p)</option>
                                        <option value="spapddpt">Spanish (spapddpt)</option>
                                        <option value="swp">Suau (swp)</option>
                                        <option value="ssd">Siroi (ssd)</option>
                                        <option value="sav">Saafi-Saafi (sav)</option>
                                        <option value="tgo">Sudest (tgo)</option>
                                        <option value="xsi">Sio (xsi)</option>
                                        <option value="shpntpo">Shipibo-Conibo (shpntpo)</option>
                                        <option value="bmu">Somba-Siawari or Burum-Mindik (bmu)</option>
                                        <option value="spp">Sénoufo, Supyire (spp)</option>
                                        <option value="ssx">Sembeleke (ssx)</option>
                                        <option value="msc">Sankaran Maninka (msc)</option>
                                        <option value="sps">Saposa (sps)</option>
                                        <option value="myk">Sénoufo, Mamara (myk)</option>
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
                                        <option value="sby">Soli (sby)</option>
                                        <option value="mavnt">Sateré-Mawé (mavnt)</option>
                                        <option value="sle">Sholaga (sle)</option>
                                        <option value="sbk">Safwa (sbk)</option>
                                        <option value="gulnt">Sea Island Creole English (gulnt)</option>
                                        <option value="slk">Slovak (slk)</option>
                                        <option value="asj">Sari (asj)</option>
                                        <option value="snc">Sinaugoro (snc)</option>
                                        <option value="sxbnt">Suba (sxbnt)</option>
                                        <option value="srnnt">Sranan (srnnt)</option>
                                        <option value="ssg">Seimat (ssg)</option>
                                        <option value="acfnt">Saint Lucian Creole French (acfnt)</option>
                                        <option value="seynt">Secoya (seynt)</option>
                                        <option value="sch">Sakachep (sch)</option>
                                        <option value="sbe">Saliba (sbe)</option>
                                        <option value="snnnt">Siona (snnnt)</option>
                                        <option value="sue">Suena (sue)</option>
                                        <option value="srqnt">Sirionó (srqnt)</option>
                                        <option value="sll">Salt-Yui (sll)</option>
                                        <option value="nwi">Southwest Tanna (nwi)</option>
                                        <option value="snp">Siane (snp)</option>
                                        <option value="snp-lambau">Siane (snp-lambau)</option>
                                        <option value="swh1850">Swahili (swh1850)</option>
                                        <option value="sny">Saniyo-Hiyewe (sny)</option>
                                        <option value="apz">Safeyoka (apz)</option>
                                        <option value="spynt">Sabaot (spynt)</option>
                                        <option value="apb">Sa'a (apb)</option>
                                        <option value="sri">Siriano (sri)</option>
                                        <option value="jivnt">Shuar (jivnt)</option>
                                        <option value="sgz">Sursurunga (sgz)</option>
                                        <option value="srmnt">Saramaccan (srmnt)</option>
                                        <option value="sua">Sulka (sua)</option>
                                        <option value="tsn">Setswana (tsn)</option>
                                        <option value="mcdnt">Sharanahua (mcdnt)</option>
                                        <option value="spl">Selepet (spl)</option>
                                        <option disabled>─── T ───</option>
                                        <option value="rifa">Tarifit (rifa)</option>
                                        <option value="rifl">Tarifit (rifl)</option>
                                        <option value="rift">Tarifit (rift)</option>
                                        <option value="tod">Toma (tod)</option>
                                        <option value="tam2017">Tamil (tam2017)</option>
                                        <option value="tglulb">Tagalog (tglulb)</option>
                                        <option value="tamtcv">Tamil (tamtcv)</option>
                                        <option value="thakjv">Thai (thakjv)</option>
                                        <option value="ton">Tongan (ton)</option>
                                        <option value="twi">Twi (twi)</option>
                                        <option value="twiasante">Twi (twiasante)</option>
                                        <option value="vieovcb">Tiếng Việt (vieovcb)</option>
                                        <option value="turytc">Turkish (turytc)</option>
                                        <option value="bodn">Tibetan (bodn)</option>
                                        <option value="tel2017">Telugu (tel2017)</option>
                                        <option value="telotsa">Telugu (telotsa)</option>
                                        <option value="tbg">Tairora (tbg)</option>
                                        <option value="iou">Tuma-Irumu (iou)</option>
                                        <option value="tuont">Tucano (tuont)</option>
                                        <option value="yer">Tarok (yer)</option>
                                        <option value="tdt">Tetun Dili (tdt)</option>
                                        <option value="bgs">Tagabawa (bgs)</option>
                                        <option value="lcm">Tungag (lcm)</option>
                                        <option value="tcs">Torres Strait Creole (tcs)</option>
                                        <option value="tfrntpo">Teribe (tfrntpo)</option>
                                        <option value="tet">Tetun (tet)</option>
                                        <option value="txq">Tii (txq)</option>
                                        <option value="lth">Thur (lth)</option>
                                        <option value="thr">Tharu, Rana (thr)</option>
                                        <option value="ttcnt">Tektiteko (ttcnt)</option>
                                        <option value="ternt">Terêna (ternt)</option>
                                        <option value="tvn">Tavoyan (tvn)</option>
                                        <option value="tptnt">Tepehua, Tlachichilco (tptnt)</option>
                                        <option value="tyx">Teke-Tyee (tyx)</option>
                                        <option value="tkunt">Totonac, Upper Necaxa (tkunt)</option>
                                        <option value="toont">Totonac, Xicotepec De Juárez (toont)</option>
                                        <option value="teent">Tepehua, Huehuetla (teent)</option>
                                        <option value="tzotzc">Tzotzil (tzotzc)</option>
                                        <option value="klg">Tagakaulo (klg)</option>
                                        <option value="tgp">Tangoa (tgp)</option>
                                        <option value="nho">Takuu (nho)</option>
                                        <option value="stpnt">Tepehuan, Southeastern (stpnt)</option>
                                        <option value="tbo">Tawala (tbo)</option>
                                        <option value="jicnt">Tol (jicnt)</option>
                                        <option value="taj">Tamang, Eastern (taj)</option>
                                        <option value="tgj">Tagin (tgj)</option>
                                        <option value="tocnt">Totonac, Coyutla (tocnt)</option>
                                        <option value="trcnt">Triqui, Copala (trcnt)</option>
                                        <option value="tosnt">Totonac, Highland (tosnt)</option>
                                        <option value="kdlnt">Tsikimba (kdlnt)</option>
                                        <option value="tiy">Tiruray (tiy)</option>
                                        <option value="tswnt">Tsishingini (tswnt)</option>
                                        <option value="tzjnt">Tz'utujil (tzjnt)</option>
                                        <option value="tzje">Tz'utujil (tzje)</option>
                                        <option value="turobt">Turkish (turobt)</option>
                                        <option value="tacnt">Tarahumara, Western (tacnt)</option>
                                        <option value="tuf">Tunebo, Central (tuf)</option>
                                        <option value="topnt">Totonac, Papantla (topnt)</option>
                                        <option value="tue">Tuyuca (tue)</option>
                                        <option value="omw">Tairora, South (omw)</option>
                                        <option value="tojnt">Tojolabal (tojnt)</option>
                                        <option value="tpz">Tinputz (tpz)</option>
                                        <option value="tzont">Tzotzil (tzont)</option>
                                        <option value="tbc">Takia (tbc)</option>
                                        <option value="tzotze">Tzotzil (tzotze)</option>
                                        <option value="tzoznt">Tzotzil (tzoznt)</option>
                                        <option value="knv-aramia">Tabo (knv-aramia)</option>
                                        <option value="knv-fly_river">Tabo (knv-fly_river)</option>
                                        <option value="tzosa">Tzotzil (tzosa)</option>
                                        <option value="tim">Timbe (tim)</option>
                                        <option value="ntpnt">Tepehuan, Northern (ntpnt)</option>
                                        <option value="tnant">Tacana (tnant)</option>
                                        <option value="tcant">Ticuna (tcant)</option>
                                        <option value="taw">Tai (taw)</option>
                                        <option value="pahnt">Tenharim (pahnt)</option>
                                        <option value="tlf">Telefol (tlf)</option>
                                        <option value="tif">Tifal (tif)</option>
                                        <option value="tav">Tatuyo (tav)</option>
                                        <option value="oodnt">Tohono O'odham (oodnt)</option>
                                        <option value="tkr">Tsakhur (tkr)</option>
                                        <option value="tap">Taabwa (tap)</option>
                                        <option disabled>─── U ───</option>
                                        <option value="urd">Urdu (urd)</option>
                                        <option value="ukr1871">Ukrainian (ukr1871)</option>
                                        <option value="ukr1996">Ukrainian (ukr1996)</option>
                                        <option value="ukrfb">Ukrainian (ukrfb)</option>
                                        <option value="uigara">Uyghur (uigara)</option>
                                        <option value="uigcyr">Uyghur (uigcyr)</option>
                                        <option value="uiglat">Uyghur (uiglat)</option>
                                        <option value="uigpin">Uyghur (uigpin)</option>
                                        <option value="urdgvh">Urdu (urdgvh)</option>
                                        <option value="urdgvr">Urdu (urdgvr)</option>
                                        <option value="urdgvu">Urdu (urdgvu)</option>
                                        <option value="udu">Uduk (udu)</option>
                                        <option value="ukronpu">Ukranian (ukronpu)</option>
                                        <option value="ubr">Ubir (ubr)</option>
                                        <option value="usa">Usarufa (usa)</option>
                                        <option value="uspnt">Uspanteko (uspnt)</option>
                                        <option value="uro">Ura (uro)</option>
                                        <option value="ksj">Uare (ksj)</option>
                                        <option value="urim">Urim (urim)</option>
                                        <option value="upv">Uripiv-Wala-Rano-Atchin (upv)</option>
                                        <option value="uli">Ulithian (uli)</option>
                                        <option value="urt">Urat (urt)</option>
                                        <option value="urant">Urarina (urant)</option>
                                        <option value="gdn">Umanakaina (gdn)</option>
                                        <option value="ubu-kala">Umbu-Ungu (ubu-kala)</option>
                                        <option value="ubu-nopenge">Umbu-Ungu (ubu-nopenge)</option>
                                        <option value="wnu">Usan (wnu)</option>
                                        <option value="ubu-andelale">Umbu-Ungu (ubu-andelale)</option>
                                        <option value="uvh">Uri (uvh)</option>
                                        <option value="gel">ut-Ma'in (gel)</option>
                                        <option disabled>─── V ───</option>
                                        <option value="vie1934">Vietnamese (vie1934)</option>
                                        <option value="vid">Vidunda (vid)</option>
                                        <option value="wbi">Vwanji (wbi)</option>
                                        <option value="vgr">Vaghri (vgr)</option>
                                        <option value="vaa">Vaagri Booli (vaa)</option>
                                        <option value="wiv">Vitu (wiv)</option>
                                        <option disabled>─── W ───</option>
                                        <option value="wolmbs">Wolof (wolmbs)</option>
                                        <option value="wal">Wolaytta (wal)</option>
                                        <option value="wsk">Waskia (wsk)</option>
                                        <option value="wlo">Wolio (wlo)</option>
                                        <option value="wnc">Wantoat (wnc)</option>
                                        <option value="wbp">Warlpiri (wbp)</option>
                                        <option value="kew">West Kewa (kew)</option>
                                        <option value="wrs">Waris (wrs)</option>
                                        <option value="rro">Waima (rro)</option>
                                        <option value="aucnt">Waorani (aucnt)</option>
                                        <option value="hrw">Warwar Feni (hrw)</option>
                                        <option value="wuv">Wuvalu-Aua (wuv)</option>
                                        <option value="baont">Waimaha (baont)</option>
                                        <option value="gdr">Wipi (gdr)</option>
                                        <option value="wol2010">Wolof (wol2010)</option>
                                        <option value="waj">Waffa (waj)</option>
                                        <option value="wapnt">Wapishana (wapnt)</option>
                                        <option value="wer">Weri (wer)</option>
                                        <option value="tnp">Whitesands (tnp)</option>
                                        <option value="noae">Woun Meu (noae)</option>
                                        <option value="noah">Woun Meu (noah)</option>
                                        <option value="lgl">Wala (lgl)</option>
                                        <option value="wiu">Wiru (wiu)</option>
                                        <option value="wim">Wik-Mungkan (wim)</option>
                                        <option value="abt-wosera">Wosera-Kamu dialect of Ambulas (abt-wosera)</option>
                                        <option disabled>─── X ───</option>
                                        <option value="xavnt">Xavánte (xavnt)</option>
                                        <option disabled>─── Y ───</option>
                                        <option value="yal">Yalunka (yal)</option>
                                        <option value="yor">Yorùbá (yor)</option>
                                        <option value="yap">Yapese (yap)</option>
                                        <option value="jae">Yabem (jae)</option>
                                        <option value="yon">Yongkom (yon)</option>
                                        <option value="yvant">Yawa (yvant)</option>
                                        <option value="yut">Yopno (yut)</option>
                                        <option value="yka">Yakan (yka)</option>
                                        <option value="yns">Yansi (yns)</option>
                                        <option value="ydd">Yiddish, Eastern (ydd)</option>
                                        <option value="yrent">Yaouré (yrent)</option>
                                        <option value="pibnt">Yine (pibnt)</option>
                                        <option value="iyx">Yaka (iyx)</option>
                                        <option value="yaqnt">Yaqui (yaqnt)</option>
                                        <option value="jnje">Yemsa (jnje)</option>
                                        <option value="jnjl">Yemsa (jnjl)</option>
                                        <option value="yss-yamano">Yessan-Mayo (yss-yamano)</option>
                                        <option value="yss-yawu">Yessan-Mayo (yss-yawu)</option>
                                        <option value="yby">Yaweyuha (yby)</option>
                                        <option value="ycn">Yucuna (ycn)</option>
                                        <option value="yuw">Yau (yuw)</option>
                                        <option value="ament">Yanesha' (ament)</option>
                                        <option value="yle">Yele (yle)</option>
                                        <option value="yaant">Yaminahua (yaant)</option>
                                        <option value="yadnt">Yagua (yadnt)</option>
                                        <option value="yrb">Yareba (yrb)</option>
                                        <option value="yaf">Yaka (yaf)</option>
                                        <option disabled>─── Z ───</option>
                                        <option value="zatntps">Zapotec, Tabaa (zatntps)</option>
                                        <option value="zarnt">Zapotec, Rincón (zarnt)</option>
                                        <option value="ztyntps">Zapotec, Yatee (ztyntps)</option>
                                        <option value="ziw">Zigua (ziw)</option>
                                        <option value="ztp">Zapotec, Loxicha (ztp)</option>
                                        <option value="zpunt">Zapotec, Yalálag (zpunt)</option>
                                        <option value="zaj">Zaramo (zaj)</option>
                                        <option value="zawnt">Zapotec, Mitla (zawnt)</option>
                                        <option value="zplnt">Zapotec, Lachixío (zplnt)</option>
                                        <option value="zadnt">Zapotec, Cajonos (zadnt)</option>
                                        <option value="zosnt">Zoque, Francisco León (zosnt)</option>
                                        <option value="zabnt">Zapotec, San Juan Guelavía (zabnt)</option>
                                        <option value="zapnt">Zapotec, Santa María Quiegolani (zapnt)</option>
                                        <option value="zacnt">Zapotec, Ocotlán (zacnt)</option>
                                        <option value="zasnt">Zapotec, Santo Domingo Albarradas (zasnt)</option>
                                        <option value="zpzntpp">Zapotec, Texmelucan (zpzntpp)</option>
                                        <option value="zcant">Zapotec, Coatecas Altas (zcant)</option>
                                        <option value="zamnt">Zapotec, Miahuatlán (zamnt)</option>
                                        <option value="zin">Zinza (zin)</option>
                                        <option value="zpvnt">Zapotec, Chichicapan (zpvnt)</option>
                                        <option value="zaont">Zapotec, Ozolotepec (zaont)</option>
                                        <option value="atbnt">Zaiwa (atbnt)</option>
                                        <option value="zak">Zanaki (zak)</option>
                                        <option value="zpont">Zapotec, Amatlán (zpont)</option>
                                        <option value="zaint">Zapotec, Isthmus (zaint)</option>
                                        <option value="zsrnt">Zapotec, Southern Rincon (zsrnt)</option>
                                        <option value="zpcnt">Zapotec, Choapan (zpcnt)</option>
                                        <option value="ztqnt">Zapotec, Quioquitani-Quierí (ztqnt)</option>
                                        <option value="zia">Zia (zia)</option>
                                        <option value="zaant">Zapotec, Sierra de Juárez (zaant)</option>
                                        <option value="zpqnt">Zapotec, Zoogocho (zpqnt)</option>
                                        <option value="zavnt">Zapotec, Yatzachi (zavnt)</option>
                                        <option value="zpmnt">Zapotec, Mixtepec (zpmnt)</option>
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
                                        <option disabled>─── ಕ ───</option>
                                        <option value="kans">ಕನ್ನಡ (kans)</option>
                                        <option disabled>─── മ ───</option>
                                        <option value="malc">മലയാളം (malc)</option>
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
                            <button 
                                onClick={() => setLeftSidebarOpen(!leftSidebarOpen)} 
                                className="w-7 h-7 rounded bg-background border border-border flex items-center justify-center text-text-3 hover:text-text-1 hover:bg-muted/10 transition-all"
                            >
                                <ChevronLeft size={14} className={`transition-transform duration-300 ${!leftSidebarOpen ? 'rotate-180' : ''}`} />
                            </button>
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
                    {!rightSidebarOpen && !isZenMode && (
                        <button 
                            onClick={() => setRightSidebarOpen(true)}
                            className="hidden md:flex absolute top-1/2 -right-1 -translate-y-1/2 z-30 p-2 bg-background border border-border rounded-l-xl shadow-lg hover:right-0 transition-all text-gold hover:text-gold-2"
                            title="Expand Tools"
                        >
                            <PanelRightOpen size={18} />
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
                                        {['NIV', 'KJV', 'NKJV', 'ES', 'ZH', 'FR', 'PT', 'DE', 'AR', 'RU', 'KO', 'TE', 'TA', 'AFRIKAANS', 'BENGALI', 'ENGLISH', 'GUJARATI', 'HINDI', 'HUNGARIAN', 'INDONESIAN', 'KANNADA', 'MALAYALAM', 'MARATHI', 'NEPALI', 'ORIYA', 'PUNJABI', 'SEPEDI', 'XHOSA', 'ZULU'].map(t => (
                                            <option key={t} value={t.toLowerCase()}>{t}</option>
                                        ))}
                                    </select>

                                    <div className="flex items-center gap-1 border-l border-border/40 pl-2 md:pl-3">
                                        <button 
                                            onClick={() => setRightSidebarOpen(!rightSidebarOpen)} 
                                            className={`w-9 h-9 flex items-center justify-center rounded-lg border transition-all ${rightSidebarOpen ? 'bg-navy text-white border-navy' : 'bg-card-bg border-border text-text-3 hover:border-gold/30'}`}
                                            title={rightSidebarOpen ? "Collapse Tools" : "Expand Tools"}
                                        >
                                            <PanelRightClose size={16} className={rightSidebarOpen ? "" : "hidden"} />
                                            <PanelRightOpen size={16} className={rightSidebarOpen ? "hidden" : ""} />
                                        </button>
                                        
                                        <button 
                                            onClick={() => setIsZenMode(!isZenMode)} 
                                            className={`w-9 h-9 flex items-center justify-center rounded-lg transition-all ${isZenMode ? 'bg-gold text-white shadow-lg' : 'bg-card-bg border border-border text-text-3 hover:border-gold/30'}`}
                                            title={isZenMode ? "Exit Zen Mode" : "Zen Mode"}
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

                {/* Column 4: Study Tools Panel */}
                <aside 
                    className={`border-l border-border bg-card-bg flex flex-col transition-all duration-500 ease-in-out shrink-0
                    ${rightSidebarOpen && !isZenMode ? 'w-80' : 'w-0 overflow-hidden border-none'}`}
                >
                    <div className="flex flex-col h-full w-80">
                        <div className="flex items-center border-b border-border shrink-0">
                            <div className="flex flex-1">
                                {['crossref'].map((tab) => (
                                    <button
                                        key={tab}
                                        onClick={() => setActiveToolTab(tab)}
                                        className={`flex-1 py-5 text-[9px] font-black uppercase tracking-[0.2em] transition-all border-b-2 relative ${activeToolTab === tab ? 'border-gold text-brand-navy' : 'border-transparent text-muted-foreground'}`}
                                    >
                                        Cross Reference
                                        {activeToolTab === tab && <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-gold" />}
                                    </button>
                                ))}
                            </div>
                            <button 
                                onClick={() => setRightSidebarOpen(false)}
                                className="px-4 py-5 text-muted-foreground hover:text-gold transition-colors border-l border-border/50"
                            >
                                <ChevronRight size={16} />
                            </button>
                        </div>

                    <div className="flex-1 overflow-y-auto p-6 custom-scrollbar space-y-8">
                        {activeToolTab === 'crossref' && (
                            <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                                <h5 className="font-title text-[9px] font-bold uppercase tracking-[0.2em] text-gold">Parallel Passages</h5>
                                {[
                                    { ref: 'John 1:1', text: '"In the beginning was the Word, and the Word was with God..."'},
                                    { ref: 'Psalm 119:105', text: '"Your word is a lamp to my feet and a light to my path."'},
                                    { ref: '2 Timothy 3:16', text: '"All Scripture is God-breathed and useful for teaching..."'}
                                ].map((cr, i) => (
                                    <div key={i} className="p-4 bg-background border border-border rounded-xl hover:border-gold/40 cursor-pointer transition-all group">
                                        <div className="font-bold text-[10px] text-brand-navy group-hover:text-gold mb-1">{cr.ref}</div>
                                        <p className="font-serif text-[11px] italic text-muted-foreground leading-relaxed">{cr.text}</p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                    </div>
                </aside>
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
