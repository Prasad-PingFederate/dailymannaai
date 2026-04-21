"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, Loader2, Check } from "lucide-react";

export default function GenerateAnswerButton({
    slug,
    question,
}: {
    slug: string;
    question: string;
}) {
    const [loading, setLoading] = useState(false);
    const [done, setDone] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();

    async function handleGenerate() {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch("/api/generate-questions/answer", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ slug }),
            });
            const data = await res.json();
            if (!data.success) throw new Error(data.error || "Failed to generate answer");
            setDone(true);
            // Refresh the page to show the new answer
            setTimeout(() => router.refresh(), 800);
        } catch (e: any) {
            setError(e.message);
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="space-y-3">
            <button
                onClick={handleGenerate}
                disabled={loading || done}
                className="inline-flex items-center gap-3 px-8 py-4 rounded-2xl bg-gradient-to-r from-gold to-gold-2 hover:from-gold-2 hover:to-gold text-navy font-black text-sm uppercase tracking-widest transition-all active:scale-95 shadow-xl shadow-gold/30 disabled:opacity-60 disabled:cursor-not-allowed disabled:active:scale-100"
            >
                {done ? (
                    <>
                        <Check size={16} />
                        Generated! Refreshing...
                    </>
                ) : loading ? (
                    <>
                        <Loader2 size={16} className="animate-spin" />
                        Generating Scripture-Based Answer...
                    </>
                ) : (
                    <>
                        <Sparkles size={16} />
                        Generate Full Blog Answer with AI
                    </>
                )}
            </button>
            {error && (
                <p className="text-red-500 dark:text-red-400 text-xs font-medium">{error}</p>
            )}
            {loading && (
                <p className="text-slate-500 dark:text-white/40 text-xs italic">
                    Consulting Holy Scripture and theological archives... this may take 15-30 seconds.
                </p>
            )}
        </div>
    );
}
