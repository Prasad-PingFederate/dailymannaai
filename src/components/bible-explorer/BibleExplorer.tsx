// src/components/bible-explorer/BibleExplorer.tsx
"use client";

import React, { useState } from 'react';
import { parseVerseReferences } from '@/lib/utils/bible-explorer-utils';
import { Book, Search, MessageSquare, History } from 'lucide-react';

export default function BibleExplorer() {
    const [query, setQuery] = useState('');
    const [messages, setMessages] = useState<{ role: 'user' | 'assistant', content: string }[]>([]);
    const [loading, setLoading] = useState(false);

    const handleAsk = async () => {
        if (!query.trim()) return;

        const userMsg = { role: 'user' as const, content: query };
        setMessages(prev => [...prev, userMsg]);
        setQuery('');
        setLoading(true);

        try {
            const response = await fetch('/api/bible-explorer', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ question: query, history: messages }),
            });

            if (!response.ok) throw new Error('Failed to fetch');

            const reader = response.body?.getReader();
            const decoder = new TextDecoder();
            let assistantMsg = { role: 'assistant' as const, content: '' };
            setMessages(prev => [...prev, assistantMsg]);

            while (true) {
                const { done, value } = await reader!.read();
                if (done) break;
                const chunk = decoder.decode(value);
                assistantMsg.content += chunk;
                setMessages(prev => {
                    const newMessages = [...prev];
                    newMessages[newMessages.length - 1] = { ...assistantMsg };
                    return newMessages;
                });
            }
        } catch (error) {
            console.error("Bible Explorer Error:", error);
            setMessages(prev => [...prev, { role: 'assistant', content: "Sorry, I encountered an error searching the scriptures." }]);
        } finally {
            setLoading(false);
        }
    };

    const renderContent = (content: string) => {
        const segments = parseVerseReferences(content);
        return segments.map((seg, i) => (
            seg.type === 'verse-ref' ? (
                <span key={i} className="text-blue-600 font-bold cursor-pointer hover:underline" title="Click to view verse">
                    {seg.value}
                </span>
            ) : (
                <span key={i}>{seg.value}</span>
            )
        ));
    };

    return (
        <div className="flex flex-col h-full bg-slate-50 rounded-xl overflow-hidden shadow-lg border border-slate-200">
            <div className="bg-slate-900 p-4 flex items-center justify-between text-white">
                <div className="flex items-center gap-2">
                    <Book className="w-6 h-6 text-amber-400" />
                    <h2 className="text-xl font-bold font-serif">Bible AI Explorer</h2>
                </div>
                <div className="flex gap-4">
                    <History className="w-5 h-5 cursor-pointer opacity-80 hover:opacity-100" />
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-white/50">
                {messages.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-full text-slate-400 space-y-4">
                        <Search className="w-16 h-16 opacity-20" />
                        <p className="text-lg italic font-serif">"Search the scriptures; for in them ye think ye have eternal life..."</p>
                    </div>
                )}

                {messages.map((msg, i) => (
                    <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[85%] rounded-2xl p-4 shadow-sm ${msg.role === 'user'
                            ? 'bg-indigo-600 text-white'
                            : 'bg-white border border-slate-100 text-slate-800'
                            }`}>
                            {msg.role === 'assistant' ? (
                                <div className="prose prose-slate max-w-none">
                                    {renderContent(msg.content)}
                                </div>
                            ) : (
                                msg.content
                            )}
                        </div>
                    </div>
                ))}
                {loading && <div className="text-slate-400 animate-pulse flex items-center gap-2 px-4"><MessageSquare className="w-4 h-4" /> VerseMind is searching...</div>}
            </div>

            <div className="p-4 bg-white border-t border-slate-200">
                <div className="relative flex items-center">
                    <input
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleAsk()}
                        placeholder="Ask a question about Scripture..."
                        className="w-full pl-4 pr-12 py-3 bg-slate-100 border-none rounded-full focus:ring-2 focus:ring-indigo-500 outline-none text-slate-700"
                    />
                    <button
                        onClick={handleAsk}
                        className="absolute right-2 p-2 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 transition shadow-md"
                    >
                        <Search className="w-5 h-5" />
                    </button>
                </div>
            </div>
        </div>
    );
}
