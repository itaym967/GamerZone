"use client";

import { useState } from "react";
import Navigation from "../components/Navigation";
import { ShieldAlert, ShieldCheck } from "lucide-react";
import { useAdminAuth } from "./hooks/useAdminAuth";
import BlacklistTab from "./components/BlacklistTab";
import UsersTab from "./components/UsersTab";
import LogsTab from "./components/LogsTab";
import ManagementTab from "./components/ManagementTab";
import SafetyTab from "./components/SafetyTab";
import type { AdminTab } from "./types";

const TABS: { key: AdminTab; label: string; color?: string; icon?: React.ReactNode }[] = [
    { key: "blacklist", label: "רשימה שחורה" },
    { key: "users", label: "ניהול משתמשים" },
    { key: "logs", label: "לוג עבירות" },
    { key: "management", label: "ניהול מערכת" },
    { key: "safety", label: "בטיחות ילדים", color: "green", icon: <ShieldCheck size={14} /> },
];

export default function AdminPage() {
    const { currentUser, isVerifying, supabase } = useAdminAuth();
    const [activeTab, setActiveTab] = useState<AdminTab>("blacklist");

    if (isVerifying) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#050510]">
                <span className="w-10 h-10 border-4 border-red-500/30 border-t-red-500 rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen pb-24 md:pb-0 md:pr-64 transition-all bg-[#050510]">
            <Navigation />

            <main className="p-6 max-w-7xl mx-auto">
                <header className="mb-8 flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
                            <ShieldAlert className="text-red-500" size={32} />
                            <span>ניהול ומודרציה</span>
                        </h1>
                        <p className="text-gray-400">מערכת הגנה על השיחות ב-GamerZone</p>
                    </div>
                </header>

                {/* Tabs */}
                <div className="flex gap-4 border-b border-white/10 mb-8 overflow-x-auto">
                    {TABS.map((tab) => {
                        const isActive = activeTab === tab.key;
                        const color = tab.color || "red";
                        return (
                            <button
                                key={tab.key}
                                onClick={() => setActiveTab(tab.key)}
                                className={`pb-3 px-4 text-sm font-bold transition-all relative whitespace-nowrap flex items-center gap-1.5 ${
                                    isActive ? `text-${color}-500` : "text-gray-500 hover:text-white"
                                }`}
                            >
                                {tab.icon}
                                {tab.label}
                                {isActive && (
                                    <div className={`absolute bottom-0 right-0 w-full h-0.5 bg-${color}-500 rounded-t-full`} />
                                )}
                            </button>
                        );
                    })}
                </div>

                {/* Tab Content */}
                {activeTab === "blacklist" && <BlacklistTab supabase={supabase} currentUser={currentUser} />}
                {activeTab === "users" && <UsersTab supabase={supabase} currentUser={currentUser} />}
                {activeTab === "logs" && <LogsTab supabase={supabase} />}
                {activeTab === "management" && <ManagementTab supabase={supabase} />}
                {activeTab === "safety" && <SafetyTab supabase={supabase} currentUser={currentUser} />}
            </main>
        </div>
    );
}
