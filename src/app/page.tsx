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
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent text-white shadow-lg shadow-accent/20">
              <BookOpen size={20} />
            </div>
            <span className="text-xl font-bold tracking-tight">notebookllm<span className="text-accent">.ai</span></span>
          </div>

          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-muted">
            <Link href="#features" className="transition-colors hover:text-foreground">Features</Link>
            <Link href="#how-it-works" className="transition-colors hover:text-foreground">How it Works</Link>
            <Link href="#pricing" className="transition-colors hover:text-foreground">Pricing</Link>
          </div>

          <div className="flex items-center gap-4">
            <Link href="/login" className="text-sm font-medium transition-colors hover:text-accent">Sign In</Link>
            <Link
              href="/signup"
              className="shine rounded-full bg-foreground px-5 py-2 text-sm font-semibold text-background transition-transform active:scale-95 shadow-xl shadow-foreground/10"
            >
              Get Started Free
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
              <span>NotebookLM clone, reimagined for you</span>
            </div>
          </div>

          <h1 className="mb-6 text-5xl font-extrabold tracking-tight md:text-7xl">
            Meet your personal <br />
            <span className="gradient-text leading-tight">AI Research Assistant.</span>
          </h1>

          <p className="mx-auto mb-10 max-w-2xl text-lg text-muted md:text-xl md:leading-relaxed">
            Upload your documents, podcasts, and notes. Instantly extract insights,
            generate citations, and create professional audio overviews.
            Built for creators, researchers, and world-class students.
          </p>

          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href="/signup"
              className="flex items-center gap-2 rounded-full bg-accent px-8 py-4 text-lg font-bold text-white transition-all hover:scale-105 hover:bg-accent/90 shadow-2xl shadow-accent/20"
            >
              Build your first Notebook
              <ArrowRight size={20} />
            </Link>
            <Link
              href="https://github.com/Prasad-PingFederate/notebookllm.ai"
              target="_blank"
              className="flex items-center gap-2 rounded-full border border-border bg-card-bg px-8 py-4 text-lg font-semibold transition-colors hover:bg-border/50"
            >
              <Github size={20} />
              Star on GitHub
            </Link>
          </div>

          {/* Social Proof */}
          <div className="mt-16 flex flex-col items-center gap-4 opacity-70">
            <p className="text-xs font-bold uppercase tracking-widest text-muted">Trusted by creators worldwide</p>
            <div className="flex gap-8 grayscale brightness-125 dark:invert">
              {/* Add dummy company logos or text */}
              <span className="text-lg font-bold text-muted">RESEARCHER</span>
              <span className="text-lg font-bold text-muted">ACADEMIA</span>
              <span className="text-lg font-bold text-muted">TECHNOW</span>
              <span className="text-lg font-bold text-muted">IDEALAB</span>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-24 bg-card-bg/30">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mb-16 text-center">
            <h2 className="mb-4 text-3xl font-bold md:text-4xl">Power tools for the curious.</h2>
            <p className="text-muted md:text-lg">Everything you love about NotebookLM, plus the freedom of your own project.</p>
          </div>

          <div className="grid gap-8 md:grid-cols-3">
            {[
              {
                icon: <MessageSquare className="text-accent" />,
                title: "Grounded Chat",
                desc: "AI that speaks only from your sources. No hallucinations. Precise citations for every claim."
              },
              {
                icon: <Mic2 className="text-accent-secondary" />,
                title: "Audio Overviews",
                desc: "Turn messy notes into professional 2-person podcast discussions using neural AI voices."
              },
              {
                icon: <ShieldCheck className="text-green-500" />,
                title: "Privacy First",
                desc: "Your documents are yours. We encrypt everything and never train on your private data."
              },
              {
                icon: <Zap className="text-amber-500" />,
                title: "Source Sync",
                desc: "Connect Google Drive, Notion, or local PDFs. Your notebook updates in real-time."
              },
              {
                icon: <Sparkles className="text-purple-500" />,
                title: "Insight Mapping",
                desc: "Automatically find connections between distant files. AI-powered semantic mapping."
              },
              {
                icon: <BookOpen className="text-blue-500" />,
                title: "Auto Citations",
                desc: "Never lose a source again. Click any claim to jump directly to the exact page it came from."
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
              <span className="font-bold tracking-tight">notebookllm<span className="text-accent">.ai</span></span>
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
