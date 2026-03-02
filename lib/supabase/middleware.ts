import { createServerClient } from "@supabase/ssr";
import type { User } from "@supabase/supabase-js";
import { type NextRequest, NextResponse } from "next/server";

const PROFILE_CHECK_PATHS = ["/admin", "/onboarding"];
const PROTECTED_ROUTES = [
  "/admin",
  "/onboarding",
  "/chat",
  "/profile",
  "/settings",
  "/friends",
  "/notifications",
  "/explore",
  "/party-finder",
  "/lfg",
];
const PUBLIC_AUTH_PATHS = [
  "/login",
  "/signup",
  "/auth",
  "/forgot-password",
  "/update-password",
  "/parental-consent",
];

function logAuthRedirect(path: string, to: string, reason: string) {
  console.warn("AuthMiddleware redirect", {
    from: path,
    reason,
    timestamp: new Date().toISOString(),
    to,
  });
}

function getRequiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function getSupabasePublishableKey(): string {
  return (
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    getRequiredEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY")
  );
}

function buildResponse(request: NextRequest): NextResponse {
  return NextResponse.next({
    request: {
      headers: request.headers,
    },
  });
}

function isPathInList(path: string, paths: string[]): boolean {
  return paths.some((entry) => path.startsWith(entry));
}

function isRefreshTokenError(message: string | undefined): boolean {
  if (!message) {
    return false;
  }
  return (
    message.includes("refresh_token_not_found") ||
    message.includes("Invalid Refresh Token")
  );
}

function clearAuthCookies(request: NextRequest, response: NextResponse): void {
  const cookiesToClear = request.cookies.getAll().filter((cookie) => {
    return cookie.name.startsWith("sb-") || cookie.name.includes("auth-token");
  });

  for (const cookie of cookiesToClear) {
    response.cookies.delete(cookie.name);
  }
}

async function applyProfileGuards(
  request: NextRequest,
  path: string,
  user: User,
  supabase: ReturnType<typeof createServerClient>
): Promise<NextResponse | null> {
  if (!isPathInList(path, PROFILE_CHECK_PATHS)) {
    return null;
  }

  const [{ data: profile }] = await Promise.all([
    supabase
      .from("profiles")
      .select("role, onboarding_completed")
      .eq("id", user.id)
      .single(),
  ]);

  if (path.startsWith("/admin") && (!profile || profile.role !== "admin")) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  if (!profile) {
    return null;
  }

  if (!(profile.onboarding_completed || path.startsWith("/onboarding"))) {
    return NextResponse.redirect(new URL("/onboarding", request.url));
  }

  if (profile.onboarding_completed && path.startsWith("/onboarding")) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return null;
}

export async function updateSession(request: NextRequest) {
  let response = buildResponse(request);
  const path = request.nextUrl.pathname;

  const supabase = createServerClient(
    getRequiredEnv("NEXT_PUBLIC_SUPABASE_URL"),
    getSupabasePublishableKey(),
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          for (const { name, value } of cookiesToSet) {
            request.cookies.set(name, value);
          }

          response = buildResponse(request);

          for (const { name, value, options } of cookiesToSet) {
            response.cookies.set(name, value, options);
          }
        },
      },
    }
  );

  if (isPathInList(path, PUBLIC_AUTH_PATHS)) {
    return response;
  }

  let user: User | null = null;
  try {
    const { data, error } = await supabase.auth.getUser();

    if (error) {
      if (isRefreshTokenError(error.message)) {
        clearAuthCookies(request, response);

        if (isPathInList(path, PROTECTED_ROUTES)) {
          logAuthRedirect(path, "/login", "refresh_token_error");
          return NextResponse.redirect(new URL("/login", request.url));
        }

        return response;
      }

      if (!error.message?.includes("Auth session missing")) {
        console.error("Auth error:", error.message);
      }
    }

    user = data?.user ?? null;
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Unknown session update error";
    console.error("Session update error:", message);

    if (isPathInList(path, PROTECTED_ROUTES)) {
      logAuthRedirect(path, "/login", "session_update_exception");
      return NextResponse.redirect(new URL("/login", request.url));
    }

    return response;
  }

  if (!user) {
    if (isPathInList(path, PROTECTED_ROUTES)) {
      logAuthRedirect(path, "/login", "missing_user");
      return NextResponse.redirect(new URL("/login", request.url));
    }

    return response;
  }

  const profileRedirect = await applyProfileGuards(
    request,
    path,
    user,
    supabase
  );
  if (profileRedirect) {
    return profileRedirect;
  }

  return response;
}
