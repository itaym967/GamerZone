/**
 * Shared types for the Admin Dashboard module.
 */

export interface BlockedWord {
  word: string;
  created_at: string;
}

export interface AdminLog {
  id: string;
  action: string;
  details: any;
  created_at: string;
  admin_id: string | null;
}

export interface Profile {
  id: string;
  username: string | null;
  full_name: string | null;
  role: string | null;
  is_online: boolean | null;
  is_banned: boolean | null;
  ban_reason?: string | null;
  avatar_url: string | null;
  updated_at: string | null;
  bio: string | null;
  website: string | null;
  onboarding_completed: boolean | null;
  is_minor?: boolean;
  account_type?: string;
  date_of_birth?: string | null;
  parental_consent?: boolean;
  chat_restricted?: boolean;
  profile_restricted?: boolean;
  safe_mode?: boolean;
  email?: string | null;
}

export interface ContentReport {
  id: string;
  reporter_id: string;
  reported_user_id: string | null;
  reported_message_id: string | null;
  report_type: string;
  description: string | null;
  status: string;
  admin_notes: string | null;
  resolved_by: string | null;
  resolved_at: string | null;
  created_at: string;
}

export interface DBMetrics {
  realtimeSubscriptions: number;
  slowQueryCount: number;
  avgQueryTime: number;
  optimizationStatus: {
    lfgPage: boolean;
    chatHook: boolean;
    gamerCard: boolean;
    adminPage: boolean;
  };
}

export type AdminTab = "blacklist" | "logs" | "users" | "management" | "safety";

export interface AIAnalysisResult {
  analysis: string;
  suggestions: string[];
}
