/**
 * Hook to handle authentication errors gracefully
 * Prevents routing loops and clears invalid sessions
 */

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

export function useAuthErrorHandler() {
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    // Listen for auth errors
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      // Handle sign-in errors
      if (event === "SIGNED_OUT" && !session) {
        // User was signed out, possibly due to invalid token
        const currentPath = window.location.pathname;
        if (!["/login", "/signup", "/"].includes(currentPath)) {
          router.push("/login");
        }
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase, router]);
}

/**
 * Wrap async auth operations with error handling
 */
export async function withAuthErrorHandling<T>(
  operation: () => Promise<T>,
  onError?: (error: any) => void
): Promise<T | null> {
  try {
    return await operation();
  } catch (error: any) {
    console.error("Auth operation error:", error);

    const message = error?.message || error?.error_description || "";
    const isRefreshError =
      message.includes("refresh_token_not_found") ||
      message.includes("Invalid Refresh Token") ||
      message.includes("refresh token") ||
      error?.code === "refresh_token_not_found";
    if (isRefreshError) {
      try {
        const supabase = createClient();
        await supabase.auth.signOut();
      } catch {}
      if (
        typeof window !== "undefined" &&
        !window.location.pathname.startsWith("/login")
      ) {
        window.location.href = "/login";
      }
    }

    if (onError) {
      onError(error);
    }

    return null;
  }
}
