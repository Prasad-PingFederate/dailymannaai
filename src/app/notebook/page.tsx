"use client";

import React, { useState } from "react";
import {
    Plus,
    FileText,
    MessageSquare,
    History,
    Settings,
    Search,
    Trash2,
    Edit3,
    Share2,
    MoreVertical,
    ChevronLeft,
    ChevronRight,
    BookOpen,
    Send,
    Sparkles,
    Paperclip
} from "lucide-react";

export default function NotebookWorkspace() {
    const [isSidebarOpen, setSidebarOpen] = useState(true);
    const [activeTab, setActiveTab] = useState("sources"); // sources, chat

    return (
        <div className="flex h-screen w-full bg-background text-foreground overflow-hidden">
            {/* 1. Sources Sidebar (Left) */}
            <aside
                className={`${isSidebarOpen ? "w-[300px]" : "w-0"
                    } transition-all duration-300 border-r border-border flex flex-col glass-morphism relative overflow-hidden`}
            >
                <div className="p-4 border-b border-border flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="bg-accent h-7 w-7 rounded flex items-center justify-center text-white">
                            <BookOpen size={16} />
                        </div>
                        <span className="font-bold tracking-tight">Sources</span>
                    </div>
                    <button className="p-1 hover:bg-border/50 rounded-md transition-colors">
                        <Plus size={18} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" size={14} />
                        <input
                            type="text"
                            placeholder="Search sources..."
                            className="w-full bg-card-bg border border-border rounded-lg py-2 pl-9 pr-4 text-sm focus:outline-none focus:ring-1 focus:ring-accent"
                        />
                    </div>

                    <div className="space-y-2">
                        {[
                            { name: "Project Requirements.pdf", type: "pdf" },
                            { name: "Market Research Notes", type: "text" },
                            { name: "User Interviews - 2024", type: "text" }
                        ].map((source, i) => (
                            <div
                                key={i}
                                className="group flex items-center gap-3 p-2 rounded-lg hover:bg-accent/10 border border-transparent hover:border-accent/20 cursor-pointer transition-all"
                            >
                                <div className="text-accent">
                                    <FileText size={16} />
                                </div>
                                <span className="text-sm font-medium truncate flex-1">{source.name}</span>
                                <button className="opacity-0 group-hover:opacity-100 p-1 hover:text-red-500 transition-opacity">
                                    <Trash2 size={14} />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="p-4 border-t border-border mt-auto">
                    <button className="flex items-center gap-2 w-full p-2 bg-accent/10 text-accent rounded-lg text-sm font-bold hover:bg-accent/20 transition-colors">
                        <Plus size={16} /> Add Source
                    </button>
                </div>
            </aside>

            {/* Collapse/Expand Toggle */}
            <button
                onClick={() => setSidebarOpen(!isSidebarOpen)}
                className="absolute left-[288px] top-4 z-50 bg-card-bg border border-border rounded-full p-1 shadow-md hover:bg-accent hover:text-white transition-all transform"
                style={{ left: isSidebarOpen ? '288px' : '12px' }}
            >
                {isSidebarOpen ? <ChevronLeft size={14} /> : <ChevronRight size={14} />}
            </button>

            {/* 2. Main Editor/Viewer (Middle) */}
            <main className="flex-1 flex flex-col bg-background relative">
                <header className="h-16 border-b border-border flex items-center justify-between px-6 bg-card-bg/50 backdrop-blur-sm">
                    <div className="flex items-center gap-4">
                        <h2 className="font-bold text-lg">My Research Workspace</h2>
                        <div className="px-2 py-0.5 bg-green-500/10 text-green-500 text-[10px] font-bold rounded uppercase tracking-wider">Saved</div>
                    </div>
                    <div className="flex items-center gap-3">
                        <button className="p-2 hover:bg-border/50 rounded-full transition-colors"><Edit3 size={18} /></button>
                        <button className="p-2 hover:bg-border/50 rounded-full transition-colors"><Share2 size={18} /></button>
                        <button className="p-2 hover:bg-border/50 rounded-full transition-colors"><Settings size={18} /></button>
                    </div>
                </header>

                <div className="flex-1 p-10 overflow-y-auto bg-card-bg/10">
                    <div className="max-w-3xl mx-auto space-y-6">
                        <div className="space-y-2">
                            <input
                                type="text"
                                defaultValue="Research Strategy - Q1 2026"
                                className="text-4xl font-extrabold bg-transparent border-none focus:outline-none w-full"
                            />
                            <p className="text-muted text-sm italic">Last updated 2 hours ago</p>
                        </div>

                        <div className="prose prose-zinc dark:prose-invert max-w-none">
                            <textarea
                                placeholder="Start typing your research notes here..."
                                className="w-full min-h-[500px] bg-transparent border-none focus:outline-none text-lg resize-none leading-relaxed"
                                rows={20}
                            />
                        </div>
                    </div>
                </div>

                {/* Dynamic Action Bar (Bottom Middle) */}
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 glass-morphism rounded-full px-6 py-3 flex items-center gap-4 shadow-2xl border border-border/50">
                    <button className="text-xs font-bold flex items-center gap-2 hover:text-accent transition-colors">
                        <Sparkles size={14} className="text-accent-secondary" /> Summarize
                    </button>
                    <div className="w-px h-4 bg-border" />
                    <button className="text-xs font-bold flex items-center gap-2 hover:text-accent transition-colors">
                        <Edit3 size={14} /> Refine
                    </button>
                    <div className="w-px h-4 bg-border" />
                    <button className="text-xs font-bold flex items-center gap-2 hover:text-accent transition-colors">
                        Audio Overview
                    </button>
                </div>
            </main>

            {/* 3. AI Assistant (Right) */}
            <section className="w-[380px] border-l border-border flex flex-col bg-card-bg/20 glass-morphism">
                <header className="h-16 border-b border-border flex items-center px-4 gap-3">
                    <div className="text-accent-secondary">
                        <MessageSquare size={20} />
                    </div>
                    <h3 className="font-bold">Notebook Assistant</h3>
                </header>

                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    <div className="bg-accent/5 border border-accent/10 rounded-2xl p-4 text-sm leading-relaxed">
                        <p className="font-bold text-accent mb-2 flex items-center gap-2">
                            <Sparkles size={14} /> AI Insights
                        </p>
                        Hello! I've analyzed your 3 sources. Based on your notes, I can help you:
                        <ul className="list-disc ml-4 mt-2 space-y-1">
                            <li className="hover:text-accent cursor-pointer underline decoration-accent/30 tracking-tight">Synthesize user interview trends</li>
                            <li className="hover:text-accent cursor-pointer underline decoration-accent/30 tracking-tight">Draft a market entry plan</li>
                        </ul>
                    </div>

                    <div className="space-y-4">
                        {/* AI Message */}
                        <div className="flex gap-3 max-w-[90%]">
                            <div className="h-8 w-8 rounded-full bg-accent-secondary flex-shrink-0 flex items-center justify-center text-white">
                                <Sparkles size={16} />
                            </div>
                            <div className="bg-muted/10 rounded-2xl p-3 text-sm">
                                How can I assist your research today?
                            </div>
                        </div>
                    </div>
                </div>

                {/* Chat Input */}
                <div className="p-4 border-t border-border">
                    <div className="relative group">
                        <textarea
                            placeholder="Ask anything about your sources..."
                            className="w-full bg-background border border-border rounded-2xl py-3 pl-4 pr-12 text-sm focus:outline-none focus:ring-1 focus:ring-accent resize-none min-h-[44px] max-h-32"
                            rows={1}
                        />
                        <button className="absolute right-2 top-2 p-1.5 bg-accent text-white rounded-xl hover:bg-accent/90 transition-all opacity-40 group-focus-within:opacity-100 shadow-lg shadow-accent/20">
                            <Send size={16} />
                        </button>
                        <div className="absolute left-4 -top-3 px-2 py-0.5 bg-background border border-border rounded text-[9px] font-bold text-muted uppercase tracking-tighter">
                            Grounded in 3 sources
                        </div>
                    </div>
                    <div className="mt-2 flex items-center justify-between text-[10px] text-muted font-medium px-1">
                        <div className="flex items-center gap-2">
                            <History size={10} /> View History
                        </div>
                        <div className="flex items-center gap-1 text-accent">
                            <Paperclip size={10} /> Link to Note
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}
