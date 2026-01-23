"use client";

import React, { useState, useRef } from "react";
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
    Paperclip,
    Upload,
    X,
    Globe,
    Link as LinkIcon,
    ShieldCheck,
    Pin,
    Copy,
    ExternalLink,
    Mic2,
    ArrowRight
} from "lucide-react";

export default function NotebookWorkspace() {
    const [isSidebarOpen, setSidebarOpen] = useState(true);
    const [activeTab, setActiveTab] = useState("sources"); // sources, chat
    const [isUploadModalOpen, setUploadModalOpen] = useState(false);
    const [messages, setMessages] = useState([
        { role: "assistant", content: "How can I assist your research today?" }
    ]);
    const [input, setInput] = useState("");
    const [noteContent, setNoteContent] = useState("");
    const [sources, setSources] = useState([
        { id: "Intro-Source", name: "Project Introduction", type: "text", selected: true },
        { id: "Strategy-Source", name: "Q1 Strategy", type: "text", selected: true }
    ]);
    const [audioOverview, setAudioOverview] = useState<null | { title: string; script: string }>(null);
    const [isGeneratingAudio, setGeneratingAudio] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const toggleSource = (id: string) => {
        setSources(prev => prev.map(s =>
            s.id === id ? { ...s, selected: !s.selected } : s
        ));
    };

    const handleFileUpload = async (fileName: string) => {
        const id = `Source-${Date.now()}`;
        const newSource = { id, name: fileName, type: "pdf", selected: true };

        // Simulation: If it's the user's flowchart, provide mock analysis text
        let mockContent = `This source "${fileName}" contains a test execution flowchart. It detail steps like B4iGo Production End-to-End testing, flowchart branch logic, and test pass/fail criteria.`;
        if (fileName.toLowerCase().includes("flowchart")) {
            mockContent = `The document "${fileName}" is a detailed technical flowchart for B4iGo Production Testing. It includes modules for:
            1. Initiation of End-to-End Test Suite.
            2. Logic gates for environment readiness.
            3. Automated test execution branches.
            4. Error handling and retry mechanisms.
            The flowchart provides a visual roadmap for ensuring production stability.`;
        }

        try {
            await fetch("/api/ingest", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name: fileName, content: mockContent }),
            });

            setSources(prev => [...prev, newSource]);
            setUploadModalOpen(false);
            setMessages(prev => [...prev, {
                role: "assistant",
                content: `I've finished reading "${fileName}" and analyzed the flowchart logic. I can now answer questions about its test cases!`
            }]);
        } catch (error) {
            console.error("Ingestion Error:", error);
        }
    };

    const addNoteAtCursor = (text: string) => {
        setNoteContent(prev => prev + (prev ? "\n\n" : "") + text);
    };

    const handleSendMessage = async () => {
        if (!input.trim()) return;

        const userMessage = { role: "user", content: input };
        setMessages(prev => [...prev, userMessage]);
        setInput("");

        try {
            const res = await fetch("/api/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ query: input }),
            });

            const data = await res.json();

            if (data.role === "assistant") {
                setMessages(prev => [...prev, {
                    role: "assistant",
                    content: data.content
                }]);
            }
        } catch (error) {
            console.error("Chat Error:", error);
            setMessages(prev => [...prev, {
                role: "assistant",
                content: "I'm having trouble connecting to my brain. Please try again later."
            }]);
        }
    };

    const generateAudioOverview = () => {
        setGeneratingAudio(true);
        // Simulate podcast script generation based on sources
        setTimeout(() => {
            setAudioOverview({
                title: "Research Deep Dive: NotebookLLM Strategy",
                script: "Host 1: Today we're looking at a new project called NotebookLLM.ai. Host 2: Right, and it's interesting how they're focusing on 'grounded' AI for researchers..."
            });
            setGeneratingAudio(false);
        }, 3000);
    };

    return (
        <div className="flex h-screen w-full bg-background text-foreground overflow-hidden relative">
            {/* Upload Modal Overlay */}
            {isUploadModalOpen && (
                <div className="absolute inset-0 z-[100] flex items-center justify-center p-6 bg-background/80 backdrop-blur-sm transition-all animate-in fade-in">
                    <div className="relative w-full max-w-2xl bg-card-bg border border-border rounded-3xl shadow-2xl overflow-hidden glass-morphism animate-in zoom-in-95 duration-200">
                        <header className="p-6 border-b border-border flex items-center justify-between">
                            <div>
                                <h3 className="text-xl font-bold">Add Sources</h3>
                                <p className="text-sm text-muted">Sources help NotebookLLM answer your questions.</p>
                            </div>
                            <button
                                onClick={() => setUploadModalOpen(false)}
                                className="p-2 hover:bg-border/50 rounded-full transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </header>

                        <div className="p-8">
                            <div className="grid grid-cols-3 gap-4 mb-8">
                                {[
                                    { icon: <Upload size={20} />, label: "Upload Files", sub: "PDF, TXT, MD" },
                                    { icon: <Globe size={20} />, label: "Website", sub: "Enter URL" },
                                    { icon: <LinkIcon size={20} />, label: "Copy-Paste", sub: "Direct text" }
                                ].map((option, i) => (
                                    <button
                                        key={i}
                                        className="flex flex-col items-center justify-center gap-3 p-6 rounded-2xl border border-border bg-background hover:border-accent hover:bg-accent/5 transition-all group"
                                    >
                                        <div className="p-3 bg-muted/10 rounded-xl text-muted group-hover:text-accent group-hover:bg-accent/10 transition-colors">
                                            {option.icon}
                                        </div>
                                        <div className="text-center">
                                            <div className="text-sm font-bold">{option.label}</div>
                                            <div className="text-[10px] text-muted uppercase tracking-tight">{option.sub}</div>
                                        </div>
                                    </button>
                                ))}
                            </div>

                            <div
                                onClick={() => fileInputRef.current?.click()}
                                className="border-2 border-dashed border-border rounded-2xl p-12 text-center hover:border-accent/50 transition-colors cursor-pointer bg-muted/5 group"
                            >
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    className="hidden"
                                    onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        if (file) handleFileUpload(file.name);
                                    }}
                                />
                                <div className="mx-auto w-16 h-16 bg-accent/10 text-accent rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                    <Upload size={32} />
                                </div>
                                <p className="text-lg font-bold mb-1">Drag and drop files here</p>
                                <p className="text-sm text-muted">or <span className="text-accent underline">browse files</span> from your computer</p>
                                <p className="mt-6 text-[11px] text-muted max-w-xs mx-auto">
                                    By uploading, you agree to our Terms. Max 50MB per file.
                                    Grounded AI works best with structured text.
                                </p>
                            </div>
                        </div>

                        <footer className="p-6 bg-muted/5 border-t border-border flex items-center justify-between">
                            <div className="flex items-center gap-2 text-xs font-medium text-muted">
                                <ShieldCheck size={14} className="text-green-500" />
                                Your data is encrypted and private.
                            </div>
                            <button
                                onClick={() => setUploadModalOpen(false)}
                                className="px-6 py-2 bg-foreground text-background rounded-full font-bold hover:bg-foreground/90 transition-all active:scale-95"
                            >
                                Done
                            </button>
                        </footer>
                    </div>
                </div>
            )}
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
                    <button
                        onClick={() => setUploadModalOpen(true)}
                        className="p-1 hover:bg-border/50 rounded-md transition-colors text-accent"
                    >
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
                        {sources.map((source) => (
                            <div
                                key={source.id}
                                onClick={() => toggleSource(source.id)}
                                className={`group flex items-center gap-3 p-2 rounded-lg border transition-all cursor-pointer ${source.selected
                                    ? "bg-accent/10 border-accent/20 ring-1 ring-accent/10"
                                    : "hover:bg-muted/10 border-transparent opacity-60"
                                    }`}
                            >
                                <div className={source.selected ? "text-accent" : "text-muted"}>
                                    <FileText size={16} />
                                </div>
                                <span className={`text-sm font-medium truncate flex-1 ${source.selected ? "text-foreground" : "text-muted"}`}>
                                    {source.name}
                                </span>
                                <div className={`h-2 w-2 rounded-full ${source.selected ? "bg-accent" : "bg-transparent border border-muted"}`} />
                            </div>
                        ))}
                    </div>
                </div>

                <div className="p-4 border-t border-border mt-auto">
                    <button
                        onClick={() => setUploadModalOpen(true)}
                        className="flex items-center gap-2 w-full p-2 bg-accent/10 text-accent rounded-lg text-sm font-bold hover:bg-accent/20 transition-colors"
                    >
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

                {/* Audio Overview Player (Appears when generated) */}
                {audioOverview && (
                    <div className="absolute top-20 right-6 w-80 glass-morphism rounded-2xl p-4 shadow-2xl border border-accent/20 animate-in slide-in-from-top-4 duration-500 z-40">
                        <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2 text-accent">
                                <Mic2 size={16} />
                                <span className="text-xs font-bold uppercase tracking-wider">Audio Overview</span>
                            </div>
                            <button onClick={() => setAudioOverview(null)} className="text-muted hover:text-foreground">
                                <X size={14} />
                            </button>
                        </div>
                        <h4 className="font-bold text-sm mb-2">{audioOverview.title}</h4>
                        <div className="h-1 bg-muted/20 rounded-full overflow-hidden mb-4">
                            <div className="h-full bg-accent w-1/3 animate-pulse" />
                        </div>
                        <div className="flex items-center justify-center gap-6">
                            <button className="text-muted"><ChevronLeft size={20} /></button>
                            <button className="h-10 w-10 bg-accent text-white rounded-full flex items-center justify-center shadow-lg shadow-accent/20">
                                <ArrowRight size={20} className="rotate-90 ml-0.5" />
                            </button>
                            <button className="text-muted"><ChevronRight size={20} /></button>
                        </div>
                    </div>
                )}

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
                                value={noteContent}
                                onChange={(e) => setNoteContent(e.target.value)}
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
                    <button
                        onClick={generateAudioOverview}
                        disabled={isGeneratingAudio}
                        className={`text-xs font-bold flex items-center gap-2 transition-colors ${isGeneratingAudio ? 'text-accent animate-pulse' : 'hover:text-accent'}`}
                    >
                        {isGeneratingAudio ? 'Generating...' : 'Audio Overview'}
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
                        {messages.map((msg, i) => (
                            <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''} animate-in slide-in-from-bottom-2 duration-300`}>
                                <div className={`h-8 w-8 rounded-full flex-shrink-0 flex items-center justify-center text-white ${msg.role === 'user' ? 'bg-accent' : 'bg-accent-secondary'}`}>
                                    {msg.role === 'user' ? 'U' : <Sparkles size={16} />}
                                </div>
                                <div className={`${msg.role === 'user' ? 'bg-accent/10' : 'bg-muted/10'} rounded-2xl p-3 text-sm max-w-[80%] group relative`}>
                                    {msg.content}

                                    {msg.role === 'assistant' && (
                                        <div className="absolute -right-12 top-0 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button
                                                onClick={() => addNoteAtCursor(msg.content)}
                                                className="p-1.5 bg-card-bg border border-border rounded-lg hover:text-accent shadow-sm"
                                                title="Pin to Note"
                                            >
                                                <Pin size={14} />
                                            </button>
                                            <button
                                                className="p-1.5 bg-card-bg border border-border rounded-lg hover:text-accent shadow-sm"
                                                title="Copy"
                                                onClick={() => navigator.clipboard.writeText(msg.content)}
                                            >
                                                <Copy size={14} />
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Chat Input */}
                <div className="p-4 border-t border-border">
                    <div className="relative group">
                        <textarea
                            placeholder="Ask anything about your sources..."
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    handleSendMessage();
                                }
                            }}
                            className="w-full bg-background border border-border rounded-2xl py-3 pl-4 pr-12 text-sm focus:outline-none focus:ring-1 focus:ring-accent resize-none min-h-[44px] max-h-32"
                            rows={1}
                        />
                        <button
                            onClick={handleSendMessage}
                            className={`absolute right-2 top-2 p-1.5 bg-accent text-white rounded-xl hover:bg-accent/90 transition-all shadow-lg shadow-accent/20 ${input.trim() ? 'opacity-100 scale-100' : 'opacity-40 scale-95 cursor-not-allowed'}`}
                        >
                            <Send size={16} />
                        </button>
                        <div className="absolute left-4 -top-3 px-2 py-0.5 bg-background border border-border rounded text-[9px] font-bold text-muted uppercase tracking-tighter">
                            Grounded in {sources.filter(s => s.selected).length} sources
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
