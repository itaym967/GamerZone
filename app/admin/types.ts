/**
 * Shared types for the Admin Dashboard module.
 */

export interface BlockedWord {
  created_at: string;
  word: string;
}

export interface AdminLog {
  action: string;
  admin_id: string | null;
  created_at: string;
  details: unknown;
  id: string;
}

export interface Profile {
  account_type?: string;
  avatar_url: string | null;
  ban_reason?: string | null;
  bio: string | null;
  chat_restricted?: boolean;
  date_of_birth?: string | null;
  email?: string | null;
  full_name: string | null;
  id: string;
  is_banned: boolean | null;
  is_minor?: boolean;
  is_online: boolean | null;
  onboarding_completed: boolean | null;
  parental_consent?: boolean;
  profile_restricted?: boolean;
  role: string | null;
  safe_mode?: boolean;
  updated_at: string | null;
  username: string | null;
  website: string | null;
}

export interface ContentReport {
  admin_notes: string | null;
  created_at: string;
  description: string | null;
  id: string;
  report_type: string;
  reported_message_id: string | null;
  reported_user_id: string | null;
  reporter_id: string;
  resolved_at: string | null;
  resolved_by: string | null;
  status: string;
}

export interface DBMetrics {
  avgQueryTime: number;
  optimizationStatus: {
    lfgPage: boolean;
    chatHook: boolean;
    gamerCard: boolean;
    adminPage: boolean;
  };
  realtimeSubscriptions: number;
  slowQueryCount: number;
}

export type AdminTab = "blacklist" | "logs" | "users" | "management" | "safety";

export interface AIAnalysisResult {
  analysis: string;
  suggestions: string[];
}
