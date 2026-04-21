"use client";

import React, { useState, useCallback } from "react";
import Link from "next/link";
import { ChevronRight, Plus, Minus, Loader2, BookOpen, ExternalLink } from "lucide-react";

interface Question {
    slug: string;
    question: string;
    category: string;
    keywords: string[];
    searchVolume: "high" | "medium";
    createdAt: string;
    metaDescription: string;
    answer?: string;
    shortAnswer?: string;
    keyVerse?: string;
}

interface CategoryMeta {
    label: string;
    color: string;
    emoji: string;
}

interface Props {
    questions: Question[];
    grouped: Record<string, Question[]>;
    categories: string[];
    categoryMeta: Record<string, CategoryMeta>;
}

interface AccordionState {
    [slug: string]: {
        open: boolean;
        loading: boolean;
        shortAnswer: string | null;
        keyVerse: string | null;
        error: string | null;
    };
}

export default function QuestionsAccordion({ questions, grouped, categories, categoryMeta }: Props) {
    const [accordion, setAccordion] = useState<AccordionState>(() => {
        // Pre-populate with any already-generated short answers
        const init: AccordionState = {};
        for (const q of questions) {
            init[q.slug] = {
                open: false,
                loading: false,
                shortAnswer: q.shortAnswer || null,
                keyVerse: q.keyVerse || null,
                error: null,
            };
        }
        return init;
    });

    const toggleQuestion = useCallback(async (q: Question) => {
        const current = accordion[q.slug];
        const isOpen = current?.open;

        // Close it
        if (isOpen) {
            setAccordion((prev) => ({
                ...prev,
                [q.slug]: { ...prev[q.slug], open: false },
            }));
            return;
        }

        // Open it — if we already have a short answer, just show it
        if (current?.shortAnswer) {
            setAccordion((prev) => ({
                ...prev,
                [q.slug]: { ...prev[q.slug], open: true },
            }));
            return;
        }

        // Need to fetch — show loading state & open
        setAccordion((prev) => ({
            ...prev,
            [q.slug]: { ...prev[q.slug], open: true, loading: true, error: null },
        }));

        try {
            const res = await fetch("/api/generate-questions/short-answer", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ slug: q.slug }),
            });
            const data = await res.json();
            if (!data.success) throw new Error(data.error || "Generation failed");

            setAccordion((prev) => ({
                ...prev,
                [q.slug]: {
                    ...prev[q.slug],
                    loading: false,
                    shortAnswer: data.shortAnswer,
                    keyVerse: data.keyVerse,
                },
            }));
        } catch (e: any) {
            setAccordion((prev) => ({
                ...prev,
                [q.slug]: {
                    ...prev[q.slug],
                    loading: false,
                    error: e.message || "Failed to generate answer",
                },
            }));
        }
    }, [accordion]);

    const DEFAULT_META: CategoryMeta = { label: "General", color: "#D4AF37", emoji: "✨" };

    if (questions.length === 0) {
        return (
            <div className="text-center py-24 space-y-6">
                <div className="mx-auto w-20 h-20 rounded-[2rem] bg-gold/10 border border-gold/20 flex items-center justify-center">
                    <BookOpen size={32} className="text-gold" />
                </div>
                <h2 className="text-navy dark:text-white font-black text-2xl">No Questions Yet</h2>
                <p className="text-slate-500 dark:text-white/40 text-sm max-w-sm mx-auto">
                    Use the AI generator to create your spiritual question library.
                </p>
                <Link
                    href="/blog/generate"
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gold text-navy text-xs font-black uppercase tracking-widest hover:bg-gold/90 transition-all"
                >
                    Generate Questions
                </Link>
            </div>
        );
    }

    return (
        <div className="space-y-16">
            {categories.map((cat) => {
                const meta = categoryMeta[cat] || DEFAULT_META;
                const catQuestions = grouped[cat];

                return (
                    <section key={cat} className="space-y-4">
                        {/* Category header */}
                        <div className="flex items-center gap-4 mb-6">
                            <div
                                className="w-10 h-10 rounded-2xl flex items-center justify-center text-lg flex-shrink-0"
                                style={{ background: `${meta.color}20`, border: `1px solid ${meta.color}30` }}
                            >
                                {meta.emoji}
                            </div>
                            <div>
                                <h2 className="text-lg font-black text-navy dark:text-white uppercase tracking-wider">
                                    {meta.label}
                                </h2>
                                <p className="text-[10px] text-slate-400 dark:text-white/30 font-medium">
                                    {catQuestions.length} questions
                                </p>
                            </div>
                            <div className="h-px flex-1 bg-slate-100 dark:bg-white/5 ml-2" />
                        </div>

                        {/* Accordion questions */}
                        <div className="space-y-2">
                            {catQuestions.map((q, qIndex) => {
                                const state = accordion[q.slug] || { open: false, loading: false, shortAnswer: null, keyVerse: null, error: null };

                                return (
                                    <div
                                        key={q.slug}
                                        className={`rounded-2xl border transition-all duration-300 overflow-hidden ${
                                            state.open
                                                ? "border-gold/40 dark:border-gold/30 bg-gold/5 dark:bg-gold/5 shadow-md shadow-gold/10"
                                                : "border-slate-100 dark:border-white/5 hover:border-gold/20 dark:hover:border-gold/10 bg-white dark:bg-navy-2"
                                        }`}
                                    >
                                        {/* Question row */}
                                        <button
                                            onClick={() => toggleQuestion(q)}
                                            className="w-full flex items-center justify-between gap-4 p-6 text-left group"
                                        >
                                            <div className="flex items-start gap-4 flex-1">
                                                {/* Numbering */}
                                                <span className="text-gold font-black text-sm pt-0.5 min-w-[20px]">
                                                    {qIndex + 1}.
                                                </span>
                                                
                                                {/* Question text with prefix */}
                                                <span className={`font-bold text-base leading-snug transition-colors ${
                                                    state.open ? "text-gold" : "text-navy dark:text-white group-hover:text-gold"
                                                }`}>
                                                    Q: {q.question}
                                                </span>

                                                {/* Toggle icon AFTER the text */}
                                                <div
                                                    className={`inline-flex items-center justify-center w-6 h-6 rounded-lg border ml-2 transition-all duration-300 ${
                                                        state.open
                                                            ? "border-gold bg-gold text-white rotate-180"
                                                            : "border-slate-200 dark:border-white/10 text-slate-400 dark:text-white/30 group-hover:border-gold/50 group-hover:text-gold"
                                                    }`}
                                                >
                                                    {state.loading
                                                        ? <Loader2 size={12} className="animate-spin text-gold" />
                                                        : state.open
                                                            ? <Minus size={12} />
                                                            : <Plus size={12} />
                                                    }
                                                </div>
                                            </div>

                                            {/* Badges (hidden on small mobile to keep it clean) */}
                                            <div className="flex-shrink-0 hidden md:flex items-center gap-2">
                                                <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${
                                                    q.searchVolume === "high"
                                                        ? "bg-green-100 dark:bg-green-500/10 text-green-700 dark:text-green-400"
                                                        : "bg-blue-100 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400"
                                                }`}>
                                                    {q.searchVolume}
                                                </span>
                                                {state.shortAnswer && !state.open && (
                                                    <span className="text-[9px] text-gold font-black uppercase tracking-wider">
                                                        ✓ Answered
                                                    </span>
                                                )}
                                            </div>
                                        </button>

                                        {/* Expanded answer */}
                                        {state.open && (
                                            <div className="px-6 pb-6 pl-14 space-y-4 animate-in slide-in-from-top-2 fade-in duration-300">
                                                <div className="h-px bg-gold/10" />

                                                {state.loading && (
                                                    <div className="flex items-center gap-3 py-4">
                                                        <Loader2 size={16} className="animate-spin text-gold flex-shrink-0" />
                                                        <p className="text-slate-400 dark:text-white/30 text-xs italic tracking-wide">Seeking the Word of God...</p>
                                                    </div>
                                                )}

                                                {state.error && (
                                                    <div className="rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-500/20 p-4">
                                                        <p className="text-red-600 dark:text-red-400 text-xs font-medium">{state.error}</p>
                                                    </div>
                                                )}

                                                {!state.loading && !state.error && state.shortAnswer && (
                                                    <div className="space-y-4">
                                                        {/* Short Answer */}
                                                        <div className="flex gap-3">
                                                            <span className="text-gold font-black text-sm pt-0.5">A:</span>
                                                            <p className="text-slate-700 dark:text-white/80 text-base leading-[1.7] font-medium">
                                                                {state.shortAnswer}
                                                            </p>
                                                        </div>

                                                        {/* Key Verse */}
                                                        {state.keyVerse && (
                                                            <div
                                                                className="rounded-2xl p-5 space-y-2 border-l-4 border-gold shadow-sm"
                                                                style={{ background: `${meta.color}05`, borderColor: meta.color }}
                                                            >
                                                                <div
                                                                    className="text-xs font-black uppercase tracking-[0.2em] flex items-center gap-1.5"
                                                                    style={{ color: meta.color }}
                                                                >
                                                                    <BookOpen size={12} />
                                                                    Key Scripture
                                                                </div>
                                                                <p className="text-navy dark:text-white text-[15px] font-serif italic leading-relaxed">
                                                                    {state.keyVerse}
                                                                </p>
                                                            </div>
                                                        )}

                                                        {/* Footer actions */}
                                                        <div className="flex items-center gap-4 pt-1">
                                                            <Link
                                                                href={`/blog/questions/${q.slug}`}
                                                                className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-gold hover:text-gold/70 transition-colors"
                                                            >
                                                                Read Full Answer
                                                                <ChevronRight size={11} />
                                                            </Link>
                                                            <Link
                                                                href={`/?q=${encodeURIComponent(q.question)}&filter=ai`}
                                                                className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-white/30 hover:text-navy dark:hover:text-white transition-colors"
                                                            >
                                                                Ask AI
                                                                <ExternalLink size={10} />
                                                            </Link>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </section>
                );
            })}

            {/* Generate more CTA */}
            <div className="border-t border-slate-100 dark:border-white/5 pt-10 flex flex-col sm:flex-row items-center justify-between gap-4">
                <p className="text-slate-500 dark:text-white/40 text-sm">
                    {questions.length} questions total &mdash; click <strong className="text-navy dark:text-white">+</strong> to see a short answer
                </p>
                <Link
                    href="/blog/generate"
                    className="flex items-center gap-2 px-6 py-3 rounded-xl bg-navy dark:bg-gold text-white dark:text-navy text-xs font-black uppercase tracking-widest hover:opacity-90 transition-all"
                >
                    Generate More Questions
                </Link>
            </div>
        </div>
    );
}
