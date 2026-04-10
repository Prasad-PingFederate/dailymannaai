"use client";

import { usePathname, useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { useState, useEffect } from "react";

export default function BackButton() {
  const router = useRouter();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  // Do not show the back button on the home page
  if (pathname === "/") return null;

  return (
    <button
      onClick={() => router.back()}
      className="fixed top-3 left-4 z-[9999] p-2 flex items-center justify-center rounded-full bg-white/80 dark:bg-black/80 shadow-md backdrop-blur-md border border-gray-200 dark:border-gray-800 text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-900 transition-all duration-200 group"
      aria-label="Go back"
    >
      <ArrowLeft size={18} className="group-hover:-translate-x-0.5 transition-transform duration-200" />
      <span className="ml-1.5 pr-1 text-sm font-medium hidden sm:inline-block">Back</span>
    </button>
  );
}
