// src/components/bible-explorer/BibleExplorer.tsx
"use client";

import React, { useState, useEffect, useRef } from 'react';
import { 
    Search, Book, Mic2, Sparkles, BookOpen, Share2, 
    ChevronLeft, ChevronRight, Volume2, Copy, Pin, 
    ExternalLink, Check, Heart, MessageSquare, Plus,
    Sun, Moon, User, ChevronDown, List, Settings, 
    Download, FileAudio, Clock, Flag, Globe, Info,
    Zap, Newspaper,
    PanelLeftClose, PanelLeftOpen,
    PanelRightClose, PanelRightOpen,
    Maximize2, Minimize2,
    Type
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
    const { theme, toggleTheme, isDark } = useTheme();
    const { user } = useAuth();
    
    // State
    const [testament, setTestament] = useState<'OT' | 'NT'>('OT');
    const [currentBook, setCurrentBook] = useState<any>(null);
    const [currentChapter, setCurrentChapter] = useState<number | null>(null);
    const [verses, setVerses] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [translation, setTranslation] = useState('KJV');
    const [activeToolTab, setActiveToolTab] = useState('commentary');
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
        try {
            const res = await fetch(`/api/bible/verses?book=${encodeURIComponent(book)}&chapter=${chapter}&translation=${translation}`);
            const data = await res.json();
            if (data.verses) {
                setVerses(data.verses);
            } else {
                setVerses([]);
            }
        } catch (error) {
            console.error("Bible Fetch Error:", error);
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
            {/* Header / Topbar */}
            <header className="h-16 px-6 flex items-center justify-between border-b border-border bg-background z-20">
                <div className="flex items-center gap-2">
                    <div className="site-logo text-brand-navy">
                        DAILY <span className="gold">MANNA</span> AI
                    </div>
                </div>

                <div className="hidden md:flex flex-col items-center">
                    <p className="font-serif italic text-xs text-muted-foreground opacity-80 max-w-sm text-center">
                        "Man shall not live by bread alone, but by every word that proceedeth out of the mouth of God."
                    </p>
                </div>

                <div className="flex items-center gap-4">
                    <button 
                        onClick={toggleTheme}
                        className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-border bg-card-bg hover:border-gold/30 transition-all text-sm font-medium shadow-sm active:scale-95"
                    >
                        {isDark ? <Sun size={14} className="text-gold" /> : <Moon size={14} className="text-brand-navy" />}
                        <span className={`hidden sm:inline ${isDark ? 'text-gold' : 'text-brand-navy'}`}>{isDark ? 'Light' : 'Dark'}</span>
                    </button>
                    
                    {user ? (
                        <div className="flex items-center gap-2 pl-2 border-l border-border">
                            <div className="w-8 h-8 rounded-full bg-gold text-white flex items-center justify-center font-bold text-xs">
                                {user.name?.[0] || 'U'}
                            </div>
                            <span className="hidden sm:inline text-sm font-semibold">{user.name}</span>
                        </div>
                    ) : (
                        <button className="px-4 py-1.5 bg-navy text-white rounded-full text-sm font-bold hover:bg-navy-3 transition-all">Sign In</button>
                    )}
                </div>
            </header>

            {/* Mode Tabs Bar */}
            <div className="h-14 border-b border-border bg-background/80 backdrop-blur-md flex items-center justify-center gap-2 px-4 overflow-x-auto no-scrollbar shrink-0">
                <a href="/" className="mode-tab transition-all">
                    <Sparkles size={14} /> All
                </a>
                <button className="mode-tab">
                    <Zap size={14} /> AI Mode
                </button>
                <button className="mode-tab active">
                    <Book size={14} /> Bible
                </button>
                <button className="mode-tab">
                    <Newspaper size={14} /> News
                </button>
                <button className="mode-tab" onClick={() => window.location.href='/notebook'}>
                    <BookOpen size={14} /> Notebook
                </button>
                <button className="mode-tab">
                    <Sun size={14} /> Devotionals
                </button>
                <button className="mode-tab">
                    <User size={14} /> Sermons
                </button>
                <div className="mode-tab border-gold/40 bg-gold-pale/10 text-gold group">
                    <div className="w-1.5 h-1.5 rounded-full bg-orange animate-pulse" />
                    Prophetic Sentinel
                </div>
            </div>

            {/* Global Search Bar (Bible Logic) */}
            <div className="bg-background border-b border-border py-4 px-6 shrink-0 flex justify-center">
                <div className="search-bar-main max-w-4xl">
                    <Search className="s-icon shrink-0" size={18} />
                    <input 
                        className="search-input-main" 
                        placeholder="Search the Scriptures, ask in faith..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    />
                    <VoiceInput 
                         onTranscript={(text) => { setSearchQuery(text); handleSearch(text); }}
                         className="voice-input-mic"
                    />
                    <button className="s-btn" onClick={() => handleSearch()}>Search</button>
                </div>
            </div>

            {/* Layout Main */}
            <main className="flex-1 flex overflow-hidden relative">
                {/* Column 1: Books & Chapters (Combined Side Navigation) */}
                <aside 
                    className={`border-r border-border bg-card-bg flex flex-col shrink-0 transition-all duration-300 ease-in-out fixed inset-y-0 left-0 z-40 md:relative md:translate-x-0 
                    ${leftSidebarOpen && !isZenMode ? 'w-80' : 'w-11 md:w-11 -translate-x-full md:translate-x-0'} 
                    ${isMobileMenuOpen ? 'w-full translate-x-0' : ''} overflow-hidden`}
                >
                    <div className="flex flex-col h-full w-80">
                        <div className="p-3.5 border-b border-border space-y-3 shrink-0 flex items-center justify-between">
                            <h4 className={`font-title text-[8px] font-bold uppercase tracking-[0.22em] text-gold transition-opacity duration-200 ${!leftSidebarOpen && 'opacity-0'}`}>Scripture Index</h4>
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
                            {/* Reader Topbar — minimal premium */}
                            <div className="sticky top-0 bg-background/95 backdrop-blur-xl border-b border-border px-6 md:px-8 py-3 flex items-center gap-4 z-20">
                                <div className="flex items-center gap-2">
                                    <span className="font-title text-[12px] font-bold text-brand-navy tracking-wider uppercase">{currentBook.name}</span>
                                    <span className="text-border px-1">·</span>
                                    <span className="text-[12px] font-medium text-text-3">Chapter {currentChapter}</span>
                                    <span className="ml-2 px-2.5 py-1 bg-gold-pale/30 border border-gold/20 rounded-full text-[10px] font-bold text-gold uppercase tracking-tighter shrink-0">{verses.length} verses</span>
                                </div>
                                
                                <div className="hidden sm:flex items-center gap-3 ml-auto">
                                    <div className="flex items-center bg-card-bg rounded-full border border-border p-0.5">
                                        <button onClick={() => setFontSize(Math.max(12, fontSize - 1))} className="w-6 h-6 flex items-center justify-center hover:bg-muted/10 rounded-full transition-colors text-xs font-bold text-text-2">−</button>
                                        <div className="px-2 text-[10px] font-bold text-text-1 min-w-[24px] text-center">{fontSize}</div>
                                        <button onClick={() => setFontSize(Math.min(32, fontSize + 1))} className="w-6 h-6 flex items-center justify-center hover:bg-muted/10 rounded-full transition-colors text-xs font-bold text-text-2">+</button>
                                    </div>

                                    <select 
                                        value={translation}
                                        onChange={(e) => setTranslation(e.target.value)}
                                        className="bg-card-bg border border-border rounded-full px-3 py-1.5 text-[11px] font-bold text-text-2 tracking-tight outline-none cursor-pointer hover:border-gold/30 transition-all font-sans"
                                    >
                                        {['NIV', 'KJV', 'ESV', 'NKJV', 'NLT', 'NASB', 'AMP'].map(t => (
                                            <option key={t} value={t}>{t}</option>
                                        ))}
                                    </select>

                                    <button 
                                        onClick={() => setRightSidebarOpen(!rightSidebarOpen)} 
                                        className={`p-2 rounded-full border transition-all ${rightSidebarOpen ? 'bg-gold-pale/30 border-gold/30 text-gold' : 'bg-card-bg border-border text-text-3 hover:border-gold/30'}`}
                                        title={rightSidebarOpen ? "Collapse Tools" : "Expand Tools"}
                                    >
                                        <PanelRightClose size={18} className={rightSidebarOpen ? "" : "hidden"} />
                                        <PanelRightOpen size={18} className={rightSidebarOpen ? "hidden" : ""} />
                                    </button>
                                    
                                    <button 
                                        onClick={() => setIsZenMode(!isZenMode)} 
                                        className={`p-2 rounded-full transition-all ${isZenMode ? 'bg-gold text-white shadow-lg' : 'hover:bg-muted/10 text-text-3'}`}
                                        title={isZenMode ? "Exit Zen Mode" : "Zen Mode"}
                                    >
                                        {isZenMode ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
                                    </button>
                                </div>
                            </div>

                            {/* Chapter Navigation Bar */}
                            <div className="ch-nav-bar px-6 md:px-8 py-2.5 flex items-center justify-between bg-card-bg/30 border-b border-border text-text-2">
                                <button 
                                    onClick={prevChapter} 
                                    disabled={currentChapter === 1} 
                                    className="flex items-center gap-2 px-4 py-1.5 rounded-full border border-border bg-background text-[11px] font-bold hover:bg-navy hover:text-white disabled:opacity-30 transition-all"
                                >
                                    <ChevronLeft size={14} /> Previous
                                </button>
                                <div className="text-[11px] font-bold text-text-3 uppercase tracking-widest hidden sm:block">
                                    {currentBook.name} · Chapter {currentChapter}
                                </div>
                                <button 
                                    onClick={nextChapter} 
                                    disabled={currentChapter === currentBook.chapters} 
                                    className="flex items-center gap-2 px-4 py-1.5 rounded-full border border-border bg-background text-[11px] font-bold hover:bg-navy hover:text-white disabled:opacity-30 transition-all"
                                >
                                    Next <ChevronRight size={14} />
                                </button>
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
                                                        className={`font-serif leading-[1.9] text-text-1 selection:bg-gold/20`}
                                                        style={{ fontSize: `${fontSize}px` }}
                                                    >
                                                        {v.text}
                                                    </p>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-center py-32 space-y-4">
                                            <Info size={48} className="text-gold opacity-10 mx-auto" />
                                            <h3 className="font-serif text-xl italic text-text-3">Wait on the Lord...</h3>
                                            <p className="text-muted-foreground text-sm uppercase tracking-widest font-bold">Content Loading Problem</p>
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
                                {['commentary', 'crossref', 'notes'].map((tab) => (
                                    <button
                                        key={tab}
                                        onClick={() => setActiveToolTab(tab)}
                                        className={`flex-1 py-5 text-[9px] font-black uppercase tracking-[0.2em] transition-all border-b-2 relative ${activeToolTab === tab ? 'border-gold text-brand-navy' : 'border-transparent text-muted-foreground hover:text-text-1'}`}
                                    >
                                        {tab}
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
                        {activeToolTab === 'commentary' && (
                            <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
                                {/* Verse of Day Card */}
                                <div className="bg-navy rounded-2xl p-6 relative overflow-hidden shadow-xl ring-1 ring-white/10">
                                    <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-gold to-gold-2" />
                                    <div className="font-title text-[8px] tracking-widest text-gold mb-3 uppercase">Verse of the Day</div>
                                    <p className="font-serif text-sm italic text-white/90 leading-relaxed mb-4">
                                        "Your word is a lamp to my feet and a light to my path."
                                    </p>
                                    <div className="flex items-center justify-between">
                                        <span className="text-[10px] font-bold text-gold">PSALM 119:105</span>
                                        <div className="flex gap-2">
                                            <button className="p-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-white/60 transition-colors"><Volume2 size={12} /></button>
                                            <button className="p-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-white/60 transition-colors"><Share2 size={12} /></button>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <h5 className="font-title text-[9px] font-bold uppercase tracking-[0.2em] text-gold">Study Tools</h5>
                                    {[
                                        { icon: '🙏', label: 'Generate Prayer' },
                                        { icon: '⚡', label: 'AI Explanation' },
                                        { icon: '🖼', label: 'Create Image' },
                                        { icon: '📓', label: 'Save to Notebook' }
                                    ].map((tool) => (
                                        <button key={tool.label} className="w-full flex items-center gap-3 px-4 py-3 bg-background border border-border rounded-xl hover:border-gold/30 hover:bg-gold-pale/5 transition-all text-left group">
                                            <span className="text-sm group-hover:scale-125 transition-transform">{tool.icon}</span>
                                            <span className="text-xs font-semibold">{tool.label}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

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

                        {activeToolTab === 'notes' && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                                <div className="space-y-3">
                                    <h5 className="font-title text-[9px] font-bold uppercase tracking-[0.2em] text-gold">Highlight</h5>
                                    <div className="flex gap-2">
                                        {['#FFE066', '#B8F0C8', '#B8D8FA', '#FFC8C8', '#E8C8F8'].map(c => (
                                            <button key={c} className="w-8 h-8 rounded-full border-2 border-transparent hover:scale-110 active:scale-95 transition-all shadow-sm" style={{ backgroundColor: c }} />
                                        ))}
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    <h5 className="font-title text-[9px] font-bold uppercase tracking-[0.2em] text-gold">Personal Reflections</h5>
                                    <textarea 
                                        placeholder="What is God speaking through this passage?..." 
                                        className="w-full h-32 bg-background border border-border rounded-xl p-4 text-xs font-sans outline-none focus:ring-1 ring-gold/20 resize-none leading-relaxed"
                                    />
                                    <button className="w-full py-3 bg-navy text-white rounded-xl font-bold text-[10px] uppercase tracking-widest hover:bg-navy-3 transition-all shadow-lg shadow-navy/20">
                                        💾 Save Reflection
                                    </button>
                                </div>
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
