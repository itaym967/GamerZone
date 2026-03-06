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
import { useCallback, useEffect, useMemo, useReducer } from "react";
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

interface ManagementState {
  dbMetrics: DBMetrics | null;
  errorMessage: string | null;
  healthCheckResult: HealthCheckResult | null;
  healthCheckRunning: boolean;
  lastUpdated: string | null;
  loading: boolean;
  rpcHealth: RpcHealth;
}

interface ManagementAction {
  payload: Partial<ManagementState>;
  type: "patch";
}

const initialState: ManagementState = {
  dbMetrics: null,
  errorMessage: null,
  healthCheckResult: null,
  healthCheckRunning: false,
  lastUpdated: null,
  loading: true,
  rpcHealth: {
    realtime: false,
    slowQueries: false,
  },
};

const managementReducer = (
  state: ManagementState,
  action: ManagementAction
): ManagementState => {
  if (action.type === "patch") {
    return { ...state, ...action.payload };
  }
  return state;
};

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
  const [state, dispatch] = useReducer(managementReducer, initialState);
  const patchState = useCallback((payload: Partial<ManagementState>) => {
    dispatch({
      type: "patch",
      payload,
    });
  }, []);

  const fetchMetrics = useCallback(
    async (showLoading = false) => {
      if (showLoading) {
        patchState({ loading: true });
      }

      patchState({ errorMessage: null });

      const [rtResult, sqResult] = await Promise.all([
        supabase
          .rpc("get_realtime_subscription_count")
          .single<RealtimeSubscriptionCountResult>(),
        supabase.rpc("get_slow_query_metrics").single<SlowQueryMetricsResult>(),
      ]).catch(() => [null, null] as const);

      if (!(rtResult && sqResult)) {
        patchState({
          dbMetrics: null,
          errorMessage: "אירעה שגיאה בטעינת נתוני הניטור.",
          loading: false,
        });
        return;
      }

      const realtimeOk = !rtResult.error && !!rtResult.data;
      const slowQueriesOk = !sqResult.error && !!sqResult.data;
      patchState({
        rpcHealth: { realtime: realtimeOk, slowQueries: slowQueriesOk },
      });

      if (!(realtimeOk && slowQueriesOk)) {
        patchState({
          dbMetrics: null,
          errorMessage: "לא ניתן לטעון חלק מנתוני הניטור כרגע.",
          loading: false,
        });
        return;
      }

      patchState({
        dbMetrics: {
          realtimeSubscriptions: getMetricNumber(rtResult.data?.count),
          slowQueryCount: getMetricNumber(sqResult.data?.slow_count),
          avgQueryTime: getMetricNumber(sqResult.data?.avg_time),
        },
        lastUpdated: new Date().toISOString(),
        loading: false,
      });
    },
    [patchState, supabase]
  );

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchMetrics(false).catch(() => undefined);
    }, 0);
    return () => clearTimeout(timer);
  }, [fetchMetrics]);

  const runHealthCheck = useCallback(async () => {
    patchState({ healthCheckRunning: true });

    const [rtResult, sqResult] = await Promise.all([
      supabase
        .rpc("get_realtime_subscription_count")
        .single<RealtimeSubscriptionCountResult>(),
      supabase.rpc("get_slow_query_metrics").single<SlowQueryMetricsResult>(),
    ]).catch(() => [null, null] as const);

    if (!(rtResult && sqResult)) {
      patchState({
        healthCheckResult: {
          checkedAt: new Date().toISOString(),
          message: "אירעה שגיאה בלתי צפויה במהלך בדיקת התקינות.",
          success: false,
        },
        healthCheckRunning: false,
      });
      toast.error("אירעה שגיאה בבדיקת התקינות");
      return;
    }

    const realtimeOk = !rtResult.error && !!rtResult.data;
    const slowQueriesOk = !sqResult.error && !!sqResult.data;
    patchState({
      rpcHealth: { realtime: realtimeOk, slowQueries: slowQueriesOk },
    });

    const success = realtimeOk && slowQueriesOk;
    patchState({
      healthCheckResult: {
        checkedAt: new Date().toISOString(),
        message: success
          ? "בדיקת התקינות עברה בהצלחה."
          : "בדיקת התקינות נכשלה באחד ממקורות הנתונים.",
        success,
      },
    });
    if (success) {
      toast.success("בדיקת תקינות עברה");
      await fetchMetrics(false);
    } else {
      toast.error("בדיקת תקינות נכשלה");
    }
    patchState({ healthCheckRunning: false });
  }, [fetchMetrics, patchState, supabase]);

  const realtimeHealth = useMemo(
    () =>
      state.dbMetrics
        ? getRealtimeHealth(state.dbMetrics.realtimeSubscriptions)
        : null,
    [state.dbMetrics]
  );
  const slowQueryHealth = useMemo(
    () =>
      state.dbMetrics
        ? getSlowQueryHealth(state.dbMetrics.slowQueryCount)
        : null,
    [state.dbMetrics]
  );
  const latencyHealth = useMemo(
    () =>
      state.dbMetrics ? getLatencyHealth(state.dbMetrics.avgQueryTime) : null,
    [state.dbMetrics]
  );

  if (state.loading) {
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
          עודכן לאחרונה: {formatLastUpdated(state.lastUpdated)}
        </p>
      </div>

      {state.errorMessage && (
        <div className="flex items-start gap-3 rounded-xl border border-yellow-500/20 bg-yellow-500/10 p-4">
          <HugeiconsIcon
            className="mt-0.5 shrink-0 text-yellow-400"
            icon={AlertCircleIcon}
            size={18}
          />
          <p className="text-fluid-sm text-yellow-200">{state.errorMessage}</p>
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
          value={state.dbMetrics?.realtimeSubscriptions ?? "—"}
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
          value={state.dbMetrics?.slowQueryCount ?? "—"}
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
          value={
            state.dbMetrics
              ? `${state.dbMetrics.avgQueryTime.toFixed(2)}ms`
              : "—"
          }
          valueClassName={latencyHealth?.valueClassName}
        />
      </div>

      <div className="rounded-2xl border border-white/5 bg-card p-6">
        <h3 className="mb-4 font-bold text-fluid-lg text-white">
          תקינות מקורות נתונים
        </h3>
        <div className="space-y-3">
          <HealthRow
            isHealthy={state.rpcHealth.realtime}
            label="RPC: get_realtime_subscription_count"
          />
          <HealthRow
            isHealthy={state.rpcHealth.slowQueries}
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
                patchState({
                  dbMetrics: null,
                  errorMessage: "אירעה שגיאה בטעינת נתוני הניטור.",
                  loading: false,
                });
              });
            }}
            type="button"
          >
            <HugeiconsIcon icon={RefreshIcon} size={18} />
            רענן נתונים
          </button>
          <button
            className="flex items-center justify-center gap-2 rounded-xl bg-slate-700 px-4 py-3 font-bold text-white transition-all hover:bg-slate-600"
            disabled={state.healthCheckRunning}
            onClick={() => {
              runHealthCheck().catch(() => {
                patchState({
                  healthCheckRunning: false,
                  healthCheckResult: {
                    checkedAt: new Date().toISOString(),
                    message: "בדיקת התקינות נכשלה.",
                    success: false,
                  },
                });
              });
            }}
            type="button"
          >
            <HugeiconsIcon icon={Activity01Icon} size={18} />
            {state.healthCheckRunning ? "בודק..." : "בדיקת תקינות"}
          </button>
        </div>

        {state.healthCheckResult && (
          <div
            className={`mt-4 flex items-start gap-3 rounded-xl border p-4 ${
              state.healthCheckResult.success
                ? "border-green-500/20 bg-green-500/10"
                : "border-red-500/20 bg-red-500/10"
            }`}
          >
            <HugeiconsIcon
              className={`mt-0.5 shrink-0 ${
                state.healthCheckResult.success
                  ? "text-green-400"
                  : "text-red-400"
              }`}
              icon={
                state.healthCheckResult.success
                  ? CheckmarkCircle02Icon
                  : AlertCircleIcon
              }
              size={18}
            />
            <div>
              <p
                className={`text-fluid-sm ${
                  state.healthCheckResult.success
                    ? "text-green-200"
                    : "text-red-200"
                }`}
              >
                {state.healthCheckResult.message}
              </p>
              <p className="mt-1 text-fluid-xs text-gray-400">
                זמן בדיקה:{" "}
                {formatLastUpdated(state.healthCheckResult.checkedAt)}
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
