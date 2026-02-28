"use client";

import React, { useState, useEffect } from "react";
import { Search, Book, Newspaper, Sparkles, MessageCircle, X, ExternalLink, Filter, Clock, Calculator, Calendar } from "lucide-react";
import Link from "next/link";

interface SearchResult {
    title: string;
    description: string;
    link?: string;
    source?: string;
    grace_rank?: number;
    bible_refs?: string[];
}

export default function SearchEnginePortal() {
    const [query, setQuery] = useState("");
    const [filter, setFilter] = useState<"global" | "bible" | "news" | "devotionals" | "sermons">("global");
    const [results, setResults] = useState<SearchResult[]>([]);
    const [solution, setSolution] = useState<any>(null);
    const [instantAnswer, setInstantAnswer] = useState<any>(null);
    const [isSearching, setIsSearching] = useState(false);
    const [hasTyped, setHasTyped] = useState(false);
    const [dailyVerse] = useState({ ref: "John 3:16", text: "For God so loved the world that He gave His one and only Son..." });

    const handleSearch = async (e?: React.FormEvent, currentType?: string) => {
        if (e) e.preventDefault();
        const searchQuery = query.trim();
        if (!searchQuery) return;

        const searchType = currentType || filter;

        setIsSearching(true);
        setHasTyped(true);
        setResults([]);
        setInstantAnswer(null);
        setSolution(null);

        try {
            const res = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}&type=${searchType}`);
            const data = await res.json();
            if (res.ok) {
                setResults(data.results || []);
                setInstantAnswer(data.instantAnswer);
                setSolution(data.solution);
            }
        } catch (error) {
            console.error("Search failed:", error);
        } finally {
            setIsSearching(false);
        }
    };

    useEffect(() => {
        if (query.trim()) {
            handleSearch(undefined, filter);
        }
    }, [filter]);

    return (
        <div className="min-h-screen bg-[#020617] text-slate-100 relative flex flex-col items-center selection:bg-sky-500/30 overflow-hidden">
            <div className="stars" />
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-sky-500/10 blur-[120px] rounded-full pointer-events-none" />

            {/* --- HEADER --- */}
            <header className={`w-full max-w-7xl px-4 md:px-8 py-6 flex items-center justify-between z-10 transition-all duration-700 ${hasTyped ? 'translate-y-0 opacity-100' : 'translate-y-0'}`}>
                <div className="flex items-center gap-10">
                    <div
                        className="flex items-center gap-1 cursor-pointer"
                        onClick={() => { setHasTyped(false); setQuery(""); setResults([]); setSolution(null); setInstantAnswer(null); }}
                    >
                        <span className="font-['Cinzel'] text-2xl font-bold tracking-tight">
                            DAILY<span className="text-sky-400">MANNA</span>AI
                        </span>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <Link href="/notebook" className="flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 px-5 py-2.5 rounded-full text-sm font-medium transition-all backdrop-blur-md">
                        <MessageCircle size={14} className="text-sky-400" />
                        Notebook Workspace
                    </Link>
                </div>
            </header>

            {/* --- MAIN CONTENT --- */}
            <main className={`flex-1 w-full flex flex-col items-center transition-all duration-700 z-10 ${hasTyped ? 'pt-4' : 'pt-32'}`}>

                <div className={`text-center space-y-8 mb-12 transition-all duration-700 ${hasTyped ? 'opacity-0 h-0 overflow-hidden -translate-y-10' : 'opacity-100'}`}>
                    <div className="text-xs font-bold text-sky-400 tracking-[0.4em] uppercase mb-4 animate-pulse">Your word is a lamp to my feet and a light to my path.</div>
                    <h1 className="font-['Cinzel'] text-5xl md:text-8xl font-black tracking-tighter text-white">
                        DAILY<span className="text-sky-400">MANNA</span>AI
                    </h1>
                </div>

                <div className={`w-full transition-all duration-700 flex flex-col items-center ${hasTyped ? 'max-w-7xl px-4 md:px-8' : 'max-w-3xl px-6'}`}>
                    <form onSubmit={handleSearch} className={`w-full flex items-center gap-4 ${hasTyped ? 'flex-col md:flex-row md:items-center' : 'flex-col'}`}>
                        <div className={`relative group w-full ${hasTyped ? 'md:max-w-2xl' : ''}`}>
                            <div className="relative bg-white/5 backdrop-blur-xl border border-white/10 rounded-full px-6 py-2 flex items-center transition-all focus-within:border-sky-500/50 shadow-2xl">
                                <Search className="text-slate-400 w-5 h-5 flex-shrink-0" />
                                <input
                                    type="text"
                                    value={query}
                                    onChange={(e) => setQuery(e.target.value)}
                                    placeholder="Seek and ye shall find solutions..."
                                    className="flex-1 bg-transparent border-none outline-none px-4 py-4 text-lg text-white placeholder:text-slate-500"
                                />
                                {query && (
                                    <button type="button" onClick={() => setQuery("")} className="p-1 hover:bg-white/10 rounded-full">
                                        <X size={20} className="text-slate-400" />
                                    </button>
                                )}
                                <button type="submit" className="hidden md:flex ml-2 bg-sky-500 hover:bg-sky-400 text-white font-bold px-6 py-2 rounded-full text-sm shadow-lg">
                                    SEARCH
                                </button>
                            </div>
                        </div>

                        {hasTyped && (
                            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-2">
                                {[
                                    { id: 'global', label: 'All', icon: <Sparkles size={14} /> },
                                    { id: 'bible', label: 'Bible', icon: <Book size={14} /> },
                                    { id: 'news', label: 'News', icon: <Newspaper size={14} /> },
                                    { id: 'devotionals', label: 'Devotionals', icon: <Sparkles size={14} /> },
                                    { id: 'sermons', label: 'Sermons', icon: <MessageCircle size={14} /> }
                                ].map((btn) => (
                                    <button
                                        key={btn.id}
                                        type="button"
                                        onClick={() => setFilter(btn.id as any)}
                                        className={`flex items-center gap-2 px-5 py-2 rounded-full border text-xs font-bold uppercase transition-all ${filter === btn.id ? 'bg-white/10 border-white/20 text-white' : 'border-transparent text-slate-500 hover:text-slate-300'}`}
                                    >
                                        {btn.icon} {btn.label}
                                    </button>
                                ))}
                            </div>
                        )}
                    </form>
                </div>

                {hasTyped && (
                    <div className="w-full max-w-7xl px-4 md:px-8 mt-12 pb-20">
                        {isSearching ? (
                            <div className="py-24 flex flex-col items-center gap-6">
                                <div className="w-16 h-16 border-4 border-sky-400 border-t-transparent rounded-full animate-spin shadow-[0_0_15px_rgba(56,189,248,0.5)]" />
                                <div className="text-slate-400 text-sm font-medium tracking-[0.2em] uppercase animate-pulse">Consulting 5!4!3!2!1! Model...</div>
                            </div>
                        ) : (results.length > 0 || instantAnswer || solution) ? (
                            <div className="grid grid-cols-1 lg:grid-cols-4 gap-12">
                                <div className="lg:col-span-3 space-y-10">

                                    {/* --- INSTANT ANSWER WIDGET --- */}
                                    {instantAnswer && (
                                        <div className="bg-white/[0.04] border border-white/10 rounded-3xl p-8 mb-10 overflow-hidden relative group animate-in zoom-in-95 duration-500">
                                            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                                {instantAnswer.type === 'calculator' && <Calculator size={100} />}
                                                {instantAnswer.type === 'time' && <Clock size={100} />}
                                                {instantAnswer.type === 'date' && <Calendar size={100} />}
                                                {instantAnswer.type === 'bible' && <Book size={100} />}
                                                {instantAnswer.type === 'age' && <Sparkles size={100} />}
                                            </div>

                                            <div className="relative z-10">
                                                <div className="flex items-center gap-2 text-sky-400 text-[10px] font-black uppercase tracking-[0.3em] mb-4">
                                                    <Sparkles size={12} className="animate-pulse" />
                                                    {instantAnswer.title || "Instant Answer"}
                                                </div>

                                                <div className="flex flex-col gap-1">
                                                    <div className="text-5xl md:text-6xl font-black text-white tracking-tighter">
                                                        {instantAnswer.result || instantAnswer.description}
                                                    </div>
                                                    {instantAnswer.subtitle && (
                                                        <div className="text-slate-400 text-sm font-medium tracking-wide mt-2">
                                                            {instantAnswer.subtitle}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* --- 5!4!3!2!1! SOLUTION --- */}
                                    {solution && (
                                        <div className="space-y-16 animate-in fade-in duration-1000">
                                            {/* AI Insight (1) */}
                                            <div className="bg-gradient-to-br from-sky-500/20 to-amber-500/5 p-8 rounded-[40px] border border-sky-400/30 backdrop-blur-3xl relative overflow-hidden">
                                                <div className="flex items-center gap-2 text-sky-400 text-[10px] font-black uppercase tracking-[0.5em] mb-6">Model: 5!4!3!2!1! Solution</div>
                                                <h2 className="text-4xl font-black text-white mb-6">Divine Insight: <span className="text-sky-400">{query}</span></h2>
                                                <p className="text-slate-300 text-lg leading-relaxed font-serif italic">"{solution.insight}"</p>
                                            </div>

                                            {/* Bible (5) */}
                                            <div className="space-y-6">
                                                <div className="flex items-center gap-3 text-xs font-black text-amber-400 uppercase tracking-widest pl-4"><Book size={16} /> 5 Scriptural Foundations</div>
                                                <div className="grid grid-cols-1 gap-4">
                                                    {solution.bible.map((b: any, i: number) => (
                                                        <div key={i} className="bg-white/[0.03] p-6 rounded-3xl border border-white/5 hover:border-amber-400/30 transition-all">
                                                            <div className="flex justify-between mb-2">
                                                                <span className="text-[10px] font-bold text-sky-400 uppercase">{b.title}</span>
                                                            </div>
                                                            <p className="text-slate-200 font-serif">"{b.description}"</p>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>

                                            {/* News (4) */}
                                            <div className="space-y-6">
                                                <div className="flex items-center gap-3 text-xs font-black text-sky-400 uppercase tracking-widest pl-4"><Newspaper size={16} /> 4 World Perspectives</div>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    {solution.news.map((n: any, i: number) => (
                                                        <div key={i} className="bg-white/[0.02] p-5 rounded-3xl border border-white/5">
                                                            <div className="text-[9px] font-black text-slate-500 uppercase mb-2">{n.source}</div>
                                                            <div className="text-white font-bold text-sm mb-2 line-clamp-1">{n.title}</div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Standard Results */}
                                    {!solution && results.length > 0 && (
                                        <div className="space-y-12">
                                            <div className="text-xs text-slate-500 font-bold uppercase tracking-[0.2em] border-b border-white/5 pb-4">
                                                Found {results.length} results for "{query}"
                                            </div>
                                            {results.map((res, i) => (
                                                <div key={i} className="group relative p-6 bg-white/[0.02] border border-white/5 rounded-3xl transition-all hover:border-sky-500/30">
                                                    <h3 className="text-xl font-bold text-white mb-2">{res.title}</h3>
                                                    <p className="text-slate-400 text-sm leading-relaxed line-clamp-3">{res.description}</p>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <div className="text-center py-32 space-y-6 flex flex-col items-center">
                                <Search className="text-slate-700 w-12 h-12" />
                                <div className="text-slate-300 font-bold text-xl italic">Seek, and ye shall find...</div>
                                <p className="text-slate-500 text-sm uppercase tracking-widest">No results found for "{query}"</p>
                            </div>
                        )}
                    </div>
                )}
            </main>
        </div>
    );
}
