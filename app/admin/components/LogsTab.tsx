"use client";

import {
  FilterIcon,
  Refresh01Icon,
  Search01Icon,
  Shield01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import type { SupabaseClient } from "@supabase/supabase-js";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import type { AdminLog } from "../types";

interface LogsTabProps {
  supabase: SupabaseClient;
}

const ACTION_LABELS: Record<string, { label: string; color: string }> = {
  ADD_WORD: { label: "הוספת מילה", color: "text-blue-400 bg-blue-500/20" },
  REMOVE_WORD: {
    label: "הסרת מילה",
    color: "text-orange-400 bg-orange-500/20",
  },
  ADD_WORD_FROM_AI: {
    label: "הוספה מ-AI",
    color: "text-purple-400 bg-purple-500/20",
  },
  AI_TOXICITY_ANALYSIS: {
    label: "ניתוח AI",
    color: "text-purple-400 bg-purple-500/20",
  },
  FREEZE_USER: { label: "הקפאת משתמש", color: "text-red-400 bg-red-500/20" },
  UNFREEZE_USER: {
    label: "שחרור משתמש",
    color: "text-green-400 bg-green-500/20",
  },
  DELETE_USER: { label: "מחיקת משתמש", color: "text-red-400 bg-red-500/20" },
  CHANGE_ROLE: {
    label: "שינוי תפקיד",
    color: "text-amber-400 bg-amber-500/20",
  },
  RESOLVE_REPORT: {
    label: "טיפול בדיווח",
    color: "text-green-400 bg-green-500/20",
  },
  DISMISS_REPORT: {
    label: "דחיית דיווח",
    color: "text-gray-400 bg-gray-500/20",
  },
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
      if (error) {
        throw error;
      }
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
    const matchesSearch =
      !searchQuery ||
      log.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
      JSON.stringify(log.details)
        .toLowerCase()
        .includes(searchQuery.toLowerCase());

    const matchesFilter =
      actionFilter === "all" ||
      (actionFilter === "words" && log.action.includes("WORD")) ||
      (actionFilter === "users" &&
        (log.action.includes("USER") || log.action.includes("ROLE"))) ||
      (actionFilter === "reports" && log.action.includes("REPORT")) ||
      (actionFilter === "ai" && log.action.includes("AI"));

    return matchesSearch && matchesFilter;
  });

  const getActionDisplay = (action: string) => {
    const info = ACTION_LABELS[action];
    if (info) {
      return info;
    }
    return { label: action, color: "text-gray-400 bg-gray-500/20" };
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <span className="h-10 w-10 animate-spin rounded-full border-4 border-red-500/30 border-t-red-500" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search & Filters */}
      <div className="flex flex-col gap-3 md:flex-row">
        <div className="relative flex-1">
          <HugeiconsIcon
            className="absolute top-1/2 right-3 -translate-y-1/2 text-gray-500"
            icon={Search01Icon}
            size={16}
          />
          <input
            className="w-full rounded-xl border border-white/5 bg-card py-2.5 pr-10 pl-4 text-right text-sm text-white outline-hidden focus:border-red-500/30"
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="חפש בלוגים..."
            type="text"
            value={searchQuery}
          />
        </div>
        <div className="flex items-center gap-2">
          <HugeiconsIcon
            className="text-gray-500"
            icon={FilterIcon}
            size={14}
          />
          {(["all", "words", "users", "reports", "ai"] as ActionFilter[]).map(
            (f) => (
              <button
                className={`rounded-lg px-3 py-1.5 font-bold text-xs transition-all ${
                  actionFilter === f
                    ? "border border-red-500/30 bg-red-500/20 text-red-400"
                    : "border border-white/5 bg-white/5 text-gray-400 hover:bg-white/10"
                }`}
                key={f}
                onClick={() => setActionFilter(f)}
              >
                {f === "all"
                  ? "הכל"
                  : f === "words"
                    ? "מילים"
                    : f === "users"
                      ? "משתמשים"
                      : f === "reports"
                        ? "דיווחים"
                        : "AI"}
              </button>
            )
          )}
          <button
            className="rounded-lg bg-white/5 p-2 text-gray-400 transition-all hover:bg-white/10 hover:text-white"
            onClick={fetchLogs}
            title="רענן"
          >
            <HugeiconsIcon icon={Refresh01Icon} size={14} />
          </button>
        </div>
      </div>

      <div className="text-right text-gray-500 text-xs">
        {filtered.length} רשומות
      </div>

      {/* Logs Table */}
      <div className="overflow-hidden rounded-2xl border border-white/5 bg-card">
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
                <tr className="transition-colors hover:bg-white/5" key={log.id}>
                  <td className="p-4 font-mono text-xs opacity-60">
                    {new Date(log.created_at).toLocaleString("he-IL")}
                  </td>
                  <td className="p-4">
                    <span
                      className={`rounded-xs px-2 py-1 font-bold text-xs ${display.color}`}
                    >
                      {display.label}
                    </span>
                  </td>
                  <td
                    className="max-w-[300px] truncate p-4 opacity-80"
                    title={JSON.stringify(log.details)}
                  >
                    {formatDetails(log.details)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="flex flex-col items-center gap-3 p-12 text-center text-gray-500">
            <div className="rounded-full bg-white/5 p-4">
              <HugeiconsIcon icon={Shield01Icon} size={32} />
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
  if (!details) {
    return "-";
  }
  if (typeof details === "string") {
    return details;
  }

  const parts: string[] = [];
  if (details.word) {
    parts.push(`מילה: ${details.word}`);
  }
  if (details.target_user) {
    parts.push(`משתמש: ${details.target_user}`);
  }
  if (details.target_username) {
    parts.push(`משתמש: ${details.target_username}`);
  }
  if (details.reason) {
    parts.push(`סיבה: ${details.reason}`);
  }
  if (details.old_role) {
    parts.push(`מ-${details.old_role} ל-${details.new_role}`);
  }
  if (details.wordCount) {
    parts.push(`${details.wordCount} מילים`);
  }
  if (details.report_type) {
    parts.push(`סוג: ${details.report_type}`);
  }

  return parts.length > 0 ? parts.join(" | ") : JSON.stringify(details);
}
