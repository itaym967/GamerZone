"use client";

const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1"]);
const DEFAULT_PRODUCTION_ORIGIN = "https://gamer-zone-sigma.vercel.app";

const normalizeOrigin = (value: string) => {
  const trimmed = value.trim();
  if (!trimmed) {
    return "";
  }
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    return trimmed;
  }
  return `https://${trimmed}`;
};

const isLocalOrigin = (origin: string) => {
  try {
    const { hostname } = new URL(origin);
    return LOCAL_HOSTS.has(hostname);
  } catch {
    return false;
  }
};

export const getAuthRedirectOrigin = () => {
  const envOrigin = normalizeOrigin(
    process.env.NEXT_PUBLIC_AUTH_REDIRECT_ORIGIN || ""
  );
  if (envOrigin) {
    return envOrigin;
  }

  if (typeof window !== "undefined") {
    const runtimeOrigin = window.location.origin;
    if (isLocalOrigin(runtimeOrigin)) {
      return runtimeOrigin;
    }
  }

  return DEFAULT_PRODUCTION_ORIGIN;
};

export const buildAuthCallbackUrl = (nextPath?: string) => {
  const origin = getAuthRedirectOrigin();
  const callbackUrl = new URL("/auth/callback", origin);
  if (nextPath) {
    callbackUrl.searchParams.set("next", nextPath);
  }
  return callbackUrl.toString();
};
