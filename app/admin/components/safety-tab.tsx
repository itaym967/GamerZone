"use client";

import {
  AlertCircleIcon,
  Cancel01Icon,
  CheckmarkCircle02Icon,
  Flag01Icon,
  Message01Icon,
  Search01Icon,
  SecurityCheckIcon,
  UserGroupIcon,
  ViewIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import type { SupabaseClient } from "@supabase/supabase-js";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import type { ContentReport, Profile } from "../types";

interface SafetyTabProps {
  currentUser: string | null;
  supabase: SupabaseClient;
}

interface ReportUpdateInput {
  admin_notes: string | null;
  resolved_at?: string;
  resolved_by?: string | null;
  status: "reviewing" | "resolved" | "dismissed";
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

type ReportStatusFilter =
  | "all"
  | "pending"
  | "reviewing"
  | "resolved"
  | "dismissed";

const REPORT_STATUS_FILTER_LABELS: Record<ReportStatusFilter, string> = {
  all: "הכל",
  pending: "ממתין",
  reviewing: "בבדיקה",
  resolved: "טופל",
  dismissed: "נדחה",
};

const getReportStatusLabel = (
  status: "reviewing" | "resolved" | "dismissed"
) => {
  if (status === "resolved") {
    return "טופל";
  }
  if (status === "dismissed") {
    return "נדחה";
  }
  return "בבדיקה";
};

export default function SafetyTab({ supabase, currentUser }: SafetyTabProps) {
  const [reports, setReports] = useState<ContentReport[]>([]);
  const [minorUsers, setMinorUsers] = useState<Profile[]>([]);
  const [uiState, setUiState] = useState({
    loading: true,
    reportFilter: "all" as ReportStatusFilter,
    activeReportId: null as string | null,
    adminNotes: "",
    minorSearch: "",
  });

  const fetchData = useCallback(
    async (showLoading = false) => {
      if (showLoading) {
        setUiState((prev) => ({ ...prev, loading: true }));
      }
      try {
        const [reportsRes, minorsRes] = await Promise.all([
          supabase
            .from("content_reports")
            .select("*")
            .order("created_at", { ascending: false })
            .limit(50),
          supabase
            .from("profiles")
            .select("*")
            .eq("is_minor", true)
            .order("username", { ascending: true }),
        ]);
        if (reportsRes.data) {
          setReports(reportsRes.data);
        } else {
          setReports([]);
        }
        if (minorsRes.data) {
          setMinorUsers(minorsRes.data);
        } else {
          setMinorUsers([]);
        }
      } catch (error) {
        console.error("Error fetching safety data:", error);
        toast.error("שגיאה בטעינת נתוני בטיחות");
      }
      setUiState((prev) => ({ ...prev, loading: false }));
    },
    [supabase]
  );

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchData(false).catch((error: unknown) => {
        console.error("Failed to fetch safety data:", error);
      });
    }, 0);
    return () => clearTimeout(timer);
  }, [fetchData]);

  const updateReportStatus = async (
    reportId: string,
    status: "reviewing" | "resolved" | "dismissed"
  ) => {
    const notes = uiState.adminNotes.trim() === "" ? null : uiState.adminNotes;
    const shouldResolveFields =
      status === "resolved" ? true : status === "dismissed";
    try {
      const now = new Date().toISOString();
      const update: ReportUpdateInput = {
        status,
        admin_notes: notes,
      };
      if (shouldResolveFields) {
        update.resolved_by = currentUser;
        update.resolved_at = now;
      }

      const { error } = await supabase
        .from("content_reports")
        .update(update)
        .eq("id", reportId);
      if (error) {
        console.error("Error updating report:", error);
        toast.error("שגיאה בעדכון הדיווח");
        return;
      }

      const statusLabel = getReportStatusLabel(status);
      toast.success(`הדיווח סומן כ${statusLabel}`);

      let logAction: "DISMISS_REPORT" | "RESOLVE_REPORT" = "RESOLVE_REPORT";
      if (status === "dismissed") {
        logAction = "DISMISS_REPORT";
      }

      await supabase.from("admin_logs").insert({
        action: logAction,
        details: {
          report_id: reportId,
          status,
          admin_notes: uiState.adminNotes,
        },
        admin_id: currentUser,
      });

      setUiState((prev) => ({ ...prev, activeReportId: null, adminNotes: "" }));
      fetchData();
    } catch (error) {
      console.error("Error updating report:", error);
      toast.error("שגיאה בעדכון הדיווח");
    }
  };

  const filteredReports = reports.filter((r) =>
    uiState.reportFilter === "all" ? true : r.status === uiState.reportFilter
  );

  const filteredMinors = minorUsers.filter(
    (m) =>
      !uiState.minorSearch ||
      m.username?.toLowerCase().includes(uiState.minorSearch.toLowerCase())
  );

  const stats = {
    totalMinors: minorUsers.length,
    pendingReports: reports.filter((r) => r.status === "pending").length,
    supervised: minorUsers.filter((u) => u.account_type === "supervised")
      .length,
    withConsent: minorUsers.filter((u) => u.parental_consent).length,
  };

  if (uiState.loading) {
    return (
      <div className="flex justify-center py-20">
        <span className="h-10 w-10 animate-spin rounded-full border-4 border-green-500/30 border-t-green-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-2xl border border-green-500/20 bg-linear-to-r from-green-500/10 to-emerald-500/10 p-6">
        <div className="mb-2 flex items-center gap-3">
          <HugeiconsIcon
            className="text-green-400"
            icon={SecurityCheckIcon}
            size={28}
          />
          <h2 className="font-bold text-fluid-xl text-white">
            בטיחות ילדים ומודרציה
          </h2>
        </div>
        <p className="text-fluid-sm text-gray-400">
          ניהול חשבונות קטינים, דיווחי תוכן, ובקרת הורים
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <StatCard
          icon={
            <HugeiconsIcon
              className="text-blue-400"
              icon={UserGroupIcon}
              size={18}
            />
          }
          label="חשבונות קטינים"
          value={stats.totalMinors}
        />
        <StatCard
          highlight={stats.pendingReports > 0}
          icon={
            <HugeiconsIcon
              className="text-amber-400"
              icon={Flag01Icon}
              size={18}
            />
          }
          label="דיווחים ממתינים"
          value={stats.pendingReports}
        />
        <StatCard
          icon={
            <HugeiconsIcon
              className="text-purple-400"
              icon={ViewIcon}
              size={18}
            />
          }
          label="חשבונות מפוקחים"
          value={stats.supervised}
        />
        <StatCard
          icon={
            <HugeiconsIcon
              className="text-green-400"
              icon={SecurityCheckIcon}
              size={18}
            />
          }
          label="עם אישור הורים"
          value={stats.withConsent}
        />
      </div>

      {/* Content Reports */}
      <div className="overflow-hidden rounded-2xl border border-white/5 bg-card">
        <div className="flex items-center justify-between border-white/5 border-b p-4">
          <h3 className="flex items-center gap-2 font-bold text-fluid-lg text-white">
            <HugeiconsIcon
              className="text-amber-400"
              icon={Flag01Icon}
              size={18}
            />
            דיווחי תוכן
          </h3>
          <div className="flex gap-2">
            {(
              [
                "all",
                "pending",
                "reviewing",
                "resolved",
                "dismissed",
              ] as ReportStatusFilter[]
            ).map((f) => (
              <button
                className={`rounded-lg px-2.5 py-1 font-bold text-[0.6875rem] transition-all ${
                  uiState.reportFilter === f
                    ? "border border-amber-500/30 bg-amber-500/20 text-amber-400"
                    : "border border-white/5 bg-white/5 text-gray-500 hover:bg-white/10"
                }`}
                key={f}
                onClick={() =>
                  setUiState((prev) => ({ ...prev, reportFilter: f }))
                }
                type="button"
              >
                {REPORT_STATUS_FILTER_LABELS[f]}
              </button>
            ))}
          </div>
        </div>

        {filteredReports.length > 0 ? (
          <div className="divide-y divide-white/5">
            {filteredReports.map((report) => (
              <div
                className="p-4 transition-colors hover:bg-white/2"
                key={report.id}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 text-right">
                    <div className="mb-1 flex items-center justify-end gap-2">
                      <span
                        className={`rounded-xs px-2 py-0.5 font-bold text-[0.6875rem] ${REPORT_TYPE_COLORS[report.report_type] || "bg-gray-500/20 text-gray-400"}`}
                      >
                        {REPORT_TYPE_LABELS[report.report_type] ||
                          report.report_type}
                      </span>
                      <StatusBadge status={report.status} />
                      <span className="font-mono text-[0.6875rem] text-gray-600">
                        {new Date(report.created_at).toLocaleString("he-IL")}
                      </span>
                    </div>
                    <p className="text-fluid-sm text-gray-300">
                      {report.description || "ללא תיאור"}
                    </p>
                    {report.admin_notes && (
                      <p className="mt-1 flex items-center justify-end gap-1 text-fluid-xs text-gray-500">
                        <HugeiconsIcon icon={Message01Icon} size={10} />
                        <span>הערת מנהל: {report.admin_notes}</span>
                      </p>
                    )}
                  </div>

                  {/* Actions */}
                  {report.status === "pending" ||
                  report.status === "reviewing" ? (
                    <div className="flex shrink-0 flex-col gap-1.5">
                      {uiState.activeReportId === report.id ? (
                        <div className="w-64 space-y-2 rounded-xl border border-white/10 bg-white/5 p-3">
                          <textarea
                            className="h-16 w-full resize-none rounded-lg border border-white/10 bg-black/30 p-2 text-right text-fluid-xs text-white outline-hidden"
                            onChange={(e) =>
                              setUiState((prev) => ({
                                ...prev,
                                adminNotes: e.target.value,
                              }))
                            }
                            placeholder="הערות מנהל (אופציונלי)..."
                            value={uiState.adminNotes}
                          />
                          <div className="flex gap-1.5">
                            {report.status === "pending" && (
                              <button
                                className="flex-1 rounded-lg bg-blue-500/20 px-2 py-1.5 font-bold text-[0.6875rem] text-blue-400 transition-colors hover:bg-blue-500/30"
                                onClick={() =>
                                  updateReportStatus(report.id, "reviewing")
                                }
                                type="button"
                              >
                                בבדיקה
                              </button>
                            )}
                            <button
                              className="flex-1 rounded-lg bg-green-500/20 px-2 py-1.5 font-bold text-[0.6875rem] text-green-400 transition-colors hover:bg-green-500/30"
                              onClick={() =>
                                updateReportStatus(report.id, "resolved")
                              }
                              type="button"
                            >
                              טופל
                            </button>
                            <button
                              className="flex-1 rounded-lg bg-gray-500/20 px-2 py-1.5 font-bold text-[0.6875rem] text-gray-400 transition-colors hover:bg-gray-500/30"
                              onClick={() =>
                                updateReportStatus(report.id, "dismissed")
                              }
                              type="button"
                            >
                              דחה
                            </button>
                            <button
                              className="p-1.5 text-gray-500 transition-colors hover:text-white"
                              onClick={() => {
                                setUiState((prev) => ({
                                  ...prev,
                                  activeReportId: null,
                                  adminNotes: "",
                                }));
                              }}
                              type="button"
                            >
                              <HugeiconsIcon icon={Cancel01Icon} size={12} />
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          className="rounded-lg bg-amber-500/10 px-3 py-1.5 font-bold text-amber-400 text-fluid-xs transition-colors hover:bg-amber-500/20"
                          onClick={() =>
                            setUiState((prev) => ({
                              ...prev,
                              activeReportId: report.id,
                            }))
                          }
                          type="button"
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
            <HugeiconsIcon
              className="mx-auto mb-3 opacity-50"
              icon={SecurityCheckIcon}
              size={32}
            />
            <p>
              {uiState.reportFilter !== "all"
                ? "אין דיווחים בסטטוס זה"
                : "אין דיווחים ממתינים"}
            </p>
          </div>
        )}
      </div>

      {/* Minor Users List */}
      <div className="overflow-hidden rounded-2xl border border-white/5 bg-card">
        <div className="flex items-center justify-between border-white/5 border-b p-4">
          <h3 className="flex items-center gap-2 font-bold text-fluid-lg text-white">
            <HugeiconsIcon
              className="text-blue-400"
              icon={UserGroupIcon}
              size={18}
            />
            חשבונות קטינים
          </h3>
          <div className="relative w-48">
            <HugeiconsIcon
              className="absolute top-1/2 right-2.5 -translate-y-1/2 text-gray-500"
              icon={Search01Icon}
              size={14}
            />
            <input
              className="w-full rounded-lg border border-white/5 bg-black/20 py-1.5 pr-8 pl-3 text-right text-fluid-xs text-white outline-hidden"
              onChange={(e) =>
                setUiState((prev) => ({ ...prev, minorSearch: e.target.value }))
              }
              placeholder="חפש קטין..."
              type="text"
              value={uiState.minorSearch}
            />
          </div>
        </div>
        {filteredMinors.length > 0 ? (
          <table className="w-full text-right text-fluid-sm">
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
                <tr
                  className="transition-colors hover:bg-white/5"
                  key={minor.id}
                >
                  <td className="p-3 font-bold text-white">
                    {minor.username || "ללא שם"}
                  </td>
                  <td className="p-3">
                    <span
                      className={`rounded-xs px-2 py-1 font-bold text-fluid-xs ${minor.account_type === "supervised" ? "bg-amber-500/20 text-amber-400" : "bg-blue-500/20 text-blue-400"}`}
                    >
                      {minor.account_type === "supervised"
                        ? "מפוקח (מתחת ל-13)"
                        : "צעיר (13-17)"}
                    </span>
                  </td>
                  <td className="p-3 text-fluid-xs">
                    {minor.date_of_birth || "-"}
                  </td>
                  <td className="p-3">
                    {minor.parental_consent ? (
                      <span className="flex items-center justify-end gap-1 font-bold text-fluid-xs text-green-400">
                        <HugeiconsIcon icon={CheckmarkCircle02Icon} size={14} />{" "}
                        מאושר
                      </span>
                    ) : (
                      <span className="flex items-center justify-end gap-1 font-bold text-amber-400 text-fluid-xs">
                        <HugeiconsIcon icon={AlertCircleIcon} size={14} /> ממתין
                      </span>
                    )}
                  </td>
                  <td className="p-3">
                    <div className="flex flex-wrap justify-end gap-1">
                      {minor.chat_restricted && (
                        <span className="rounded-xs bg-red-500/20 px-1.5 py-0.5 text-[0.625rem] text-red-400">
                          צ׳אט מוגבל
                        </span>
                      )}
                      {minor.profile_restricted && (
                        <span className="rounded-xs bg-orange-500/20 px-1.5 py-0.5 text-[0.625rem] text-orange-400">
                          פרופיל מוגבל
                        </span>
                      )}
                      {minor.safe_mode && (
                        <span className="rounded-xs bg-green-500/20 px-1.5 py-0.5 text-[0.625rem] text-green-400">
                          מצב בטוח
                        </span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="p-12 text-center text-gray-500">
            <HugeiconsIcon
              className="mx-auto mb-3 opacity-50"
              icon={UserGroupIcon}
              size={32}
            />
            <p>
              {uiState.minorSearch
                ? "לא נמצאו קטינים"
                : "אין חשבונות קטינים רשומים"}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  highlight,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  highlight?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl border bg-card p-5 ${highlight ? "border-amber-500/20" : "border-white/5"}`}
    >
      <div className="mb-2 flex items-center gap-2">
        {icon}
        <span className="text-fluid-sm text-gray-400">{label}</span>
      </div>
      <div
        className={`font-bold text-fluid-xl ${highlight ? "text-amber-400" : "text-white"}`}
      >
        {value}
      </div>
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
    <span
      className={`rounded-xs px-2 py-0.5 font-bold text-[0.6875rem] ${styles[status] || "bg-gray-500/20 text-gray-400"}`}
    >
      {labels[status] || status}
    </span>
  );
}
