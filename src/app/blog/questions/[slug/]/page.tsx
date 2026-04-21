// src/app/blog/questions/[slug]/page.tsx
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import fs from "fs";
import path from "path";
import { ArrowLeft, Sparkles, BookOpen, Share2, MessageCircle } from "lucide-react";
import { CATEGORY_META } from "../../page";
import { getProviderManager } from "@/lib/ai/gemini";

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

const DATA_FILE = path.join(process.cwd(), "src", "data", "spiritual-questions.json");

function getQuestion(slug: string): Question | null {
    try {
        if (!fs.existsSync(DATA_FILE)) return null;
        const questions: Question[] = JSON.parse(fs.readFileSync(DATA_FILE, "utf-8"));
        return questions.find(q => q.slug === slug) || null;
    } catch { return null; }
}

function updateQuestion(updated: Question) {
    try {
        const questions: Question[] = JSON.parse(fs.readFileSync(DATA_FILE, "utf-8"));
        const idx = questions.findIndex(q => q.slug === updated.slug);
        if (idx !== -1) {
            questions[idx] = updated;
            fs.writeFileSync(DATA_FILE, JSON.stringify(questions, null, 2));
        }
    } catch (e) {
        console.error("Failed to update question", e);
    }
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
    const q = getQuestion(params.slug);
    if (!q) return { title: "Question Not Found" };

    return {
        title: `${q.question} — Biblical Answer | DailyMannaAI Blog`,
        description: q.metaDescription,
        keywords: q.keywords,
        openGraph: {
            title: q.question,
            description: q.metaDescription,
            type: "article",
            publishedTime: q.createdAt,
        }
    };
}

export default async function QuestionDetailPage({ params }: { params: { slug: string } }) {
    const q = getQuestion(params.slug);
    if (!q) notFound();

    const meta = CATEGORY_META[q.category] || CATEGORY_META.all;

    // If full answer is missing, generate it on the fly (and save it for future visitors)
    let fullAnswer = q.answer;
    if (!fullAnswer) {
        const prompt = `You are a Christian theologian and pastor. Write a comprehensive, deeply spiritual, and biblical answer to this question: "${q.question}".
        
        Requirements:
        1. Length: Approximately 500-700 words.
        2. Format: Use Markdown (H2, H3, bold, lists).
        3. Tone: Compassionate, authoritative, and grounded in KJV scripture.
        4. Structure: 
           - Introduction
           - Biblical Foundation (with verses)
           - Practical Application for the believer
           - Conclusion with a prayerful closing.
        
        Start directly with the content. Do not include titles like "Title:".`;
        
        try {
            const { response } = await getProviderManager().generateResponse(prompt);
            fullAnswer = response;
            // Persist the answer so we don't generate it again
            updateQuestion({ ...q, answer: fullAnswer });
        } catch (e) {
            fullAnswer = "We are currently seeking the Spirit's guidance for a full answer to this question. In the meantime, please refer to the short answer on the main blog page.";
        }
    }

    return (
        <div className="min-h-screen bg-white dark:bg-navy selection:bg-gold/30">
            {/* Header / Nav */}
            <nav className="sticky top-0 bg-white/80 dark:bg-navy/80 backdrop-blur-md border-b border-slate-100 dark:border-white/5 z-50 px-6 py-4">
                <div className="max-w-4xl mx-auto flex items-center justify-between">
                    <Link href="/blog" className="group flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-400 hover:text-gold transition-colors">
                        <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
                        Back to Library
                    </Link>
                    <Link href="/" className="font-black text-sm tracking-tighter text-navy dark:text-white">
                        DAILY<span className="text-gold">MANNA</span>AI
                    </Link>
                </div>
            </nav>

            <article className="max-w-4xl mx-auto px-6 py-16 md:py-24 space-y-12">
                {/* Hero / Question Intro */}
                <header className="space-y-6 text-center">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gold/10 border border-gold/20 text-gold text-[10px] font-black uppercase tracking-[0.2em]">
                        <span className="opacity-70">{meta.emoji}</span> {meta.label}
                    </div>
                    <h1 className="text-4xl md:text-6xl font-black text-navy dark:text-white tracking-tight leading-[1.1]">
                        {q.question}
                    </h1>
                    <div className="flex items-center justify-center gap-4 text-[10px] text-slate-400 dark:text-white/30 font-bold uppercase tracking-widest">
                        <span>{new Date(q.createdAt).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}</span>
                        <div className="w-1 h-1 rounded-full bg-gold" />
                        <span>Biblical Research</span>
                    </div>
                </header>

                {/* Quick Summary / Short Answer Box */}
                <div className="rounded-[2.5rem] bg-slate-50 dark:bg-navy-2 border border-slate-100 dark:border-white/5 p-8 md:p-12 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
                        <Sparkles size={100} className="text-gold" />
                    </div>
                    <div className="relative space-y-6">
                        <div className="flex items-center gap-2 text-gold font-black uppercase tracking-[0.3em] text-[10px]">
                            <Sparkles size={12} />
                            Spirit-Led Summary
                        </div>
                        <p className="text-xl md:text-2xl font-serif italic text-navy dark:text-white leading-relaxed">
                            {q.shortAnswer}
                        </p>
                        {q.keyVerse && (
                            <div className="pt-4 flex items-start gap-3 border-t border-gold/10">
                                <BookOpen size={18} className="text-gold mt-1 flex-shrink-0" />
                                <cite className="text-slate-500 dark:text-white/50 text-sm not-italic font-medium leading-relaxed">
                                    {q.keyVerse}
                                </cite>
                            </div>
                        )}
                    </div>
                </div>

                {/* Main Content Area */}
                <div className="prose prose-slate dark:prose-invert prose-lg max-w-none pt-8
                    prose-headings:font-black prose-headings:text-navy dark:prose-headings:text-white prose-headings:tracking-tight
                    prose-p:text-slate-600 dark:prose-p:text-white/70 prose-p:leading-[1.8]
                    prose-strong:text-navy dark:prose-strong:text-white prose-strong:font-black
                    prose-blockquote:border-gold prose-blockquote:bg-gold/5 prose-blockquote:py-2 prose-blockquote:px-8 prose-blockquote:rounded-r-2xl prose-blockquote:italic
                    prose-a:text-gold prose-a:no-underline hover:prose-a:underline
                ">
                    <div dangerouslySetInnerHTML={{ __html: formatMarkdown(fullAnswer || "") }} />
                </div>

                {/* Share / Footer CTA */}
                <footer className="pt-16 border-t border-slate-100 dark:border-white/5 space-y-12">
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
                        <div className="space-y-1">
                            <h4 className="text-navy dark:text-white font-black text-lg">Share this revelation</h4>
                            <p className="text-slate-500 dark:text-white/40 text-xs">Help others find the truth in Christ.</p>
                        </div>
                        <div className="flex items-center gap-3">
                            <button className="p-4 rounded-2xl bg-[#25D366]/10 text-[#25D366] hover:bg-[#25D366]/20 transition-all">
                                <MessageCircle size={20} />
                            </button>
                            <button className="flex items-center gap-3 px-6 py-4 rounded-2xl bg-navy dark:bg-gold text-white dark:text-navy font-black text-[10px] uppercase tracking-widest hover:opacity-90 transition-all">
                                <Share2 size={16} />
                                Share Word
                            </button>
                        </div>
                    </div>

                    <div className="rounded-[2rem] bg-navy p-10 text-center space-y-6 relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-br from-gold/10 to-transparent opacity-50" />
                        <div className="relative space-y-4">
                            <h3 className="text-white font-black text-2xl tracking-tighter">Still seeking answers?</h3>
                            <p className="text-white/60 text-sm max-w-md mx-auto">
                                Our AI is available 24/7 to help you explore the depths of Scripture and find peace in His word.
                            </p>
                            <Link href="/?q=?&filter=ai" className="inline-flex items-center gap-2 px-8 py-3 rounded-xl bg-gold text-navy font-black text-[10px] uppercase tracking-[0.2em] hover:scale-105 transition-all">
                                Start AI Revelation Studio
                            </Link>
                        </div>
                    </div>
                </footer>
            </article>
        </div>
    );
}

// Simple markdown formatter helper
function formatMarkdown(text: string): string {
    return text
        .replace(/^### (.*$)/gim, '<h3 class="text-xl font-black mt-10 mb-4 text-gold/80">$1</h3>')
        .replace(/^## (.*$)/gim, '<h2 class="text-3xl font-black mt-12 mb-6 text-navy dark:text-white">$1</h2>')
        .replace(/\*\*(.*)\*\*/gim, '<strong class="font-black text-navy dark:text-white">$1</strong>')
        .replace(/\*(.*)\*/gim, '<em>$1</em>')
        .replace(/\n\n/g, '</p><p>')
        .replace(/\n/g, '<br />')
        .replace(/^> (.*$)/gim, '<blockquote class="border-l-4 border-gold bg-gold/5 p-4 rounded-r-xl italic">$1</blockquote>')
        .trim();
}
