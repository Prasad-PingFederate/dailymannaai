/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useRef, useEffect } from 'react';
import { Mic, Search, Moon, Bell, Menu, Volume2, Globe } from 'lucide-react';
import { GoogleGenAI } from '@google/genai';
import ReactMarkdown from 'react-markdown';

// AI Initialization
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const LANGUAGES = [
  { code: 'en', name: 'English' },
  { code: 'te', name: 'Telugu (తెలుగు)' },
  { code: 'hi', name: 'Hindi (हिन्दी)' },
  { code: 'ta', name: 'Tamil (தமிழ்)' },
  { code: 'ml', name: 'Malayalam (മലയാളം)' },
  { code: 'kn', name: 'Kannada (ಕನ್ನಡ)' },
];

export default function App() {
  const [messages, setMessages] = useState<{ role: 'user' | 'model'; text: string }[]>([]);
  const [input, setInput] = useState('');
  const [language, setLanguage] = useState('en');
  const [isLoading, setIsLoading] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  
  const chatEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    // Initialize Web Speech API for recognition
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = true;

      recognitionRef.current.onresult = (event: any) => {
        let finalTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          }
        }
        if (finalTranscript) {
          setInput((prev) => prev ? prev + ' ' + finalTranscript : finalTranscript);
        }
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error('Speech recognition error', event.error);
        setIsListening(false);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }
  }, []);

  // Sync language for speech recognition
  useEffect(() => {
    if (recognitionRef.current) {
      // Map 'en' -> 'en-IN', 'hi' -> 'hi-IN' etc for better native support
      const langMap: Record<string, string> = {
        enc: 'en-IN',
        en: 'en-IN',
        hi: 'hi-IN',
        te: 'te-IN',
        ta: 'ta-IN',
        ml: 'ml-IN',
        kn: 'kn-IN',
      };
      recognitionRef.current.lang = langMap[language] || 'en-IN';
    }
  }, [language]);

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    } else {
      if (recognitionRef.current) {
        setMessages((prev) => [...prev]); // trigger re-render if needed
        try {
          recognitionRef.current.start();
          setIsListening(true);
        } catch(e) {}
      } else {
        alert("Speech recognition is not supported in this browser.");
      }
    }
  };

  const speakMessage = (text: string) => {
    if (isPlaying) {
      window.speechSynthesis.cancel();
      setIsPlaying(false);
      return;
    }

    if (!('speechSynthesis' in window)) {
      alert("Text-to-speech is not supported in this browser.");
      return;
    }

    const langMap: Record<string, string> = {
      en: 'en-IN',
      hi: 'hi-IN',
      te: 'te-IN',
      ta: 'ta-IN',
      ml: 'ml-IN',
      kn: 'kn-IN',
    };
    const targetLang = langMap[language] || 'en-IN';

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = targetLang;
    
    utterance.onstart = () => setIsPlaying(true);
    utterance.onend = () => setIsPlaying(false);
    utterance.onerror = () => setIsPlaying(false);

    window.speechSynthesis.speak(utterance);
  };


  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages((prev) => [...prev, { role: 'user', text: userMessage }]);
    setIsLoading(true);

    try {
      const selectedLangName = LANGUAGES.find((l) => l.code === language)?.name || 'English';

      const systemInstruction = `You are Daily Manna AI, a helpful, respectful, and comforting AI biblical assistant. 
You must interact and respond to the user primarily in ${selectedLangName}. 
Base your answers on biblical principles and scripture. Provide the scripture reference if applicable. 
Maintain a warm, hopeful, and encouraging tone. If asked about languages, you support English, Telugu, Hindi, Tamil, Malayalam, and Kannada.`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [
          ...messages.map((m) => ({ role: m.role, parts: [{ text: m.text }] })),
          { role: 'user', parts: [{ text: userMessage }] },
        ],
        config: {
          systemInstruction: systemInstruction,
          temperature: 0.7,
        },
      });

      setMessages((prev) => [
        ...prev,
        { role: 'model', text: response.text || 'Sorry, I could not generate a response.' },
      ]);
      // Optional: Auto-speak response
      // speakMessage(response.text || '');
    } catch (error) {
      console.error('AI Error:', error);
      setMessages((prev) => [
        ...prev,
        { role: 'model', text: 'An error occurred while connecting to Daily Manna AI. Please try again later.' },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const navItems = [
    { name: 'AI MODE', active: true, icon: <Search size={14} className="mr-1" /> },
    { name: 'BIBLE', active: false, icon: null },
    { name: 'NEWS', active: false, icon: null },
    { name: 'NOTEBOOK', active: false, icon: null },
    { name: 'DEVOTIONALS', active: false, icon: null },
    { name: 'SERMONS', active: false, icon: null },
    { name: 'IMAGE STUDIO', active: false, icon: null },
  ];

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900 text-white' : 'bg-[#EFEAE2] text-gray-900'} font-sans transition-colors duration-300 flex flex-col relative overflow-hidden`}>
      
      {/* Header */}
      <header className="w-full flex justify-between items-center p-4 md:p-6 select-none relative z-10">
        <div className="flex items-center gap-4">
          <Menu className="w-6 h-6 md:hidden cursor-pointer" />
          <div className="hidden md:block"></div>
        </div>
        
        <div className="flex gap-4">
          <button className="bg-[#D4AF37] text-gray-900 font-semibold px-6 py-2 rounded-md hover:bg-[#C5A030] transition-colors text-sm">
            SIGN IN
          </button>
          <button 
            onClick={() => setIsDarkMode(!isDarkMode)}
            className={`flex items-center gap-2 px-4 py-2 rounded-full border ${isDarkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-300 bg-white'} hover:shadow-sm transition-all`}
          >
            <Moon size={16} />
            <span className="text-sm font-medium">Dark</span>
          </button>
        </div>
      </header>

      <main className="flex-grow flex flex-col items-center w-full max-w-5xl mx-auto px-4 md:px-8 relative z-10">
        
        {/* Title Area - Hide when chatting to give more space */}
        {messages.length === 0 && (
          <div className="text-center mt-8 mb-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-[#0f172a] dark:text-white mb-2">
              DAILY MANNA
            </h1>
            <p className="text-xl tracking-[0.5em] text-[#D4AF37] mb-8 font-medium">A I</p>
            
            <p className="font-serif italic text-lg md:text-2xl max-w-2xl mx-auto text-gray-600 dark:text-gray-300 leading-relaxed mb-10">
              "Man shall not live by bread alone, but by every word that proceedeth out of the mouth of God."
            </p>
          </div>
        )}

        {/* Navigation Pills */}
        <div className={`flex flex-wrap justify-center gap-3 mb-8 transition-all ${messages.length > 0 ? 'mt-4 scale-[0.95] opacity-80' : ''}`}>
          {navItems.map((item, idx) => (
            <button
              key={idx}
              className={`flex items-center px-4 py-2 md:px-5 md:py-2.5 rounded-full text-[10px] md:text-xs font-semibold tracking-wider transition-all shadow-sm ${
                item.active 
                  ? 'bg-[#0f172a] text-white hover:bg-gray-800 dark:bg-[#D4AF37] dark:text-gray-900' 
                  : 'bg-white text-gray-700 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300 border border-transparent dark:border-gray-700'
              }`}
            >
              {item.icon}
              {item.name}
            </button>
          ))}
          <button className={`flex items-center px-4 py-2 md:px-5 md:py-2.5 rounded-full text-[10px] md:text-xs font-semibold tracking-wider bg-white text-gray-700 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300 shadow-sm transition-all border border-transparent dark:border-gray-700`}>
            <Bell size={14} className="mr-1" />
            PROPHETIC ALERTS
          </button>
        </div>

        {/* Chat Interface Container */}
        {messages.length > 0 && (
          <div className="flex-1 w-full flex flex-col items-center transition-all mb-4 mt-2 overflow-hidden bg-white/70 dark:bg-gray-800/70 rounded-3xl border border-white dark:border-gray-700 shadow-xl backdrop-blur-md">
            <div className="w-full text-center py-3 border-b border-gray-200/50 dark:border-gray-700/50 bg-white/50 dark:bg-gray-900/50 font-medium text-sm flex items-center justify-center gap-2">
                 <Globe size={16} className="text-[#D4AF37]" />
                 Current Language: <span className="font-bold">{LANGUAGES.find(l => l.code === language)?.name}</span>
            </div>
            
            <div className="flex-1 w-full overflow-y-auto p-4 md:p-6 space-y-6 scroll-smooth">
              {messages.map((m, i) => (
                <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div 
                    className={`max-w-[85%] md:max-w-[75%] rounded-2xl p-5 ${
                      m.role === 'user' 
                        ? 'bg-[#0f172a] text-white dark:bg-[#D4AF37] dark:text-gray-900 ml-auto rounded-br-sm' 
                        : 'bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 border border-gray-100 dark:border-gray-700 shadow-sm rounded-bl-sm'
                    }`}
                  >
                     {m.role === 'model' ? (
                        <div className="prose prose-sm md:prose-base dark:prose-invert max-w-none">
                             <ReactMarkdown>{m.text}</ReactMarkdown>
                        </div>
                     ) : (
                         <p className="text-base">{m.text}</p>
                     )}
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 shadow-sm rounded-2xl p-5 rounded-bl-sm flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-[#D4AF37] animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-2 h-2 rounded-full bg-[#D4AF37] animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-2 h-2 rounded-full bg-[#D4AF37] animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>
          </div>
        )}

        {/* Input Area */}
        <div className={`w-full max-w-3xl transform transition-all duration-500 ease-in-out ${messages.length === 0 ? 'mt-8' : 'mt-2 mb-6'}`}>
          <div className="relative group flex items-center shadow-lg rounded-full bg-white dark:bg-gray-800 border border-transparent dark:border-gray-700 focus-within:ring-4 focus-within:ring-[#D4AF37]/30 transition-all duration-300 p-1 md:p-2">
            
            {/* Language Selector built into input bar */}
            <div className="relative flex items-center shrink-0 ml-1 md:ml-2">
                <select 
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="appearance-none bg-[#f8f6f0] dark:bg-gray-700 border-none text-xs md:text-sm font-medium text-gray-700 dark:text-gray-200 pl-3 pr-7 py-2 md:py-3 rounded-full outline-none cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                >
                  {LANGUAGES.map(lang => (
                    <option key={lang.code} value={lang.code}>
                      {lang.name}
                    </option>
                  ))}
                </select>
                <div className="pointer-events-none absolute right-2 flex items-center text-gray-500">
                    <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                </div>
            </div>

            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder="Reply to DailyMannaAI..."
              className="flex-1 bg-transparent border-none text-base md:text-lg focus:outline-none pl-4 pr-16 py-3 placeholder-gray-400 dark:text-white"
            />
            
            <div className="absolute right-3 flex items-center gap-1 md:gap-2">
              <button 
                onClick={toggleListening}
                className={`hidden md:flex p-2 rounded-full transition-colors ${isListening ? 'bg-rose-100 dark:bg-rose-900/30 text-rose-600 animate-pulse' : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-teal-600'}`}
                title={isListening ? "Stop listening" : "Start speaking"}
              >
                <Mic size={20} />
              </button>
              <button 
                onClick={handleSendMessage}
                disabled={isLoading || !input.trim()}
                className={`p-2 rounded-full transition-colors flex items-center justify-center ${input.trim() ? 'hover:bg-gray-100 dark:hover:bg-gray-700 text-[#D4AF37]' : 'text-gray-300 dark:text-gray-600'}`}
              >
                 <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="rotate-[-45deg]"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
              </button>
              <button 
                onClick={() => {
                  // Speak the last model message
                  const lastModelMsg = [...messages].reverse().find(m => m.role === 'model');
                  if (lastModelMsg) {
                    speakMessage(lastModelMsg.text);
                  }
                }}
                disabled={!messages.some(m => m.role === 'model')}
                className={`p-2 rounded-full bg-[#fcf9f2] dark:bg-orange-900/30 text-amber-600 shadow-sm border border-orange-100 dark:border-orange-800 hover:scale-105 transition-transform flex items-center justify-center ${isPlaying ? 'animate-pulse bg-orange-100 dark:bg-orange-800/50 scale-105' : ''} ${!messages.some(m => m.role === 'model') ? 'opacity-50 cursor-not-allowed' : ''}`}
                title="Read answer aloud"
              >
                <Volume2 size={20} />
              </button>
            </div>
          </div>
        </div>

        {/* Sentinel Footer Button */}
        {messages.length === 0 && (
          <div className="mt-12 mb-8 animate-in fade-in slide-in-from-bottom-6 duration-1000 delay-300">
             <button className="flex items-center gap-3 px-8 py-4 rounded-full border border-orange-200 bg-orange-100/50 dark:bg-orange-900/20 dark:border-orange-900 text-orange-800 dark:text-orange-400 hover:bg-orange-100 transition-colors shadow-sm">
                <Bell className="animate-pulse" size={18} />
                <div className="flex flex-col items-start bg-transparent">
                  <span className="text-xs font-bold tracking-wider opacity-90">PROPHETIC SENTINEL</span>
                  <span className="text-[10px] opacity-70">Sentinel Active</span>
                </div>
             </button>
          </div>
        )}
      </main>

      <footer className="absolute bottom-4 w-full text-center text-xs text-gray-400 dark:text-gray-600 tracking-widest uppercase pb-2 z-10">
          © 2026 DAILYMANNAAI — BUILT WITH PRAYER
      </footer>
    </div>
  );
}
