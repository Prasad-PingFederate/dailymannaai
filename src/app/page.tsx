import SearchEnginePortal from "@/components/search/SearchEnginePortal";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col bg-background">
      <div className="flex-1">
        <SearchEnginePortal />
      </div>
      
      {/* SEO Optimization Section - Visible and Indexable */}
      <footer className="mt-auto border-t border-border bg-slate-50/50 dark:bg-black/20 py-16 px-6">
        <div className="max-w-6xl mx-auto text-center space-y-8">
          <h2 className="text-2xl font-bold text-navy dark:text-white">DailyManna AI: The Premier Christian AI Search Engine</h2>
          
          <div className="space-y-4 text-sm text-text-2 dark:text-slate-300 leading-relaxed max-w-4xl mx-auto">
            <p>
              Welcome to <strong className="text-gold">Daily Manna AI</strong> (dailymannaai), your ultimate <strong>AI Bible search</strong> and <strong>Christian AI search engine</strong>. 
              As the <strong>best AI for Bible study</strong>, our platform offers a <strong>Spirit-led AI</strong> experience, acting as your personal <strong>AI devotional tool</strong> and <strong>Bible AI companion</strong>. 
              Whether you are looking for an <strong>AI powered Bible study</strong> guide or an <strong>online Bible search engine</strong>, our <strong>faith-based AI</strong> is here to provide <strong>Spirit-led Bible answers</strong>.
            </p>
            <p>
              Ask our <strong>Bible chat AI</strong> anything, such as "<em>what does the Bible say about AI?</em>" or "<em>Bible verses about anxiety AI</em>". 
              Get instant <strong>AI Bible questions and answers</strong> and learn <strong>how to study the Bible with AI</strong>. 
              Our <strong>AI Bible verse finder</strong> and <strong>Bible search AI</strong> help you discover a <strong>daily Bible verse with explanation</strong>, providing <strong>daily spiritual nourishment AI</strong>.
            </p>
            <p>
              Embrace your faith with our <strong>Christian daily devotional</strong> and <strong>daily manna devotional</strong> features. 
              Our <strong>Christian AI app</strong> includes an <strong>AI sermon helper</strong>, <strong>Bible news AI</strong>, <strong>AI image studio Bible</strong>, and an <strong>AI Bible notebook</strong>. 
              Stay connected with <strong>prophetic alerts AI</strong> and <strong>AI daily devotionals</strong>, remembering that "<em>man shall not live by bread alone</em>" AI. 
              Experience the <strong>best Christian AI tool</strong> and step into the future of faith with <strong>Bible study AI 2026</strong>.
            </p>
          </div>
          
          <div className="flex flex-wrap justify-center gap-3 pt-6 border-t border-border/50">
            {["bible ai tool", "christian ai devotional", "bible ai search engine", "faith ai tool", "christian ai bible search", "ai for christian faith", "christian search engine ai", "ai for bible verses", "spirit led answers ai", "daily manna ai bible", "best bible study tool", "ai powered devotionals"].map((keyword) => (
              <span key={keyword} className="text-xs font-medium text-text-3 dark:text-slate-500 bg-slate-100 dark:bg-slate-800/50 px-3 py-1 rounded-full">
                {keyword}
              </span>
            ))}
          </div>
        </div>
      </footer>
    </main>
  );
}
