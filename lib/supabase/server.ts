import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "@/lib/database.types";

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

/**
 * If using Fluid compute: Don't put this client in a global variable.
 * Always create a new client within each function.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    getRequiredEnv("NEXT_PUBLIC_SUPABASE_URL"),
    getSupabasePublishableKey(),
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            for (const { name, value, options } of cookiesToSet) {
              cookieStore.set(name, value, options);
            }
          } catch {
            // setAll can be called from Server Components where cookie writes are not allowed.
            // Safe to ignore when session refreshing is handled in proxy/middleware.
          }
        },
      },
    }
  );
}
