import { createBrowserClient } from "@supabase/ssr";
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

export function createClient() {
  return createBrowserClient<Database>(
    getRequiredEnv("NEXT_PUBLIC_SUPABASE_URL"),
    getSupabasePublishableKey()
  );
}
