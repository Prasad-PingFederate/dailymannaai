// lib/instant-answers.ts
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Smart instant answers: calculator, world time, date, age,
// tithe, unit conversion, Christian calendar.
// ✅ ZERO API KEYS — pure logic.
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export interface InstantAnswer {
    type: "calculator" | "date" | "time" | "age" | "bible" | "tithe";
    title: string;
    result: string;
    subtitle: string;
    link?: string;
    icon?: string;
}

// ── WORLD TIMEZONE MAP ────────────────────────────────────────
const TZ: Record<string, string> = {
    india: "Asia/Kolkata", kolkata: "Asia/Kolkata", mumbai: "Asia/Kolkata",
    delhi: "Asia/Kolkata", bangalore: "Asia/Kolkata", bengaluru: "Asia/Kolkata",
    chennai: "Asia/Kolkata", hyderabad: "Asia/Kolkata", pune: "Asia/Kolkata",
    usa: "America/New_York", "new york": "America/New_York", america: "America/New_York",
    "los angeles": "America/Los_Angeles", california: "America/Los_Angeles",
    chicago: "America/Chicago", texas: "America/Chicago", florida: "America/New_York",
    uk: "Europe/London", england: "Europe/London", london: "Europe/London",
    nigeria: "Africa/Lagos", lagos: "Africa/Lagos", abuja: "Africa/Lagos",
    ghana: "Africa/Accra", kenya: "Africa/Nairobi", nairobi: "Africa/Nairobi",
    "south africa": "Africa/Johannesburg", johannesburg: "Africa/Johannesburg", cape: "Africa/Johannesburg",
    ethiopia: "Africa/Addis_Ababa", uganda: "Africa/Kampala", tanzania: "Africa/Dar_es_Salaam",
    egypt: "Africa/Cairo", cairo: "Africa/Cairo",
    israel: "Asia/Jerusalem", jerusalem: "Asia/Jerusalem", "tel aviv": "Asia/Jerusalem",
    canada: "America/Toronto", toronto: "America/Toronto", vancouver: "America/Vancouver",
    australia: "Australia/Sydney", sydney: "Australia/Sydney", melbourne: "Australia/Melbourne",
    germany: "Europe/Berlin", berlin: "Europe/Berlin", france: "Europe/Paris", paris: "Europe/Paris",
    italy: "Europe/Rome", spain: "Europe/Madrid", greece: "Europe/Athens",
    philippines: "Asia/Manila", manila: "Asia/Manila", singapore: "Asia/Singapore",
    japan: "Asia/Tokyo", tokyo: "Asia/Tokyo", korea: "Asia/Seoul", seoul: "Asia/Seoul",
    china: "Asia/Shanghai", beijing: "Asia/Shanghai",
    brazil: "America/Sao_Paulo", mexico: "America/Mexico_City",
    dubai: "Asia/Dubai", uae: "Asia/Dubai", pakistan: "Asia/Karachi", karachi: "Asia/Karachi",
    bangladesh: "Asia/Dhaka", dhaka: "Asia/Dhaka",
    indonesia: "Asia/Jakarta", jakarta: "Asia/Jakarta",
    malaysia: "Asia/Kuala_Lumpur", thailand: "Asia/Bangkok", vietnam: "Asia/Ho_Chi_Minh",
};

function findTZ(location: string): string {
    const l = location.toLowerCase().trim();
    if (TZ[l]) return TZ[l];
    for (const [k, tz] of Object.entries(TZ)) {
        if (l.includes(k) || k.includes(l)) return tz;
    }
    return "UTC";
}

// ── SAFE MATH EVALUATOR ───────────────────────────────────────
// No eval() — handles: +, -, *, /, **, %, (, )
function safeMath(expr: string): number | null {
    try {
        // Only allow safe characters
        if (!/^[\d\s+\-*/.()%^,]+$/.test(expr)) return null;
        // Replace ^ with ** for power
        const clean = expr.replace(/\^/g, "**").replace(/,/g, "");
        // Use Function constructor (safer than eval in Next.js edge)
        // eslint-disable-next-line no-new-func
        const result = new Function(`"use strict"; return (${clean})`)();
        return typeof result === "number" && isFinite(result) ? result : null;
    } catch {
        return null;
    }
}

// ── FORMAT NUMBER ─────────────────────────────────────────────
function fmt(n: number): string {
    if (n % 1 === 0) return n.toLocaleString();
    // Up to 8 sig figs, strip trailing zeros
    return parseFloat(n.toPrecision(8)).toString();
}

// ── EASTER ALGORITHM (Meeus/Jones/Butcher) ────────────────────
function easter(year: number): Date {
    const a = year % 19, b = Math.floor(year / 100), c = year % 100;
    const d = Math.floor(b / 4), e = b % 4, f = Math.floor((b + 8) / 25);
    const g = Math.floor((b - f + 1) / 3), h = (19 * a + b - d - g + 15) % 30;
    const i = Math.floor(c / 4), k = c % 4, l = (32 + 2 * e + 2 * i - h - k) % 7;
    const m = Math.floor((a + 11 * h + 22 * l) / 451);
    const month = Math.floor((h + l - 7 * m + 114) / 31), day = ((h + l - 7 * m + 114) % 31) + 1;
    return new Date(year, month - 1, day);
}

function formatDate(d: Date): string {
    return d.toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
}

function daysAway(d: Date): string {
    const diff = Math.ceil((d.getTime() - Date.now()) / 86400000);
    if (diff === 0) return "🎉 TODAY!";
    if (diff > 0) return `${diff} days away`;
    return `${Math.abs(diff)} days ago`;
}

// ── MAIN DETECTOR ─────────────────────────────────────────────
export function detectInstantAnswer(query: string): InstantAnswer | null {
    const q = query.trim();
    const ql = q.toLowerCase();

    // ── 1. PURE MATH ──────────────────────────────────────────
    // Matches: 25*4, (100+50)/3, 2^10, 144/12+7, etc.
    if (/^[\d\s+\-*/().%^,]+$/.test(q) && /\d/.test(q)) {
        const r = safeMath(q.replace(/=\s*$/, ""));
        if (r !== null) return { type: "calculator", icon: "🧮", title: "Calculator", result: fmt(r), subtitle: `${q} = ${fmt(r)}` };
    }

    // Also: "what is 25 * 4" / "calculate 144/12"
    const calcPhrase = ql.match(/(?:what\s+is|calculate|compute|eval(?:uate)?|solve)\s+([\d\s+\-*/().%^,]+)/i);
    if (calcPhrase) {
        const r = safeMath(calcPhrase[1]);
        if (r !== null) return { type: "calculator", icon: "🧮", title: "Calculator", result: fmt(r), subtitle: `${calcPhrase[1].trim()} = ${fmt(r)}` };
    }

    // ── 2. PERCENTAGE ─────────────────────────────────────────
    const pctOf = ql.match(/^(\d+(?:\.\d+)?)\s*%\s*of\s*([\d,]+(?:\.\d+)?)/);
    if (pctOf) {
        const pct = parseFloat(pctOf[1]), num = parseFloat(pctOf[2].replace(/,/g, ""));
        const ans = (pct / 100) * num;
        return { type: "calculator", icon: "📊", title: `${pct}% of ${num.toLocaleString()}`, result: ans.toLocaleString("en-IN", { maximumFractionDigits: 2 }), subtitle: `${pct}% × ${num.toLocaleString()} = ${ans.toLocaleString()}` };
    }

    // ── 3. TITHE CALCULATOR ───────────────────────────────────
    const titheM = ql.match(/tithe(?:\s+(?:on|of|from|for))?\s+([\d,]+)/i);
    if (titheM) {
        const inc = parseFloat(titheM[1].replace(/,/g, ""));
        const t = inc * 0.1, o = inc * 0.02;
        return { type: "tithe", icon: "✝️", title: "Tithe Calculator · Malachi 3:10", result: t.toLocaleString("en-IN", { maximumFractionDigits: 2 }), subtitle: `10% tithe = ${t.toLocaleString()} | 2% offering = ${o.toLocaleString()} | Total = ${(t + o).toLocaleString()} of ${inc.toLocaleString()}`, link: "https://www.biblegateway.com/passage/?search=Malachi+3%3A10&version=KJV" };
    }

    // ── 4. TODAY'S DATE ───────────────────────────────────────
    if (/\b(today'?s?\s+date|what\s+(day|date)\s+is\s+(it|today)|current\s+date|today)\b/i.test(ql) && !/time/.test(ql)) {
        const now = new Date();
        const day = now.toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
        const doy = Math.ceil((now.getTime() - new Date(now.getFullYear(), 0, 0).getTime()) / 86400000);
        return { type: "date", icon: "📅", title: "Today's Date", result: day, subtitle: `Day ${doy} of 365 · Week ${Math.ceil(doy / 7)} · ${365 - doy} days left in ${now.getFullYear()}` };
    }

    // ── 5. WORLD TIME ─────────────────────────────────────────
    const timeIn = ql.match(/time\s+in\s+(.+)/i);
    const isNow = /^(what\s+time\s+is\s+it|current\s+time|time\s+now|local\s+time|my\s+time)$/i.test(ql);
    if (timeIn || isNow) {
        const location = timeIn ? timeIn[1].trim() : "local";
        const tz = location === "local" ? "Asia/Kolkata" : findTZ(location);
        const now = new Date();
        const time = now.toLocaleTimeString("en-US", { timeZone: tz, hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: true });
        const date = now.toLocaleDateString("en-US", { timeZone: tz, weekday: "long", month: "long", day: "numeric", year: "numeric" });
        const label = isNow ? "Current Time" : `Time in ${location.charAt(0).toUpperCase() + location.slice(1)}`;
        const offset = new Date().toLocaleString("en", { timeZone: tz, timeZoneName: "short" }).split(" ").pop() ?? tz;
        return { type: "time", icon: "🕐", title: label, result: time, subtitle: `${date} · ${tz.replace(/_/g, " ")} (${offset})` };
    }

    // ── 6. AGE CALCULATOR ────────────────────────────────────
    if (/\b(age|born|how\s+old)\b/i.test(ql)) {
        const patterns = [/(\d{4}-\d{1,2}-\d{1,2})/, /(\d{1,2}\/\d{1,2}\/\d{4})/, /(\d{1,2}-\d{1,2}-\d{4})/, /((?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s+\d{1,2},?\s+\d{4})/i];
        for (const p of patterns) {
            const m = ql.match(p);
            if (m) {
                const dob = new Date(m[1]);
                if (!isNaN(dob.getTime()) && dob < new Date()) {
                    const now = new Date();
                    const yrs = now.getFullYear() - dob.getFullYear() - (now < new Date(now.getFullYear(), dob.getMonth(), dob.getDate()) ? 1 : 0);
                    const next = new Date(now.getFullYear(), dob.getMonth(), dob.getDate());
                    if (next < now) next.setFullYear(now.getFullYear() + 1);
                    const toNext = Math.ceil((next.getTime() - now.getTime()) / 86400000);
                    const totalDays = Math.floor((now.getTime() - dob.getTime()) / 86400000);
                    return { type: "age", icon: "🎂", title: "Age Calculator", result: `${yrs} years old`, subtitle: `${totalDays.toLocaleString()} days lived · Next birthday in ${toNext} days · Born ${dob.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}` };
                }
            }
        }
        if (/age\s+calculator|how\s+old\s+am\s+i/i.test(ql)) return { type: "age", icon: "🎂", title: "Age Calculator", result: "Enter your birthdate", subtitle: 'Example: "born 1990-05-15" or "age 15/05/1990"' };
    }

    // ── 7. DATE DIFFERENCE ────────────────────────────────────
    const diffM = ql.match(/days?\s+(?:between|from)\s+(.+?)\s+(?:and|to)\s+(.+)/i);
    if (diffM) {
        const d1 = new Date(diffM[1]), d2 = new Date(diffM[2]);
        if (!isNaN(d1.getTime()) && !isNaN(d2.getTime())) {
            const days = Math.abs(Math.round((d2.getTime() - d1.getTime()) / 86400000));
            const weeks = Math.floor(days / 7);
            return { type: "date", icon: "📆", title: "Date Difference", result: `${days.toLocaleString()} days`, subtitle: `${weeks} weeks ${days % 7} days · ~${Math.round(days / 30.44)} months · ${d1.toDateString()} → ${d2.toDateString()}` };
        }
    }

    // ── 8. CHRISTIAN CALENDAR ─────────────────────────────────
    const yr = new Date().getFullYear();
    const customYear = ql.match(/\b(20\d{2})\b/)?.[1];
    const targetYear = customYear ? parseInt(customYear) : yr;

    if (/\beaster\b/i.test(ql)) {
        const e = easter(targetYear);
        const gf = new Date(e.getTime() - 2 * 86400000);
        return { type: "date", icon: "🐣", title: `Easter ${targetYear}`, result: formatDate(e), subtitle: `${daysAway(e)} · Good Friday: ${gf.toLocaleDateString("en-US", { month: "long", day: "numeric" })}`, link: `https://www.biblegateway.com/passage/?search=Luke+24&version=KJV` };
    }
    if (/good\s+friday/i.test(ql)) {
        const gf = new Date(easter(targetYear).getTime() - 2 * 86400000);
        return { type: "date", icon: "✝️", title: `Good Friday ${targetYear}`, result: formatDate(gf), subtitle: daysAway(gf), link: "https://www.biblegateway.com/passage/?search=John+19&version=KJV" };
    }
    if (/christmas/i.test(ql)) {
        const xmas = new Date(targetYear, 11, 25);
        return { type: "date", icon: "🎄", title: `Christmas ${targetYear}`, result: formatDate(xmas), subtitle: daysAway(xmas), link: "https://www.biblegateway.com/passage/?search=Luke+2&version=KJV" };
    }
    if (/pentecost/i.test(ql)) {
        const p = new Date(easter(targetYear).getTime() + 49 * 86400000);
        return { type: "date", icon: "🔥", title: `Pentecost ${targetYear}`, result: formatDate(p), subtitle: daysAway(p), link: "https://www.biblegateway.com/passage/?search=Acts+2&version=KJV" };
    }
    if (/advent/i.test(ql)) {
        const xmasDay = new Date(targetYear, 11, 25).getDay();
        const advent = new Date(targetYear, 11, 25 - xmasDay - 21);
        return { type: "date", icon: "🕯️", title: `First Sunday of Advent ${targetYear}`, result: formatDate(advent), subtitle: daysAway(advent) };
    }
    if (/ash\s+wednesday|lent/i.test(ql)) {
        const aw = new Date(easter(targetYear).getTime() - 46 * 86400000);
        return { type: "date", icon: "🌿", title: `Ash Wednesday ${targetYear}`, result: formatDate(aw), subtitle: `Lent begins — 40 days of fasting · ${daysAway(aw)}` };
    }

    // ── 9. TEMPERATURE CONVERSION ────────────────────────────
    const toC = ql.match(/^(-?\d+(?:\.\d+)?)\s*°?\s*f(?:ahrenheit)?\s+(?:to|in)\s+(?:°?\s*c|celsius)/i);
    if (toC) { const c = ((parseFloat(toC[1]) - 32) * 5 / 9); return { type: "calculator", icon: "🌡️", title: "Temperature", result: `${c.toFixed(1)}°C`, subtitle: `${toC[1]}°F = ${c.toFixed(4)}°C` }; }
    const toF = ql.match(/^(-?\d+(?:\.\d+)?)\s*°?\s*c(?:elsius)?\s+(?:to|in)\s+(?:°?\s*f|fahrenheit)/i);
    if (toF) { const f = ((parseFloat(toF[1])) * 9 / 5 + 32); return { type: "calculator", icon: "🌡️", title: "Temperature", result: `${f.toFixed(1)}°F`, subtitle: `${toF[1]}°C = ${f.toFixed(4)}°F` }; }

    // ── 10. DISTANCE ─────────────────────────────────────────
    const toMi = ql.match(/^(\d+(?:\.\d+)?)\s*km\s+(?:to|in)\s+mi/i);
    if (toMi) { const mi = parseFloat(toMi[1]) * 0.621371; return { type: "calculator", icon: "📏", title: "Distance", result: `${mi.toFixed(2)} miles`, subtitle: `${toMi[1]} km = ${mi.toFixed(4)} miles` }; }
    const toKm = ql.match(/^(\d+(?:\.\d+)?)\s*mi(?:les?)?\s+(?:to|in)\s+km/i);
    if (toKm) { const km = parseFloat(toKm[1]) * 1.60934; return { type: "calculator", icon: "📏", title: "Distance", result: `${km.toFixed(2)} km`, subtitle: `${toKm[1]} miles = ${km.toFixed(4)} km` }; }

    return null;
}
