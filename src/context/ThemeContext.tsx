// src/context/ThemeContext.tsx
"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";

type Theme = "light" | "dark";

interface ThemeContextType {
    theme: Theme;
    toggleTheme: () => void;
    isDark: boolean;
}

const ThemeContext = createContext<ThemeContextType>({
    theme: "light",
    toggleTheme: () => { },
    isDark: false,
});

export function ThemeProvider({ children }: { children: ReactNode }) {
    const [theme, setTheme] = useState<Theme>("light");
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        // On mount: read from localStorage or system preference
        const stored = localStorage.getItem("dailymanna-theme") as Theme | null;
        if (stored) {
            setTheme(stored);
        } else {
            // Respect system preference
            const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
            setTheme(prefersDark ? "dark" : "light");
        }
        setMounted(true);
    }, []);

    useEffect(() => {
        if (!mounted) return;
        // Apply theme to <html> element
        const root = document.documentElement;
        root.setAttribute("data-theme", theme);
        
        // Also toggle the 'dark' class for Tailwind 'dark:' utility support
        if (theme === "dark") {
            root.classList.add("dark");
        } else {
            root.classList.remove("dark");
        }
        
        localStorage.setItem("dailymanna-theme", theme);
    }, [theme, mounted]);

    function toggleTheme() {
        setTheme((prev) => (prev === "light" ? "dark" : "light"));
    }

    // Prevent flash of wrong theme by using the 'mounted' state inside the components if needed,
    // but ALWAYS render the provider to avoid Root Hydration crashes on mobile.
    return (
        <ThemeContext.Provider value={{ theme, toggleTheme, isDark: theme === "dark" }}>
            <div style={{ visibility: mounted ? "visible" : "hidden" }}>
                {children}
            </div>
        </ThemeContext.Provider>
    );
}

export function useTheme() {
    return useContext(ThemeContext);
}
