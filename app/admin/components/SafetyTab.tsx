"use client";

import { useState, useEffect, useCallback } from "react";
import { ShieldCheck, Users, Flag, Eye, CheckCircle2, AlertCircle, X, MessageSquare, Search } from "lucide-react";
import { toast } from "sonner";
import { SupabaseClient } from "@supabase/supabase-js";
import type { Profile, ContentReport } from "../types";

interface SafetyTabProps {
  supabase: SupabaseClient;
  currentUser: string | null;
}

const REPORT_TYPE_LABELS: Record<string, string> = {
  harassment: "הטרדה",
  inappropriate_content: "תוכן לא הולם",
  spam: "ספאם",
  predatory_behavior: "התנהגות טורפנית",
  personal_info_sharing: "שיתוף מידע אישי",
  other: "אחר",
};

const REPORT_TYPE_COLORS: Record<string, string> = {
  predatory_behavior: "bg-red-500/20 text-red-400",
  harassment: "bg-orange-500/20 text-orange-400",
  inappropriate_content: "bg-amber-500/20 text-amber-400",
  spam: "bg-gray-500/20 text-gray-400",
  personal_info_sharing: "bg-purple-500/20 text-purple-400",
  other: "bg-blue-500/20 text-blue-400",
};

type ReportStatusFilter = "all" | "pending" | "reviewing" | "resolved" | "dismissed";

export default function SafetyTab({ supabase, currentUser }: SafetyTabProps) {
  const [reports, setReports] = useState<ContentReport[]>([]);
  const [minorUsers, setMinorUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [reportFilter, setReportFilter] = useState<ReportStatusFilter>("all");
  const [activeReportId, setActiveReportId] = useState<string | null>(null);
  const [adminNotes, setAdminNotes] = useState("");
  const [minorSearch, setMinorSearch] = useState("");

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [reportsRes, minorsRes] = await Promise.all([
        supabase.from("content_reports").select("*").order("created_at", { ascending: false }).limit(50),
        supabase.from("profiles").select("*").eq("is_minor", true).order("username", { ascending: true }),
      ]);
      setReports(reportsRes.data || []);
      setMinorUsers(minorsRes.data || []);
    } catch (error) {
      console.error("Error fetching safety data:", error);
      toast.error("שגיאה בטעינת נתוני בטיחות");
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const updateReportStatus = async (reportId: string, status: "reviewing" | "resolved" | "dismissed") => {
    try {
      const now = new Date().toISOString();
      const update: any = { status, admin_notes: adminNotes || null };
      if (status === "resolved" || status === "dismissed") {
        update.resolved_by = currentUser;
        update.resolved_at = now;
      }

      const { error } = await supabase.from("content_reports").update(update).eq("id", reportId);
      if (error) throw error;

      const statusLabel = status === "resolved" ? "טופל" : status === "dismissed" ? "נדחה" : "בבדיקה";
      toast.success(`הדיווח סומן כ${statusLabel}`);

      await supabase.from("admin_logs").insert({
        action: status === "dismissed" ? "DISMISS_REPORT" : "RESOLVE_REPORT",
        details: { report_id: reportId, status, admin_notes: adminNotes },
        admin_id: currentUser,
      });

      setActiveReportId(null);
      setAdminNotes("");
      fetchData();
    } catch (error) {
      console.error("Error updating report:", error);
      toast.error("שגיאה בעדכון הדיווח");
    }
  };

  const filteredReports = reports.filter((r) =>
    reportFilter === "all" ? true : r.status === reportFilter
  );

  const filteredMinors = minorUsers.filter((m) =>
    !minorSearch || m.username?.toLowerCase().includes(minorSearch.toLowerCase())
  );

  const stats = {
    totalMinors: minorUsers.length,
    pendingReports: reports.filter((r) => r.status === "pending").length,
    supervised: minorUsers.filter((u) => u.account_type === "supervised").length,
    withConsent: minorUsers.filter((u) => u.parental_consent).length,
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <span className="w-10 h-10 border-4 border-green-500/30 border-t-green-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/20 rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-2">
          <ShieldCheck className="text-green-400" size={28} />
          <h2 className="text-2xl font-bold text-white">בטיחות ילדים ומודרציה</h2>
        </div>
        <p className="text-gray-400 text-sm">ניהול חשבונות קטינים, דיווחי תוכן, ובקרת הורים</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard icon={<Users className="text-blue-400" size={18} />} label="חשבונות קטינים" value={stats.totalMinors} />
        <StatCard icon={<Flag className="text-amber-400" size={18} />} label="דיווחים ממתינים" value={stats.pendingReports} highlight={stats.pendingReports > 0} />
        <StatCard icon={<Eye className="text-purple-400" size={18} />} label="חשבונות מפוקחים" value={stats.supervised} />
        <StatCard icon={<ShieldCheck className="text-green-400" size={18} />} label="עם אישור הורים" value={stats.withConsent} />
      </div>

      {/* Content Reports */}
      <div className="bg-[#0e0e1b] border border-white/5 rounded-2xl overflow-hidden">
        <div className="p-4 border-b border-white/5 flex items-center justify-between">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Flag className="text-amber-400" size={18} />
            דיווחי תוכן
          </h3>
          <div className="flex gap-2">
            {(["all", "pending", "reviewing", "resolved", "dismissed"] as ReportStatusFilter[]).map((f) => (
              <button
                key={f}
                onClick={() => setReportFilter(f)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                  reportFilter === f ? "bg-amber-500/20 text-amber-400 border border-amber-500/30" : "bg-white/5 text-gray-500 border border-white/5 hover:bg-white/10"
                }`}
              >
                {f === "all" ? "הכל" : f === "pending" ? "ממתין" : f === "reviewing" ? "בבדיקה" : f === "resolved" ? "טופל" : "נדחה"}
              </button>
            ))}
          </div>
        </div>

        {filteredReports.length > 0 ? (
          <div className="divide-y divide-white/5">
            {filteredReports.map((report) => (
              <div key={report.id} className="p-4 hover:bg-white/[0.02] transition-colors">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 text-right">
                    <div className="flex items-center gap-2 justify-end mb-1">
                      <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${REPORT_TYPE_COLORS[report.report_type] || "bg-gray-500/20 text-gray-400"}`}>
                        {REPORT_TYPE_LABELS[report.report_type] || report.report_type}
                      </span>
                      <StatusBadge status={report.status} />
                      <span className="text-[11px] text-gray-600 font-mono">{new Date(report.created_at).toLocaleString("he-IL")}</span>
                    </div>
                    <p className="text-sm text-gray-300">{report.description || "ללא תיאור"}</p>
                    {report.admin_notes && (
                      <p className="text-xs text-gray-500 mt-1 flex items-center gap-1 justify-end">
                        <MessageSquare size={10} />
                        <span>הערת מנהל: {report.admin_notes}</span>
                      </p>
                    )}
                  </div>

                  {/* Actions */}
                  {report.status === "pending" || report.status === "reviewing" ? (
                    <div className="flex flex-col gap-1.5 flex-shrink-0">
                      {activeReportId === report.id ? (
                        <div className="bg-white/5 border border-white/10 rounded-xl p-3 w-64 space-y-2">
                          <textarea
                            value={adminNotes}
                            onChange={(e) => setAdminNotes(e.target.value)}
                            placeholder="הערות מנהל (אופציונלי)..."
                            className="w-full h-16 bg-black/30 border border-white/10 rounded-lg p-2 text-white text-xs outline-none resize-none text-right"
                          />
                          <div className="flex gap-1.5">
                            {report.status === "pending" && (
                              <button onClick={() => updateReportStatus(report.id, "reviewing")} className="flex-1 px-2 py-1.5 bg-blue-500/20 text-blue-400 rounded-lg text-[11px] font-bold hover:bg-blue-500/30 transition-colors">
                                בבדיקה
                              </button>
                            )}
                            <button onClick={() => updateReportStatus(report.id, "resolved")} className="flex-1 px-2 py-1.5 bg-green-500/20 text-green-400 rounded-lg text-[11px] font-bold hover:bg-green-500/30 transition-colors">
                              טופל
                            </button>
                            <button onClick={() => updateReportStatus(report.id, "dismissed")} className="flex-1 px-2 py-1.5 bg-gray-500/20 text-gray-400 rounded-lg text-[11px] font-bold hover:bg-gray-500/30 transition-colors">
                              דחה
                            </button>
                            <button onClick={() => { setActiveReportId(null); setAdminNotes(""); }} className="p-1.5 text-gray-500 hover:text-white transition-colors">
                              <X size={12} />
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          onClick={() => setActiveReportId(report.id)}
                          className="px-3 py-1.5 bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 rounded-lg text-xs font-bold transition-colors"
                        >
                          טפל בדיווח
                        </button>
                      )}
                    </div>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-12 text-center text-gray-500">
            <ShieldCheck size={32} className="mx-auto mb-3 opacity-50" />
            <p>{reportFilter !== "all" ? "אין דיווחים בסטטוס זה" : "אין דיווחים ממתינים"}</p>
          </div>
        )}
      </div>

      {/* Minor Users List */}
      <div className="bg-[#0e0e1b] border border-white/5 rounded-2xl overflow-hidden">
        <div className="p-4 border-b border-white/5 flex items-center justify-between">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Users className="text-blue-400" size={18} />
            חשבונות קטינים
          </h3>
          <div className="relative w-48">
            <Search size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              type="text"
              value={minorSearch}
              onChange={(e) => setMinorSearch(e.target.value)}
              placeholder="חפש קטין..."
              className="w-full bg-black/20 border border-white/5 rounded-lg pr-8 pl-3 py-1.5 text-white text-xs outline-none text-right"
            />
          </div>
        </div>
        {filteredMinors.length > 0 ? (
          <table className="w-full text-right text-sm">
            <thead className="bg-white/5 text-gray-400">
              <tr>
                <th className="p-3 font-medium">שם משתמש</th>
                <th className="p-3 font-medium">סוג חשבון</th>
                <th className="p-3 font-medium">תאריך לידה</th>
                <th className="p-3 font-medium">אישור הורים</th>
                <th className="p-3 font-medium">הגבלות</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-gray-300">
              {filteredMinors.map((minor) => (
                <tr key={minor.id} className="hover:bg-white/5 transition-colors">
                  <td className="p-3 font-bold text-white">{minor.username || "ללא שם"}</td>
                  <td className="p-3">
                    <span className={`px-2 py-1 rounded text-xs font-bold ${minor.account_type === "supervised" ? "bg-amber-500/20 text-amber-400" : "bg-blue-500/20 text-blue-400"}`}>
                      {minor.account_type === "supervised" ? "מפוקח (מתחת ל-13)" : "צעיר (13-17)"}
                    </span>
                  </td>
                  <td className="p-3 text-xs">{minor.date_of_birth || "-"}</td>
                  <td className="p-3">
                    {minor.parental_consent ? (
                      <span className="text-green-400 text-xs font-bold flex items-center gap-1 justify-end"><CheckCircle2 size={14} /> מאושר</span>
                    ) : (
                      <span className="text-amber-400 text-xs font-bold flex items-center gap-1 justify-end"><AlertCircle size={14} /> ממתין</span>
                    )}
                  </td>
                  <td className="p-3">
                    <div className="flex gap-1 justify-end flex-wrap">
                      {minor.chat_restricted && <span className="px-1.5 py-0.5 bg-red-500/20 text-red-400 rounded text-[10px]">צ׳אט מוגבל</span>}
                      {minor.profile_restricted && <span className="px-1.5 py-0.5 bg-orange-500/20 text-orange-400 rounded text-[10px]">פרופיל מוגבל</span>}
                      {minor.safe_mode && <span className="px-1.5 py-0.5 bg-green-500/20 text-green-400 rounded text-[10px]">מצב בטוח</span>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="p-12 text-center text-gray-500">
            <Users size={32} className="mx-auto mb-3 opacity-50" />
            <p>{minorSearch ? "לא נמצאו קטינים" : "אין חשבונות קטינים רשומים"}</p>
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, highlight }: { icon: React.ReactNode; label: string; value: number; highlight?: boolean }) {
  return (
    <div className={`bg-[#0e0e1b] border rounded-2xl p-5 ${highlight ? "border-amber-500/20" : "border-white/5"}`}>
      <div className="flex items-center gap-2 mb-2">
        {icon}
        <span className="text-sm text-gray-400">{label}</span>
      </div>
      <div className={`text-2xl font-bold ${highlight ? "text-amber-400" : "text-white"}`}>{value}</div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    pending: "bg-yellow-500/20 text-yellow-400",
    reviewing: "bg-blue-500/20 text-blue-400",
    resolved: "bg-green-500/20 text-green-400",
    dismissed: "bg-gray-500/20 text-gray-400",
  };
  const labels: Record<string, string> = {
    pending: "ממתין",
    reviewing: "בבדיקה",
    resolved: "טופל",
    dismissed: "נדחה",
  };
  return (
    <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${styles[status] || "bg-gray-500/20 text-gray-400"}`}>
      {labels[status] || status}
    </span>
  );
}
