/**
 * Hook to handle authentication errors gracefully
 * Prevents routing loops and clears invalid sessions
 */

import type { AuthError } from "@supabase/supabase-js";
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
    } = supabase.auth.onAuthStateChange((event, session) => {
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
  onError?: (error: unknown) => void
): Promise<T | null> {
  try {
    return await operation();
  } catch (error: unknown) {
    console.error("Auth operation error:", error);

    const authError = error as Partial<AuthError> & {
      error_description?: string;
      code?: string;
      message?: string;
    };
    const message = authError.message || authError.error_description || "";
    const isRefreshError =
      message.includes("refresh_token_not_found") ||
      message.includes("Invalid Refresh Token") ||
      message.includes("refresh token") ||
      authError.code === "refresh_token_not_found";
    if (isRefreshError) {
      try {
        const supabase = createClient();
        await supabase.auth.signOut();
      } catch (signOutError: unknown) {
        console.warn("Auth sign-out failed after token error", signOutError);
      }
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
