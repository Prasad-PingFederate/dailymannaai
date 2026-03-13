// src/components/bible-explorer/BibleExplorer.tsx
"use client";

import React, { useState, useEffect, useRef } from 'react';
import { 
    Search, Book, Mic2, Sparkles, BookOpen, Share2, 
    ChevronLeft, ChevronRight, Volume2, Copy, Pin, 
    ExternalLink, Check, Heart, MessageSquare, Plus,
    Sun, Moon, User, ChevronDown, List, Settings, 
    Download, FileAudio, Clock, Flag, Globe, Info
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
        setCurrentBook(book);
        setCurrentChapter(null);
        setVerses([]);
    };

    const handleChapterSelect = (chapter: number) => {
        setCurrentChapter(chapter);
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
                    <div className="site-logo">
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
                        className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-border bg-card-bg hover:border-gold/30 transition-all text-sm font-medium"
                    >
                        {isDark ? <Sun size={14} className="text-gold" /> : <Moon size={14} className="text-navy" />}
                        <span className="hidden sm:inline">{isDark ? 'Light' : 'Dark'}</span>
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
                <div className="search-bar-main max-w-2xl">
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
            <main className="flex-1 flex overflow-hidden">
                {/* Column 1: Books (Side Navigation) */}
                <aside className={`w-64 border-r border-border bg-card-bg flex flex-col shrink-0 transition-all duration-300 fixed inset-y-0 left-0 z-30 md:relative md:translate-x-0 ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                    <div className="p-4 border-b border-border space-y-3">
                        <h4 className="font-title text-[9px] font-bold uppercase tracking-[0.2em] text-gold">Books of the Bible</h4>
                        <div className="flex p-1 bg-background rounded-lg border border-border">
                            <button 
                                onClick={() => setTestament('OT')}
                                className={`flex-1 py-1.5 rounded-md text-[10px] font-bold transition-all ${testament === 'OT' ? 'bg-navy text-white shadow-sm' : 'text-muted-foreground hover:bg-muted/10'}`}
                            >
                                OLD (39)
                            </button>
                            <button 
                                onClick={() => setTestament('NT')}
                                className={`flex-1 py-1.5 rounded-md text-[10px] font-bold transition-all ${testament === 'NT' ? 'bg-navy text-white shadow-sm' : 'text-muted-foreground hover:bg-muted/10'}`}
                            >
                                NEW (27)
                            </button>
                        </div>
                    </div>
                    <div className="flex-1 overflow-y-auto custom-scrollbar">
                        {BIBLE_BOOKS[testament].map((book) => (
                            <button
                                key={book.name}
                                onClick={() => handleBookSelect(book)}
                                className={`w-full flex items-center justify-between px-5 py-3 text-sm border-l-[3px] transition-all border-b border-border/20 ${currentBook?.name === book.name ? 'bg-gold-pale/20 text-gold border-gold font-bold' : 'hover:bg-muted/5 border-transparent text-text-2 hover:text-foreground'}`}
                            >
                                <span>{book.name}</span>
                                <span className={`text-[9px] font-bold uppercase tracking-wider ${currentBook?.name === book.name ? 'text-gold' : 'text-muted-foreground'}`}>{book.abbr}</span>
                            </button>
                        ))}
                    </div>
                </aside>

                {/* Column 2: Chapters Navigation */}
                <aside className={`w-48 border-r border-border bg-background flex flex-col shrink-0 ${currentBook ? 'block' : 'hidden md:block'}`}>
                    <div className="p-4 border-b border-border">
                        <h4 className="font-title text-[9px] font-bold uppercase tracking-[0.2em] text-gold truncate">
                            {currentBook ? `${currentBook.name} Chapters` : 'Chapters'}
                        </h4>
                    </div>
                    {currentBook ? (
                        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                            <div className="grid grid-cols-4 gap-2">
                                {Array.from({ length: currentBook.chapters }, (_, i) => i + 1).map((ch) => (
                                    <button
                                        key={ch}
                                        onClick={() => handleChapterSelect(ch)}
                                        className={`h-10 rounded-lg border transition-all flex items-center justify-center text-xs font-bold ${currentChapter === ch ? 'bg-navy border-navy text-white shadow-lg' : 'bg-card-bg border-border hover:border-gold/30 hover:bg-gold-pale/10 text-muted-foreground hover:text-gold'}`}
                                    >
                                        {ch}
                                    </button>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center opacity-30">
                            <BookOpen size={32} className="mb-2" />
                            <p className="text-[10px] font-bold uppercase tracking-widest">Select Book</p>
                        </div>
                    )}
                </aside>

                {/* Column 3: Reader Area */}
                <section className="flex-1 flex flex-col bg-background relative">
                    {/* Floating Mobile Toggle */}
                    <button 
                        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                        className="md:hidden fixed top-20 left-4 z-40 p-3 bg-navy text-white rounded-full shadow-xl"
                    >
                        <List size={20} />
                    </button>

                    {currentBook && currentChapter ? (
                        <>
                            {/* Reader Controls */}
                            <div className="sticky top-0 bg-background/90 backdrop-blur-md border-b border-border px-8 py-5 flex items-center justify-between z-10">
                                <div>
                                    <div className="font-title text-[10px] font-bold tracking-[0.2em] text-gold uppercase mb-1">{currentBook.name}</div>
                                    <h2 className="font-serif text-3xl font-medium tracking-tight">Chapter {currentChapter}</h2>
                                </div>
                                <div className="flex items-center gap-2">
                                    <select 
                                        value={translation}
                                        onChange={(e) => setTranslation(e.target.value)}
                                        className="bg-card-bg border border-border rounded-full px-4 py-1.5 text-xs font-bold focus:ring-1 ring-gold/20 outline-none cursor-pointer"
                                    >
                                        <option value="KJV">KJV</option>
                                        <option value="NIV">NIV</option>
                                        <option value="ESV">ESV</option>
                                        <option value="NKJV">NKJV</option>
                                    </select>
                                    <button onClick={prevChapter} disabled={currentChapter === 1} className="p-2 border border-border rounded-full bg-card-bg hover:bg-muted/10 disabled:opacity-30 disabled:cursor-not-allowed"><ChevronLeft size={16} /></button>
                                    <button onClick={nextChapter} disabled={currentChapter === currentBook.chapters} className="p-2 border border-border rounded-full bg-card-bg hover:bg-muted/10 disabled:opacity-30 disabled:cursor-not-allowed"><ChevronRight size={16} /></button>
                                </div>
                            </div>

                            {/* Scripture Content */}
                            <div className="flex-1 overflow-y-auto px-8 md:px-16 py-12 custom-scrollbar">
                                <div className="max-w-3xl mx-auto space-y-1">
                                    {loading ? (
                                        <div className="flex flex-col items-center justify-center py-20 animate-pulse">
                                            <div className="w-12 h-12 rounded-full border-2 border-gold/30 border-t-gold animate-spin mb-4" />
                                            <p className="font-serif italic text-muted-foreground">Drawing from the well of living water...</p>
                                        </div>
                                    ) : verses.length > 0 ? (
                                        verses.map((v) => (
                                            <div 
                                                key={v.verse || v.pk} 
                                                onClick={() => setHighlightedVerse(v.verse)}
                                                className={`group flex items-start gap-5 p-4 rounded-xl transition-all cursor-pointer border-l-[3px] ${highlightedVerse === v.verse ? 'bg-gold-pale/10 border-gold' : 'hover:bg-muted/5 border-transparent'}`}
                                            >
                                                <span className="shrink-0 w-8 text-right font-bold text-[10px] text-gold pt-1.5">{v.verse}</span>
                                                <p className="font-serif text-[19px] leading-[1.8] text-foreground/90 selection:bg-gold/20">
                                                    {v.text}
                                                </p>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="text-center py-20 text-muted-foreground">
                                            <Info size={40} className="mx-auto mb-4 opacity-20" />
                                            <p>Scripture content not found in {translation}.</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-center p-12 space-y-6 animate-in fade-in duration-1000">
                             <div className="p-8 rounded-[3rem] bg-gold-pale/5 ring-1 ring-gold/10">
                                <svg width="80" height="80" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-gold opacity-60">
                                    <path d="M12 21C16.9706 21 21 16.9706 21 12C21 7.02944 16.9706 3 12 3C7.02944 3 3 7.02944 3 12C3 16.9706 7.02944 21 12 21Z" stroke="currentColor" strokeWidth="1.5" />
                                    <path d="M12 8V12L15 15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                                </svg>
                             </div>
                             <div className="space-y-2">
                                <h1 className="font-title text-xl tracking-[0.3em] text-gold uppercase">Daily Manna AI</h1>
                                <p className="font-serif text-2xl italic text-muted-foreground">Select a book and chapter to begin your study.</p>
                             </div>
                             <div className="flex flex-wrap justify-center gap-3 pt-4">
                                {['GENESIS 1', 'PSALM 23', 'JOHN 3', 'ROMANS 8'].map((s) => (
                                    <button key={s} className="px-5 py-2 rounded-full border border-border bg-card-bg text-[10px] font-bold tracking-widest hover:border-gold transition-all uppercase">
                                        {s}
                                    </button>
                                ))}
                             </div>
                        </div>
                    )}
                </section>

                {/* Column 4: Study Tools Panel */}
                <aside className="hidden lg:flex w-72 border-l border-border bg-card-bg flex-col shrink-0">
                    <div className="flex border-b border-border">
                        {['commentary', 'crossref', 'notes'].map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setActiveToolTab(tab)}
                                className={`flex-1 py-4 text-[10px] font-bold uppercase tracking-widest transition-all border-b-2 ${activeToolTab === tab ? 'border-gold text-navy font-black' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
                            >
                                {tab}
                            </button>
                        ))}
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
                                        <div className="font-bold text-[10px] text-navy group-hover:text-gold mb-1">{cr.ref}</div>
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
                </aside>
            </main>

            {/* Footer */}
            <footer className="h-10 border-t border-border bg-card-bg/50 px-6 flex items-center justify-between shrink-0">
                <p className="text-[10px] font-bold opacity-40 uppercase tracking-widest">© 2026 DailyMannaAI — Built with Prayer ✦</p>
                <div className="flex gap-6">
                    <button className="text-[10px] font-bold text-muted-foreground hover:text-gold transition-colors uppercase tracking-widest">About Us</button>
                    <button className="text-[10px] font-bold text-muted-foreground hover:text-gold transition-colors uppercase tracking-widest">Privacy Policy</button>
                </div>
            </footer>
        </div>
    );
}
