// src/app/blog/generate/layout.tsx
import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Spiritual Blog Question Generator — DailyManna AI",
    description:
        "AI-powered generator for high-volume Christian spiritual questions. Build your blog content library with questions that millions of believers search for.",
};

export default function GenerateLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
