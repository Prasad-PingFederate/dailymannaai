"use client";

import React, { useState, useRef, useEffect } from "react";
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
    Eye,
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
    ArrowRight,
    FileStack,
    Wand2,
    FileAudio,
    CheckCircle2,
    Volume2,
    Menu,
    Lightbulb,
    MessageCircle,
    Square
} from "lucide-react";
import { resolvePortrait, resolveSituationalImage, FALLBACK_IMAGE } from "@/lib/ai/image-resolver";
import { GODS_LOVE_VERSES } from "@/lib/data/gods_love";
import { DEITY_OF_CHRIST_DOCTRINE } from "@/lib/data/deity_of_christ";
import { BILLY_GRAHAM_SERMONS } from "@/lib/data/billy_graham_sermons";
import { JOHN_WESLEY_SERMONS } from "@/lib/data/john_wesley_sermons";
import { APOSTOLIC_TEACHINGS } from "@/lib/data/apostolic_teachings";
import VoiceInput from "@/components/notebook/VoiceInput";
import BibleQuoteGenerator from "@/components/notebook/BibleQuoteGenerator";
import { Image as ImageIcon } from "lucide-react";


interface Source {
    id: string;
    name: string;
    type: string;
    selected: boolean;
    fullContent?: string;
}

export default function NotebookWorkspace() {
    const [isSidebarOpen, setSidebarOpen] = useState(true);
    const [isMobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [activeTab, setActiveTab] = useState("sources"); // sources, chat
    const [isUploadModalOpen, setUploadModalOpen] = useState(false);
    const [messages, setMessages] = useState<any[]>([
        { role: "assistant", content: "How can I assist your research today?" }
    ]);
    const [input, setInput] = useState("");
    const [noteContent, setNoteContent] = useState("");
    const [sources, setSources] = useState<Source[]>([
        { id: "Intro-Source", name: "Project Introduction", type: "text", selected: true, fullContent: "DailyMannaAI is a spiritual growth platform..." },
        { id: "Historical-Missionaries-Pioneers", name: "Historical Missionaries", type: "text", selected: true, fullContent: "The history of missions is filled with pioneers like William Carey..." },
        { id: "Modern-Evangelists-Missionaries", name: "Modern Evangelists", type: "text", selected: true, fullContent: "Modern evangelism leverages technology to reach the unreached..." },
        { id: "Joshua-Daniel-Doing-Gods-Will", name: "Joshua Daniel - Doing God's Will", type: "text", selected: true, fullContent: "Joshua Daniel's life was a testament to following God's calling..." },
        { id: "Gods-Love-Verses", name: "Scriptures on God's Love", type: "text", selected: true, fullContent: GODS_LOVE_VERSES },
        { id: "Deity-Of-Christ", name: "Doctrine: Deity of Christ", type: "text", selected: true, fullContent: DEITY_OF_CHRIST_DOCTRINE },
        { id: "Billy-Graham-Sermons", name: "Billy Graham: Key Sermons", type: "text", selected: true, fullContent: BILLY_GRAHAM_SERMONS },
        { id: "John-Wesley-Sermons", name: "John Wesley: Key Sermons", type: "text", selected: true, fullContent: JOHN_WESLEY_SERMONS },
        { id: "Apostolic-Teachings", name: "Apostolic Teachings (Acts/Paul)", type: "text", selected: true, fullContent: APOSTOLIC_TEACHINGS }
    ]);
    const [audioOverview, setAudioOverview] = useState<null | { title: string; script: string }>(null);
    const [isGeneratingAudio, setGeneratingAudio] = useState(false);

    const [isPlaying, setIsPlaying] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const [selectedVoice, setSelectedVoice] = useState<'male' | 'female'>('male');
    const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
    const [uploadMode, setUploadMode] = useState<'file' | 'website' | 'text' | 'youtube'>('file');
    const [websiteUrl, setWebsiteUrl] = useState("");
    const [websiteTitle, setWebsiteTitle] = useState("");
    const [pastedText, setPastedText] = useState("");
    const [pastedTitle, setPastedTitle] = useState("");
    const [isIngesting, setIsIngesting] = useState(false);
    const [ingestStatus, setIngestStatus] = useState<string>("");
    const [isGrammarChecking, setIsGrammarChecking] = useState(false);
    const [isChatting, setIsChatting] = useState(false);
    const [viewingSource, setViewingSource] = useState<any>(null);
    const [isGeneratingGuide, setIsGeneratingGuide] = useState(false);
    const [suggestions, setSuggestions] = useState<string[]>([]);
    const [isMeditating, setIsMeditating] = useState(false);
    const [isBarHovered, setIsBarHovered] = useState(false);
    const [isDraggingToSidebar, setIsDraggingToSidebar] = useState(false);
    const [isMobile, setIsMobile] = useState(false);
    const [isSpeakingMap, setIsSpeakingMap] = useState<Record<number, boolean>>({});
    const [isVoiceActive, setIsVoiceActive] = useState(false);

    const [isAudioOverviewOpen, setIsAudioOverviewOpen] = useState(false);
    const [showScrollButton, setShowScrollButton] = useState(false);
    const [dailyManna, setDailyManna] = useState<{ date: string, message: string } | null>(null);
    const [isDailyMannaOpen, setIsDailyMannaOpen] = useState(false);
    const [localImagePath, setLocalImagePath] = useState("");
    const [isLocalImageModalOpen, setLocalImageModalOpen] = useState(false);
    const [isStudioOpen, setIsStudioOpen] = useState(false);
    const messageAudioRefs = useRef<Record<number, HTMLAudioElement>>({});

    const chatContainerRef = useRef<HTMLDivElement>(null);
    const actionBarRef = useRef<HTMLDivElement>(null);

    // --- PERSISTENCE: Load data on mount ---
    useEffect(() => {
        const savedSources = localStorage.getItem("notebook_sources");
        const savedMessages = localStorage.getItem("notebook_messages");
        const savedNote = localStorage.getItem("notebook_note");

        if (savedSources) setSources(JSON.parse(savedSources));
        if (savedMessages) setMessages(JSON.parse(savedMessages));
        if (savedNote) setNoteContent(savedNote);
    }, []);

    // --- PERSISTENCE: Save data on change ---
    useEffect(() => {
        if (sources.length > 0) localStorage.setItem("notebook_sources", JSON.stringify(sources));
    }, [sources]);

    useEffect(() => {
        if (messages.length > 0) localStorage.setItem("notebook_messages", JSON.stringify(messages));
    }, [messages]);

    useEffect(() => {
        localStorage.setItem("notebook_note", noteContent);
    }, [noteContent]);

    const fileInputRef = useRef<HTMLInputElement>(null);
    const speechSynthesisRef = useRef<SpeechSynthesisUtterance | null>(null);
    const isPlayingRef = useRef(false);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const abortControllerRef = useRef<AbortController | null>(null);


    useEffect(() => {
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
    }, [messages]);

    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
        }
    }, [input]);

    // Hydration-safe mobile detection
    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth < 768);
        };
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    // Handle scroll to show/hide scroll button
    const handleChatScroll = () => {
        if (chatContainerRef.current) {
            const { scrollTop, scrollHeight, clientHeight } = chatContainerRef.current;
            const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
            setShowScrollButton(!isNearBottom);
        }
    };

    // Scroll to bottom function
    const scrollToBottom = () => {
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTo({
                top: chatContainerRef.current.scrollHeight,
                behavior: 'smooth'
            });
        }
    };

    // Clear chat function
    const clearChat = () => {
        setMessages([{ role: "assistant", content: "How can I assist your research today?" }]);
        setSuggestions([]);
        localStorage.removeItem("notebook_messages");
        showToast("Chat history cleared", "success");
    };

    // Load available voices
    React.useEffect(() => {
        const loadVoices = () => {
            const voices = window.speechSynthesis.getVoices();
            setAvailableVoices(voices);
        };

        loadVoices();
        window.speechSynthesis.onvoiceschanged = loadVoices;
    }, []);

    // --- DAILY MANNA: Fetch message ---
    useEffect(() => {
        const fetchDailyManna = async () => {
            try {
                const res = await fetch("/api/daily-message");
                const data = await res.json();
                if (data.message) {
                    setDailyManna(data);
                }
            } catch (e) {
                console.error("Daily Manna Fetch Error:", e);
            }
        };
        fetchDailyManna();
    }, []);

    // --- Notification System ---
    const [notification, setNotification] = useState<{ message: string, type: 'success' | 'error' } | null>(null);

    const showToast = (message: string, type: 'success' | 'error') => {
        setNotification({ message, type });
        setTimeout(() => setNotification(null), 4000); // Auto hide after 4s
    };

    // --- Drag and Drop Logic --- (New Feature)
    const handleSourceDragStart = (e: React.DragEvent, source: any) => {
        e.dataTransfer.setData("sourceId", source.id);
        e.dataTransfer.effectAllowed = "copy";

        // Custom drag ghost image effect (Optional/Visual)
        const ghost = document.createElement("div");
        ghost.className = "bg-accent text-white px-3 py-1 rounded-full text-xs font-bold shadow-xl border border-white/20";
        ghost.textContent = `📑 ${source.name}`;
        ghost.style.position = "absolute";
        ghost.style.top = "-1000px";
        document.body.appendChild(ghost);
        setTimeout(() => document.body.removeChild(ghost), 0);
    };


    const toggleSource = (id: string) => {
        setSources(prev => prev.map(s =>
            s.id === id ? { ...s, selected: !s.selected } : s
        ));
    };

    const removeSource = (id: string, name: string) => {
        setSources(prev => prev.filter(s => s.id !== id));
        showToast(`Removed "${name}" from sources`, "success");
    };

    const handleSidebarDrop = async (e: React.DragEvent) => {
        e.preventDefault();
        setIsDraggingToSidebar(false);
        const files = e.dataTransfer.files;
        const droppedText = e.dataTransfer.getData("text/plain");
        const type = e.dataTransfer.getData("type");

        if (files && files.length > 0) {
            handleFileUpload(files[0]);
            showToast("Ingesting spiritual file...", "success");
        } else if (droppedText && type === "assistant_message") {
            const newSource: Source = {
                id: `dynamic-${Date.now()}`,
                name: `Divine Insight ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
                type: 'text',
                selected: true,
                fullContent: droppedText
            };
            setSources(prev => [newSource, ...prev]);
            showToast("Saved revelation to sources", "success");

            // Sync with backend
            try {
                await fetch("/api/ingest", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        text: droppedText,
                        name: newSource.name,
                        mode: "text"
                    }),
                });
            } catch (err) {
                console.error("Failed to sync dropped revelation", err);
            }
        }
    };

    const handleFileUpload = async (file: File) => {
        const id = `Source-${Date.now()}`;
        const fileName = file.name;
        const fileType = file.type;
        const isMP3 = fileType === "audio/mpeg" || fileName.toLowerCase().endsWith(".mp3");
        const isPDF = fileType === "application/pdf" || fileName.toLowerCase().endsWith(".pdf");
        const isWord = fileType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" || fileName.toLowerCase().endsWith(".docx");

        const newSource = {
            id,
            name: fileName,
            type: isMP3 ? "audio" : isWord ? "word" : "pdf",
            selected: true
        };

        setIsIngesting(true);
        setIngestStatus("Starting file upload...");
        showToast("Processing file...", "success");

        try {
            let payload: FormData | string;
            let headers = {};
            let body: any;

            // CLIENT-SIDE PDF PARSING (Bypass Vercel 4.5MB Limit)
            if (isPDF) {
                setIngestStatus("Extracting text from PDF (client-side)...");
                showToast("Extracting text from PDF...", "success");
                try {
                    // Dynamic import to avoid SSR issues
                    const pdfJS = await import('pdfjs-dist');

                    // Set worker (local file to fix Firefox CORS issues)
                    pdfJS.GlobalWorkerOptions.workerSrc = `/pdf.worker.min.js`;

                    const arrayBuffer = await file.arrayBuffer();
                    const pdf = await pdfJS.getDocument({ data: arrayBuffer }).promise;

                    let extractedText = "";
                    const maxPages = 50; // Limit pages to prevent browser freeze

                    for (let i = 1; i <= Math.min(pdf.numPages, maxPages); i++) {
                        const page = await pdf.getPage(i);
                        const textContent = await page.getTextContent();
                        const pageText = textContent.items.map((item: any) => item.str).join(" ");
                        extractedText += `\n--- Page ${i} ---\n${pageText}`;
                    }

                    if (pdf.numPages > maxPages) {
                        extractedText += `\n... (Truncated after ${maxPages} pages for performance) ...`;
                    }

                    if (extractedText.trim().length < 20) {
                        // Throw to trigger catch block -> Fallback to server upload -> Gemini OCR
                        throw new Error("Scanned PDF detected");
                    }

                    // Send as TEXT mode (JSON) instead of Blob (FormData)
                    // This bypasses 4.5MB limit because text is much smaller
                    body = JSON.stringify({
                        text: extractedText,
                        name: fileName,
                        mode: "text"
                    });
                    headers = { "Content-Type": "application/json" };
                    console.log("PDF parsed client-side. Size:", extractedText.length);
                    setIngestStatus("PDF text extracted. Sending to AI for indexing...");

                } catch (pdfErr: any) {
                    console.error("Client-side PDF parse failed / Scanned fallback:", pdfErr);

                    if (pdfErr.message.includes("Scanned")) {
                        showToast("Scanned PDF detected. Using Advanced AI Reading...", "success");
                        setIngestStatus("Scanned PDF detected. Using Advanced AI Reading...");
                    } else {
                        showToast(`Client parse failed (${pdfErr.message}), trying server...`, "error");
                        setIngestStatus(`Client parse failed (${pdfErr.message}), trying server...`);
                    }
                    // Fallback to standard upload
                    const formData = new FormData();
                    formData.append("file", file);
                    formData.append("name", fileName);
                    body = formData;
                }
            } else {
                // Standard upload for MP3 / Text files
                const formData = new FormData();
                formData.append("file", file);
                formData.append("name", fileName);
                body = formData;
                setIngestStatus("Uploading file to server...");
            }

            const res = await fetch("/api/ingest", {
                method: "POST",
                headers,
                body,
            });

            if (res.status === 413) {
                throw new Error("File is too large for server processing. Try splitting it.");
            }

            let data;
            try {
                if (res.ok) {
                    setIngestStatus("Success! Finalizing document...");
                }
                data = await res.json();
            } catch (e: any) {
                const text = await res.text();
                throw new Error(`Server Error (${res.status}): ${text.substring(0, 50)}...`);
            }

            if (!res.ok) throw new Error(data.error || "Failed to ingest file");

            setSources(prev => [...prev, {
                ...newSource,
                fullContent: data.preview || "Text content extracted successfully."
            }]);

            // CRITICAL: Ensure the server has this content in the vector store for SUMMARIZE
            if (isPDF && body && headers) {
                // The client-side parse already sent it to /api/ingest which saved it to Vector DB
                console.log("Vector DB Sync preserved via /api/ingest");
            }

            setUploadModalOpen(false);
            showToast(`Successfully uploaded "${fileName}"`, 'success');

            const contentToShow = data.preview || "Text content extracted successfully.";
            const assistanceMessage = `I've finished indexing "${fileName}". Here is the content I've captured:

### 📝 Content from ${fileName}
${contentToShow}

I'm ready to answer any questions about it!`;

            setMessages(prev => [...prev, {
                role: "assistant",
                content: assistanceMessage
            }]);
        } catch (error: any) {
            console.error("Ingestion Error:", error);
            showToast(error.message || "Failed to upload file", 'error');
            setMessages(prev => [...prev, {
                role: "assistant",
                content: "Sorry, I had trouble reading that file. Please make sure it's a valid PDF or text file under 10MB."
            }]);
        } finally {
            setIsIngesting(false);
        }
    };

    const handleWebsiteIngest = async () => {
        if (!websiteUrl || !websiteTitle) {
            showToast("URL and Title are required", 'error');
            return;
        }

        setIsIngesting(true);
        setIngestStatus("Initializing transcription...");
        try {
            const isYoutube = websiteUrl.includes("youtube.com") || websiteUrl.includes("youtu.be") || websiteUrl.includes("walch");

            let finalContent = "";
            let finalMode = "website";

            if (isYoutube) {
                setIngestStatus("Connecting to YouTube (Client-Side)...");
                // Extract Video ID
                const videoIdMatch = websiteUrl.match(/(?:[?&]v=|youtu\.be\/|youtube\.com\/embed\/|v\/|walch\?v=)([^#\&\?]*)/);
                const videoId = videoIdMatch ? videoIdMatch[1] : websiteUrl.trim();
                const normalizedUrl = `https://www.youtube.com/watch?v=${videoId}`;

                try {
                    const proxyUrl = (target: string) => `https://corsproxy.io/?url=${encodeURIComponent(target)}`;

                    // Layer 1: CORS Proxy + Regex
                    setIngestStatus("Trying fast bypass (Layer 1)...");
                    try {
                        const htmlRes = await fetch(proxyUrl(normalizedUrl));
                        const html = await htmlRes.text();
                        const regex = /"captionTracks":\s*(\[.*?\])/;
                        const match = html.match(regex);

                        if (match) {
                            const tracks = JSON.parse(match[1]);
                            const enTrack = tracks.find((t: any) => t.languageCode === 'en' || t.languageCode?.startsWith('en')) || tracks[0];
                            const transRes = await fetch(proxyUrl(enTrack.baseUrl));
                            const xml = await transRes.text();
                            const textMatch = xml.match(/<text.*?>([\s\S]*?)<\/text>/g);
                            if (textMatch) {
                                finalContent = textMatch
                                    .map(t => t.replace(/<text.*?>|<\/text>/g, ''))
                                    .map(t => t.replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>'))
                                    .join(' ')
                                    .replace(/\s+/g, ' ')
                                    .trim();
                                finalMode = "text";
                            }
                        }
                    } catch (l1Err) { console.warn("L1 Fail:", l1Err); }

                    // Layer 2: Piped API (Very reliable)
                    if (!finalContent) {
                        setIngestStatus("Trying alternative route (Layer 2)...");
                        const pipedEndpoints = ["https://pipedapi.kavin.rocks", "https://api.piped.io", "https://pipedapi.tokhmi.xyz", "https://pipedapi.nexus-it.pt"];
                        for (const api of pipedEndpoints) {
                            try {
                                const res = await fetch(`${api}/streams/${videoId}`);
                                if (!res.ok) continue;
                                const data = await res.json();
                                const subtitles = data.subtitles;
                                if (subtitles && subtitles.length > 0) {
                                    const enSub = subtitles.find((s: any) => s.code === 'en' || s.name === 'English') || subtitles[0];
                                    const subRes = await fetch(enSub.url);
                                    finalContent = await subRes.text();
                                    finalMode = "text";
                                    break;
                                }
                            } catch (e) { continue; }
                        }
                    }

                    // Layer 3: Invidious API
                    if (!finalContent) {
                        setIngestStatus("Trying deep search (Layer 3)...");
                        const invidiousEndpoints = ["https://yewtu.be", "https://inv.vern.cc", "https://invidious.snopyta.org", "https://vid.priv.au"];
                        for (const api of invidiousEndpoints) {
                            try {
                                const res = await fetch(`${api}/api/v1/captions/${videoId}?label=English`);
                                if (res.ok) {
                                    const data = await res.json();
                                    finalContent = typeof data === 'string' ? data : JSON.stringify(data);
                                    finalMode = "text";
                                    break;
                                }
                            } catch (e) { continue; }
                        }
                    }

                    if (finalContent) {
                        setIngestStatus("Transcript captured! Finalizing...");
                    } else {
                        throw new Error("All bypass layers failed. YouTube is heavily restricted.");
                    }
                } catch (clientErr: any) {
                    console.warn("Client-side YT fetch failed, falling back to server:", clientErr.message);
                    setIngestStatus("Client-side check failed. Trying Server Fallback...");
                }
            }

            const res = await fetch("/api/ingest", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    url: websiteUrl,
                    name: websiteTitle,
                    mode: finalMode,
                    text: finalContent // Pass content directly if we grabbed it client-side
                }),
            });

            if (res.ok) {
                setIngestStatus("Success! Finalizing document...");
                const data = await res.json();

                const id = `Web-${Date.now()}`;
                setSources(prev => [...prev, {
                    id,
                    name: websiteTitle,
                    type: "text",
                    selected: true,
                    fullContent: data.preview || finalContent.substring(0, 1000)
                }]);
                setUploadModalOpen(false);
                setWebsiteUrl("");
                setWebsiteTitle("");
                showToast("Content added successfully", 'success');
                const contentToShow = data.preview || finalContent || "Content extracted successfully.";
                setMessages(prev => [...prev, {
                    role: "assistant",
                    content: `I've finished indexing "${websiteTitle}". Here is the transcript/content:

### 📑 Transcription: ${websiteTitle}
${contentToShow}

I'm ready to answer any questions about it!`
                }]);
            } else {
                const data = await res.json();
                throw new Error(data.error || "Failed to ingest content");
            }
        } catch (error: any) {
            console.error("Website Ingest Error:", error);
            showToast(error.message, 'error');
            setMessages(prev => [...prev, {
                role: "assistant",
                content: `Sorry, I had trouble: ${error.message}`
            }]);
        } finally {
            setIsIngesting(false);
        }
    };

    const handleTextIngest = async () => {
        if (!pastedText || !pastedTitle) {
            showToast("Text and Title are required", 'error');
            return;
        }

        setIsIngesting(true);
        try {
            const res = await fetch("/api/ingest", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ text: pastedText, name: pastedTitle, mode: "text" }),
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Failed to ingest text");

            const id = `Text-${Date.now()}`;
            setSources(prev => [...prev, {
                id,
                name: pastedTitle,
                type: "text",
                selected: true,
                fullContent: pastedText
            }]);
            setUploadModalOpen(false);
            setPastedText("");
            setPastedTitle("");

            showToast("Note added successfully", 'success');

            setMessages(prev => [...prev, {
                role: "assistant",
                content: `I've learned from your pasted note "${pastedTitle}". Here is the text I've added:

### 🗒️ Note: ${pastedTitle}
${pastedText}

It's now part of my collective wisdom!`
            }]);
        } catch (error: any) {
            console.error("Text Ingest Error:", error);
            showToast(error.message, 'error');
            setMessages(prev => [...prev, {
                role: "assistant",
                content: `Sorry, I had trouble processing your text: ${error.message}`
            }]);
        } finally {
            setIsIngesting(false);
        }
    };

    const addNoteAtCursor = (text: string) => {
        setNoteContent(prev => prev + (prev ? "\n\n" : "") + text);
        showToast("Added to notes", 'success');
    };

    const handleSendMessage = async (overrideText?: string): Promise<string> => {
        const textToSend = overrideText || input;
        if (!textToSend.trim()) return "";

        let finalResponse = "";

        const userMessage = { role: "user", content: textToSend };
        setMessages(prev => [...prev, userMessage]);
        setInput("");
        setSuggestions([]); // Clear previous suggestions
        setIsChatting(true);
        const currentHistory = [...messages, userMessage];

        // Abort previous if any
        if (abortControllerRef.current) abortControllerRef.current.abort();
        const controller = new AbortController();
        abortControllerRef.current = controller;

        // 🧪 INSTANT FEEDBACK: Add a "Ghost" assistant message immediately
        setMessages(prev => [...prev, {
            role: "assistant",
            content: "",
            thought: "",
            isThinking: true,
            thinkingPhase: "Consulting the Scriptures...",
            researchSteps: [
                "Opening the Divine archives...",
                "Cross-referencing KJV context...",
                "Distilling spiritual wisdom...",
                "Preparing your revelation..."
            ]
        }]);

        // Explicitly set chatting status before fetch
        setIsChatting(true);

        try {
            const res = await fetch("/api/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    query: textToSend,
                    history: currentHistory
                }),
                signal: controller.signal
            });

            if (!res.ok) throw new Error("Synthesis failure");

            const contentType = res.headers.get("content-type");
            if (contentType?.includes("application/json")) {
                const data = await res.json();
                if (data.role === "assistant") {
                    // Update the Ghost message instead of adding a new one
                    setMessages(prev => {
                        const newMsgs = [...prev];
                        const lastIdx = newMsgs.length - 1;
                        if (newMsgs[lastIdx].role === "assistant") {
                            newMsgs[lastIdx] = {
                                ...newMsgs[lastIdx],
                                content: data.content,
                                thought: data.thought,
                                portrait: data.portrait,
                                isThinking: false
                            };
                        }
                        return newMsgs;
                    });
                    if (data.suggestions) setSuggestions(data.suggestions);
                    finalResponse = data.content;
                }
                setIsChatting(false);
                return finalResponse;
            }

            // --- STREAMING MODE ---
            const reader = res.body?.getReader();
            if (!reader) throw new Error("No stream reader");

            // Extract metadata from headers
            const citationsHeader = res.headers.get("x-citations");
            const webLinksHeader = res.headers.get("x-web-links");
            const stepsHeader = res.headers.get("x-research-steps");
            const providerHeader = res.headers.get("x-ai-provider");

            let initialCitations: any[] = [];
            let initialWebLinks: any[] = [];
            let initialResearchSteps: string[] = [];
            try {
                if (citationsHeader) initialCitations = JSON.parse(decodeURIComponent(escape(atob(citationsHeader))));
                if (webLinksHeader) initialWebLinks = JSON.parse(decodeURIComponent(escape(atob(webLinksHeader))));
                if (stepsHeader) initialResearchSteps = JSON.parse(decodeURIComponent(escape(atob(stepsHeader))));
            } catch (e) { console.warn("Metadata error", e); }

            // UPDATE the "Ghost" assistant message with real metadata from headers
            setMessages(prev => {
                const newMsgs = [...prev];
                const lastIdx = newMsgs.length - 1;
                if (newMsgs[lastIdx].role === "assistant") {
                    newMsgs[lastIdx] = {
                        ...newMsgs[lastIdx],
                        citations: initialCitations,
                        webResults: initialWebLinks,
                        researchSteps: initialResearchSteps.length > 0 ? initialResearchSteps : newMsgs[lastIdx].researchSteps,
                        thinkingPhase: "Preparing study context..."
                    };
                }
                return newMsgs;
            });

            let fullText = "";
            const decoder = new TextDecoder();

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value, { stream: true });
                fullText += chunk;

                // 🧬 ROBUST PARSING (Handles common misspellings like THOUGHT, THUGHT, THOHT)
                let currentThought = "";
                let currentContent = fullText;
                let stillThinking = true;
                let thinkingPhase = "Analyzing...";

                // Check for delimiters (case-insensitive + misspellings)
                const thoughtStartRegex = /<(THOUGHT|THUGHT|THOHT)>/i;
                const thoughtEndRegex = /<\/(THOUGHT|THUGHT|THOHT)>/i;
                const responseStartRegex = /### RESPONSE START ###/i;

                const tStartMatch = fullText.match(thoughtStartRegex);
                const tEndMatch = fullText.match(thoughtEndRegex);
                const rStartMatch = fullText.match(responseStartRegex);

                if (tStartMatch) {
                    const startIndex = tStartMatch.index! + tStartMatch[0].length;
                    if (tEndMatch) {
                        const endIndex = tEndMatch.index!;
                        currentThought = fullText.substring(startIndex, endIndex);
                        currentContent = fullText.substring(endIndex + tEndMatch[0].length);
                        stillThinking = false;
                        thinkingPhase = "Reasoning complete.";
                    } else {
                        currentThought = fullText.substring(startIndex);
                        currentContent = "";
                        stillThinking = true;

                        // Dynamic Phase Display
                        if (currentThought.length > 400) thinkingPhase = "Finalizing synthesis...";
                        else if (currentThought.length > 150) thinkingPhase = "Cross-referencing Scriptures...";
                        else thinkingPhase = "Searching truth archives...";
                    }
                } else if (rStartMatch) {
                    currentContent = fullText.substring(rStartMatch.index! + rStartMatch[0].length);
                    stillThinking = false;
                    thinkingPhase = "Response generated.";
                } else {
                    // No delimiters yet — if text is short, assume it might be starting to think
                    if (fullText.length < 100 && fullText.includes("<")) {
                        currentContent = "";
                        stillThinking = true;
                        thinkingPhase = "Initializing search...";
                    } else {
                        currentContent = fullText;
                        stillThinking = false;
                    }
                }

                // Clean content of remaining markers/leaks
                currentContent = currentContent.replace(/### RESPONSE START ###/i, "").trim();
                currentContent = currentContent.split(/---S[UG]*ESTIONS---/i)[0].trim();
                currentContent = currentContent.replace(/\*?\[METADATA:[^\]]*\]\*?/gi, "").trim();
                currentContent = currentContent.replace(/\[METADATA:/gi, "").trim(); // Catch partials

                // Nuclear option for leftover tags: remove anything like <...> involving THOUGHT/THUGHT/THOHT
                currentContent = currentContent.replace(/<\/?(THOUGHT|THUGHT|THOHT)>/gi, "").trim();

                // Remove research pipeline debug lines
                currentContent = currentContent.replace(/^Distilled intent:.*$/gm, "").trim();
                currentContent = currentContent.replace(/^Found \d+ relevant context fragments?$/gm, "").trim();
                currentContent = currentContent.replace(/^(Verified with internal canonical archives|Integrated \d+ external truth-points?)$/gm, "").trim();
                currentContent = currentContent.replace(/^Doctrine Integrity Score:.*$/gm, "").trim();
                currentContent = currentContent.replace(/^Sovereign Reasoning Mode Active$/gm, "").trim();

                // Update the LATEST assistant message
                setMessages(prev => {
                    const newMsgs = [...prev];
                    const lastIdx = newMsgs.length - 1;
                    if (newMsgs[lastIdx].role === "assistant") {
                        newMsgs[lastIdx] = {
                            ...newMsgs[lastIdx],
                            content: currentContent,
                            thought: currentThought,
                            isThinking: stillThinking,
                            thinkingPhase: thinkingPhase,
                            portrait: newMsgs[lastIdx].portrait // Preserve portrait
                        };
                    }
                    return newMsgs;
                });
            }

            // Post-stream cleanup to ensure isThinking is false
            setMessages(prev => {
                const newMsgs = [...prev];
                const lastIdx = newMsgs.length - 1;
                if (newMsgs[lastIdx].role === "assistant") {
                    newMsgs[lastIdx].isThinking = false;
                }
                return newMsgs;
            });

            // Post-stream cleanup (Final suggestions extraction)
            const suggestionMatch = fullText.match(/---SUGGESTIONS---([\s\S]*?)(?:\[METADATA|$)/i);
            if (suggestionMatch) {
                const s = suggestionMatch[1].split("\n").map(line => line.trim().replace(/^\d+\.\s*|-\s*|\?\s*$/, "") + "?").filter(l => l.length > 5).slice(0, 3);
                setSuggestions(s.length > 0 ? s : ["Tell me more.", "Show me verses.", "Apply this."]);
            }

            // Capture final content from messages
            setMessages(prev => {
                const lastMsg = prev[prev.length - 1];
                if (lastMsg && lastMsg.role === "assistant") {
                    finalResponse = lastMsg.content;
                }
                return prev;
            });
        } catch (error: any) {
            if (error.name === 'AbortError') {
                console.log("Chat generation stopped by user.");
                // Ensure isThinking is turned off but keep the generated text
                setMessages(prev => {
                    const newMsgs = [...prev];
                    const lastIdx = newMsgs.length - 1;
                    if (newMsgs[lastIdx].role === "assistant") {
                        newMsgs[lastIdx].isThinking = false;
                    }
                    return newMsgs;
                });
            } else {
                console.error("Chat Error:", error);
                setMessages(prev => {
                    const newMsgs = [...prev];
                    const lastIdx = newMsgs.length - 1;
                    if (newMsgs[lastIdx].role === "assistant") {
                        newMsgs[lastIdx] = {
                            ...newMsgs[lastIdx],
                            content: "I'm sorry, I'm unable to provide an answer right now. Please try again in a few moments.",
                            isThinking: false
                        };
                    }
                    return newMsgs;
                });
            }
        } finally {
            setIsChatting(false);
            abortControllerRef.current = null;
        }
        return finalResponse;
    };

    const handleAbortChat = () => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
            abortControllerRef.current = null;
            setIsChatting(false);

            // Clean up any "Thinking" UI immediately
            setMessages(prev => prev.map(m => m.isThinking ? { ...m, isThinking: false, content: m.content || "Response stopped by user." } : m));

            window.speechSynthesis?.cancel();

            // Kill any active AI voice
            if (typeof window !== 'undefined' && window.speechSynthesis) {
                window.speechSynthesis.cancel();
            }

            // Clean up the "Thinking" state in the messages list
            setMessages(prev => {
                const newMessages = [...prev];
                const lastIdx = newMessages.length - 1;
                if (lastIdx >= 0 && newMessages[lastIdx].role === "assistant" && newMessages[lastIdx].isThinking) {
                    newMessages[lastIdx] = { ...newMessages[lastIdx], isThinking: false };
                }
                return newMessages;
            });

            showToast("Response stopped", "success");
        }
    };





    const handleGrammarCheck = async () => {
        if (!noteContent || noteContent.trim().length < 5) {
            alert("Please write some notes first to check for mistakes.");
            return;
        }

        setIsGrammarChecking(true);
        try {
            const res = await fetch("/api/grammar", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ text: noteContent }),
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Failed to analyze grammar");

            let analysisMessage = `📊 **Grammar Analysis Report** (Quality: ${data.overallQuality}/10)\n\n`;

            if (data.hasMistakes && data.suggestions.length > 0) {
                analysisMessage += `I found ${data.suggestions.length} potential area(s) for improvement:\n\n`;
                data.suggestions.forEach((s: any, i: number) => {
                    analysisMessage += `${i + 1}. **"${s.original}"** → *"${s.corrected}"*\n   *Why:* ${s.reason}\n\n`;
                });

                if (data.deepDive) {
                    analysisMessage += `💡 **Deep Dive: ${data.deepDive.mistake}**\n${data.deepDive.explanation}\n\n*Rule to remember:* ${data.deepDive.rule}`;
                }
            } else {
                analysisMessage += "✨ **Excellent work!** Your writing is clear, grammatically sound, and spiritually focused. No significant errors were found.";
            }

            setMessages(prev => [...prev, {
                role: "assistant",
                content: analysisMessage
            }]);

        } catch (error: any) {
            console.error("Grammar Check Error:", error);
            setMessages(prev => [...prev, {
                role: "assistant",
                content: `Sorry, I had trouble analyzing your grammar: ${error.message}`
            }]);
        } finally {
            setIsGrammarChecking(false);
        }
    };

    const handleDivineMeditation = async () => {
        const selectedSources = sources.filter(s => s.selected);

        if (selectedSources.length === 0 && (!noteContent || noteContent.trim().length < 20)) {
            alert("Please select some sources or write more in your research notes to receive a Divine Reflection.");
            return;
        }

        setIsMeditating(true);
        showToast("Seeking profound divine intervention...", "success");

        try {
            const res = await fetch("/api/divine", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    sources: selectedSources.map(s => ({ name: s.name, content: s.fullContent || "" })),
                    notes: noteContent
                }),
            });

            const data = await res.json();
            if (res.ok && data.reflection) {
                // Parse out suggestions if they exist at the end (looking for section 6)
                let mainContent = data.reflection;
                let parsedSuggestions: string[] = [];

                if (mainContent.includes("6. ✨ DIVINE SUGGESTIONS")) {
                    const parts = mainContent.split("6. ✨ DIVINE SUGGESTIONS");
                    mainContent = parts[0];
                    const suggestionBlock = parts[1];
                    // Extract numbered items or bullet points
                    const regex = /(?:\d\.|\*)\s+(.+)/g;
                    let match;
                    while ((match = regex.exec(suggestionBlock)) !== null) {
                        parsedSuggestions.push(match[1].trim());
                    }
                }

                setMessages(prev => [...prev, {
                    role: "assistant",
                    content: mainContent.trim()
                }]);

                if (parsedSuggestions.length > 0) {
                    setSuggestions(parsedSuggestions);
                }

                showToast("Profound intervention received", "success");
                setActiveTab("chat");
            }
        } catch (e) {
            console.error("Divine Reflection Error:", e);
            showToast("Failed to connect to the Divine Counselor", "error");
        } finally {
            setIsMeditating(false);
        }
    };

    const handleGenerateGuide = async (type: "study-guide" | "faq" | "timeline" | "briefing doc" | "transcription") => {
        const selectedSources = sources.filter(s => s.selected);
        if (selectedSources.length === 0) {
            alert("Please select at least one source to generate from.");
            return;
        }

        setIsGeneratingGuide(true);
        try {
            const res = await fetch("/api/generate-guide", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    type,
                    sources: selectedSources.map(s => ({
                        name: s.name,
                        content: s.fullContent || "[Content Pending Extraction]"
                    }))
                }),
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Failed to generate guide");

            const label = type === "study-guide" ? "Study Guide" :
                type === "faq" ? "FAQ" :
                    type === "timeline" ? "Timeline" :
                        type === "transcription" ? "Full Transcription" : "Briefing Doc";

            setMessages(prev => [...prev, {
                role: "assistant",
                content: `### 📘 ${label}\n\n${data.result}`
            }]);

        } catch (error: any) {
            console.error("Guide Error:", error);
            setMessages(prev => [...prev, {
                role: "assistant",
                content: `Sorry, I had trouble generating your ${type}: ${error.message}`
            }]);
        } finally {
            setIsGeneratingGuide(false);
        }
    };

    const generateAudioOverview = async () => {
        const selectedSourceIds = sources.filter(s => s.selected).map(s => s.id);

        if (selectedSourceIds.length === 0) {
            alert("Please select at least one source for the audio overview.");
            return;
        }

        setGeneratingAudio(true);
        try {
            const selectedSources = sources.filter(s => s.selected);
            const res = await fetch("/api/audio-overview", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    sources: selectedSources.map(s => ({
                        name: s.name,
                        content: s.fullContent || ""
                    }))
                }),
            });

            const data = await res.json();

            if (data.title && data.script) {
                setAudioOverview({ title: data.title, script: data.script });
                setIsAudioOverviewOpen(true);
                showToast("Podcast generated!", "success");
                setMessages(prev => [...prev, {
                    role: "assistant",
                    content: `I've created a podcast-style overview of your ${data.sourceCount} source(s)! Check the audio player above.`
                }]);
            } else {
                throw new Error(data.error || "Failed to generate audio overview");
            }
        } catch (error: any) {
            console.error("Audio Overview Error:", error);
            setMessages(prev => [...prev, {
                role: "assistant",
                content: `Sorry, I had trouble creating the audio overview: ${error.message}`
            }]);
        } finally {
            setGeneratingAudio(false);
        }
    };

    const handleSpeakMessage = async (text: string, index: number) => {
        if (isSpeakingMap[index]) {
            if (messageAudioRefs.current[index]) {
                messageAudioRefs.current[index].pause();
                messageAudioRefs.current[index].currentTime = 0;
                delete messageAudioRefs.current[index];
            }
            setIsSpeakingMap(prev => ({ ...prev, [index]: false }));
            return;
        }

        setIsSpeakingMap(prev => ({ ...prev, [index]: true }));
        try {
            const res = await fetch("/api/generate-audio", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ text: text.substring(0, 10000) })
            });

            const data = await res.json();
            if (data.audio_base64) {
                const audio = new Audio(`data:audio/mp3;base64,${data.audio_base64}`);
                messageAudioRefs.current[index] = audio;

                audio.onended = () => {
                    setIsSpeakingMap(prev => ({ ...prev, [index]: false }));
                    delete messageAudioRefs.current[index];
                };

                audio.onerror = () => {
                    setIsSpeakingMap(prev => ({ ...prev, [index]: false }));
                    delete messageAudioRefs.current[index];
                };

                audio.play();
            } else {
                setIsSpeakingMap(prev => ({ ...prev, [index]: false }));
            }
        } catch (e) {
            console.error("Audio Playback Error:", e);
            setIsSpeakingMap(prev => ({ ...prev, [index]: false }));
        }
    };

    const downloadMessageMp3 = async (text: string, titleHint: string) => {
        try {
            showToast("Generating MP3 for download...", "success");
            const res = await fetch("/api/generate-audio", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ text: text.substring(0, 10000) })
            });
            const data = await res.json();
            if (data.audio_base64) {
                const byteCharacters = atob(data.audio_base64);
                const byteNumbers = new Array(byteCharacters.length);
                for (let i = 0; i < byteCharacters.length; i++) byteNumbers[i] = byteCharacters.charCodeAt(i);
                const byteArray = new Uint8Array(byteNumbers);
                const blob = new Blob([byteArray], { type: 'audio/mpeg' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `daily_manna_${titleHint.substring(0, 20).replace(/[^a-z0-9]/gi, '_').toLowerCase()}.mp3`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
                showToast("MP3 Study saved successfully", "success");
            }
        } catch (e) {
            console.error("Download Error:", e);
            showToast("Failed to save MP3", "error");
        }
    };





    const playAudio = () => {
        if (!audioOverview) return;

        // Stop any existing speech
        window.speechSynthesis.cancel();

        // Parse the script to separate speakers
        const lines = audioOverview.script.split('\n').filter(line => line.trim());
        const voices = availableVoices;

        // Find male and female voices
        const femaleVoice = voices.find(v =>
            v.name.toLowerCase().includes('female') ||
            v.name.toLowerCase().includes('zira') ||
            v.name.toLowerCase().includes('samantha') ||
            v.name.toLowerCase().includes('victoria') ||
            v.name.toLowerCase().includes('karen')
        ) || voices.find(v => v.name.includes('Google') && v.lang.includes('en'));

        const maleVoice = voices.find(v =>
            v.name.toLowerCase().includes('male') ||
            v.name.toLowerCase().includes('david') ||
            v.name.toLowerCase().includes('mark') ||
            v.name.toLowerCase().includes('daniel')
        ) || voices.find(v => v.name.includes('Google') && v.lang.includes('en'));

        setIsPlaying(true);
        isPlayingRef.current = true;
        setIsPaused(false);

        let currentIndex = 0;

        const speakNextLine = () => {
            if (!isPlayingRef.current) return;

            if (currentIndex >= lines.length) {
                setIsPlaying(false);
                isPlayingRef.current = false;
                setIsPaused(false);
                return;
            }

            const line = lines[currentIndex];

            // Skip empty lines or non-dialogue lines
            if (!line.includes(':')) {
                currentIndex++;
                speakNextLine();
                return;
            }

            // Extract speaker and text
            const [speaker, ...textParts] = line.split(':');
            let text = textParts.join(':').trim();

            // Clean text
            text = text
                .replace(/\*/g, '')
                .replace(/\[[\d\s,-]+\]/g, '')
                .replace(/\(\/.*?\/\)/g, '')
                .trim();

            if (!text) {
                currentIndex++;
                speakNextLine();
                return;
            }

            // --- ADVANCED: GROUPING SAME SPEAKER ---
            // Look ahead to see if the next line is the SAME speaker
            // If it is, combine them to avoid pauses between sentences
            let combinedText = text;
            const currentSpeakerPrefix = speaker.trim().toLowerCase();

            while (currentIndex + 1 < lines.length) {
                const nextLine = lines[currentIndex + 1];
                if (nextLine.includes(':')) {
                    const [nextSpeaker, ...nextParts] = nextLine.split(':');
                    if (nextSpeaker.trim().toLowerCase() === currentSpeakerPrefix) {
                        let nextText = nextParts.join(':').trim();
                        nextText = nextText
                            .replace(/\*/g, '')
                            .replace(/\[[\d\s,-]+\]/g, '')
                            .replace(/\(\/.*?\/\)/g, '')
                            .trim();

                        combinedText += " " + nextText;
                        currentIndex++; // Move to next line index
                        continue;
                    }
                }
                break;
            }

            currentIndex++; // Move index to the next unique speaker

            const utterance = new SpeechSynthesisUtterance(combinedText);

            // Assign voice based on speaker
            const isSarah = speaker.toLowerCase().includes('sarah');
            const voice = isSarah ? femaleVoice : maleVoice;

            if (voice) {
                utterance.voice = voice;
            }

            utterance.rate = 1.0; // Dynamic human rate
            utterance.pitch = isSarah ? 1.05 : 0.95;
            utterance.volume = 1.0;

            utterance.onend = () => {
                // Natural pause ONLY when switching speakers
                if (isPlayingRef.current) {
                    setTimeout(() => {
                        if (isPlayingRef.current) speakNextLine();
                    }, 250);
                }
            };

            utterance.onerror = (event) => {
                console.error('Speech synthesis error:', event);
                setIsPlaying(false);
                isPlayingRef.current = false;
                setIsPaused(false);
            };

            speechSynthesisRef.current = utterance;
            window.speechSynthesis.speak(utterance);
        };

        speakNextLine();
    };

    const pauseAudio = () => {
        if (window.speechSynthesis.speaking && !window.speechSynthesis.paused) {
            window.speechSynthesis.pause();
            setIsPaused(true);
        }
    };

    const resumeAudio = () => {
        if (window.speechSynthesis.paused) {
            window.speechSynthesis.resume();
            setIsPaused(false);
        }
    };

    const stopAudio = () => {
        window.speechSynthesis.cancel();
        setIsPlaying(false);
        isPlayingRef.current = false;
        setIsPaused(false);
        speechSynthesisRef.current = null;
    };

    const downloadAudio = () => {
        if (!audioOverview) return;

        const content = `${audioOverview.title}\n\n${audioOverview.script}`;
        const blob = new Blob([content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${audioOverview.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const downloadMp3 = async () => {
        if (!audioOverview) return;

        try {
            // Show loading state (optional, but good UX)
            const btn = document.querySelector('button[title="Download MP3 Audio"]') as HTMLButtonElement;
            if (btn) {
                const originalText = btn.innerHTML;
                btn.innerHTML = '<span class="animate-spin">⏳</span> Generating...';
                btn.disabled = true;
            }

            const res = await fetch('/api/generate-audio', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text: audioOverview.script })
            });

            const data = await res.json();

            if (!res.ok) throw new Error(data.error || 'Failed to generate audio');

            if (data.audio_base64) {
                // Convert Base64 to Blob
                const byteCharacters = atob(data.audio_base64);
                const byteNumbers = new Array(byteCharacters.length);
                for (let i = 0; i < byteCharacters.length; i++) {
                    byteNumbers[i] = byteCharacters.charCodeAt(i);
                }
                const byteArray = new Uint8Array(byteNumbers);
                const blob = new Blob([byteArray], { type: 'audio/mpeg' });

                // Download
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `${audioOverview.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.mp3`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
            }

            // Restore button
            if (btn) {
                btn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-file-audio"><path d="M17.5 22h.5c.5 0 1-.5 1-1v-4c0-.5-.5-1-1-1h-1.5c-.5 0-1 .5-1 1v4c0 .5.5 1 1 1h.5"></path><path d="M7 2v20"></path><path d="M11 2h10"></path><path d="M13 2H3"></path><path d="M3 20h8"></path><path d="M18.9 2h.1c.5 0 1 .5 1 1v20c0 .5-.5 1-1 1h-.1"></path><path d="M9.1 12H11"></path><path d="M16 12h1"></path><path d="M5 2h2"></path></svg> Download MP3';
                btn.disabled = false;
            }

        } catch (error) {
            console.error("MP3 Download Error:", error);
            alert("Could not generate MP3. Please try again.");
            const btn = document.querySelector('button[title="Download MP3 Audio"]') as HTMLButtonElement;
            if (btn) {
                btn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-file-audio"><path d="M17.5 22h.5c.5 0 1-.5 1-1v-4c0-.5-.5-1-1-1h-1.5c-.5 0-1 .5-1 1v4c0 .5.5 1 1 1h.5"></path><path d="M7 2v20"></path><path d="M11 2h10"></path><path d="M13 2H3"></path><path d="M3 20h8"></path><path d="M18.9 2h.1c.5 0 1 .5 1 1v20c0 .5-.5 1-1 1h-.1"></path><path d="M9.1 12H11"></path><path d="M16 12h1"></path><path d="M5 2h2"></path></svg> Download MP3';
                btn.disabled = false;
            }
        }
    };

    return (
        <div className="flex bg-background text-foreground overflow-hidden relative h-screen-safe w-full">
            {/* Notification Toast */}
            {notification && (
                <div className={`fixed top-20 left-1/2 -translate-x-1/2 z-[200] px-4 py-2 rounded-full shadow-lg border animate-in slide-in-from-top-4 duration-300 text-sm font-bold flex items-center gap-2 ${notification.type === 'success' ? 'bg-green-500/90 text-white border-green-400' : 'bg-red-500/90 text-white border-red-400'}`}>
                    {notification.type === 'success' ? <CheckCircle2 size={16} /> : <X size={16} />}
                    {notification.message}
                </div>
            )}

            {/* Image Studio Overlap */}
            {isStudioOpen && (
                <BibleQuoteGenerator onClose={() => setIsStudioOpen(false)} />
            )}

            {/* Local Image Viewer Modal */}
            {isLocalImageModalOpen && (
                <div className="absolute inset-0 z-[200] flex items-center justify-center p-6 bg-background/90 backdrop-blur-md animate-in fade-in">
                    <div className="relative w-full max-w-3xl bg-card-bg border border-border rounded-3xl shadow-2xl overflow-hidden glass-morphism animate-in zoom-in-95 duration-200">
                        <header className="p-6 border-b border-border flex items-center justify-between">
                            <div>
                                <h3 className="text-xl font-bold">Local Image Explorer</h3>
                                <p className="text-sm text-muted">Paste an absolute disk path to view your integrated images.</p>
                            </div>
                            <button onClick={() => setLocalImageModalOpen(false)} className="p-2 hover:bg-border/50 rounded-full transition-colors">
                                <X size={20} />
                            </button>
                        </header>
                        <div className="p-8 space-y-6">
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-muted uppercase tracking-wider">Absolute File Path</label>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        placeholder="C:\Users\...\image.jpg"
                                        value={localImagePath}
                                        onChange={(e) => setLocalImagePath(e.target.value)}
                                        className="flex-1 bg-background border border-border rounded-xl px-4 py-3 text-sm focus:ring-1 focus:ring-accent outline-none"
                                    />
                                    <button
                                        onClick={() => setLocalImagePath("")}
                                        className="px-4 bg-muted/10 hover:bg-muted/20 rounded-xl transition-colors"
                                    >Clear</button>
                                </div>
                            </div>

                            {localImagePath && (
                                <div className="border border-border rounded-2xl overflow-hidden bg-black/20 flex flex-col min-h-[300px]">
                                    <div className="p-3 bg-muted/5 border-b border-border flex items-center justify-between">
                                        <span className="text-[10px] font-mono text-muted truncate max-w-md">{localImagePath}</span>
                                        <button
                                            onClick={() => navigator.clipboard.writeText(localImagePath)}
                                            className="text-[10px] font-bold text-accent hover:underline"
                                        >COPY PATH</button>
                                    </div>
                                    <div className="flex-1 flex items-center justify-center p-4">
                                        <img
                                            src={`/api/local-image?path=${encodeURIComponent(localImagePath)}`}
                                            alt="Local Preview"
                                            className="max-w-full max-h-[400px] rounded-lg shadow-xl object-contain"
                                            onError={(e) => {
                                                (e.target as any).src = 'https://via.placeholder.com/400x300?text=Invalid+Image+Path';
                                            }}
                                        />
                                    </div>
                                </div>
                            )}
                        </div>
                        <footer className="p-6 border-t border-border flex justify-end">
                            <button
                                onClick={() => setLocalImageModalOpen(false)}
                                className="px-8 py-2 bg-accent text-white rounded-full font-bold hover:bg-accent/90 transition-all shadow-lg shadow-accent/20"
                            >
                                Done
                            </button>
                        </footer>
                    </div>
                </div>
            )}
            {/* Upload Modal Overlay */}
            {isUploadModalOpen && (
                <div className="absolute inset-0 z-[100] flex items-center justify-center p-6 bg-background/80 backdrop-blur-sm transition-all animate-in fade-in">
                    <div className="relative w-full max-w-2xl max-h-[90dvh] flex flex-col bg-card-bg border border-border rounded-3xl shadow-2xl overflow-hidden glass-morphism animate-in zoom-in-95 duration-200">
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

                        <div className="p-4 md:p-8 overflow-y-auto custom-scrollbar">
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-6 md:mb-8">
                                {[
                                    { mode: 'file', icon: <Upload size={20} />, label: "Upload Files", sub: "PDF, TXT, MD" },
                                    { mode: 'youtube', icon: <Mic2 size={20} />, label: "YouTube Video", sub: "Transcribe" },
                                    { mode: 'website', icon: <Globe size={20} />, label: "Website", sub: "Import Link" },
                                    { mode: 'text', icon: <LinkIcon size={20} />, label: "Copy-Paste", sub: "Direct text" }
                                ].map((option, i) => (
                                    <button
                                        key={i}
                                        onClick={() => setUploadMode(option.mode as any)}
                                        className={`flex flex-row sm:flex-col items-center sm:justify-center gap-3 p-4 md:p-6 rounded-2xl border transition-all group ${uploadMode === option.mode ? 'bg-accent/10 border-accent text-accent' : 'bg-background border-border hover:bg-accent/5'}`}
                                    >
                                        <div className={`p-2 md:p-3 rounded-xl transition-colors ${uploadMode === option.mode ? 'bg-accent/20 text-accent' : 'bg-muted/10 text-muted group-hover:text-accent group-hover:bg-accent/10'}`}>
                                            {option.icon}
                                        </div>
                                        <div className="text-left sm:text-center">
                                            <div className="text-sm font-bold">{option.label}</div>
                                            <div className="text-[9px] md:text-[10px] text-muted uppercase tracking-tight">{option.sub}</div>
                                        </div>
                                    </button>
                                ))}
                            </div>

                            {uploadMode === 'file' ? (
                                <div
                                    onClick={() => !isIngesting && fileInputRef.current?.click()}
                                    className={`border-2 border-dashed border-border rounded-2xl p-12 text-center hover:border-accent/50 transition-colors cursor-pointer bg-muted/5 group ${isIngesting ? 'opacity-50 cursor-wait' : ''}`}
                                >
                                    <input
                                        type="file"
                                        ref={fileInputRef}
                                        className="hidden"
                                        accept=".pdf,.txt,.md,.docx,application/pdf,text/plain,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                                        onChange={(e) => {
                                            const file = e.target.files?.[0];
                                            if (file) handleFileUpload(file);
                                        }}
                                    />
                                    <div className="mx-auto w-16 h-16 bg-accent/10 text-accent rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                        {isIngesting ? <div className="animate-spin text-2xl">⏳</div> : <Upload size={32} />}
                                    </div>
                                    <p className="text-lg font-bold mb-1">{isIngesting ? 'Ingesting...' : 'Drag and drop files here'}</p>
                                    <p className="text-sm text-muted">or <span className="text-accent underline">browse files</span> from your computer</p>
                                </div>
                            ) : (uploadMode === 'website' || uploadMode === 'youtube') ? (
                                <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-muted uppercase tracking-wider">{uploadMode === 'youtube' ? 'Video Name' : 'Site / Video Name'}</label>
                                        <input
                                            type="text"
                                            placeholder={uploadMode === 'youtube' ? "e.g., My Favorite Sermon" : "e.g., Pastor Pagadala Sermon"}
                                            value={websiteTitle}
                                            onChange={(e) => setWebsiteTitle(e.target.value)}
                                            className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm focus:ring-1 focus:ring-accent outline-none"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-muted uppercase tracking-wider">{uploadMode === 'youtube' ? 'YouTube URL' : 'Website or YouTube URL'}</label>
                                        <input
                                            type="url"
                                            placeholder={uploadMode === 'youtube' ? "https://youtube.com/watch?v=..." : "https://website.com or YouTube link"}
                                            value={websiteUrl}
                                            onChange={(e) => setWebsiteUrl(e.target.value)}
                                            className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm focus:ring-1 focus:ring-accent outline-none"
                                        />
                                    </div>
                                    <button
                                        onClick={handleWebsiteIngest}
                                        disabled={isIngesting || !websiteUrl || !websiteTitle}
                                        className="w-full bg-accent text-white py-4 rounded-xl font-bold shadow-lg shadow-accent/20 hover:bg-accent/90 transition-all active:scale-95 disabled:opacity-50 disabled:scale-100"
                                    >
                                        {isIngesting ? (uploadMode === 'youtube' ? 'Transcribing Video...' : 'Exploring Website...') : (uploadMode === 'youtube' ? 'Ingest YouTube Video' : 'Ingest Website')}
                                    </button>
                                </div>
                            ) : (
                                <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-muted uppercase tracking-wider">Source Title</label>
                                        <input
                                            type="text"
                                            placeholder="e.g., My Study Notes"
                                            value={pastedTitle}
                                            onChange={(e) => setPastedTitle(e.target.value)}
                                            className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm focus:ring-1 focus:ring-accent outline-none"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-muted uppercase tracking-wider">Paste Text Content</label>
                                        <textarea
                                            placeholder="Paste your text here..."
                                            value={pastedText}
                                            onChange={(e) => setPastedText(e.target.value)}
                                            className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm focus:ring-1 focus:ring-accent outline-none min-h-[150px] resize-none"
                                        />
                                    </div>
                                    <button
                                        onClick={handleTextIngest}
                                        disabled={isIngesting || !pastedText || !pastedTitle}
                                        className="w-full bg-accent text-white py-4 rounded-xl font-bold shadow-lg shadow-accent/20 hover:bg-accent/90 transition-all active:scale-95 disabled:opacity-50 disabled:scale-100"
                                    >
                                        {isIngesting ? 'Ingesting Notes...' : 'Ingest Text'}
                                    </button>
                                </div>
                            )}
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

            {/* Source Viewer Modal */}
            {viewingSource && (
                <div className="absolute inset-0 z-[110] flex items-center justify-center p-6 bg-background/80 backdrop-blur-sm transition-all animate-in fade-in">
                    <div className="relative w-full max-w-4xl h-[80vh] bg-card-bg border border-border rounded-3xl shadow-2xl overflow-hidden glass-morphism animate-in zoom-in-95 duration-200 flex flex-col">
                        <header className="p-6 border-b border-border flex items-center justify-between bg-muted/5">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-accent/10 text-accent rounded-lg">
                                    <FileText size={20} />
                                </div>
                                <h3 className="text-xl font-bold truncate max-w-md">{viewingSource.name}</h3>
                            </div>
                            <button
                                onClick={() => setViewingSource(null)}
                                className="p-2 hover:bg-border/50 rounded-full transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </header>
                        <div className="flex-1 overflow-y-auto p-4 md:p-8 leading-relaxed text-foreground select-text custom-scrollbar">
                            <div className="max-w-3xl mx-auto space-y-4">
                                {viewingSource.name.toLowerCase().endsWith(".mp3") ? (
                                    <div className="p-6 bg-accent/5 rounded-2xl border border-accent/20">
                                        <h4 className="font-bold text-accent mb-2">Simulated Sermon Transcription</h4>
                                        <p className="whitespace-pre-wrap">
                                            This is a digital transcript generated from the audio source "{viewingSource.name}".
                                            The message focuses on spiritual growth and biblical wisdom.
                                        </p>
                                    </div>
                                ) : (
                                    <p className="whitespace-pre-wrap">
                                        {viewingSource.fullContent || "[No content preview available for this source.]"}
                                    </p>
                                )}
                            </div>
                        </div>
                        <footer className="p-4 border-t border-border bg-muted/5 text-center">
                            <button
                                onClick={() => setViewingSource(null)}
                                className="px-8 py-2 bg-foreground text-background rounded-full font-bold hover:bg-foreground/90 transition-all"
                            >
                                Close Explorer
                            </button>
                        </footer>
                    </div>
                </div>
            )}

            {/* 2. Main Editor/Viewer (Middle) */}
            <main className="flex-1 min-w-0 flex flex-col bg-background relative overflow-hidden transition-all duration-500">
                <header className="absolute top-0 left-0 right-0 z-40 h-14 flex items-center justify-between px-2 md:px-4 bg-transparent pt-safe">
                    <div className="flex items-center gap-2 md:gap-4">
                        <div className="flex items-center gap-1.5 md:gap-2 group cursor-pointer hover:opacity-80 transition-opacity">
                            <div className="text-red-600 flex-shrink-0" title="DailyMannaAI">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M10 2h4v6h6v4h-6v10h-4v-10h-6v-4h6V2z" />
                                </svg>
                            </div>
                            <span className="font-bold text-sm text-muted-foreground flex items-center gap-1">
                                DailyMannaAI <ChevronRight size={14} className="opacity-50" />
                            </span>
                        </div>
                    </div>

                    {/* Daily Manna Mini-Message (Header Right) */}
                    <div className="flex items-center gap-3">
                        {dailyManna && (
                            <div className="relative group flex items-center">
                                <button
                                    onClick={() => setIsDailyMannaOpen(!isDailyMannaOpen)}
                                    className={`flex items-center gap-1.5 px-2 py-1.5 rounded-xl transition-all ${isDailyMannaOpen ? 'bg-accent/10 text-accent' : 'text-muted-foreground/60 hover:text-accent hover:bg-accent/5'}`}
                                >
                                    <span className="text-[10px] font-black uppercase tracking-widest mr-1 opacity-70">Read Today's Daily Manna 🍞</span>
                                    <div className="relative flex items-center justify-center">
                                        <Sparkles size={14} className={!isDailyMannaOpen ? 'animate-pulse text-amber-500' : ''} />
                                        {!isDailyMannaOpen && (
                                            <div className="absolute inset-0 w-full h-full bg-amber-500 rounded-full animate-ping opacity-20" />
                                        )}
                                    </div>
                                    <span className="text-[10px] font-bold font-mono">{dailyManna.date}</span>
                                </button>

                                {isDailyMannaOpen && (
                                    <div className="absolute right-0 top-14 w-[calc(100vw-2rem)] sm:w-[400px] bg-card-bg border border-border rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.2)] p-6 z-[100] animate-in slide-in-from-top-4 duration-300">
                                        <div className="flex items-center justify-between mb-4">
                                            <div className="flex items-center gap-2 text-accent">
                                                <Sparkles size={16} />
                                                <span className="text-xs font-black uppercase tracking-[0.2em]">Heavenly Message</span>
                                            </div>
                                            <button onClick={() => setIsDailyMannaOpen(false)} className="text-muted hover:text-foreground">
                                                <X size={16} />
                                            </button>
                                        </div>
                                        <div className="text-[11px] font-black text-accent/60 uppercase tracking-widest mb-1">{dailyManna.date}</div>
                                        <div className="text-[13px] leading-relaxed text-foreground/90 italic font-serif space-y-3 whitespace-pre-wrap max-h-[40vh] overflow-y-auto custom-scrollbar pr-2">
                                            {dailyManna.message}
                                        </div>
                                        <div className="mt-6 pt-6 border-t border-border/50 space-y-4">
                                            <button
                                                onClick={() => window.open('https://chat.whatsapp.com/JHD6LT3xDcp93tt1DDSWED', '_blank')}
                                                className="w-full py-3 bg-[#25D366]/10 text-[#25D366] border border-[#25D366]/20 rounded-xl font-black text-[10px] uppercase tracking-[0.2em] flex items-center justify-center gap-2 hover:bg-[#25D366]/20 transition-all active:scale-95"
                                            >
                                                <MessageCircle size={14} fill="currentColor" className="opacity-20" />
                                                Join WhatsApp Community
                                            </button>

                                            <div className="flex items-center justify-between gap-3">
                                                <button
                                                    onClick={() => {
                                                        const text = encodeURIComponent(`✨ *Daily Manna (${dailyManna.date})* ✨\n\n${dailyManna.message}\n\n🙏 _Grounded in Grace_\n📖 Read more at: dailymannaai.com`);
                                                        window.open(`https://wa.me/?text=${text}`, '_blank');
                                                        showToast("Opening WhatsApp...", "success");
                                                    }}
                                                    className="flex-1 py-3 bg-accent text-white rounded-xl font-black text-[10px] uppercase tracking-[0.2em] flex items-center justify-center gap-2 shadow-lg shadow-accent/20 hover:scale-[1.02] transition-all active:scale-95"
                                                >
                                                    <Share2 size={14} />
                                                    Share to WhatsApp
                                                </button>

                                                <button
                                                    onClick={() => {
                                                        navigator.clipboard.writeText(`Daily Manna (${dailyManna.date}):\n\n${dailyManna.message}\n\n🙏 Grounded in Grace\n📖 Read more at: dailymannaai.com`);
                                                        showToast("Today's Manna copied to heart & clipboard", "success");
                                                    }}
                                                    className="flex-1 py-3 bg-muted/10 text-muted-foreground border border-border rounded-xl font-black text-[10px] uppercase tracking-[0.2em] flex items-center justify-center gap-2 hover:bg-muted/20 transition-all active:scale-95"
                                                >
                                                    <Copy size={14} />
                                                    Copy Word
                                                </button>
                                            </div>

                                            <div className="text-center">
                                                <span className="text-[8px] font-bold text-muted uppercase tracking-widest opacity-50">#1 Spiritual Resource Provider</span>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Other existing header right items could go here */}
                    </div>
                </header>

                <div className="flex-1 flex overflow-hidden pt-0">
                    {/* 2a. Main Chat Area */}
                    <div className="flex-1 flex flex-col relative overflow-hidden">
                        <div
                            ref={chatContainerRef}
                            onScroll={handleChatScroll}
                            className="flex-1 overflow-y-auto px-4 pb-48 md:px-10 pt-14 space-y-6 relative custom-scrollbar"
                        >
                            <div className="max-w-3xl mx-auto">
                                <div className="chat-focus-messages space-y-6 pt-2">
                                    {messages.length === 1 && (
                                        <div className="flex flex-col items-center justify-center min-h-[50vh] text-center animate-in fade-in zoom-in-95 duration-1000 ease-out">
                                            <div className="mb-8 p-4 rounded-3xl bg-accent/5 ring-1 ring-accent/10 animate-bounce-subtle">
                                                <svg width="48" height="48" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg" className="text-red-600">
                                                    <path d="M10 2h4v6h6v4h-6v10h-4v-10h-6v-4h6V2z" />
                                                </svg>
                                            </div>
                                            <h1 className="text-4xl md:text-5xl font-extrabold mb-6 tracking-tight text-foreground">
                                                What can I help with?
                                            </h1>
                                            <div className="flex flex-wrap justify-center gap-3 max-w-2xl mx-auto">
                                                {["Explain Romans 8", "John Wesley on Grace", "Study guide for Ephesians", "Sermon summary"].map((hint, idx) => (
                                                    <button
                                                        key={idx}
                                                        onClick={() => setInput(hint)}
                                                        className="px-4 py-2 bg-card-bg border border-border rounded-full text-xs font-bold text-muted-foreground hover:border-accent hover:text-accent transition-all"
                                                    >
                                                        {hint}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                    <div className="space-y-8 pb-6">
                                        {messages.map((msg: any, i) => (
                                            <div key={i} className={`group flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''} animate-in slide-in-from-bottom-6 fade-in duration-700 ease-out`}>
                                                <div className={`h-10 w-10 rounded-xl flex-shrink-0 flex items-center justify-center text-white text-lg font-bold shadow-lg transition-transform hover:scale-105 ${msg.role === 'user' ? 'bg-gradient-to-br from-accent to-accent-secondary' : 'bg-card-bg border border-border text-red-600 shadow-xl'}`}>
                                                    {msg.role === 'user' ? 'U' : (
                                                        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg" className="text-red-600 drop-shadow-md">
                                                            <path d="M10 2h4v6h6v4h-6v10h-4v-10h-6v-4h6V2z" />
                                                        </svg>
                                                    )}
                                                </div>
                                                <div className={`flex flex-col gap-3 ${msg.role === 'user' ? 'items-end max-w-[80%]' : 'items-start max-w-[85%] flex-1'}`}>
                                                    {msg.role === 'assistant' && (
                                                        <div className={`flex flex-wrap items-center gap-3 md:gap-6 px-4 mb-2 transition-opacity ${isMobile ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>

                                                            <button
                                                                onClick={() => handleSpeakMessage(msg.content, i)}
                                                                className={`flex items-center gap-2 text-[10px] md:text-[11px] font-black uppercase tracking-[0.15em] transition-all hover:scale-105 active:scale-95 ${isSpeakingMap[i] ? 'text-accent' : 'text-muted-foreground/70 hover:text-accent'}`}
                                                            >
                                                                <Volume2 size={isMobile ? 18 : 14} className={isSpeakingMap[i] ? 'animate-pulse' : ''} />
                                                                {isSpeakingMap[i] ? 'Stop' : 'Listen'}
                                                            </button>

                                                            <button
                                                                onClick={() => downloadMessageMp3(msg.content, msg.content.substring(0, 15))}
                                                                className="text-muted-foreground/70 hover:text-accent flex items-center gap-2 text-[10px] md:text-[11px] font-black uppercase tracking-[0.15em] transition-all hover:scale-105 active:scale-95"
                                                            >
                                                                <FileAudio size={isMobile ? 18 : 14} /> MP3
                                                            </button>


                                                            <button
                                                                onClick={() => addNoteAtCursor(msg.content)}
                                                                className="text-muted-foreground/70 hover:text-accent flex items-center gap-2 text-[10px] md:text-[11px] font-black uppercase tracking-[0.15em] transition-all hover:scale-105 active:scale-95"
                                                            >
                                                                <Pin size={isMobile ? 18 : 14} /> Pin
                                                            </button>
                                                            <button
                                                                onClick={() => navigator.clipboard.writeText(msg.content)}
                                                                className="text-muted-foreground/70 hover:text-accent flex items-center gap-2 text-[10px] md:text-[11px] font-black uppercase tracking-[0.15em] transition-all hover:scale-105 active:scale-95"
                                                            >
                                                                <Copy size={isMobile ? 18 : 14} /> Copy
                                                            </button>
                                                        </div>
                                                    )}
                                                    <div className={`${msg.role === 'user' ? 'bg-accent/5 ring-1 ring-accent/20' : 'bg-card-bg/70 backdrop-blur-xl border border-border/50'} rounded-3xl p-6 px-7 text-[17px] leading-relaxed select-text shadow-xl transition-all hover:border-accent/40 w-fit max-w-full`}>
                                                        {msg.role === 'assistant' && (msg.thought || msg.isThinking || (msg.researchSteps && msg.researchSteps.length > 0)) && (
                                                            <div className="mb-4">
                                                                <details className="group" open={msg.isThinking}>
                                                                    <summary className="flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.15em] cursor-pointer hover:opacity-80 transition-all list-none select-none py-2 px-4 rounded-xl bg-gradient-to-r from-blue-600/15 to-purple-600/15 border border-blue-500/30 hover:border-blue-400/50 shadow-sm relative shine">
                                                                        <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${msg.isThinking ? 'bg-blue-600 text-white animate-pulse' : 'bg-blue-600/20 text-blue-600 dark:text-blue-400'}`}>
                                                                            {msg.isThinking ? '⚡' : '💭'}
                                                                        </span>
                                                                        <span className="text-blue-700 dark:text-blue-400 font-bold">
                                                                            {msg.isThinking ? (msg.thinkingPhase || "Analyzing...") : "View Reasoning Process"}
                                                                        </span>
                                                                        <span className="ml-auto text-blue-600/50 group-open:rotate-180 transition-transform text-[10px]">▼</span>
                                                                    </summary>
                                                                    <div className="mt-2 relative overflow-hidden rounded-2xl border border-blue-500/30 shadow-2xl">
                                                                        {/* DeepSeek-style left gradient stripe */}
                                                                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-blue-500 via-purple-500 to-blue-400 z-10" />
                                                                        <div className="pl-6 pr-4 py-5 bg-slate-900 dark:bg-black/80 backdrop-blur-md">
                                                                            {/* Research Steps Log */}
                                                                            {msg.researchSteps && msg.researchSteps.length > 0 && (
                                                                                <div className="mb-4 space-y-2 border-b border-white/5 pb-4">
                                                                                    {msg.researchSteps.map((step: string, idx: number) => (
                                                                                        <div key={idx} className={`flex items-start gap-2.5 text-[12px] text-blue-200/90 ${msg.isThinking && idx === msg.researchSteps.length - 1 ? 'animate-pulse' : ''}`}>
                                                                                            <CheckCircle2 size={13} className="text-blue-400 mt-0.5 flex-shrink-0" />
                                                                                            <span className="font-semibold leading-tight">{step}</span>
                                                                                        </div>
                                                                                    ))}
                                                                                </div>
                                                                            )}
                                                                            {/* Thought content */}
                                                                            <div className="text-[14px] text-slate-100/90 leading-relaxed font-mono whitespace-pre-wrap select-text">
                                                                                {msg.thought}
                                                                                {msg.isThinking && <span className="inline-flex ml-1 w-1.5 h-1.5 bg-blue-400 rounded-full animate-pulse" />}
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                </details>
                                                            </div>
                                                        )}
                                                        <div className={`whitespace-pre-wrap break-words [overflow-wrap:anywhere] transition-all duration-700 ${!msg.content && msg.isThinking ? 'opacity-40 animate-pulse italic text-sm' : 'opacity-100'}`}>
                                                            {msg.content || (msg.isThinking ? "Preparing inspired response based on research..." : "")}
                                                        </div>
                                                    </div>
                                                    {msg.role === 'assistant' && (
                                                        <div className="space-y-4">
                                                            {/* Follow-up Suggestions (Only for the latest message) */}
                                                            {i === messages.length - 1 && suggestions.length > 0 && !isChatting && (
                                                                <div className="mt-8 px-4 space-y-5 animate-in fade-in slide-in-from-left-4 duration-700 delay-300">
                                                                    <div className="flex items-center gap-3 text-[11px] text-accent/80 font-black uppercase tracking-[0.2em] mb-2">
                                                                        <Sparkles size={14} className="text-accent animate-pulse" />
                                                                        <span>Continue your study:</span>
                                                                    </div>
                                                                    <div className="flex flex-wrap gap-3">
                                                                        {suggestions.map((suggestion, sIdx) => (
                                                                            <button
                                                                                key={sIdx}
                                                                                onClick={() => handleSendMessage(suggestion)}
                                                                                className="px-6 py-3.5 bg-accent/5 border border-accent/20 rounded-2xl text-[13px] font-bold text-foreground/90 hover:text-accent hover:border-accent/50 hover:bg-accent/10 hover:shadow-lg hover:shadow-accent/5 transition-all hover:-translate-y-1 active:scale-95 text-left max-w-sm"
                                                                            >
                                                                                {suggestion}
                                                                            </button>
                                                                        ))}
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        ))}

                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Center Chat Input space removed - moved to footer */}
                    </div>
                </div>

                {/* 🚀 WORLD-CLASS FLOATING SEARCH BAR (ChatGPT/Antigravity Style) */}
                <div className="fixed bottom-0 left-0 right-0 z-[100] px-4 pb-8 pt-24 pointer-events-none bg-gradient-to-t from-background via-background/90 to-transparent">
                    <div className="max-w-3xl mx-auto flex flex-col gap-4 pointer-events-auto">
                        {/* Compact Tool Row (Subtle) */}
                        <div className="flex items-center justify-center gap-2 overflow-x-auto no-scrollbar pb-1 px-2">
                            {[
                                { label: 'Divine Intervention', icon: <Sparkles size={14} />, action: handleDivineMeditation, color: 'text-amber-500 bg-amber-500/15 border-amber-500/30' },
                                { label: 'Audio Podcast', icon: <Mic2 size={14} />, action: generateAudioOverview, color: 'text-accent bg-accent/15 border-accent/20' },
                                { label: 'Image Studio', icon: <ImageIcon size={14} />, action: () => setIsStudioOpen(true), color: 'text-rose-500 bg-rose-500/15 border-rose-500/30' }
                            ].map((tool, idx) => (
                                <button
                                    key={idx}
                                    onClick={tool.action}
                                    title={tool.label === 'Image Studio' ? 'Generate Image' : tool.label}
                                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-[10px] font-bold transition-all hover:scale-105 active:scale-95 whitespace-nowrap shadow-sm ${tool.color}`}
                                >
                                    {tool.icon}
                                    {tool.label}
                                </button>
                            ))}
                        </div>

                        {/* ChatGPT-Style Simple & Effective Search Bar */}
                        <div className="relative group">
                            <div className="relative bg-card-bg/95 backdrop-blur-3xl border border-border/40 rounded-[1.8rem] shadow-[0_20px_60px_rgba(0,0,0,0.3)] focus-within:ring-1 ring-accent/30 transition-all p-3 md:p-4 pb-3 flex flex-col gap-1.5 group-hover:border-accent/20">
                                <textarea
                                    ref={textareaRef}
                                    placeholder="Ask DailyMannaAI about Bible or scriptures..."
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' && !e.shiftKey) {
                                            e.preventDefault();
                                            handleSendMessage();
                                        }
                                    }}
                                    className="w-full bg-transparent border-none py-1.5 px-2 text-[16px] md:text-[17px] focus:outline-none resize-none max-h-60 overflow-y-auto placeholder:text-muted/50 leading-relaxed"
                                    rows={1}
                                />

                                <div className="flex items-center justify-between px-1">
                                    <button
                                        onClick={() => setUploadModalOpen(true)}
                                        className="p-2.5 bg-muted/5 hover:bg-accent/10 rounded-xl text-muted/60 hover:text-accent transition-all hover:scale-105"
                                        title="Add Source"
                                    >
                                        <Plus size={22} className="stroke-[2.5px]" />
                                    </button>

                                    <div className="flex items-center gap-3">
                                        <VoiceInput
                                            onTranscript={(text) => setInput(text)}
                                            onInterimTranscript={(text) => text && setInput(text)}
                                            onListeningChange={(active) => setIsVoiceActive(active)}
                                            className="voice-input-mic"
                                        />
                                        <button
                                            onClick={() => isChatting ? handleAbortChat() : handleSendMessage()}
                                            disabled={!input.trim() && !isChatting}
                                            className={`p-2.5 rounded-full transition-all ${input.trim() || isChatting ? 'bg-accent text-white shadow-xl shadow-accent/40 hover:scale-110 active:scale-95' : 'bg-muted/10 text-muted/30 opacity-40 cursor-not-allowed'}`}
                                            title={isChatting ? "Stop generating" : "Send message"}
                                        >
                                            {isChatting ? (
                                                <Square size={22} className="fill-white stroke-none" />
                                            ) : (
                                                <ArrowRight size={22} className="stroke-[3px]" />
                                            )}
                                        </button>
                                    </div>
                                </div>
                            </div>

                        </div>
                    </div>
                </div>
            </main>
            {/* Audio Overview Container - Moved to a separate flex column */}
            {/* 2b. Audio Overview Sidebar - Integrated Docked View */}
            {audioOverview && isAudioOverviewOpen && (
                <div className="w-full md:w-[400px] border-l border-border bg-card-bg/30 backdrop-blur-3xl animate-in slide-in-from-right duration-500 flex flex-col h-full overflow-hidden shrink-0 z-50 fixed md:relative inset-0 md:inset-auto">
                    <div className="flex items-center justify-between p-4 border-b border-border shadow-sm">
                        <div className="flex items-center gap-2 text-accent">
                            <Mic2 size={16} />
                            <span className="text-xs font-bold uppercase tracking-wider text-foreground">Audio Overview</span>
                        </div>
                        <button onClick={() => { stopAudio(); setIsAudioOverviewOpen(false); setAudioOverview(null); }} className="p-2 hover:bg-red-500/10 hover:text-red-500 rounded-lg transition-colors">
                            <X size={16} />
                        </button>
                    </div>

                    {/* Bible Explorer Link */}
                    <button
                        onClick={() => window.open('/bible-explorer', '_blank')}
                        className="mx-4 my-4 flex items-center gap-3 px-4 py-3 bg-accent/5 border border-accent/10 hover:border-accent/30 hover:bg-accent/10 rounded-xl transition-all group"
                    >
                        <BookOpen className="w-5 h-5 text-accent group-hover:scale-110 transition-transform" />
                        <div className="text-left">
                            <p className="text-xs font-bold text-foreground">Bible Explorer</p>
                            <p className="text-[10px] text-muted">Study grounded in scripture</p>
                        </div>
                        <ExternalLink className="w-4 h-4 ml-auto opacity-0 group-hover:opacity-100 transition-opacity text-accent" />
                    </button>

                    <div className="px-6 py-4 border-b border-border bg-gradient-to-br from-accent/5 to-accent-secondary/5">
                        <div className="flex flex-col items-center gap-4 text-center">
                            <div>
                                <p className="text-xs font-black uppercase tracking-widest text-accent mb-1">
                                    {isPlaying ? (isPaused ? 'Paused' : 'Now Playing') : 'Ready to Play'}
                                </p>
                                <p className="text-[10px] text-muted leading-tight">
                                    {isPlaying ? 'David & Sarah are discussing your research' : 'Click play to start the podcast overview'}
                                </p>
                            </div>

                            <div className="flex items-center gap-6 py-2">
                                {!isPlaying ? (
                                    <button
                                        onClick={playAudio}
                                        className="h-14 w-14 bg-accent text-white rounded-full flex items-center justify-center shadow-lg shadow-accent/30 hover:bg-accent/90 hover:scale-105 transition-all active:scale-95"
                                    >
                                        <ArrowRight size={24} className="rotate-90 ml-1" />
                                    </button>
                                ) : isPaused ? (
                                    <button
                                        onClick={resumeAudio}
                                        className="h-14 w-14 bg-accent text-white rounded-full flex items-center justify-center shadow-lg shadow-accent/30 hover:bg-accent/90 hover:scale-105 transition-all active:scale-95"
                                    >
                                        <ArrowRight size={24} className="rotate-90 ml-1" />
                                    </button>
                                ) : (
                                    <button
                                        onClick={pauseAudio}
                                        className="h-14 w-14 bg-accent text-white rounded-full flex items-center justify-center shadow-lg shadow-accent/30 hover:bg-accent/90 hover:scale-105 transition-all active:scale-95"
                                    >
                                        <div className="flex gap-1.5">
                                            <div className="w-1.5 h-6 bg-white rounded"></div>
                                            <div className="w-1.5 h-6 bg-white rounded"></div>
                                        </div>
                                    </button>
                                )}
                                <button
                                    onClick={stopAudio}
                                    className="h-10 w-10 border border-border hover:bg-red-500/10 hover:text-red-500 hover:border-red-500/30 rounded-full flex items-center justify-center transition-all"
                                >
                                    <div className="w-3 h-3 bg-current rounded-sm"></div>
                                </button>
                            </div>

                            {isPlaying && !isPaused && (
                                <div className="w-full h-1 bg-accent/10 rounded-full overflow-hidden">
                                    <div className="h-full bg-accent animate-pulse w-full"></div>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-6 space-y-6">
                        <div>
                            <h4 className="font-bold text-lg mb-2 text-foreground">{audioOverview?.title || 'Overview'}</h4>
                            <div className="text-[12px] leading-relaxed text-foreground/80 whitespace-pre-wrap font-serif">
                                {audioOverview?.script || ''}
                            </div>
                        </div>
                    </div>

                    <div className="p-4 border-t border-border bg-card-bg/50 backdrop-blur-sm space-y-3">
                        <div className="flex items-center justify-between px-2">
                            <span className="text-[10px] text-muted font-bold uppercase tracking-tighter">AI Voices: David & Sarah</span>
                            <button onClick={() => audioOverview && navigator.clipboard.writeText(audioOverview.script)} className="text-[10px] text-accent font-bold hover:underline">Copy Script</button>
                        </div>
                        <div className="flex gap-2">
                            <button onClick={downloadMp3} className="flex-1 py-2.5 bg-accent text-white rounded-xl hover:bg-accent/90 font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-accent/10">
                                <FileAudio size={14} /> Download MP3
                            </button>
                            <button onClick={downloadAudio} className="p-2.5 border border-border rounded-xl hover:bg-muted/10 transition-colors">
                                <ArrowRight size={14} className="rotate-90" />
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
