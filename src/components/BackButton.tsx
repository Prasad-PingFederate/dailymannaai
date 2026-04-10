"use client";

import { usePathname, useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

export default function BackButton() {
  const router = useRouter();
  const pathname = usePathname();

  return (
    <button
      onClick={() => router.back()}
      className="p-2 flex items-center justify-center rounded-full shadow-md backdrop-blur-md transition-all duration-200 group"
      style={{
        display: pathname === "/" ? "none" : "flex",
        position: "fixed",
        top: "14px",
        left: "18px",
        zIndex: 2147483647,
        backgroundColor: "rgba(255, 255, 255, 0.9)",
        border: "1px solid rgba(0, 0, 0, 0.1)",
        color: "#1a1a1a",
      }}
      aria-label="Go back"
    >
      <ArrowLeft size={18} className="group-hover:-translate-x-0.5 transition-transform duration-200" />
      <span className="ml-1.5 pr-1 text-sm font-medium hidden sm:inline-block">Back</span>
    </button>
  );
}

