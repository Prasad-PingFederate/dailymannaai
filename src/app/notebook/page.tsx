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
    CheckCircle2
} from "lucide-react";
import { resolvePortrait, resolveSituationalImage, FALLBACK_IMAGE } from "@/lib/ai/image-resolver";

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
        { id: "Historical-Missionaries-Pioneers", name: "Historical Missionaries", type: "text", selected: true },
        { id: "Modern-Evangelists-Missionaries", name: "Modern Evangelists", type: "text", selected: true },
        { id: "Joshua-Daniel-Doing-Gods-Will", name: "Joshua Daniel - Doing God's Will", type: "text", selected: true }
    ]);
    const [audioOverview, setAudioOverview] = useState<null | { title: string; script: string }>(null);
    const [isGeneratingAudio, setGeneratingAudio] = useState(false);
    const [isSummarizing, setIsSummarizing] = useState(false);
    const [isRefining, setIsRefining] = useState(false);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const [selectedVoice, setSelectedVoice] = useState<'male' | 'female'>('male');
    const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
    const [uploadMode, setUploadMode] = useState<'file' | 'website' | 'text'>('file');
    const [websiteUrl, setWebsiteUrl] = useState("");
    const [websiteTitle, setWebsiteTitle] = useState("");
    const [pastedText, setPastedText] = useState("");
    const [pastedTitle, setPastedTitle] = useState("");
    const [isIngesting, setIsIngesting] = useState(false);
    const [isGrammarChecking, setIsGrammarChecking] = useState(false);
    const [viewingSource, setViewingSource] = useState<any>(null);
    const [isGeneratingGuide, setIsGeneratingGuide] = useState(false);
    const [suggestions, setSuggestions] = useState<string[]>([]);
    const [chatSidebarWidth, setChatSidebarWidth] = useState(450);
    const [isResizing, setIsResizing] = useState(false);

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

    // Load available voices
    React.useEffect(() => {
        const loadVoices = () => {
            const voices = window.speechSynthesis.getVoices();
            setAvailableVoices(voices);
        };

        loadVoices();
        window.speechSynthesis.onvoiceschanged = loadVoices;
    }, []);

    // --- Notification System ---
    const [notification, setNotification] = useState<{ message: string, type: 'success' | 'error' } | null>(null);

    const showToast = (message: string, type: 'success' | 'error') => {
        setNotification({ message, type });
        setTimeout(() => setNotification(null), 4000); // Auto hide after 4s
    };

    // --- Resizing Logic ---
    const startResizing = (e: React.MouseEvent) => {
        setIsResizing(true);
        e.preventDefault();
    };

    const stopResizing = () => {
        setIsResizing(false);
    };

    const resize = (e: MouseEvent) => {
        if (isResizing) {
            const newWidth = window.innerWidth - e.clientX;
            if (newWidth > 300 && newWidth < 800) {
                setChatSidebarWidth(newWidth);
            }
        }
    };

    useEffect(() => {
        if (isResizing) {
            window.addEventListener("mousemove", resize);
            window.addEventListener("mouseup", stopResizing);
        } else {
            window.removeEventListener("mousemove", resize);
            window.removeEventListener("mouseup", stopResizing);
        }

        return () => {
            window.removeEventListener("mousemove", resize);
            window.removeEventListener("mouseup", stopResizing);
        };
    }, [isResizing]);

    const toggleSource = (id: string) => {
        setSources(prev => prev.map(s =>
            s.id === id ? { ...s, selected: !s.selected } : s
        ));
    };

    const handleFileUpload = async (file: File) => {
        const id = `Source-${Date.now()}`;
        const fileName = file.name;
        const fileType = file.type;
        const isMP3 = fileType === "audio/mpeg" || fileName.toLowerCase().endsWith(".mp3");
        const isPDF = fileType === "application/pdf" || fileName.toLowerCase().endsWith(".pdf");

        const newSource = { id, name: fileName, type: isMP3 ? "audio" : "pdf", selected: true };

        setIsIngesting(true);
        showToast("Processing file...", "success");

        try {
            let payload: FormData | string;
            let headers = {};
            let body: any;

            // CLIENT-SIDE PDF PARSING (Bypass Vercel 4.5MB Limit)
            if (isPDF) {
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
                        console.warn("Client-side extracted scarce text. Sending to server for OCR...");
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

                } catch (pdfErr: any) {
                    console.error("Client-side PDF parse failed:", pdfErr);
                    // If it was the "Scanned" error, show it and STOP. Don't fallback to server (server will also fail on scanned).
                    if (pdfErr.message.includes("Scanned")) {
                        showToast(pdfErr.message, "error");
                        setIsIngesting(false);
                        return;
                    }

                    showToast(`Client parse failed (${pdfErr.message}), trying server...`, "error");
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
                data = await res.json();
            } catch (e) {
                const text = await res.text();
                throw new Error(`Server Error (${res.status}): ${text.substring(0, 50)}...`);
            }

            if (!res.ok) throw new Error(data.error || "Failed to ingest file");

            setSources(prev => [...prev, {
                ...newSource,
                fullContent: data.preview || "Text content extracted successfully."
            }]);
            setUploadModalOpen(false);

            showToast(`Successfully uploaded "${fileName}"`, 'success');

            const assistanceMessage = isMP3
                ? `I've finished transcribing and "listening" to the sermon "${fileName}". I can now answer questions about the message and the scriptures mentioned in it!`
                : `I've finished reading and indexing "${fileName}". I have "learned" its spiritual content and can now answer any questions about it!`;

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
        try {
            const res = await fetch("/api/ingest", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ url: websiteUrl, name: websiteTitle, mode: "website" }),
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Failed to ingest website");

            const id = `Web-${Date.now()}`;
            setSources(prev => [...prev, {
                id,
                name: websiteTitle,
                type: "text",
                selected: true,
                fullContent: data.preview
            }]);
            setUploadModalOpen(false);
            setWebsiteUrl("");
            setWebsiteTitle("");

            showToast("Website content added successfully", 'success');

            setMessages(prev => [...prev, {
                role: "assistant",
                content: `I've finished exploring and "learning" from the website "${websiteTitle}". I'm ready to answer any questions about it!`
            }]);
        } catch (error: any) {
            console.error("Website Ingest Error:", error);
            showToast(error.message, 'error');
            setMessages(prev => [...prev, {
                role: "assistant",
                content: `Sorry, I had trouble visiting that website: ${error.message}`
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
                content: `I've learned from your pasted note "${pastedTitle}". It's now part of my collective wisdom!`
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

    const handleSendMessage = async (overrideText?: string) => {
        const textToSend = overrideText || input;
        if (!textToSend.trim()) return;

        const userMessage = { role: "user", content: textToSend };
        setMessages(prev => [...prev, userMessage]);
        setInput("");
        setSuggestions([]); // Clear previous suggestions

        try {
            const res = await fetch("/api/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    query: textToSend,
                    history: messages // Pass the history before the new message
                }),
            });

            const data = await res.json();

            if (data.role === "assistant") {
                setMessages(prev => [...prev, {
                    role: "assistant",
                    content: data.content
                }]);
                if (data.suggestions) {
                    setSuggestions(data.suggestions);
                }
            }
        } catch (error) {
            console.error("Chat Error:", error);
            setMessages(prev => [...prev, {
                role: "assistant",
                content: "I'm having trouble connecting to my brain. Please try again later."
            }]);
        }
    };

    const handleSummarize = async () => {
        const selectedSourceIds = sources.filter(s => s.selected).map(s => s.id);

        if (selectedSourceIds.length === 0) {
            alert("Please select at least one source to summarize.");
            return;
        }

        setIsSummarizing(true);
        try {
            const res = await fetch("/api/summarize", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ sourceIds: selectedSourceIds }),
            });

            const data = await res.json();

            if (res.ok) {
                // Add summary to notes
                setNoteContent(prev => prev + (prev ? "\n\n" : "") + "## Summary\n\n" + data.summary);
                setMessages(prev => [...prev, {
                    role: "assistant",
                    content: `I've created a summary of ${data.sourceCount} source(s) and added it to your notes!`
                }]);
            } else {
                throw new Error(data.error || "Failed to generate summary");
            }
        } catch (error: any) {
            console.error("Summarize Error:", error);
            setMessages(prev => [...prev, {
                role: "assistant",
                content: `Sorry, I had trouble creating the summary: ${error.message}`
            }]);
        } finally {
            setIsSummarizing(false);
        }
    };

    const handleRefine = async () => {
        if (!noteContent || noteContent.trim().length === 0) {
            alert("Please write some notes first, then I can help refine them.");
            return;
        }

        setIsRefining(true);
        try {
            const res = await fetch("/api/refine", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ text: noteContent }),
            });

            const data = await res.json();

            if (res.ok) {
                setNoteContent(data.refined);
                setMessages(prev => [...prev, {
                    role: "assistant",
                    content: "I've refined your notes! Check the editor to see the improvements."
                }]);
            } else {
                throw new Error(data.error || "Failed to refine text");
            }
        } catch (error: any) {
            console.error("Refine Error:", error);
            setMessages(prev => [...prev, {
                role: "assistant",
                content: `Sorry, I had trouble refining your notes: ${error.message}`
            }]);
        } finally {
            setIsRefining(false);
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

            // Build a nice message for the assistant
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

    const handleGenerateGuide = async (type: "study-guide" | "faq" | "timeline" | "briefing doc") => {
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
                    sources: selectedSources.map(s => s.name)
                }),
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Failed to generate guide");

            const label = type === "study-guide" ? "Study Guide" :
                type === "faq" ? "FAQ" :
                    type === "timeline" ? "Timeline" : "Briefing Doc";

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
            const res = await fetch("/api/audio-overview", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ sourceIds: selectedSourceIds }),
            });

            const data = await res.json();

            if (res.ok) {
                setAudioOverview({
                    title: data.title,
                    script: data.script
                });
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
            currentIndex++;

            // Skip empty lines or non-dialogue lines
            if (!line.includes(':')) {
                speakNextLine();
                return;
            }

            // Extract speaker and text
            const [speaker, ...textParts] = line.split(':');
            const text = textParts.join(':').trim();

            if (!text) {
                speakNextLine();
                return;
            }

            const utterance = new SpeechSynthesisUtterance(text);

            // Assign voice based on speaker
            const isSarah = speaker.toLowerCase().includes('sarah');
            const voice = isSarah ? femaleVoice : maleVoice;

            if (voice) {
                utterance.voice = voice;
            }

            utterance.rate = 0.95;
            utterance.pitch = isSarah ? 1.1 : 0.9;
            utterance.volume = 1.0;

            utterance.onend = () => {
                // Small pause between speakers
                if (isPlayingRef.current) {
                    setTimeout(() => {
                        if (isPlayingRef.current) speakNextLine();
                    }, 300);
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
                                    { mode: 'file', icon: <Upload size={20} />, label: "Upload Files", sub: "PDF, TXT, MD" },
                                    { mode: 'website', icon: <Globe size={20} />, label: "Website", sub: "Enter URL" },
                                    { mode: 'text', icon: <LinkIcon size={20} />, label: "Copy-Paste", sub: "Direct text" }
                                ].map((option, i) => (
                                    <button
                                        key={i}
                                        onClick={() => setUploadMode(option.mode as any)}
                                        className={`flex flex-col items-center justify-center gap-3 p-6 rounded-2xl border transition-all group ${uploadMode === option.mode ? 'bg-accent/10 border-accent text-accent' : 'bg-background border-border hover:bg-accent/5'}`}
                                    >
                                        <div className={`p-3 rounded-xl transition-colors ${uploadMode === option.mode ? 'bg-accent/20 text-accent' : 'bg-muted/10 text-muted group-hover:text-accent group-hover:bg-accent/10'}`}>
                                            {option.icon}
                                        </div>
                                        <div className="text-center">
                                            <div className="text-sm font-bold">{option.label}</div>
                                            <div className="text-[10px] text-muted uppercase tracking-tight">{option.sub}</div>
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
                            ) : uploadMode === 'website' ? (
                                <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-muted uppercase tracking-wider">Site Name</label>
                                        <input
                                            type="text"
                                            placeholder="e.g., Sadhu Sundar Singh Biography"
                                            value={websiteTitle}
                                            onChange={(e) => setWebsiteTitle(e.target.value)}
                                            className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm focus:ring-1 focus:ring-accent outline-none"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-muted uppercase tracking-wider">Website URL</label>
                                        <input
                                            type="url"
                                            placeholder="https://example.com/page"
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
                                        {isIngesting ? 'Exploring Website...' : 'Ingest Website'}
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
                        <div className="flex-1 overflow-y-auto p-8 leading-relaxed text-foreground select-text custom-scrollbar">
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
                                <div
                                    title="View full source content"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setViewingSource(source);
                                    }}
                                    className="p-1 hover:bg-accent/20 rounded text-muted hover:text-accent transition-colors opacity-0 group-hover:opacity-100"
                                >
                                    <Eye size={14} />
                                </div>
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
                    <div className="absolute top-20 right-6 w-96 max-h-[calc(100vh-120px)] glass-morphism rounded-2xl shadow-2xl border border-accent/20 animate-in slide-in-from-top-4 duration-500 z-40 flex flex-col">
                        <div className="flex items-center justify-between p-4 border-b border-border">
                            <div className="flex items-center gap-2 text-accent">
                                <Mic2 size={16} />
                                <span className="text-xs font-bold uppercase tracking-wider">Audio Overview</span>
                            </div>
                            <button onClick={() => { stopAudio(); setAudioOverview(null); }} className="text-muted hover:text-foreground">
                                <X size={14} />
                            </button>
                        </div>

                        {/* Audio Controls */}
                        <div className="p-6 border-b border-border bg-gradient-to-br from-accent/10 to-accent-secondary/10">
                            <div className="flex flex-col items-center gap-4">
                                {/* Status Text - Large and Prominent */}
                                <div className="text-center">
                                    <p className="text-sm font-bold text-foreground mb-1">
                                        {isPlaying ? (isPaused ? '⏸️ Paused' : '🔊 Playing Podcast...') : '🎧 Ready to Listen'}
                                    </p>
                                    <p className="text-[10px] text-muted">
                                        {isPlaying ? '👨 David & 👩 Sarah - Two Voice Conversation' : 'Click play for two-voice podcast'}
                                    </p>
                                </div>

                                {/* Play/Pause/Stop Controls */}
                                <div className="flex items-center justify-center gap-6">
                                    {!isPlaying ? (
                                        <div className="flex flex-col items-center gap-2">
                                            <button
                                                onClick={playAudio}
                                                className="h-16 w-16 bg-accent text-white rounded-full flex items-center justify-center shadow-lg shadow-accent/30 hover:bg-accent/90 hover:scale-105 transition-all active:scale-95"
                                                title="Start Podcast"
                                            >
                                                <ArrowRight size={28} className="rotate-90 ml-0.5" />
                                            </button>
                                            <span className="text-[10px] font-bold uppercase tracking-wider text-muted">Start</span>
                                        </div>
                                    ) : isPaused ? (
                                        <div className="flex flex-col items-center gap-2">
                                            <button
                                                onClick={resumeAudio}
                                                className="h-16 w-16 bg-accent text-white rounded-full flex items-center justify-center shadow-lg shadow-accent/30 hover:bg-accent/90 hover:scale-105 transition-all active:scale-95"
                                                title="Resume Podcast"
                                            >
                                                <ArrowRight size={28} className="rotate-90 ml-0.5" />
                                            </button>
                                            <span className="text-[10px] font-bold uppercase tracking-wider text-muted">Resume</span>
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center gap-2">
                                            <button
                                                onClick={pauseAudio}
                                                className="h-16 w-16 bg-accent text-white rounded-full flex items-center justify-center shadow-lg shadow-accent/30 hover:bg-accent/90 hover:scale-105 transition-all active:scale-95"
                                                title="Pause Podcast"
                                            >
                                                <div className="flex gap-1.5">
                                                    <div className="w-1.5 h-6 bg-white rounded"></div>
                                                    <div className="w-1.5 h-6 bg-white rounded"></div>
                                                </div>
                                            </button>
                                            <span className="text-[10px] font-bold uppercase tracking-wider text-muted">Pause</span>
                                        </div>
                                    )}

                                    <div className="flex flex-col items-center gap-2">
                                        <button
                                            onClick={stopAudio}
                                            disabled={!isPlaying && !isPaused}
                                            className={`h-12 w-12 rounded-full flex items-center justify-center border transition-all ${isPlaying || isPaused
                                                ? "bg-red-500/10 text-red-500 border-red-500/20 hover:bg-red-500/20"
                                                : "bg-muted/5 text-muted/30 border-transparent cursor-not-allowed"
                                                }`}
                                            title="Stop Podcast"
                                        >
                                            <div className="w-4 h-4 bg-current rounded-sm"></div>
                                        </button>
                                        <span className={`text-[10px] font-bold uppercase tracking-wider ${isPlaying || isPaused ? "text-muted" : "text-muted/30"}`}>Stop</span>
                                    </div>
                                </div>

                                {/* Progress Indicator */}
                                {isPlaying && !isPaused && (
                                    <div className="w-full">
                                        <div className="h-1 bg-muted/20 rounded-full overflow-hidden">
                                            <div className="h-full bg-accent animate-pulse w-full"></div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>


                        <div className="p-4 overflow-y-auto flex-1 bg-background">
                            <div className="mb-3 pb-3 border-b border-border">
                                <h4 className="font-bold text-base mb-1">{audioOverview.title}</h4>
                                <p className="text-[10px] text-muted uppercase tracking-wider">Podcast Transcript</p>
                            </div>
                            <div className="text-xs leading-relaxed space-y-3 text-foreground whitespace-pre-wrap font-mono">
                                {audioOverview.script}
                            </div>
                        </div>
                        <div className="p-4 border-t border-border bg-muted/5 flex flex-col gap-3">
                            <div className="flex items-center justify-between">
                                <p className="text-[10px] text-muted">
                                    🎙️ Browser TTS Engine
                                </p>
                                <button
                                    onClick={() => navigator.clipboard.writeText(audioOverview.script)}
                                    className="text-[10px] text-accent hover:text-accent/80 font-medium flex items-center gap-1"
                                >
                                    <Copy size={10} /> Copy Script
                                </button>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={downloadMp3}
                                    className="flex-1 py-2 bg-accent text-white rounded-lg hover:bg-accent/90 font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-lg shadow-accent/20"
                                    title="Download MP3 Audio"
                                >
                                    <FileAudio size={14} /> Download MP3
                                </button>
                                <button
                                    onClick={downloadAudio}
                                    className="flex-1 py-2 bg-card-bg border border-border text-foreground rounded-lg hover:bg-border/50 font-bold text-xs flex items-center justify-center gap-2 transition-colors"
                                    title="Download text transcript"
                                >
                                    <ArrowRight size={14} className="rotate-90" /> Get Script
                                </button>
                            </div>
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
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 glass-morphism rounded-2xl px-4 py-3 flex items-center gap-3 shadow-2xl border border-border/50">
                    {/* Summarize - Works on SOURCES */}
                    <button
                        onClick={handleSummarize}
                        disabled={isSummarizing}
                        title="Summarize selected sources and add to notes"
                        className={`group relative flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-all ${isSummarizing ? 'bg-accent/20 cursor-wait' : 'hover:bg-accent/10'}`}
                    >
                        <div className="flex items-center gap-2">
                            <FileStack size={16} className="text-blue-500" />
                            <span className="text-xs font-bold">{isSummarizing ? 'Summarizing...' : 'Summarize'}</span>
                        </div>
                        <span className="text-[9px] text-muted uppercase tracking-wider">From Sources</span>
                        {!isSummarizing && (
                            <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-foreground text-background px-3 py-1.5 rounded-lg text-[10px] font-medium whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                                Create summary from selected sources
                                <div className="absolute bottom-[-4px] left-1/2 -translate-x-1/2 w-2 h-2 bg-foreground rotate-45"></div>
                            </div>
                        )}
                    </button>

                    <div className="w-px h-12 bg-border" />

                    {/* Refine - Works on NOTES */}
                    <button
                        onClick={handleRefine}
                        disabled={isRefining}
                        title="Refine and improve your notes"
                        className={`group relative flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-all ${isRefining ? 'bg-accent/20 cursor-wait' : 'hover:bg-accent/10'}`}
                    >
                        <div className="flex items-center gap-2">
                            <Wand2 size={16} className="text-purple-500" />
                            <span className="text-xs font-bold">{isRefining ? 'Refining...' : 'Refine'}</span>
                        </div>
                        <span className="text-[9px] text-muted uppercase tracking-wider">Polish Notes</span>
                        {!isRefining && (
                            <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-foreground text-background px-3 py-1.5 rounded-lg text-[10px] font-medium whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                                Improve your written notes
                                <div className="absolute bottom-[-4px] left-1/2 -translate-x-1/2 w-2 h-2 bg-foreground rotate-45"></div>
                            </div>
                        )}
                    </button>

                    <div className="w-px h-12 bg-border" />

                    {/* Grammar Check - NEW */}
                    <button
                        onClick={handleGrammarCheck}
                        disabled={isGrammarChecking}
                        title="Identify grammar mistakes and explain rules"
                        className={`group relative flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-all ${isGrammarChecking ? 'bg-accent/20 cursor-wait' : 'hover:bg-accent/10'}`}
                    >
                        <div className="flex items-center gap-2">
                            <CheckCircle2 size={16} className="text-green-500" />
                            <span className="text-xs font-bold">{isGrammarChecking ? 'Verifying...' : 'Check Grammar'}</span>
                        </div>
                        <span className="text-[9px] text-muted uppercase tracking-wider">Verify Rules</span>
                        {!isGrammarChecking && (
                            <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-foreground text-background px-3 py-1.5 rounded-lg text-[10px] font-medium whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                                Identify and explain grammar mistakes
                                <div className="absolute bottom-[-4px] left-1/2 -translate-x-1/2 w-2 h-2 bg-foreground rotate-45"></div>
                            </div>
                        )}
                    </button>

                    <div className="w-px h-12 bg-border" />

                    {/* Audio Overview - Works on SOURCES */}
                    <button
                        onClick={generateAudioOverview}
                        disabled={isGeneratingAudio}
                        title="Generate podcast-style overview"
                        className={`group relative flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-all ${isGeneratingAudio ? 'bg-accent/20 cursor-wait' : 'hover:bg-accent/10'}`}
                    >
                        <div className="flex items-center gap-2">
                            <Mic2 size={16} className="text-accent" />
                            <span className="text-xs font-bold">{isGeneratingAudio ? 'Generating...' : 'Audio Overview'}</span>
                        </div>
                        <span className="text-[9px] text-muted uppercase tracking-wider">Podcast Script</span>
                        {!isGeneratingAudio && (
                            <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-foreground text-background px-3 py-1.5 rounded-lg text-[10px] font-medium whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                                Create podcast from sources
                                <div className="absolute bottom-[-4px] left-1/2 -translate-x-1/2 w-2 h-2 bg-foreground rotate-45"></div>
                            </div>
                        )}
                    </button>
                </div>
            </main>

            {/* 3. AI Assistant (Right) */}
            <section
                style={{ width: `${chatSidebarWidth}px` }}
                className="border-l border-border flex flex-col bg-card-bg/20 glass-morphism relative"
            >
                {/* Resize Handle (Hit Area) */}
                <div
                    onMouseDown={startResizing}
                    className="absolute left-[-4px] top-0 bottom-0 w-2 cursor-col-resize hover:bg-accent/30 transition-all z-50 group-hover:bg-accent/10"
                    title="Drag to resize chat"
                />

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
                        {messages.map((msg, i) => {
                            const portrait = msg.role === 'assistant' ? resolvePortrait(msg.content) : null;
                            const situationalImg = msg.role === 'assistant' && !portrait ? resolveSituationalImage(msg.content) : null;

                            return (
                                <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''} animate-in slide-in-from-bottom-2 duration-300`}>
                                    <div className={`h-8 w-8 rounded-full flex-shrink-0 flex items-center justify-center text-white ${msg.role === 'user' ? 'bg-accent' : 'bg-accent-secondary'}`}>
                                        {msg.role === 'user' ? 'U' : <Sparkles size={16} />}
                                    </div>
                                    <div className={`${msg.role === 'user' ? 'bg-accent/10' : 'bg-muted/10'} rounded-2xl p-4 text-sm max-w-[90%] group relative flex flex-col gap-3 overflow-hidden shadow-sm`}>
                                        <div className="whitespace-pre-wrap break-words leading-relaxed text-[15px]">
                                            {msg.content.split(/(\[\d+\])/g).map((part, partIndex) => {
                                                if (/^\[\d+\]$/.test(part)) {
                                                    return (
                                                        <span key={partIndex} className="inline-flex items-center justify-center bg-accent/10 border border-accent/20 text-accent text-[10px] font-bold rounded px-1 min-w-[18px] h-[18px] mx-0.5 cursor-pointer hover:bg-accent hover:text-white transition-colors" title="View Source">
                                                            {part.replace(/[\[\]]/g, '')}
                                                        </span>
                                                    );
                                                }
                                                return part;
                                            })}
                                        </div>

                                        {portrait && (
                                            <div className="mt-2 rounded-xl overflow-hidden border border-border bg-card-bg shadow-lg animate-in zoom-in-95 duration-500">
                                                <img
                                                    src={portrait.imageUrl}
                                                    alt={portrait.name}
                                                    className="w-full h-40 object-cover"
                                                    onError={(e) => {
                                                        const target = e.target as HTMLImageElement;
                                                        target.src = FALLBACK_IMAGE;
                                                    }}
                                                />
                                                <div className="p-3 bg-accent/5">
                                                    <div className="flex items-center justify-between mb-1">
                                                        <p className="text-[10px] font-bold uppercase tracking-widest text-accent">Inspirational Figure</p>
                                                        {portrait.attribution && (
                                                            <a
                                                                href={portrait.sourceUrl}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="text-[10px] text-muted-foreground hover:text-accent flex items-center gap-1"
                                                            >
                                                                <ExternalLink size={10} /> {portrait.attribution}
                                                            </a>
                                                        )}
                                                    </div>
                                                    <p className="font-bold text-sm">{portrait.name}</p>
                                                    <p className="text-[11px] text-muted">{portrait.description}</p>
                                                </div>
                                            </div>
                                        )}

                                        {situationalImg && (
                                            <div className="mt-2 rounded-xl overflow-hidden border border-border shadow-md animate-in fade-in duration-700">
                                                <img
                                                    src={situationalImg}
                                                    alt="Spiritual reflection"
                                                    className="w-full h-32 object-cover"
                                                    onError={(e) => {
                                                        const target = e.target as HTMLImageElement;
                                                        target.src = FALLBACK_IMAGE;
                                                    }}
                                                />
                                                <div className="p-1 px-2 text-[9px] text-muted-foreground bg-background/50 text-right">
                                                    Source: Unsplash
                                                </div>
                                            </div>
                                        )}

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
                            );
                        })}
                    </div>
                </div>

                {/* Recommended Actions (Help Me Create) */}
                <div className="px-4 pb-2">
                    {/* Suggested Questions Chips */}
                    {suggestions.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-3 animate-in fade-in slide-in-from-bottom-2">
                            {suggestions.map((suggestion, i) => (
                                <button
                                    key={i}
                                    onClick={() => handleSendMessage(suggestion)}
                                    className="px-3 py-1.5 bg-accent/10 border border-accent/20 rounded-full text-xs font-bold text-accent hover:bg-accent/20 transition-all flex items-center gap-2"
                                >
                                    <Sparkles size={10} />
                                    {suggestion}
                                </button>
                            ))}
                        </div>
                    )}

                    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin">
                        {[
                            { id: "study-guide", label: "🙏 Study Guide" },
                            { id: "faq", label: "❓ FAQ" },
                            { id: "timeline", label: "📅 Timeline" },
                            { id: "briefing doc", label: "📝 Briefing Doc" }
                        ].map((action, i) => (
                            <button
                                key={i}
                                onClick={() => handleGenerateGuide(action.id as any)}
                                disabled={isGeneratingGuide}
                                className={`flex-shrink-0 px-3 py-1.5 bg-accent/5 border border-accent/10 rounded-full text-xs font-medium text-accent hover:bg-accent/10 transition-colors whitespace-nowrap ${isGeneratingGuide ? 'opacity-50 cursor-wait' : ''}`}
                            >
                                {action.label}
                            </button>
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
                            className="w-full bg-background border border-border rounded-2xl py-3 pl-4 pr-12 pb-8 text-sm focus:outline-none focus:ring-1 focus:ring-accent resize-none min-h-[44px] max-h-32"
                            rows={1}
                        />
                        <button
                            onClick={() => handleSendMessage()}
                            className={`absolute right-2 top-2 p-1.5 bg-accent text-white rounded-xl hover:bg-accent/90 transition-all shadow-lg shadow-accent/20 ${input.trim() ? 'opacity-100 scale-100' : 'opacity-40 scale-95 cursor-not-allowed'}`}
                            title="Send Message"
                        >
                            <Send size={16} />
                        </button>
                        <div className="absolute left-3 bottom-3 px-2 py-0.5 bg-background border border-border rounded text-[9px] font-bold text-muted uppercase tracking-tighter shadow-sm">
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
