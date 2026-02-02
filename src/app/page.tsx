import Link from "next/link";
import {
  BookOpen,
  MessageSquare,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Zap,
  Mic2,
  Github
} from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-accent/30">
      {/* Navbar */}
      <nav className="fixed top-0 z-50 w-full border-b border-border glass-morphism">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 md:px-6">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent text-white shadow-lg shadow-accent/20">
              <BookOpen size={20} />
            </div>
            <span className="text-lg md:text-xl font-bold tracking-tight truncate">christian-notebook<span className="text-accent">.ai</span></span>
          </div>

          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-muted">
            <Link href="#features" className="transition-colors hover:text-foreground">Study the Word</Link>
            <Link href="#how-it-works" className="transition-colors hover:text-foreground">Spiritual Guidance</Link>
            <Link href="#pricing" className="transition-colors hover:text-foreground">Sermon Analysis</Link>
          </div>

          <div className="flex items-center gap-2 md:gap-4">
            <Link href="/notebook" className="hidden sm:inline text-sm font-medium transition-colors hover:text-accent">Sign In</Link>
            <Link
              href="/notebook"
              className="shine rounded-full bg-foreground px-4 md:px-5 py-2 text-xs md:text-sm font-semibold text-background transition-transform active:scale-95 shadow-xl shadow-foreground/10"
            >
              Start Your Bible Study
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-32 pb-20 md:pt-48 md:pb-32">
        {/* Background Decorative Elements */}
        <div className="absolute top-1/4 left-1/2 -z-10 h-[500px] w-[500px] -translate-x-1/2 rounded-full bg-accent/10 blur-[120px]" />
        <div className="absolute top-1/2 right-0 -z-10 h-[300px] w-[300px] rounded-full bg-accent-secondary/10 blur-[100px]" />

        <div className="mx-auto max-w-7xl px-6 text-center">
          <div className="mb-8 flex justify-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card-bg/50 px-3 py-1 text-sm font-medium text-muted">
              <Sparkles size={14} className="text-accent-secondary" />
              <span>Deepen your relationship with the Word</span>
            </div>
          </div>

          <h1 className="mb-6 text-5xl font-extrabold tracking-tight md:text-7xl">
            Your Personal <br />
            <span className="gradient-text leading-tight">Spiritual Guidance Partner.</span>
          </h1>

          <p className="mx-auto mb-10 max-w-2xl text-lg text-muted md:text-xl md:leading-relaxed">
            Upload sermons, study the Bible, and get situational guidance.
            Ground your study in the teachings of John Wesley, Billy Graham,
            and the Holy Scriptures. Built for modern disciples.
          </p>

          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href="/notebook"
              className="flex items-center gap-2 rounded-full bg-accent px-8 py-4 text-lg font-bold text-white transition-all hover:scale-105 hover:bg-accent/90 shadow-2xl shadow-accent/20"
            >
              Open Your Study Workspace
              <ArrowRight size={20} />
            </Link>
            <Link
              href="https://github.com/Prasad-PingFederate/notebookllm.ai"
              target="_blank"
              className="flex items-center gap-2 rounded-full border border-border bg-card-bg px-8 py-4 text-lg font-semibold transition-colors hover:bg-border/50"
            >
              <Github size={20} />
              Support on GitHub
            </Link>
          </div>

          {/* Social Proof */}
          <div className="mt-16 flex flex-col items-center gap-4 opacity-70">
            <p className="text-xs font-bold uppercase tracking-widest text-muted">Wisdom from the great teachers</p>
            <div className="flex gap-8 grayscale brightness-125 dark:invert">
              <span className="text-lg font-bold text-muted">WESLEY</span>
              <span className="text-lg font-bold text-muted">GRAHAM</span>
              <span className="text-lg font-bold text-muted">BONNKE</span>
              <span className="text-lg font-bold text-muted">SCRIPTURE</span>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-24 bg-card-bg/30">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mb-16 text-center">
            <h2 className="mb-4 text-3xl font-bold md:text-4xl">Power tools for your soul.</h2>
            <p className="text-muted md:text-lg">AI grounded in Scripture and the teachings of great men of God.</p>
          </div>

          <div className="grid gap-8 md:grid-cols-3">
            {[
              {
                icon: <MessageSquare className="text-accent" />,
                title: "Situational Guidance",
                desc: "Get answers to life's challenges grounded in the Bible and the wisdom of Billy Graham and John Wesley."
              },
              {
                icon: <Mic2 className="text-accent-secondary" />,
                title: "Sermon Analysis",
                desc: "Upload MP3 sermons to transcribe and analyze. Extract key points and Scripture references automatically."
              },
              {
                icon: <ShieldCheck className="text-green-500" />,
                title: "Safe Study",
                desc: "A secure workspace for your private prayers, notes, and theological reflections. We never train on your data."
              },
              {
                icon: <Zap className="text-amber-500" />,
                title: "Word Sync",
                desc: "Connect your Bible apps or local study guides. Your spiritual notebook stays updated in real-time."
              },
              {
                icon: <Sparkles className="text-purple-500" />,
                title: "Verse Mapping",
                desc: "Automatically find connections between sermons and Bible verses. AI-powered theological mapping."
              },
              {
                icon: <BookOpen className="text-blue-500" />,
                title: "Cited Truth",
                desc: "Never misquote again. Click any claim to jump directly to the exact Scripture or sermon page it came from."
              }
            ].map((f, i) => (
              <div
                key={i}
                className="group rounded-2xl border border-border bg-card-bg p-8 transition-all hover:-translate-y-1 hover:border-accent/30 hover:shadow-2xl hover:shadow-accent/5"
              >
                <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-xl bg-background shadow-inner transition-transform group-hover:scale-110">
                  {f.icon}
                </div>
                <h3 className="mb-3 text-xl font-bold">{f.title}</h3>
                <p className="text-muted leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-12">
        <div className="mx-auto max-w-7xl px-6">
          <div className="flex flex-col items-center justify-between gap-8 md:flex-row">
            <div className="flex items-center gap-2">
              <div className="flex h-6 w-6 items-center justify-center rounded bg-accent text-white">
                <BookOpen size={14} />
              </div>
              <span className="font-bold tracking-tight">christian-notebook<span className="text-accent">.ai</span></span>
            </div>

            <p className="text-sm text-muted">
              © {new Date().getFullYear()} notebookllm.ai. Designed for the builders.
            </p>

            <div className="flex gap-6 text-sm font-medium text-muted">
              <Link href="#" className="hover:text-foreground">Privacy</Link>
              <Link href="#" className="hover:text-foreground">Terms</Link>
              <Link href="#" className="hover:text-foreground">Contact</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
