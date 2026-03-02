"use client";

type AuthTelemetryStatus = "error" | "info" | "success";

interface AuthTelemetryEvent {
  errorCode?: string;
  errorMessage?: string;
  event: string;
  from?: string;
  reason?: string;
  status: AuthTelemetryStatus;
  to?: string;
}

const AUTH_TELEMETRY_KEY = "gamerzone_auth_telemetry";
const MAX_AUTH_EVENTS = 50;

function getStoredEvents() {
  try {
    const raw = sessionStorage.getItem(AUTH_TELEMETRY_KEY);
    if (!raw) {
      return [];
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed;
  } catch {
    return [];
  }
}

export function trackAuthEvent(event: AuthTelemetryEvent) {
  if (typeof window === "undefined") {
    return;
  }

  const payload = {
    ...event,
    path: window.location.pathname,
    timestamp: new Date().toISOString(),
  };

  try {
    const previousEvents = getStoredEvents();
    const nextEvents = [...previousEvents, payload].slice(-MAX_AUTH_EVENTS);
    sessionStorage.setItem(AUTH_TELEMETRY_KEY, JSON.stringify(nextEvents));
  } catch {
    // Ignore telemetry storage failures.
  }

  window.dispatchEvent(
    new CustomEvent("gamerzone:auth-telemetry", { detail: payload })
  );
}
