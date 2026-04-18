"use client";

import { useTheme } from "@/context/ThemeContext";
import { Sun, Moon } from "lucide-react";

interface ThemeToggleProps {
    variant?: "icon" | "pill";
}

export default function ThemeToggle({ variant = "icon" }: ThemeToggleProps) {
    const { toggleTheme, isDark } = useTheme();

    if (variant === "pill") {
        return (
            <button
                onClick={toggleTheme}
                className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3.5 py-1.5 rounded-full bg-slate-100 dark:bg-navy-3 border border-slate-200 dark:border-white/10 text-[11px] sm:text-xs font-bold text-slate-600 dark:text-slate-400 hover:text-navy dark:hover:text-white transition-all shadow-sm"
            >
                {isDark ? <Sun size={14} className="text-amber-500" /> : <Moon size={14} className="text-sky-600" />}
                <span>{isDark ? "Light" : "Dark"}</span>
            </button>
        );
    }

    return (
        <button
            onClick={toggleTheme}
            className={`relative w-12 h-6 rounded-full transition-all duration-300 flex items-center p-1 ${isDark ? "bg-amber-500/10 border border-amber-500/30" : "bg-slate-200 border border-slate-300"}`}
        >
            <div className={`w-4 h-4 rounded-full shadow-md transition-transform duration-300 flex items-center justify-center ${isDark ? "translate-x-6 bg-amber-500" : "translate-x-0 bg-white"}`}>
                {isDark ? <Sun size={10} className="text-white" /> : <Moon size={10} className="text-slate-600" />}
            </div>
        </button>
    );
}
