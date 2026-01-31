"use client";

import dynamic from "next/dynamic";
import React from "react";

// CRITICAL: We load the actual workspace with SSR: FALSE
// This prevents the build server from ever seeing pdfjs-dist / canvas errors.
// This is the absolute most robust way to fix bundling errors in Next.js.
const NotebookCore = dynamic(
    () => import("@/components/notebook/NotebookCore"),
    {
        ssr: false,
        loading: () => (
            <div className="h-screen w-screen flex flex-col items-center justify-center bg-background text-foreground">
                <div className="animate-spin text-4xl mb-4">🛸</div>
                <h1 className="text-xl font-bold tracking-widest uppercase">Initializing AntiGravity Core</h1>
                <p className="text-muted text-sm mt-2">Bypassing build-time constraints...</p>
            </div>
        )
    }
);

export default function Page() {
    return <NotebookCore />;
}
