import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
    title: "Daily Manna — DailyMannaAI | Daily Bible Verses, Devotionals & 200+ Translations",
    description:
        "Start your day with Daily Manna — AI-curated Bible verses, devotional insights, and spiritual nourishment. Explore Scripture in 200+ languages including English, Spanish, Hindi, Korean, Arabic, and more.",
    keywords: [
        "daily manna", "daily devotional", "daily Bible verse", "morning devotion",
        "Bible in all languages", "multilingual Bible", "Bible translations",
        "Christian daily reading", "DailyMannaAI", "scripture search engine",
    ],
    openGraph: {
        title: "Daily Manna — Your Daily Scripture in 200+ Languages",
        description: "AI-curated Bible verses and devotionals. Explore Scripture in English, Spanish, Hindi, Arabic, Korean, and 200+ more languages.",
        url: "https://www.dailymannaai.com/daily-manna",
        siteName: "DailyMannaAI",
        type: "website",
    },
    twitter: {
        card: "summary_large_image",
        title: "Daily Manna — DailyMannaAI",
        description: "Daily Bible verses in 200+ languages, powered by AI.",
    },
    alternates: {
        canonical: "https://www.dailymannaai.com/daily-manna",
    },
    robots: { index: true, follow: true, googleBot: { index: true, follow: true } },
};

// All supported Bible languages with display names
const BIBLE_LANGUAGES = [
    { code: "english", name: "English", flag: "🇺🇸", version: "WEB" },
    { code: "es", name: "Spanish (Español)", flag: "🇪🇸", version: "Reina-Valera" },
    { code: "fr", name: "French (Français)", flag: "🇫🇷", version: "Crampon" },
    { code: "de", name: "German (Deutsch)", flag: "🇩🇪", version: "Textbibel" },
    { code: "pt", name: "Portuguese (Português)", flag: "🇧🇷", version: "Nova Bíblia" },
    { code: "it", name: "Italian (Italiano)", flag: "🇮🇹", version: "Riveduta" },
    { code: "ru", name: "Russian (Русский)", flag: "🇷🇺", version: "Synodal" },
    { code: "zh", name: "Chinese (中文)", flag: "🇨🇳", version: "Chinese Union" },
    { code: "ko", name: "Korean (한국어)", flag: "🇰🇷", version: "Korean" },
    { code: "ja", name: "Japanese (日本語)", flag: "🇯🇵", version: "口語訳" },
    { code: "ar", name: "Arabic (العربية)", flag: "🇸🇦", version: "Van Dyke" },
    { code: "hindi", name: "Hindi (हिन्दी)", flag: "🇮🇳", version: "Hindi IRV" },
    { code: "bengali", name: "Bengali (বাংলা)", flag: "🇧🇩", version: "Bengali IRV" },
    { code: "te", name: "Telugu (తెలుగు)", flag: "🇮🇳", version: "Telugu 2017" },
    { code: "ta", name: "Tamil (தமிழ்)", flag: "🇮🇳", version: "Tamil 2017" },
    { code: "kannada", name: "Kannada (ಕನ್ನಡ)", flag: "🇮🇳", version: "Kannada IRV" },
    { code: "malayalam", name: "Malayalam (മലയാളം)", flag: "🇮🇳", version: "Malayalam" },
    { code: "marathi", name: "Marathi (मराठी)", flag: "🇮🇳", version: "Marathi" },
    { code: "gujarati", name: "Gujarati (ગુજરાતી)", flag: "🇮🇳", version: "Gujarati 2017" },
    { code: "punjabi", name: "Punjabi (ਪੰਜਾਬੀ)", flag: "🇮🇳", version: "Punjabi" },
    { code: "nepali", name: "Nepali (नेपाली)", flag: "🇳🇵", version: "Nepali ULB" },
    { code: "tl", name: "Filipino (Tagalog)", flag: "🇵🇭", version: "ULB" },
    { code: "vi", name: "Vietnamese (Tiếng Việt)", flag: "🇻🇳", version: "1934" },
    { code: "th", name: "Thai (ไทย)", flag: "🇹🇭", version: "KJV Thai" },
    { code: "my", name: "Burmese (မြန်မာ)", flag: "🇲🇲", version: "Judson" },
    { code: "indonesian", name: "Indonesian (Bahasa)", flag: "🇮🇩", version: "Indonesian" },
    { code: "tr", name: "Turkish (Türkçe)", flag: "🇹🇷", version: "YTC" },
    { code: "pl", name: "Polish (Polski)", flag: "🇵🇱", version: "UBG" },
    { code: "ro", name: "Romanian (Română)", flag: "🇷🇴", version: "BTF" },
    { code: "nl", name: "Dutch (Nederlands)", flag: "🇳🇱", version: "NBG" },
    { code: "sv", name: "Swedish (Svenska)", flag: "🇸🇪", version: "Svenska" },
    { code: "fi", name: "Finnish (Suomi)", flag: "🇫🇮", version: "Suomi" },
    { code: "da", name: "Danish (Dansk)", flag: "🇩🇰", version: "1931" },
    { code: "nb", name: "Norwegian (Norsk)", flag: "🇳🇴", version: "Bokmål" },
    { code: "cs", name: "Czech (Čeština)", flag: "🇨🇿", version: "Czech 1613" },
    { code: "hr", name: "Croatian (Hrvatski)", flag: "🇭🇷", version: "Croatian" },
    { code: "sr", name: "Serbian (Српски)", flag: "🇷🇸", version: "1865" },
    { code: "uk", name: "Ukrainian (Українська)", flag: "🇺🇦", version: "1871" },
    { code: "et", name: "Estonian (Eesti)", flag: "🇪🇪", version: "Estonian" },
    { code: "lt", name: "Lithuanian (Lietuvių)", flag: "🇱🇹", version: "Lithuanian" },
    { code: "lv", name: "Latvian (Latviešu)", flag: "🇱🇻", version: "Latvian" },
    { code: "sq", name: "Albanian (Shqip)", flag: "🇦🇱", version: "Albanian" },
    { code: "el", name: "Greek (Ελληνικά)", flag: "🇬🇷", version: "Modern Greek" },
    { code: "he", name: "Hebrew (עברית)", flag: "🇮🇱", version: "Hebrew" },
    { code: "sw", name: "Swahili (Kiswahili)", flag: "🇰🇪", version: "Neno" },
    { code: "afrikaans", name: "Afrikaans", flag: "🇿🇦", version: "1953" },
    { code: "isl", name: "Icelandic (Íslenska)", flag: "🇮🇸", version: "Icelandic" },
    { code: "eo", name: "Esperanto", flag: "🌐", version: "Esperanto" },
    { code: "ctu", name: "Ch'ol (Maya)", flag: "🇲🇽", version: "Ch'ol Bible" },
    { code: "kyg", name: "Keyagana", flag: "🇵🇬", version: "Keyagana" },
    { code: "dww", name: "Dawawa", flag: "🇵🇬", version: "Dawawa" },
    { code: "kgf", name: "Kube", flag: "🇵🇬", version: "Kube" },
    { code: "ssd", name: "Siroi", flag: "🇵🇬", version: "Siroi" },
    { code: "pck", name: "Paite", flag: "🇮🇳", version: "Paite Chin" },
    { code: "grc", name: "Ancient Greek (Koiné)", flag: "🏛️", version: "Septuagint" },
    { code: "hbo", name: "Biblical Hebrew", flag: "📜", version: "Westminster" },
    { code: "la", name: "Latin (Latina)", flag: "🏛️", version: "Vulgate" },
    { code: "cu", name: "Church Slavonic", flag: "⛪", version: "Slavonic" },
    { code: "got", name: "Gothic", flag: "📜", version: "Wulfila" },
    { code: "cop", name: "Coptic", flag: "📜", version: "Coptic" },
    { code: "syr", name: "Syriac (ܣܘܪܝܝܐ)", flag: "📜", version: "Peshitta" },
];

const BIBLE_BOOKS_OT = [
    "Genesis", "Exodus", "Leviticus", "Numbers", "Deuteronomy",
    "Joshua", "Judges", "Ruth", "1 Samuel", "2 Samuel",
    "1 Kings", "2 Kings", "1 Chronicles", "2 Chronicles",
    "Ezra", "Nehemiah", "Esther", "Job", "Psalms", "Proverbs",
    "Ecclesiastes", "Song of Solomon", "Isaiah", "Jeremiah",
    "Lamentations", "Ezekiel", "Daniel", "Hosea", "Joel",
    "Amos", "Obadiah", "Jonah", "Micah", "Nahum", "Habakkuk",
    "Zephaniah", "Haggai", "Zechariah", "Malachi",
];

const BIBLE_BOOKS_NT = [
    "Matthew", "Mark", "Luke", "John", "Acts",
    "Romans", "1 Corinthians", "2 Corinthians", "Galatians",
    "Ephesians", "Philippians", "Colossians",
    "1 Thessalonians", "2 Thessalonians", "1 Timothy", "2 Timothy",
    "Titus", "Philemon", "Hebrews", "James",
    "1 Peter", "2 Peter", "1 John", "2 John", "3 John",
    "Jude", "Revelation",
];

export default function DailyMannaPage() {
    return (
        <main
            style={{
                minHeight: "100vh",
                background: "linear-gradient(180deg, #f5f0e8 0%, #fff 50%, #f5f0e8 100%)",
                color: "#1a1a1a",
                fontFamily: "Georgia, serif",
            }}
        >
            {/* Navigation */}
            <nav
                style={{
                    padding: "18px 40px",
                    borderBottom: "1px solid #e8e8e8",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    background: "rgba(255,255,255,0.95)",
                    backdropFilter: "blur(10px)",
                    position: "sticky",
                    top: 0,
                    zIndex: 50,
                }}
            >
                <Link
                    href="/"
                    style={{
                        fontFamily: "'Cinzel', serif",
                        fontSize: 20,
                        fontWeight: 900,
                        textDecoration: "none",
                        letterSpacing: "-0.02em",
                        color: "#1a1a1a",
                    }}
                >
                    DAILY
                    <span
                        style={{
                            background: "linear-gradient(135deg, #B8860B 0%, #D4A017 40%, #F5C842 60%, #B8860B 100%)",
                            WebkitBackgroundClip: "text",
                            WebkitTextFillColor: "transparent",
                            backgroundClip: "text",
                        }}
                    >
                        MANNA
                    </span>
                    AI
                </Link>
                <div style={{ display: "flex", gap: 24, fontSize: 14 }}>
                    <Link href="/" style={{ color: "#555", textDecoration: "none" }}>Search</Link>
                    <Link href="/bible-explorer" style={{ color: "#555", textDecoration: "none" }}>Bible Explorer</Link>
                    <Link href="/notebook" style={{ color: "#555", textDecoration: "none" }}>Notebook</Link>
                    <Link href="/about" style={{ color: "#555", textDecoration: "none" }}>About</Link>
                    <Link href="/contact" style={{ color: "#555", textDecoration: "none" }}>Contact</Link>
                </div>
            </nav>

            {/* Hero Section */}
            <section
                style={{
                    textAlign: "center",
                    padding: "80px 24px 60px",
                    maxWidth: 900,
                    margin: "0 auto",
                }}
            >
                <div
                    style={{
                        display: "inline-block",
                        padding: "4px 18px",
                        borderRadius: 20,
                        background: "#D4A01715",
                        border: "1px solid #D4A01740",
                        fontSize: 11,
                        fontFamily: "sans-serif",
                        fontWeight: 700,
                        letterSpacing: "0.3em",
                        textTransform: "uppercase",
                        color: "#B8860B",
                        marginBottom: 24,
                    }}
                >
                    ✦ Daily Manna
                </div>
                <h1
                    style={{
                        fontFamily: "'Cinzel', serif",
                        fontSize: "clamp(32px, 5vw, 56px)",
                        fontWeight: 900,
                        lineHeight: 1.2,
                        marginBottom: 20,
                    }}
                >
                    The Bible in Every Language,{" "}
                    <span
                        style={{
                            background: "linear-gradient(135deg, #B8860B 0%, #D4A017 50%, #F5C842 100%)",
                            WebkitBackgroundClip: "text",
                            WebkitTextFillColor: "transparent",
                            backgroundClip: "text",
                        }}
                    >
                        Every Day
                    </span>
                </h1>
                <p
                    style={{
                        fontSize: 18,
                        lineHeight: 1.8,
                        color: "#666",
                        maxWidth: 700,
                        margin: "0 auto 40px",
                        fontStyle: "italic",
                    }}
                >
                    DailyMannaAI brings the Word of God to every nation and tongue.
                    Explore the complete Bible — Old &amp; New Testament — in over 200
                    translations across 60+ languages, powered by AI-driven study tools.
                </p>
                <div style={{ display: "flex", gap: 16, justifyContent: "center", flexWrap: "wrap" }}>
                    <Link
                        href="/"
                        style={{
                            display: "inline-block",
                            background: "#1a1a1a",
                            color: "#fff",
                            padding: "14px 32px",
                            borderRadius: 10,
                            fontSize: 13,
                            fontFamily: "sans-serif",
                            fontWeight: 700,
                            letterSpacing: "0.1em",
                            textTransform: "uppercase",
                            textDecoration: "none",
                        }}
                    >
                        Search the Scriptures ✦
                    </Link>
                    <Link
                        href="/bible-explorer"
                        style={{
                            display: "inline-block",
                            background: "#f5f0e8",
                            color: "#B8860B",
                            border: "1px solid #D4A01740",
                            padding: "14px 32px",
                            borderRadius: 10,
                            fontSize: 13,
                            fontFamily: "sans-serif",
                            fontWeight: 700,
                            letterSpacing: "0.1em",
                            textTransform: "uppercase",
                            textDecoration: "none",
                        }}
                    >
                        Open Bible Explorer
                    </Link>
                </div>
            </section>

            {/* Stats Section */}
            <section
                style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                    gap: 20,
                    maxWidth: 900,
                    margin: "0 auto 60px",
                    padding: "0 24px",
                }}
            >
                {[
                    { number: "200+", label: "Bible Translations" },
                    { number: "60+", label: "Languages" },
                    { number: "15M+", label: "Verses Available" },
                    { number: "66", label: "Books of the Bible" },
                ].map((stat, i) => (
                    <div
                        key={i}
                        style={{
                            textAlign: "center",
                            padding: "28px 20px",
                            background: "#fff",
                            borderRadius: 16,
                            border: "1px solid #ebebeb",
                        }}
                    >
                        <div
                            style={{
                                fontFamily: "'Cinzel', serif",
                                fontSize: 36,
                                fontWeight: 900,
                                color: "#B8860B",
                                marginBottom: 4,
                            }}
                        >
                            {stat.number}
                        </div>
                        <div
                            style={{
                                fontSize: 12,
                                fontFamily: "sans-serif",
                                fontWeight: 700,
                                letterSpacing: "0.15em",
                                textTransform: "uppercase",
                                color: "#888",
                            }}
                        >
                            {stat.label}
                        </div>
                    </div>
                ))}
            </section>

            {/* All Bible Languages Section */}
            <section
                style={{
                    maxWidth: 1100,
                    margin: "0 auto 80px",
                    padding: "0 24px",
                }}
            >
                <h2
                    style={{
                        fontFamily: "'Cinzel', serif",
                        fontSize: "clamp(24px, 3vw, 36px)",
                        fontWeight: 900,
                        textAlign: "center",
                        marginBottom: 12,
                    }}
                >
                    Bible Available in All These Languages
                </h2>
                <p
                    style={{
                        textAlign: "center",
                        color: "#888",
                        fontSize: 14,
                        fontFamily: "sans-serif",
                        marginBottom: 40,
                    }}
                >
                    Click any language to start reading in the Bible Explorer
                </p>
                <div
                    style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
                        gap: 12,
                    }}
                >
                    {BIBLE_LANGUAGES.map((lang) => (
                        <Link
                            key={lang.code}
                            href={`/bible-explorer?lang=${lang.code}`}
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 12,
                                padding: "14px 16px",
                                background: "#fff",
                                border: "1px solid #ebebeb",
                                borderRadius: 12,
                                textDecoration: "none",
                                color: "#1a1a1a",
                                transition: "all 0.2s",
                            }}
                        >
                            <span style={{ fontSize: 22 }}>{lang.flag}</span>
                            <div>
                                <div
                                    style={{
                                        fontSize: 14,
                                        fontWeight: 600,
                                        fontFamily: "sans-serif",
                                    }}
                                >
                                    {lang.name}
                                </div>
                                <div
                                    style={{
                                        fontSize: 11,
                                        color: "#999",
                                        fontFamily: "sans-serif",
                                    }}
                                >
                                    {lang.version}
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            </section>

            {/* All Bible Books Section */}
            <section
                style={{
                    maxWidth: 1100,
                    margin: "0 auto 80px",
                    padding: "0 24px",
                }}
            >
                <h2
                    style={{
                        fontFamily: "'Cinzel', serif",
                        fontSize: "clamp(24px, 3vw, 36px)",
                        fontWeight: 900,
                        textAlign: "center",
                        marginBottom: 40,
                    }}
                >
                    Browse All 66 Books of the Bible
                </h2>

                {/* Old Testament */}
                <div style={{ marginBottom: 40 }}>
                    <h3
                        style={{
                            fontSize: 13,
                            fontFamily: "sans-serif",
                            fontWeight: 700,
                            letterSpacing: "0.2em",
                            textTransform: "uppercase",
                            color: "#B8860B",
                            marginBottom: 16,
                            paddingBottom: 8,
                            borderBottom: "1px solid #ebebeb",
                        }}
                    >
                        📜 Old Testament — 39 Books
                    </h3>
                    <div
                        style={{
                            display: "flex",
                            flexWrap: "wrap",
                            gap: 8,
                        }}
                    >
                        {BIBLE_BOOKS_OT.map((book) => (
                            <Link
                                key={book}
                                href={`/bible/${book.toLowerCase().replace(/ /g, "-")}`}
                                style={{
                                    padding: "8px 16px",
                                    background: "#fff",
                                    border: "1px solid #ebebeb",
                                    borderRadius: 8,
                                    fontSize: 13,
                                    fontFamily: "sans-serif",
                                    color: "#444",
                                    textDecoration: "none",
                                    whiteSpace: "nowrap",
                                }}
                            >
                                {book}
                            </Link>
                        ))}
                    </div>
                </div>

                {/* New Testament */}
                <div>
                    <h3
                        style={{
                            fontSize: 13,
                            fontFamily: "sans-serif",
                            fontWeight: 700,
                            letterSpacing: "0.2em",
                            textTransform: "uppercase",
                            color: "#B8860B",
                            marginBottom: 16,
                            paddingBottom: 8,
                            borderBottom: "1px solid #ebebeb",
                        }}
                    >
                        ✝️ New Testament — 27 Books
                    </h3>
                    <div
                        style={{
                            display: "flex",
                            flexWrap: "wrap",
                            gap: 8,
                        }}
                    >
                        {BIBLE_BOOKS_NT.map((book) => (
                            <Link
                                key={book}
                                href={`/bible/${book.toLowerCase().replace(/ /g, "-")}`}
                                style={{
                                    padding: "8px 16px",
                                    background: "#fff",
                                    border: "1px solid #ebebeb",
                                    borderRadius: 8,
                                    fontSize: 13,
                                    fontFamily: "sans-serif",
                                    color: "#444",
                                    textDecoration: "none",
                                    whiteSpace: "nowrap",
                                }}
                            >
                                {book}
                            </Link>
                        ))}
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section
                style={{
                    maxWidth: 900,
                    margin: "0 auto 80px",
                    padding: "0 24px",
                }}
            >
                <h2
                    style={{
                        fontFamily: "'Cinzel', serif",
                        fontSize: "clamp(24px, 3vw, 36px)",
                        fontWeight: 900,
                        textAlign: "center",
                        marginBottom: 40,
                    }}
                >
                    Why Choose DailyMannaAI?
                </h2>
                <div
                    style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
                        gap: 20,
                    }}
                >
                    {[
                        {
                            icon: "🔍",
                            title: "AI-Powered Bible Search",
                            desc: "Ask any question about faith, theology, or life — get scripture-grounded answers instantly.",
                        },
                        {
                            icon: "🌐",
                            title: "200+ Bible Translations",
                            desc: "Read the Word in your native language. From English KJV to Hindi IRV to ancient Greek Septuagint.",
                        },
                        {
                            icon: "📖",
                            title: "Complete Old & New Testament",
                            desc: "Full coverage of all 66 books — Genesis to Revelation — in every supported language.",
                        },
                        {
                            icon: "📝",
                            title: "Personal Notebook",
                            desc: "Save verses, write study notes, create highlights, and build your devotional journal.",
                        },
                        {
                            icon: "🕊️",
                            title: "Spirit-Led Insights",
                            desc: "Our AI is trained on Scripture to give you prophetic, faith-building answers.",
                        },
                        {
                            icon: "⚡",
                            title: "Free & Fast",
                            desc: "No subscriptions, no ads. Just the pure Word of God — beautifully presented, instantly available.",
                        },
                    ].map((feature, i) => (
                        <div
                            key={i}
                            style={{
                                padding: "28px 24px",
                                background: "#fff",
                                borderRadius: 16,
                                border: "1px solid #ebebeb",
                            }}
                        >
                            <div style={{ fontSize: 32, marginBottom: 12 }}>{feature.icon}</div>
                            <h3
                                style={{
                                    fontSize: 16,
                                    fontWeight: 700,
                                    fontFamily: "sans-serif",
                                    marginBottom: 8,
                                }}
                            >
                                {feature.title}
                            </h3>
                            <p
                                style={{
                                    fontSize: 14,
                                    lineHeight: 1.6,
                                    color: "#666",
                                    fontFamily: "sans-serif",
                                }}
                            >
                                {feature.desc}
                            </p>
                        </div>
                    ))}
                </div>
            </section>

            {/* Footer */}
            <footer
                style={{
                    borderTop: "1px solid #ebebeb",
                    padding: "28px 40px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    flexWrap: "wrap",
                    gap: 12,
                    background: "#fff",
                }}
            >
                <span
                    style={{
                        fontFamily: "sans-serif",
                        fontSize: 12,
                        color: "#888",
                    }}
                >
                    © {new Date().getFullYear()} DailyMannaAI — Built with Prayer ✦
                </span>
                <nav style={{ display: "flex", gap: 20 }}>
                    {[
                        { label: "Home", href: "/" },
                        { label: "Bible Explorer", href: "/bible-explorer" },
                        { label: "Notebook", href: "/notebook" },
                        { label: "About", href: "/about" },
                        { label: "Contact", href: "/contact" },
                        { label: "Privacy", href: "/privacy-policy" },
                    ].map((link) => (
                        <Link
                            key={link.href}
                            href={link.href}
                            style={{
                                fontFamily: "sans-serif",
                                fontSize: 12,
                                color: "#666",
                                textDecoration: "none",
                            }}
                        >
                            {link.label}
                        </Link>
                    ))}
                </nav>
            </footer>
        </main>
    );
}
