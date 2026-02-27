"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";

/**
 * Hook for admin authentication and authorization.
 * Verifies the current user has admin role, redirects otherwise.
 *
 * Returns:
 *   - currentUser: The authenticated admin's user ID
 *   - isVerifying: Whether the auth check is still in progress
 *   - supabase: The Supabase client instance
 */
export function useAdminAuth() {
  const router = useRouter();
  const supabase = createClient();
  const [currentUser, setCurrentUser] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(true);

  useEffect(() => {
    const checkAccess = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) {
          router.push("/");
          return;
        }

        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .single();

        if (profile?.role !== "admin") {
          toast.error("אין לך הרשאת גישה לדף זה");
          router.push("/");
          return;
        }

        setCurrentUser(user.id);
      } catch (error) {
        console.error("Admin auth check failed:", error);
        router.push("/");
      }
      setIsVerifying(false);
    };

    checkAccess();
  }, [router, supabase]);

  return { currentUser, isVerifying, supabase };
}
