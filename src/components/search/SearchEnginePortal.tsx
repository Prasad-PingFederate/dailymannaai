"use client";

import React, { useState, useEffect } from "react";
import { Search, Book, Newspaper, Sparkles, MessageCircle, X, ExternalLink, Filter, Clock, Calculator, Calendar, PlayCircle, Quote } from "lucide-react";
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
        if (query.trim() && hasTyped) {
            handleSearch(undefined, filter);
        }
    }, [filter]);

    return (
        <div className="min-h-screen bg-[#020617] text-slate-100 relative flex flex-col items-center selection:bg-sky-500/30 overflow-x-hidden">
            {/* Ambient Background Elements */}
            <div className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-20">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-sky-500 rounded-full blur-[150px]" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-500 rounded-full blur-[150px]" />
            </div>

            {/* --- HEADER --- */}
            <header className={`w-full max-w-7xl px-4 md:px-8 py-6 flex items-center justify-between z-20 transition-all duration-700 ${hasTyped ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}>
                <div
                    className="flex items-center gap-1 cursor-pointer group"
                    onClick={() => { setHasTyped(false); setQuery(""); setResults([]); setSolution(null); setInstantAnswer(null); }}
                >
                    <span className="font-['Cinzel'] text-2xl font-bold tracking-tight group-hover:text-sky-400 transition-colors">
                        DAILY<span className="text-sky-400 group-hover:text-white transition-colors">MANNA</span>AI
                    </span>
                </div>

                <div className="flex items-center gap-4">
                    <Link href="/notebook" className="flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 px-5 py-2.5 rounded-full text-sm font-medium transition-all backdrop-blur-md">
                        <MessageCircle size={14} className="text-sky-400" />
                        Notebook Workspace
                    </Link>
                </div>
            </header>

            {/* --- MAIN SEARCH AREA --- */}
            <main className={`flex-1 w-full flex flex-col items-center transition-all duration-700 z-10 px-4 ${hasTyped ? 'pt-4' : 'pt-40'}`}>

                {/* Vertical Center Logo (Hidden when searching) */}
                <div className={`text-center space-y-8 mb-16 transition-all duration-700 ${hasTyped ? 'opacity-0 -translate-y-20 h-0 overflow-hidden' : 'opacity-100'}`}>
                    <div className="inline-block px-4 py-1.5 rounded-full bg-sky-500/10 border border-sky-500/20 text-[10px] font-black tracking-[0.4em] text-sky-400 uppercase mb-6 animate-pulse">
                        Powered by 5!4!3!2!1! Model
                    </div>
                    <h1 className="font-['Cinzel'] text-6xl md:text-9xl font-black tracking-tighter text-white drop-shadow-2xl">
                        DAILY<span className="text-sky-400">MANNA</span>AI
                    </h1>
                    <p className="text-slate-400 max-w-lg mx-auto text-lg font-medium opacity-80 leading-relaxed italic">
                        "Man shall not live by bread alone, but by every word that proceedeth out of the mouth of God."
                    </p>
                </div>

                <div className={`w-full transition-all duration-700 ${hasTyped ? 'max-w-4xl' : 'max-w-3xl'}`}>
                    <form onSubmit={handleSearch} className="relative group">
                        <div className={`relative bg-white/5 backdrop-blur-2xl border border-white/10 rounded-[2rem] px-8 py-2 flex items-center transition-all duration-500 focus-within:ring-4 focus-within:ring-sky-500/10 focus-within:border-sky-500/40 shadow-[0_20px_50px_rgba(0,0,0,0.5)] ${hasTyped ? 'rounded-2xl' : ''}`}>
                            <Search className="text-sky-400 w-6 h-6 flex-shrink-0 animate-pulse" />
                            <input
                                type="text"
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                placeholder="Seek and ye shall find answers..."
                                className="flex-1 bg-transparent border-none outline-none px-6 py-5 text-xl text-white placeholder:text-slate-500 font-medium"
                            />
                            {query && (
                                <button type="button" onClick={() => setQuery("")} className="p-2 hover:bg-white/10 rounded-full transition-colors mr-2">
                                    <X size={20} className="text-slate-400" />
                                </button>
                            )}
                            <button type="submit" className="bg-sky-500 hover:bg-sky-400 text-white font-black px-8 py-3 rounded-2xl text-sm tracking-widest transition-all shadow-lg active:scale-95">
                                SEARCH
                            </button>
                        </div>

                        {/* Search Filters */}
                        <div className={`flex items-center justify-center gap-2 mt-8 transition-all duration-500 ${hasTyped ? 'opacity-100 scale-100' : 'opacity-80'}`}>
                            {[
                                { id: 'global', label: 'All', icon: <Sparkles size={14} /> },
                                { id: 'bible', label: 'Bible', icon: <Book size={14} /> },
                                { id: 'news', label: 'News', icon: <Newspaper size={14} /> },
                                { id: 'devotionals', label: 'Devotionals', icon: <Quote size={14} /> },
                                { id: 'sermons', label: 'Sermons', icon: <MessageCircle size={14} /> }
                            ].map((btn) => (
                                <button
                                    key={btn.id}
                                    type="button"
                                    onClick={() => setFilter(btn.id as any)}
                                    className={`flex items-center gap-2 px-6 py-2.5 rounded-full border text-[10px] font-black uppercase tracking-widest transition-all duration-300 ${filter === btn.id ? 'bg-sky-500 border-sky-400 text-white shadow-lg shadow-sky-500/20' : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10 hover:text-white'}`}
                                >
                                    {btn.icon} {btn.label}
                                </button>
                            ))}
                        </div>
                    </form>
                </div>

                {/* --- RESULTS SECTION --- */}
                {hasTyped && (
                    <div className="w-full max-w-7xl px-4 md:px-8 mt-16 pb-32">
                        {isSearching ? (
                            <div className="py-24 flex flex-col items-center gap-8 animate-in fade-in duration-700">
                                <div className="relative">
                                    <div className="w-24 h-24 border-2 border-sky-500/20 rounded-full" />
                                    <div className="absolute top-0 left-0 w-24 h-24 border-t-2 border-sky-500 rounded-full animate-spin" />
                                    <Sparkles className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-sky-400 w-8 h-8 animate-pulse" />
                                </div>
                                <div className="text-center space-y-2">
                                    <div className="text-sky-400 text-xs font-black tracking-[0.5em] uppercase animate-pulse">Consulting Crawlers...</div>
                                    <div className="text-slate-500 text-sm font-medium italic">"Knock, and it shall be opened unto you"</div>
                                </div>
                            </div>
                        ) : (results.length > 0 || instantAnswer || solution) ? (
                            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                                <div className="lg:col-span-8 space-y-12">

                                    {/* --- INSTANT ANSWER WIDGET --- */}
                                    {instantAnswer && (
                                        <div className="bg-gradient-to-br from-white/[0.05] to-transparent border border-white/10 rounded-[2.5rem] p-10 relative overflow-hidden group animate-in slide-in-from-bottom-5 duration-700">
                                            <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:opacity-[0.06] transition-opacity rotate-12">
                                                {instantAnswer.type === 'calculator' && <Calculator size={160} />}
                                                {instantAnswer.type === 'time' && <Clock size={160} />}
                                                {instantAnswer.type === 'date' && <Calendar size={160} />}
                                                {instantAnswer.type === 'bible' && <Book size={160} />}
                                                {instantAnswer.type === 'age' && <Sparkles size={160} />}
                                            </div>

                                            <div className="relative z-10 space-y-6">
                                                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-500/10 border border-sky-500/20 text-sky-400 text-[9px] font-black uppercase tracking-[0.3em]">
                                                    <Sparkles size={10} className="animate-pulse" />
                                                    {instantAnswer.title || "Instant Wisdom"}
                                                </div>

                                                <div className="space-y-2">
                                                    <div className="text-5xl md:text-7xl font-black text-white tracking-tighter leading-none">
                                                        {instantAnswer.result || instantAnswer.description}
                                                    </div>
                                                    {instantAnswer.subtitle && (
                                                        <div className="text-slate-400 text-lg font-medium opacity-60">
                                                            {instantAnswer.subtitle}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* --- 5!4!3!2!1! SMART SOLUTION DASHBOARD --- */}
                                    {solution && (
                                        <div className="space-y-16 animate-in fade-in duration-1000">
                                            {/* AI Insight (1) */}
                                            <div className="bg-gradient-to-br from-sky-500/[0.15] via-indigo-500/[0.05] to-transparent border border-sky-400/20 rounded-[3rem] p-12 relative overflow-hidden backdrop-blur-xl group">
                                                <div className="absolute -top-24 -right-24 w-64 h-64 bg-sky-400/10 rounded-full blur-[80px]" />
                                                <div className="relative z-10 flex flex-col items-center text-center space-y-8">
                                                    <div className="text-sky-400 text-[10px] font-black uppercase tracking-[0.6em]">Crawled Perspective</div>
                                                    <h2 className="text-4xl md:text-5xl font-black text-white leading-tight">
                                                        Divine Insight: <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-indigo-400 italic font-['Cinzel']">{query}</span>
                                                    </h2>
                                                    <div className="w-16 h-1 bg-gradient-to-r from-transparent via-sky-500 to-transparent" />
                                                    <p className="text-slate-200 text-xl md:text-2xl leading-relaxed font-serif italic max-w-3xl">
                                                        "{solution.insight}"
                                                    </p>
                                                    <div className="flex items-center gap-4 pt-4">
                                                        <span className="text-slate-500 text-[9px] font-black tracking-widest uppercase">Verified Knowledge Output</span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Bible (5) - Scriptural Foundation */}
                                            <div className="space-y-8">
                                                <div className="flex items-center justify-between px-4">
                                                    <div className="flex items-center gap-3 text-sm font-black text-amber-500 uppercase tracking-[0.2em]"><Book size={18} /> 5 Scriptural Foundations</div>
                                                    <div className="h-px flex-1 bg-amber-500/10 ml-6" />
                                                </div>
                                                <div className="grid grid-cols-1 gap-6">
                                                    {(solution.bible || []).map((b: any, i: number) => (
                                                        <div key={i} className="group bg-white/[0.03] hover:bg-white/[0.05] p-8 rounded-[2rem] border border-white/5 hover:border-amber-500/30 transition-all duration-300">
                                                            <div className="flex items-center justify-between mb-4">
                                                                <span className="text-amber-500 text-[10px] font-black uppercase">{b.title}</span>
                                                                <Link href={`https://www.biblegateway.com/passage/?search=${encodeURIComponent(b.title)}&version=KJV`} target="_blank" className="text-slate-500 hover:text-white transition-colors">
                                                                    <ExternalLink size={14} />
                                                                </Link>
                                                            </div>
                                                            <p className="text-slate-200 text-lg font-serif italic group-hover:text-white transition-colors leading-relaxed">"{b.description}"</p>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>

                                            {/* News (4) - Modern Context (Powered by "Google Crawler") */}
                                            <div className="space-y-8">
                                                <div className="flex items-center justify-between px-4">
                                                    <div className="flex items-center gap-3 text-sm font-black text-sky-400 uppercase tracking-[0.2em]"><Newspaper size={18} /> 4 World Perspectives</div>
                                                    <div className="h-px flex-1 bg-sky-500/10 ml-6" />
                                                </div>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                    {(solution.news || []).length > 0 ? (solution.news.map((n: any, i: number) => (
                                                        <Link key={i} href={n.link || "#"} target="_blank" className="block group">
                                                            <div className="bg-white/5 hover:bg-white/10 p-6 rounded-[2rem] border border-white/5 hover:border-sky-500/30 transition-all duration-500 h-full flex flex-col justify-between">
                                                                <div>
                                                                    <div className="flex items-center justify-between mb-4">
                                                                        <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">{n.source || "Global Perspective"}</span>
                                                                        <Newspaper size={14} className="text-sky-500 group-hover:scale-110 transition-transform" />
                                                                    </div>
                                                                    <h3 className="text-white font-bold text-lg mb-4 line-clamp-2 group-hover:text-sky-400 transition-colors leading-tight">{n.title}</h3>
                                                                </div>
                                                                <p className="text-slate-400 text-sm line-clamp-2 italic mb-4">"{n.description}"</p>
                                                                <div className="text-[9px] text-sky-400 font-black uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">Read Full Report →</div>
                                                            </div>
                                                        </Link>
                                                    ))) : (
                                                        <div className="col-span-2 py-10 text-center text-slate-500 italic border border-white/5 rounded-3xl">Search Crawler identifying modern context...</div>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Devotionals (3) & Sermons (2) Combined for aesthetics */}
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                                                <div className="space-y-8">
                                                    <div className="flex items-center gap-3 text-sm font-black text-indigo-400 uppercase tracking-[0.2em] pl-4"><Sparkles size={18} /> 3 Daily Mannas</div>
                                                    <div className="space-y-4">
                                                        {(solution.devotionals || []).map((d: any, i: number) => (
                                                            <div key={i} className="bg-white/[0.02] p-6 rounded-[1.5rem] border border-white/5 hover:bg-white/[0.04] transition-all">
                                                                <div className="flex items-center gap-2 mb-2">
                                                                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                                                                    <h4 className="text-white font-bold text-sm tracking-wide">{d.title}</h4>
                                                                </div>
                                                                <p className="text-slate-400 text-xs leading-relaxed italic">{d.description}</p>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                                <div className="space-y-8">
                                                    <div className="flex items-center gap-3 text-sm font-black text-pink-400 uppercase tracking-[0.2em] pl-4"><MessageCircle size={18} /> 2 Divine Lectures</div>
                                                    <div className="space-y-4">
                                                        {(solution.sermons || []).map((s: any, i: number) => (
                                                            <div key={i} className="bg-white/[0.02] p-6 rounded-[1.5rem] border border-white/5 flex items-center gap-4 hover:border-pink-500/30 transition-all cursor-pointer group">
                                                                <div className="w-12 h-12 rounded-2xl bg-pink-500/10 flex items-center justify-center text-pink-500 group-hover:bg-pink-500 group-hover:text-white transition-all">
                                                                    <PlayCircle size={24} />
                                                                </div>
                                                                <div>
                                                                    <h4 className="text-white font-bold text-sm">{s.title}</h4>
                                                                    <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest">{s.speaker} • {s.length}</p>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Standard Results Fallback (If not in Global mode) */}
                                    {!solution && results.length > 0 && (
                                        <div className="space-y-10">
                                            <div className="flex items-center gap-4 mb-8">
                                                <div className="h-px flex-1 bg-white/10" />
                                                <div className="text-[10px] text-slate-500 font-black uppercase tracking-[0.4em]">Historical Search Archives</div>
                                                <div className="h-px flex-1 bg-white/10" />
                                            </div>
                                            {results.map((res, i) => (
                                                <div key={i} className="group relative p-8 bg-white/[0.02] border border-white/5 rounded-[2.5rem] transition-all hover:bg-white/[0.04] hover:border-sky-500/30">
                                                    <div className="flex justify-between items-start mb-4">
                                                        <h3 className="text-2xl font-bold text-white group-hover:text-sky-400 transition-colors leading-tight">{res.title}</h3>
                                                        {res.link && (
                                                            <Link href={res.link} target="_blank" className="p-2 bg-white/5 rounded-full text-slate-400 hover:text-white transition-all">
                                                                <ExternalLink size={16} />
                                                            </Link>
                                                        )}
                                                    </div>
                                                    <p className="text-slate-400 text-lg leading-relaxed line-clamp-3 font-medium opacity-80">{res.description}</p>
                                                    {res.source && (
                                                        <div className="mt-6 flex items-center gap-3">
                                                            <div className="w-2 h-2 rounded-full bg-sky-500" />
                                                            <span className="text-[10px] font-black text-sky-400 uppercase tracking-widest">{res.source}</span>
                                                            {res.grace_rank && (
                                                                <span className="text-[10px] font-black text-slate-600 ml-auto">GRACE_RANK: {res.grace_rank.toFixed(2)}</span>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Sidebar / Related Elements */}
                                <div className="lg:col-span-4 space-y-10">
                                    <div className="bg-white/5 border border-white/10 rounded-[2.5rem] p-8 space-y-8 sticky top-10">
                                        <div className="space-y-2">
                                            <h3 className="text-white font-black uppercase text-xs tracking-widest">Divine Engine Status</h3>
                                            <div className="flex items-center gap-2 text-green-400">
                                                <div className="w-2 h-2 rounded-full bg-current animate-pulse" />
                                                <span className="text-[10px] font-black uppercase">Crawler Live</span>
                                            </div>
                                        </div>

                                        <div className="space-y-4">
                                            <h4 className="text-slate-400 text-[10px] font-black uppercase tracking-widest border-b border-white/5 pb-2">Search Logic</h4>
                                            <div className="space-y-3">
                                                {[
                                                    { icon: <Search size={12} />, label: "Astra AI Vector Index" },
                                                    { icon: <Sparkles size={12} />, label: "5!4!3!2!1! Model Synthesis" },
                                                    { icon: <Quote size={12} />, label: "Doctrine Verification" },
                                                    { icon: <Clock size={12} />, label: "Real-time Google Crawler" }
                                                ].map((t, i) => (
                                                    <div key={i} className="flex items-center gap-3 text-slate-300 text-xs font-bold">
                                                        <div className="w-6 h-6 rounded-lg bg-white/5 flex items-center justify-center text-sky-400">{t.icon}</div>
                                                        {t.label}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="pt-6 border-t border-white/5">
                                            <div className="bg-sky-500/10 p-4 rounded-2xl border border-sky-500/20 text-xs font-serif italic text-slate-300">
                                                "The search for Truth is never in vain when conducted with a sincere heart."
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="text-center py-40 flex flex-col items-center gap-8 group">
                                <div className="relative">
                                    <div className="absolute inset-0 bg-sky-500/20 blur-[60px] rounded-full scale-150 group-hover:scale-125 transition-transform duration-1000" />
                                    <div className="w-24 h-24 rounded-[2rem] bg-white/5 border border-white/10 flex items-center justify-center relative backdrop-blur-3xl group-hover:rotate-12 transition-all duration-700">
                                        <Search className="text-slate-400 w-10 h-10 group-hover:text-sky-400 transition-colors" />
                                    </div>
                                </div>
                                <div className="space-y-4 max-w-sm">
                                    <div className="text-white font-black text-2xl font-['Cinzel'] tracking-tight italic opacity-80">"Seek, and ye shall find..."</div>
                                    <p className="text-slate-500 text-xs font-black uppercase tracking-[0.3em] leading-relaxed">No data retrieved for "{query}". Try a broader theological concept.</p>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </main>
        </div>
    );
}
