"use client";

import {
  Activity01Icon,
  AlertCircleIcon,
  CheckmarkCircle02Icon,
  DatabaseIcon,
  RefreshIcon,
  ZapIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import type { SupabaseClient } from "@supabase/supabase-js";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import type { DBMetrics } from "../types";

interface ManagementTabProps {
  supabase: SupabaseClient;
}

interface RealtimeSubscriptionCountResult {
  count: number;
}

interface SlowQueryMetricsResult {
  avg_time: number;
  slow_count: number;
}

interface RpcHealth {
  realtime: boolean;
  slowQueries: boolean;
}

interface HealthCheckResult {
  checkedAt: string;
  message: string;
  success: boolean;
}

const getMetricNumber = (value: unknown) =>
  typeof value === "number" ? value : 0;

const getRealtimeHealth = (count: number) => {
  if (count <= 25) {
    return { label: "תקין", valueClassName: "text-green-400" };
  }
  if (count <= 75) {
    return { label: "בינוני", valueClassName: "text-yellow-400" };
  }
  return { label: "גבוה", valueClassName: "text-red-400" };
};

const getSlowQueryHealth = (count: number) => {
  if (count <= 20) {
    return { label: "תקין", valueClassName: "text-green-400" };
  }
  if (count <= 60) {
    return { label: "בינוני", valueClassName: "text-yellow-400" };
  }
  return { label: "גבוה", valueClassName: "text-red-400" };
};

const getLatencyHealth = (avgQueryTime: number) => {
  if (avgQueryTime <= 30) {
    return { label: "תקין", valueClassName: "text-green-400" };
  }
  if (avgQueryTime <= 80) {
    return { label: "בינוני", valueClassName: "text-yellow-400" };
  }
  return { label: "איטי", valueClassName: "text-red-400" };
};

const formatLastUpdated = (isoString: string | null) => {
  if (!isoString) {
    return "לא זמין";
  }
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) {
    return "לא זמין";
  }
  return date.toLocaleString("he-IL");
};

export default function ManagementTab({ supabase }: ManagementTabProps) {
  const [dbMetrics, setDbMetrics] = useState<DBMetrics | null>(null);
  const [rpcHealth, setRpcHealth] = useState<RpcHealth>({
    realtime: false,
    slowQueries: false,
  });
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [healthCheckRunning, setHealthCheckRunning] = useState(false);
  const [healthCheckResult, setHealthCheckResult] =
    useState<HealthCheckResult | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchMetrics = useCallback(
    async (showLoading = false) => {
      if (showLoading) {
        setLoading(true);
      }

      setErrorMessage(null);

      const [rtResult, sqResult] = await Promise.all([
        supabase
          .rpc("get_realtime_subscription_count")
          .single<RealtimeSubscriptionCountResult>(),
        supabase.rpc("get_slow_query_metrics").single<SlowQueryMetricsResult>(),
      ]);

      const realtimeOk = !rtResult.error && !!rtResult.data;
      const slowQueriesOk = !sqResult.error && !!sqResult.data;
      setRpcHealth({ realtime: realtimeOk, slowQueries: slowQueriesOk });

      if (!(realtimeOk && slowQueriesOk)) {
        setDbMetrics(null);
        setErrorMessage("לא ניתן לטעון חלק מנתוני הניטור כרגע.");
        setLoading(false);
        return;
      }

      setDbMetrics({
        realtimeSubscriptions: getMetricNumber(rtResult.data?.count),
        slowQueryCount: getMetricNumber(sqResult.data?.slow_count),
        avgQueryTime: getMetricNumber(sqResult.data?.avg_time),
      });
      setLastUpdated(new Date().toISOString());
      setLoading(false);
    },
    [supabase]
  );

  useEffect(() => {
    fetchMetrics(false).catch(() => {
      setDbMetrics(null);
      setErrorMessage("אירעה שגיאה בטעינת נתוני הניטור.");
      setLoading(false);
    });
  }, [fetchMetrics]);

  const runHealthCheck = useCallback(async () => {
    setHealthCheckRunning(true);

    try {
      const [rtResult, sqResult] = await Promise.all([
        supabase
          .rpc("get_realtime_subscription_count")
          .single<RealtimeSubscriptionCountResult>(),
        supabase.rpc("get_slow_query_metrics").single<SlowQueryMetricsResult>(),
      ]);

      const realtimeOk = !rtResult.error && !!rtResult.data;
      const slowQueriesOk = !sqResult.error && !!sqResult.data;
      setRpcHealth({ realtime: realtimeOk, slowQueries: slowQueriesOk });

      const success = realtimeOk && slowQueriesOk;
      setHealthCheckResult({
        checkedAt: new Date().toISOString(),
        message: success
          ? "בדיקת התקינות עברה בהצלחה."
          : "בדיקת התקינות נכשלה באחד ממקורות הנתונים.",
        success,
      });
      if (success) {
        toast.success("בדיקת תקינות עברה");
      } else {
        toast.error("בדיקת תקינות נכשלה");
      }

      if (success) {
        await fetchMetrics(false);
      }
    } catch {
      setHealthCheckResult({
        checkedAt: new Date().toISOString(),
        message: "אירעה שגיאה בלתי צפויה במהלך בדיקת התקינות.",
        success: false,
      });
      toast.error("אירעה שגיאה בבדיקת התקינות");
    } finally {
      setHealthCheckRunning(false);
    }
  }, [fetchMetrics, supabase]);

  const realtimeHealth = useMemo(
    () =>
      dbMetrics ? getRealtimeHealth(dbMetrics.realtimeSubscriptions) : null,
    [dbMetrics]
  );
  const slowQueryHealth = useMemo(
    () => (dbMetrics ? getSlowQueryHealth(dbMetrics.slowQueryCount) : null),
    [dbMetrics]
  );
  const latencyHealth = useMemo(
    () => (dbMetrics ? getLatencyHealth(dbMetrics.avgQueryTime) : null),
    [dbMetrics]
  );

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <span className="h-10 w-10 animate-spin rounded-full border-4 border-blue-500/30 border-t-blue-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-blue-500/20 bg-linear-to-r from-blue-500/10 to-purple-500/10 p-6">
        <div className="mb-2 flex items-center gap-3">
          <HugeiconsIcon
            className="text-blue-400"
            icon={DatabaseIcon}
            size={28}
          />
          <h2 className="font-bold text-fluid-xl text-white">
            ניטור ביצועי מסד נתונים
          </h2>
        </div>
        <p className="text-fluid-sm text-gray-300">
          נתונים בזמן אמת על Realtime ושאילתות איטיות
        </p>
        <p className="mt-2 text-fluid-xs text-gray-400">
          עודכן לאחרונה: {formatLastUpdated(lastUpdated)}
        </p>
      </div>

      {errorMessage && (
        <div className="flex items-start gap-3 rounded-xl border border-yellow-500/20 bg-yellow-500/10 p-4">
          <HugeiconsIcon
            className="mt-0.5 shrink-0 text-yellow-400"
            icon={AlertCircleIcon}
            size={18}
          />
          <p className="text-fluid-sm text-yellow-200">{errorMessage}</p>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <MetricCard
          footer={
            <span className="text-gray-400">
              סטטוס:{" "}
              <span
                className={realtimeHealth?.valueClassName || "text-gray-500"}
              >
                {realtimeHealth?.label || "לא זמין"}
              </span>
            </span>
          }
          icon={
            <HugeiconsIcon
              className={realtimeHealth?.valueClassName || "text-gray-400"}
              icon={Activity01Icon}
              size={20}
            />
          }
          label="מנויי Realtime"
          sub="מספר מנויים פעילים"
          value={dbMetrics?.realtimeSubscriptions ?? "—"}
          valueClassName={realtimeHealth?.valueClassName}
        />

        <MetricCard
          footer={
            <span className="text-gray-400">
              סטטוס:{" "}
              <span
                className={slowQueryHealth?.valueClassName || "text-gray-500"}
              >
                {slowQueryHealth?.label || "לא זמין"}
              </span>
            </span>
          }
          icon={
            <HugeiconsIcon
              className={slowQueryHealth?.valueClassName || "text-gray-400"}
              icon={ZapIcon}
              size={20}
            />
          }
          label="שאילתות איטיות"
          sub="כמות בשעה האחרונה"
          value={dbMetrics?.slowQueryCount ?? "—"}
          valueClassName={slowQueryHealth?.valueClassName}
        />

        <MetricCard
          footer={
            <span className="text-gray-400">
              סטטוס:{" "}
              <span
                className={latencyHealth?.valueClassName || "text-gray-500"}
              >
                {latencyHealth?.label || "לא זמין"}
              </span>
            </span>
          }
          icon={
            <HugeiconsIcon
              className={latencyHealth?.valueClassName || "text-gray-400"}
              icon={CheckmarkCircle02Icon}
              size={20}
            />
          }
          label="זמן שאילתה ממוצע"
          sub="במילישניות"
          value={dbMetrics ? `${dbMetrics.avgQueryTime.toFixed(2)}ms` : "—"}
          valueClassName={latencyHealth?.valueClassName}
        />
      </div>

      <div className="rounded-2xl border border-white/5 bg-card p-6">
        <h3 className="mb-4 font-bold text-fluid-lg text-white">
          תקינות מקורות נתונים
        </h3>
        <div className="space-y-3">
          <HealthRow
            isHealthy={rpcHealth.realtime}
            label="RPC: get_realtime_subscription_count"
          />
          <HealthRow
            isHealthy={rpcHealth.slowQueries}
            label="RPC: get_slow_query_metrics"
          />
        </div>
      </div>

      <div className="rounded-2xl border border-white/5 bg-card p-6">
        <h3 className="mb-4 font-bold text-fluid-lg text-white">
          פעולות מהירות
        </h3>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <button
            className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 font-bold text-white transition-all hover:bg-blue-500"
            onClick={() => {
              fetchMetrics(true).catch(() => {
                setDbMetrics(null);
                setErrorMessage("אירעה שגיאה בטעינת נתוני הניטור.");
                setLoading(false);
              });
            }}
            type="button"
          >
            <HugeiconsIcon icon={RefreshIcon} size={18} />
            רענן נתונים
          </button>
          <button
            className="flex items-center justify-center gap-2 rounded-xl bg-slate-700 px-4 py-3 font-bold text-white transition-all hover:bg-slate-600"
            disabled={healthCheckRunning}
            onClick={() => {
              runHealthCheck().catch(() => {
                setHealthCheckRunning(false);
                setHealthCheckResult({
                  checkedAt: new Date().toISOString(),
                  message: "בדיקת התקינות נכשלה.",
                  success: false,
                });
              });
            }}
            type="button"
          >
            <HugeiconsIcon icon={Activity01Icon} size={18} />
            {healthCheckRunning ? "בודק..." : "בדיקת תקינות"}
          </button>
        </div>

        {healthCheckResult && (
          <div
            className={`mt-4 flex items-start gap-3 rounded-xl border p-4 ${
              healthCheckResult.success
                ? "border-green-500/20 bg-green-500/10"
                : "border-red-500/20 bg-red-500/10"
            }`}
          >
            <HugeiconsIcon
              className={`mt-0.5 shrink-0 ${
                healthCheckResult.success ? "text-green-400" : "text-red-400"
              }`}
              icon={
                healthCheckResult.success
                  ? CheckmarkCircle02Icon
                  : AlertCircleIcon
              }
              size={18}
            />
            <div>
              <p
                className={`text-fluid-sm ${
                  healthCheckResult.success ? "text-green-200" : "text-red-200"
                }`}
              >
                {healthCheckResult.message}
              </p>
              <p className="mt-1 text-fluid-xs text-gray-400">
                זמן בדיקה: {formatLastUpdated(healthCheckResult.checkedAt)}
              </p>
            </div>
          </div>
        )}
      </div>

      <div className="rounded-2xl border border-blue-500/20 bg-blue-500/10 p-6">
        <div className="flex items-start gap-3">
          <HugeiconsIcon
            className="mt-1 shrink-0 text-blue-400"
            icon={AlertCircleIcon}
            size={20}
          />
          <div>
            <h4 className="mb-2 font-bold text-white">מה מוצג כאן</h4>
            <p className="text-fluid-sm text-gray-300 leading-relaxed">
              המסך מציג רק מדדים שמגיעים כרגע ישירות מה-RPC במסד הנתונים. אם
              מקור נתונים נכשל, זה מוצג כתקלה במקום להציג מספרים מלאכותיים.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function HealthRow({
  label,
  isHealthy,
}: {
  label: string;
  isHealthy: boolean;
}) {
  return (
    <div className="flex items-center justify-between rounded-xl bg-white/5 p-4">
      <span className="font-mono text-fluid-xs text-gray-300">{label}</span>
      <span
        className={`rounded-full px-3 py-1 font-bold text-fluid-xs ${
          isHealthy
            ? "bg-green-500/20 text-green-400"
            : "bg-red-500/20 text-red-400"
        }`}
      >
        {isHealthy ? "תקין" : "כשל"}
      </span>
    </div>
  );
}

/**
 * Reusable metric card for the management dashboard.
 */
function MetricCard({
  icon,
  label,
  value,
  sub,
  footer,
  valueClassName,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  sub: string;
  footer: React.ReactNode;
  valueClassName?: string;
}) {
  return (
    <div className="rounded-2xl border border-white/5 bg-card p-6">
      <div className="mb-4 flex items-center gap-2">
        {icon}
        <h3 className="font-medium text-fluid-sm text-gray-400">{label}</h3>
      </div>
      <div
        className={`mb-2 font-bold text-fluid-2xl ${
          valueClassName ?? "text-white"
        }`}
      >
        {value}
      </div>
      <p className="text-fluid-xs text-gray-500">{sub}</p>
      <div className="mt-4 flex items-center gap-2 border-white/5 border-t pt-4 text-fluid-xs">
        {footer}
      </div>
    </div>
  );
}
