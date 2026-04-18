"use client";
import { useAuth } from "@/hooks/useAuth";
import Link from "next/link";
import { useState } from "react";
import { User, LogOut, ChevronDown, Shield, Mail } from "lucide-react";

export default function UserMenu() {
    const { user, loading, logout, isLoggedIn } = useAuth();
    const [open, setOpen] = useState(false);

    if (loading) return <div className="w-20 h-8 rounded-lg bg-slate-100 dark:bg-navy-2 animate-pulse" />;

    if (!isLoggedIn) return (
        <Link 
            href="/auth/signin?callbackUrl=/" 
            className="inline-flex items-center gap-1.5 sm:gap-2 bg-gold hover:bg-gold-2 text-navy px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg text-[10px] sm:text-xs font-bold tracking-widest uppercase transition-all shadow-md active:scale-95"
        >
            Sign In
        </Link>
    );

    const initials = user!.name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);

    return (
        <div className="relative">
            <button 
                onClick={() => setOpen(!open)}
                className="flex items-center gap-2 p-1 pr-3 rounded-full bg-slate-100 dark:bg-navy-2 border border-slate-200 dark:border-white/10 hover:border-gold/40 transition-all font-sans"
            >
                <div className="w-7 h-7 rounded-full bg-gold text-navy flex items-center justify-center text-[10px] font-black">
                    {initials}
                </div>
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300 max-w-[80px] truncate">
                    {user!.name.split(" ")[0]}
                </span>
                <ChevronDown size={12} className={`text-slate-400 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
            </button>

            {open && (
                <>
                    <div className="fixed inset-0 z-[100]" onClick={() => setOpen(false)} />
                    <div className="absolute top-full mt-2 right-0 w-64 bg-white dark:bg-navy-2 border border-slate-200 dark:border-white/10 rounded-2xl shadow-2xl z-[110] p-2 animate-in fade-in slide-in-from-top-2 duration-200">
                        <div className="p-4 border-b border-slate-100 dark:border-white/5 mb-2">
                            <div className="flex items-center gap-3 mb-3">
                                <div className="w-10 h-10 rounded-xl bg-gold/10 flex items-center justify-center text-gold font-black">
                                    {initials}
                                </div>
                                <div className="min-w-0">
                                    <div className="text-sm font-black text-slate-900 dark:text-white truncate">{user!.name}</div>
                                    <div className="text-[10px] text-slate-500 flex items-center gap-1 font-sans">
                                        <Mail size={10} />
                                        <span className="truncate">{user!.email}</span>
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 px-2 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-[9px] font-black uppercase tracking-widest text-emerald-600 font-sans">
                                <Shield size={10} />
                                {user!.plan} PLAN ACTIVE
                            </div>
                        </div>

                        <button 
                            onClick={() => { setOpen(false); logout(); }}
                            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors font-sans"
                        >
                            <LogOut size={16} />
                            Sign Out
                        </button>
                    </div>
                </>
            )}
        </div>
    );
}
