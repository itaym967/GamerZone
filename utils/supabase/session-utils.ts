import { createServerClient } from "@supabase/ssr";
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

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const path = request.nextUrl.pathname;

  // Public auth paths - skip heavy checks
  if (PUBLIC_AUTH_PATHS.some((p) => path.startsWith(p))) {
    return response;
  }

  // Try to get user with error handling for refresh token failures
  let user = null;
  try {
    const { data, error } = await supabase.auth.getUser();

    // If refresh token is invalid, clear auth cookies and redirect to login
    if (error) {
      if (
        error.message?.includes("refresh_token_not_found") ||
        error.message?.includes("Invalid Refresh Token")
      ) {
        // Clear all auth-related cookies
        const cookiesToClear = request.cookies
          .getAll()
          .filter(
            (cookie) =>
              cookie.name.startsWith("sb-") ||
              cookie.name.includes("auth-token")
          );

        cookiesToClear.forEach((cookie) => {
          response.cookies.delete(cookie.name);
        });

        // Only redirect to login if on a protected route
        if (PROTECTED_ROUTES.some((route) => path.startsWith(route))) {
          return NextResponse.redirect(new URL("/login", request.url));
        }

        return response;
      }
      // For other errors, log but continue (skip expected "session missing" for guests)
      if (!error.message?.includes("Auth session missing")) {
        console.error("Auth error:", error.message);
      }
    }

    user = data?.user || null;
  } catch (error: any) {
    console.error("Session update error:", error.message);
    // On any error, if on protected route, redirect to login
    if (PROTECTED_ROUTES.some((route) => path.startsWith(route))) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
    return response;
  }

  if (user) {
    // Only fetch profile for paths that actually need it (admin, onboarding)
    const needsProfileCheck = PROFILE_CHECK_PATHS.some((p) =>
      path.startsWith(p)
    );

    if (needsProfileCheck) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("role, onboarding_completed")
        .eq("id", user.id)
        .single();

      // Admin Check (Secure: Fail Closed)
      if (path.startsWith("/admin") && (!profile || profile.role !== "admin")) {
        return NextResponse.redirect(new URL("/", request.url));
      }

      // Onboarding Check
      if (profile) {
        if (!(profile.onboarding_completed || path.startsWith("/onboarding"))) {
          return NextResponse.redirect(new URL("/onboarding", request.url));
        }

        if (profile.onboarding_completed && path.startsWith("/onboarding")) {
          return NextResponse.redirect(new URL("/", request.url));
        }
      }
    }
  } else {
    // Not Authenticated - protect specific routes
    if (PROTECTED_ROUTES.some((route) => path.startsWith(route))) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
  }

  return response;
}
