"use client";

import { useState, useEffect, useCallback } from "react";
import { Shield, Search, Filter, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { SupabaseClient } from "@supabase/supabase-js";
import type { AdminLog } from "../types";

interface LogsTabProps {
  supabase: SupabaseClient;
}

const ACTION_LABELS: Record<string, { label: string; color: string }> = {
  ADD_WORD: { label: "הוספת מילה", color: "text-blue-400 bg-blue-500/20" },
  REMOVE_WORD: { label: "הסרת מילה", color: "text-orange-400 bg-orange-500/20" },
  ADD_WORD_FROM_AI: { label: "הוספה מ-AI", color: "text-purple-400 bg-purple-500/20" },
  AI_TOXICITY_ANALYSIS: { label: "ניתוח AI", color: "text-purple-400 bg-purple-500/20" },
  FREEZE_USER: { label: "הקפאת משתמש", color: "text-red-400 bg-red-500/20" },
  UNFREEZE_USER: { label: "שחרור משתמש", color: "text-green-400 bg-green-500/20" },
  DELETE_USER: { label: "מחיקת משתמש", color: "text-red-400 bg-red-500/20" },
  CHANGE_ROLE: { label: "שינוי תפקיד", color: "text-amber-400 bg-amber-500/20" },
  RESOLVE_REPORT: { label: "טיפול בדיווח", color: "text-green-400 bg-green-500/20" },
  DISMISS_REPORT: { label: "דחיית דיווח", color: "text-gray-400 bg-gray-500/20" },
};

type ActionFilter = "all" | "words" | "users" | "reports" | "ai";

export default function LogsTab({ supabase }: LogsTabProps) {
  const [logs, setLogs] = useState<AdminLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [actionFilter, setActionFilter] = useState<ActionFilter>("all");

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("admin_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      setLogs(data || []);
    } catch (error) {
      console.error("Error fetching logs:", error);
      toast.error("שגיאה בטעינת לוגים");
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const filtered = logs.filter((log) => {
    const matchesSearch = !searchQuery
      || log.action.toLowerCase().includes(searchQuery.toLowerCase())
      || JSON.stringify(log.details).toLowerCase().includes(searchQuery.toLowerCase());

    const matchesFilter =
      actionFilter === "all" ||
      (actionFilter === "words" && (log.action.includes("WORD"))) ||
      (actionFilter === "users" && (log.action.includes("USER") || log.action.includes("ROLE"))) ||
      (actionFilter === "reports" && log.action.includes("REPORT")) ||
      (actionFilter === "ai" && log.action.includes("AI"));

    return matchesSearch && matchesFilter;
  });

  const getActionDisplay = (action: string) => {
    const info = ACTION_LABELS[action];
    if (info) return info;
    return { label: action, color: "text-gray-400 bg-gray-500/20" };
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <span className="w-10 h-10 border-4 border-red-500/30 border-t-red-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search & Filters */}
      <div className="flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="חפש בלוגים..."
            className="w-full bg-[#0e0e1b] border border-white/5 rounded-xl pr-10 pl-4 py-2.5 text-white text-sm outline-none focus:border-red-500/30 text-right"
          />
        </div>
        <div className="flex gap-2 items-center">
          <Filter size={14} className="text-gray-500" />
          {(["all", "words", "users", "reports", "ai"] as ActionFilter[]).map((f) => (
            <button
              key={f}
              onClick={() => setActionFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                actionFilter === f
                  ? "bg-red-500/20 text-red-400 border border-red-500/30"
                  : "bg-white/5 text-gray-400 border border-white/5 hover:bg-white/10"
              }`}
            >
              {f === "all" ? "הכל" : f === "words" ? "מילים" : f === "users" ? "משתמשים" : f === "reports" ? "דיווחים" : "AI"}
            </button>
          ))}
          <button
            onClick={fetchLogs}
            className="p-2 rounded-lg bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white transition-all"
            title="רענן"
          >
            <RefreshCw size={14} />
          </button>
        </div>
      </div>

      <div className="text-xs text-gray-500 text-right">{filtered.length} רשומות</div>

      {/* Logs Table */}
      <div className="bg-[#0e0e1b] rounded-2xl border border-white/5 overflow-hidden">
        <table className="w-full text-right text-sm">
          <thead className="bg-white/5 text-gray-400">
            <tr>
              <th className="p-4 font-medium">זמן</th>
              <th className="p-4 font-medium">פעולה</th>
              <th className="p-4 font-medium">פרטים</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5 text-gray-300">
            {filtered.map((log) => {
              const display = getActionDisplay(log.action);
              return (
                <tr key={log.id} className="hover:bg-white/5 transition-colors">
                  <td className="p-4 font-mono text-xs opacity-60">
                    {new Date(log.created_at).toLocaleString("he-IL")}
                  </td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded text-xs font-bold ${display.color}`}>
                      {display.label}
                    </span>
                  </td>
                  <td className="p-4 opacity-80 max-w-[300px] truncate" title={JSON.stringify(log.details)}>
                    {formatDetails(log.details)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="p-12 text-center text-gray-500 flex flex-col items-center gap-3">
            <div className="bg-white/5 p-4 rounded-full">
              <Shield size={32} />
            </div>
            <p>{searchQuery ? "לא נמצאו תוצאות" : "אין לוגים להצגה."}</p>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Format log details into a readable Hebrew string.
 */
function formatDetails(details: any): string {
  if (!details) return "-";
  if (typeof details === "string") return details;

  const parts: string[] = [];
  if (details.word) parts.push(`מילה: ${details.word}`);
  if (details.target_user) parts.push(`משתמש: ${details.target_user}`);
  if (details.target_username) parts.push(`משתמש: ${details.target_username}`);
  if (details.reason) parts.push(`סיבה: ${details.reason}`);
  if (details.old_role) parts.push(`מ-${details.old_role} ל-${details.new_role}`);
  if (details.wordCount) parts.push(`${details.wordCount} מילים`);
  if (details.report_type) parts.push(`סוג: ${details.report_type}`);

  return parts.length > 0 ? parts.join(" | ") : JSON.stringify(details);
}
