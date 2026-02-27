"use client";

import { ShieldAlert, ShieldCheck } from "lucide-react";
import { useState } from "react";
import Navigation from "../components/Navigation";
import BlacklistTab from "./components/BlacklistTab";
import LogsTab from "./components/LogsTab";
import ManagementTab from "./components/ManagementTab";
import SafetyTab from "./components/SafetyTab";
import UsersTab from "./components/UsersTab";
import { useAdminAuth } from "./hooks/useAdminAuth";
import type { AdminTab } from "./types";

const TABS: {
  key: AdminTab;
  label: string;
  color?: string;
  icon?: React.ReactNode;
}[] = [
  { key: "blacklist", label: "רשימה שחורה" },
  { key: "users", label: "ניהול משתמשים" },
  { key: "logs", label: "לוג עבירות" },
  { key: "management", label: "ניהול מערכת" },
  {
    key: "safety",
    label: "בטיחות ילדים",
    color: "green",
    icon: <ShieldCheck size={14} />,
  },
];

export default function AdminPage() {
  const { currentUser, isVerifying, supabase } = useAdminAuth();
  const [activeTab, setActiveTab] = useState<AdminTab>("blacklist");

  if (isVerifying) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#050510]">
        <span className="h-10 w-10 animate-spin rounded-full border-4 border-red-500/30 border-t-red-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050510] pb-24 transition-all md:pr-64 md:pb-0">
      <Navigation />

      <main className="mx-auto max-w-7xl p-6">
        <header className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="mb-2 flex items-center gap-3 font-bold text-3xl text-white">
              <ShieldAlert className="text-red-500" size={32} />
              <span>ניהול ומודרציה</span>
            </h1>
            <p className="text-gray-400">מערכת הגנה על השיחות ב-GamerZone</p>
          </div>
        </header>

        {/* Tabs */}
        <div className="mb-8 flex gap-4 overflow-x-auto border-white/10 border-b">
          {TABS.map((tab) => {
            const isActive = activeTab === tab.key;
            const color = tab.color || "red";
            return (
              <button
                className={`relative flex items-center gap-1.5 whitespace-nowrap px-4 pb-3 font-bold text-sm transition-all ${
                  isActive
                    ? `text-${color}-500`
                    : "text-gray-500 hover:text-white"
                }`}
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
              >
                {tab.icon}
                {tab.label}
                {isActive && (
                  <div
                    className={`absolute right-0 bottom-0 h-0.5 w-full bg-${color}-500 rounded-t-full`}
                  />
                )}
              </button>
            );
          })}
        </div>

        {/* Tab Content */}
        {activeTab === "blacklist" && (
          <BlacklistTab currentUser={currentUser} supabase={supabase} />
        )}
        {activeTab === "users" && (
          <UsersTab currentUser={currentUser} supabase={supabase} />
        )}
        {activeTab === "logs" && <LogsTab supabase={supabase} />}
        {activeTab === "management" && <ManagementTab supabase={supabase} />}
        {activeTab === "safety" && (
          <SafetyTab currentUser={currentUser} supabase={supabase} />
        )}
      </main>
    </div>
  );
}
