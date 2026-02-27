"use client";

import type {
  AuthChangeEvent,
  RealtimeChannel,
  Session,
  User,
} from "@supabase/supabase-js";
import { useRouter } from "next/navigation";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { createClient } from "@/lib/supabase/client";

interface Profile {
  account_type?: string;
  avatar_url: string | null;
  ban_reason?: string | null;
  chat_restricted?: boolean;
  date_of_birth?: string | null;
  full_name: string | null;
  id: string;
  is_banned?: boolean | null;
  is_minor?: boolean;
  max_daily_chat_minutes?: number;
  parental_consent?: boolean;
  parental_email?: string | null;
  profile_restricted?: boolean;
  role: string | null;
  safe_mode?: boolean;
  username: string | null;
}

interface AuthContextType {
  isAdmin: boolean;
  isLoading: boolean;
  profile: Profile | null;
  refreshProfile: () => Promise<void>;
  signOut: () => Promise<void>;
  user: User | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const PROFILE_CACHE_KEY = "gamerzone_profile_cache";
const PROFILE_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

const logStorageError = (scope: string, error: unknown) => {
  console.warn(`AuthContext: ${scope} cache error`, error);
};

function getCachedProfile(): { profile: Profile; timestamp: number } | null {
  if (typeof window === "undefined") {
    return null;
  }
  try {
    const cached = sessionStorage.getItem(PROFILE_CACHE_KEY);
    if (cached) {
      const parsed = JSON.parse(cached);
      if (Date.now() - parsed.timestamp < PROFILE_CACHE_TTL) {
        return parsed;
      }
    }
  } catch (error: unknown) {
    logStorageError("read", error);
  }
  return null;
}

function setCachedProfile(profile: Profile) {
  if (typeof window === "undefined") {
    return;
  }
  try {
    sessionStorage.setItem(
      PROFILE_CACHE_KEY,
      JSON.stringify({
        profile,
        timestamp: Date.now(),
      })
    );
  } catch (error: unknown) {
    logStorageError("write", error);
  }
}

function clearCachedProfile() {
  if (typeof window === "undefined") {
    return;
  }
  try {
    sessionStorage.removeItem(PROFILE_CACHE_KEY);
  } catch (error: unknown) {
    logStorageError("clear", error);
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const supabase = useMemo(() => createClient(), []);
  const router = useRouter();
  const profileChannelRef = useRef<RealtimeChannel | null>(null);

  const clearAuthState = useCallback(() => {
    setUser(null);
    setProfile(null);
    setIsAdmin(false);
    clearCachedProfile();
  }, []);

  const fetchProfile = useCallback(
    async (userId: string, useCache = true) => {
      try {
        // Try cache first for faster initial load
        if (useCache) {
          const cached = getCachedProfile();
          if (cached && cached.profile.id === userId) {
            setProfile(cached.profile);
            setIsAdmin(cached.profile.role === "admin");
            // Still fetch fresh data in background
            fetchProfile(userId, false);
            return;
          }
        }

        const { data, error } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", userId)
          .single();

        if (error) {
          console.error("AuthContext: Profile fetch error", error);
          return;
        }

        if (data) {
          if (data.is_banned) {
            clearCachedProfile();
            await supabase.auth.signOut();
            setUser(null);
            setProfile(null);
            router.push("/login");
            return;
          }

          setProfile(data);
          setIsAdmin(data.role === "admin");
          setCachedProfile(data);

          // Clean up old channel if exists
          if (profileChannelRef.current) {
            supabase.removeChannel(profileChannelRef.current);
          }

          // Listen for changes to this profile (e.g. banning)
          const channel = supabase
            .channel(`profile-${userId}`)
            .on(
              "postgres_changes",
              {
                event: "UPDATE",
                schema: "public",
                table: "profiles",
                filter: `id=eq.${userId}`,
              },
              async (payload) => {
                if (payload.new.is_banned) {
                  clearCachedProfile();
                  await supabase.auth.signOut();
                  setUser(null);
                  setProfile(null);
                  router.push("/login");
                } else {
                  const updatedProfile = { ...data, ...payload.new } as Profile;
                  setProfile(updatedProfile);
                  setIsAdmin(payload.new.role === "admin");
                  setCachedProfile(updatedProfile);
                }
              }
            )
            .subscribe();

          profileChannelRef.current = channel;
        }
      } catch (error) {
        console.error("AuthContext: Unexpected fetch error", error);
      }
    },
    [supabase, router]
  );

  useEffect(() => {
    let mounted = true;
    let timeoutId: NodeJS.Timeout;

    const initAuth = async () => {
      try {
        // Set a timeout to prevent infinite loading
        timeoutId = setTimeout(() => {
          if (mounted) {
            console.warn(
              "AuthContext: Session check timeout - forcing completion"
            );
            setUser(null);
            setProfile(null);
            clearCachedProfile();
            setIsLoading(false);
          }
        }, 10_000);

        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();

        // Clear timeout on successful response
        clearTimeout(timeoutId);

        // Handle refresh token errors
        if (
          error &&
          (error.message?.includes("refresh_token_not_found") ||
            error.message?.includes("Invalid Refresh Token"))
        ) {
          // Clear invalid session
          await supabase.auth.signOut();
          setUser(null);
          setProfile(null);
          clearCachedProfile();
          if (mounted) {
            setIsLoading(false);
          }
          return;
        }

        if (session?.user) {
          setUser(session.user);
          await fetchProfile(session.user.id, true);
        } else {
          setUser(null);
          setProfile(null);
          clearCachedProfile();
        }
      } catch (error: unknown) {
        console.error("AuthContext: Error checking session", error);
        // Clear session on any error to prevent loops
        clearAuthState();
      } finally {
        clearTimeout(timeoutId);
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    initAuth();

    const handleAuthStateChange = async (
      event: AuthChangeEvent,
      session: Session | null
    ) => {
      if (!mounted) {
        return;
      }

      switch (event) {
        case "SIGNED_IN": {
          if (session?.user) {
            setUser(session.user);
            await fetchProfile(session.user.id, false);
          }
          break;
        }
        case "SIGNED_OUT": {
          clearAuthState();
          router.refresh();
          break;
        }
        case "TOKEN_REFRESHED":
        case "USER_UPDATED": {
          if (session?.user) {
            setUser(session.user);
          }
          break;
        }
        default: {
          break;
        }
      }

      setIsLoading(false);
    };

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(handleAuthStateChange);

    return () => {
      mounted = false;
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      subscription.unsubscribe();
      if (profileChannelRef.current) {
        supabase.removeChannel(profileChannelRef.current);
      }
    };
  }, [supabase, fetchProfile, router, clearAuthState]);

  const signOut = useCallback(async () => {
    try {
      // Clear state immediately for instant UI feedback
      setUser(null);
      setProfile(null);
      setIsAdmin(false);

      // Clean up realtime subscription
      if (profileChannelRef.current) {
        supabase.removeChannel(profileChannelRef.current);
        profileChannelRef.current = null;
      }

      // Sign out from Supabase
      await supabase.auth.signOut();

      // Force router refresh and redirect
      router.refresh();
      router.push("/login");
    } catch (error) {
      console.error("Error during sign out:", error);
      // Even if sign out fails, clear local state
      setUser(null);
      setProfile(null);
      setIsAdmin(false);
      router.push("/login");
    }
  }, [supabase, router]);

  const refreshProfile = useCallback(async () => {
    if (user?.id) {
      await fetchProfile(user.id, false);
    }
  }, [user?.id, fetchProfile]);

  const value = useMemo(
    () => ({
      user,
      profile,
      isLoading,
      isAdmin,
      signOut,
      refreshProfile,
    }),
    [user, profile, isLoading, isAdmin, signOut, refreshProfile]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
