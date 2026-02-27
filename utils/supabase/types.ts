export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      admin_logs: {
        Row: {
          id: string;
          admin_id: string | null;
          action: string;
          target_id: string | null;
          details: Json | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          admin_id?: string | null;
          action: string;
          target_id?: string | null;
          details?: Json | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          admin_id?: string | null;
          action?: string;
          target_id?: string | null;
          details?: Json | null;
          created_at?: string;
        };
        Relationships: [];
      };
      friendships: {
        Row: {
          id: string;
          sender_id: string;
          receiver_id: string;
          status: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          sender_id: string;
          receiver_id: string;
          status?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          sender_id?: string;
          receiver_id?: string;
          status?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "friendships_sender_id_fkey";
            columns: ["sender_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "friendships_receiver_id_fkey";
            columns: ["receiver_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      blocked_words: {
        Row: {
          word: string;
          created_at: string;
          created_by: string | null;
        };
        Insert: {
          word: string;
          created_at?: string;
          created_by?: string | null;
        };
        Update: {
          word?: string;
          created_at?: string;
          created_by?: string | null;
        };
        Relationships: [];
      };
      chat_participants: {
        Row: {
          chat_id: string;
          user_id: string;
          joined_at: string;
        };
        Insert: {
          chat_id: string;
          user_id: string;
          joined_at?: string;
        };
        Update: {
          chat_id?: string;
          user_id?: string;
          joined_at?: string;
        };
        Relationships: [];
      };
      gamertags: {
        Row: {
          id: string;
          user_id: string;
          platform: string;
          tag: string;
          is_hidden: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          platform: string;
          tag: string;
          is_hidden?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          platform?: string;
          tag?: string;
          is_hidden?: boolean;
          created_at?: string;
        };
        Relationships: [];
      };
      lfg_posts: {
        Row: {
          id: string;
          user_id: string;
          game: string;
          mode: string;
          description: string | null;
          mic_required: boolean;
          region: string | null;
          created_at: string;
          expires_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          game: string;
          mode: string;
          description?: string | null;
          mic_required?: boolean;
          region?: string | null;
          created_at?: string;
          expires_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          game?: string;
          mode?: string;
          description?: string | null;
          mic_required?: boolean;
          region?: string | null;
          created_at?: string;
          expires_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "lfg_posts_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      parties: {
        Row: {
          id: string;
          leader_id: string;
          game: string;
          mode: string;
          title: string;
          max_members: number;
          skill_level_required: string | null;
          mic_required: boolean | null;
          region: string | null;
          language: string | null;
          status: string;
          created_at: string;
          expires_at: string;
          game_started_at: string | null;
        };
        Insert: {
          id?: string;
          leader_id: string;
          game: string;
          mode: string;
          title: string;
          max_members?: number;
          skill_level_required?: string | null;
          mic_required?: boolean | null;
          region?: string | null;
          language?: string | null;
          status?: string;
          created_at?: string;
          expires_at?: string;
          game_started_at?: string | null;
        };
        Update: {
          id?: string;
          leader_id?: string;
          game?: string;
          mode?: string;
          title?: string;
          max_members?: number;
          skill_level_required?: string | null;
          mic_required?: boolean | null;
          region?: string | null;
          language?: string | null;
          status?: string;
          created_at?: string;
          expires_at?: string;
          game_started_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "parties_leader_id_fkey";
            columns: ["leader_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      party_members: {
        Row: {
          id: string;
          party_id: string;
          user_id: string;
          joined_at: string;
          role: string;
          is_ready: boolean | null;
        };
        Insert: {
          id?: string;
          party_id: string;
          user_id: string;
          joined_at?: string;
          role?: string;
          is_ready?: boolean | null;
        };
        Update: {
          id?: string;
          party_id?: string;
          user_id?: string;
          joined_at?: string;
          role?: string;
          is_ready?: boolean | null;
        };
        Relationships: [
          {
            foreignKeyName: "party_members_party_id_fkey";
            columns: ["party_id"];
            isOneToOne: false;
            referencedRelation: "parties";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "party_members_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      messages: {
        Row: {
          id: string;
          sender_id: string;
          receiver_id: string;
          content: string;
          created_at: string;
          is_read: boolean;
          read_at: string | null;
          deleted_by: string[] | null;
        };
        Insert: {
          id?: string;
          sender_id: string;
          receiver_id: string;
          content: string;
          created_at?: string;
          is_read?: boolean;
          read_at?: string | null;
          deleted_by?: string[] | null;
        };
        Update: {
          id?: string;
          sender_id?: string;
          receiver_id?: string;
          content?: string;
          created_at?: string;
          is_read?: boolean;
          read_at?: string | null;
          deleted_by?: string[] | null;
        };
        Relationships: [];
      };
      notifications: {
        Row: {
          id: string;
          user_id: string;
          type: string;
          title: string;
          message: string;
          is_read: boolean;
          action_url: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          type: string;
          title: string;
          message: string;
          is_read?: boolean;
          action_url?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          type?: string;
          title?: string;
          message?: string;
          is_read?: boolean;
          action_url?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          id: string;
          username: string | null;
          avatar_url: string | null;
          updated_at: string | null;
          is_banned: boolean | null;
          role: string | null;
          full_name: string | null;
          bio: string | null;
          website: string | null;
          is_online: boolean | null;
          onboarding_completed: boolean | null;
          ban_reason: string | null;
          date_of_birth: string | null;
          account_type: string;
          is_minor: boolean;
          parental_email: string | null;
          parental_consent: boolean;
          parental_consent_at: string | null;
          chat_restricted: boolean;
          profile_restricted: boolean;
          safe_mode: boolean;
          max_daily_chat_minutes: number;
          email: string | null;
        };
        Insert: {
          id: string;
          username?: string | null;
          avatar_url?: string | null;
          updated_at?: string | null;
          is_banned?: boolean | null;
          role?: string | null;
          full_name?: string | null;
          bio?: string | null;
          website?: string | null;
          is_online?: boolean | null;
          onboarding_completed?: boolean | null;
          ban_reason?: string | null;
          date_of_birth?: string | null;
          account_type?: string;
          is_minor?: boolean;
          parental_email?: string | null;
          parental_consent?: boolean;
          parental_consent_at?: string | null;
          chat_restricted?: boolean;
          profile_restricted?: boolean;
          safe_mode?: boolean;
          max_daily_chat_minutes?: number;
          email?: string | null;
        };
        Update: {
          id?: string;
          username?: string | null;
          avatar_url?: string | null;
          updated_at?: string | null;
          is_banned?: boolean | null;
          role?: string | null;
          full_name?: string | null;
          bio?: string | null;
          website?: string | null;
          is_online?: boolean | null;
          onboarding_completed?: boolean | null;
          ban_reason?: string | null;
          date_of_birth?: string | null;
          account_type?: string;
          is_minor?: boolean;
          parental_email?: string | null;
          parental_consent?: boolean;
          parental_consent_at?: string | null;
          chat_restricted?: boolean;
          profile_restricted?: boolean;
          safe_mode?: boolean;
          max_daily_chat_minutes?: number;
          email?: string | null;
        };
        Relationships: [];
      };
      parental_controls: {
        Row: {
          id: string;
          parent_email: string;
          child_id: string;
          consent_token: string | null;
          consent_granted: boolean;
          consent_granted_at: string | null;
          activity_log_enabled: boolean;
          allowed_contacts_only: boolean;
          max_daily_chat_minutes: number;
          chat_enabled: boolean;
          explore_enabled: boolean;
          lfg_enabled: boolean;
          party_finder_enabled: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          parent_email: string;
          child_id: string;
          consent_token?: string | null;
          consent_granted?: boolean;
          consent_granted_at?: string | null;
          activity_log_enabled?: boolean;
          allowed_contacts_only?: boolean;
          max_daily_chat_minutes?: number;
          chat_enabled?: boolean;
          explore_enabled?: boolean;
          lfg_enabled?: boolean;
          party_finder_enabled?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          parent_email?: string;
          child_id?: string;
          consent_token?: string | null;
          consent_granted?: boolean;
          consent_granted_at?: string | null;
          activity_log_enabled?: boolean;
          allowed_contacts_only?: boolean;
          max_daily_chat_minutes?: number;
          chat_enabled?: boolean;
          explore_enabled?: boolean;
          lfg_enabled?: boolean;
          party_finder_enabled?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      content_reports: {
        Row: {
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
        };
        Insert: {
          id?: string;
          reporter_id: string;
          reported_user_id?: string | null;
          reported_message_id?: string | null;
          report_type: string;
          description?: string | null;
          status?: string;
          admin_notes?: string | null;
          resolved_by?: string | null;
          resolved_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          reporter_id?: string;
          reported_user_id?: string | null;
          reported_message_id?: string | null;
          report_type?: string;
          description?: string | null;
          status?: string;
          admin_notes?: string | null;
          resolved_by?: string | null;
          resolved_at?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      minor_activity_log: {
        Row: {
          id: string;
          user_id: string;
          activity_type: string;
          details: Json | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          activity_type: string;
          details?: Json | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          activity_type?: string;
          details?: Json | null;
          created_at?: string;
        };
        Relationships: [];
      };
      push_subscriptions: {
        Row: {
          id: string;
          user_id: string;
          endpoint: string;
          p256dh: string;
          auth: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          endpoint: string;
          p256dh: string;
          auth: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          endpoint?: string;
          p256dh?: string;
          auth?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      swap_requests: {
        Row: {
          id: string;
          sender_id: string;
          receiver_id: string;
          status: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          sender_id: string;
          receiver_id: string;
          status: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          sender_id?: string;
          receiver_id?: string;
          status?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      delete_user_as_admin: {
        Args: { target_user_id: string };
        Returns: void;
      };
      soft_delete_message: {
        Args: { message_id: string; user_id: string };
        Returns: void;
      };
      clear_conversation: {
        Args: { user_id_param: string; other_user_id: string };
        Returns: void;
      };
      get_dashboard_data: {
        Args: Record<string, never>;
        Returns: Json;
      };
      get_realtime_subscription_count: {
        Args: Record<string, never>;
        Returns: { count: number };
      };
      get_slow_query_metrics: {
        Args: Record<string, never>;
        Returns: { slow_count: number; avg_time: number };
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};
