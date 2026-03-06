import { NextResponse } from "next/server";
// The client you created from the Server-Side Auth instructions
import { createClient } from "@/lib/supabase/server";

const DEFAULT_PRODUCTION_ORIGIN = "https://gamer-zone-sigma.vercel.app";
const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1"]);

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

const getSafeRedirectOrigin = (requestOrigin: string) => {
  const envOrigin = normalizeOrigin(
    process.env.NEXT_PUBLIC_AUTH_REDIRECT_ORIGIN ||
      process.env.NEXT_PUBLIC_SITE_URL ||
      ""
  );
  if (envOrigin) {
    return envOrigin;
  }
  if (process.env.NODE_ENV === "development") {
    return requestOrigin;
  }
  return isLocalOrigin(requestOrigin)
    ? DEFAULT_PRODUCTION_ORIGIN
    : requestOrigin;
};

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const type = searchParams.get("type");
  // if "next" is in param, use it as the redirect URL
  let next = searchParams.get("next") ?? "/";
  if (!next.startsWith("/")) {
    next = "/";
  }

  // Handle password recovery flow fallback
  if (type === "recovery") {
    next = "/update-password";
  }

  if (code) {
    const supabase = await createClient();
    const { data: exchangeData, error } =
      await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      const authUserId = exchangeData.user?.id;
      if (authUserId) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("onboarding_completed")
          .eq("id", authUserId)
          .maybeSingle();

        if (!profile?.onboarding_completed) {
          const safeOrigin = getSafeRedirectOrigin(origin);
          return NextResponse.redirect(`${safeOrigin}/onboarding`);
        }
      }

      const safeOrigin = getSafeRedirectOrigin(origin);
      return NextResponse.redirect(`${safeOrigin}${next}`);
    }
  }

  // return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/auth/auth-code-error`);
}
