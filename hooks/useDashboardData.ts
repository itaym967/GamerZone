/**
 * useDashboardData Hook
 *
 * Centralized hook for caching dashboard/explore data to prevent redundant fetches.
 * Data is cached in sessionStorage and shared across pages.
 * Optimized for PWA/mobile with offline support.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createClient } from "@/utils/supabase/client";

const CACHE_KEY_PREFIX = "gamerzone_dashboard_cache";
const CACHE_TTL = 2 * 60 * 1000; // 2 minutes
const OFFLINE_CACHE_TTL = 30 * 60 * 1000; // 30 minutes for offline mode

function getCacheKey(userId: string | null): string {
  return userId ? `${CACHE_KEY_PREFIX}_${userId}` : `${CACHE_KEY_PREFIX}_guest`;
}

interface Gamer {
  avatarSeed?: string;
  bio: string;
  games: string[];
  hiddenTags: { [key: string]: string };
  id: string;
  online: boolean;
  tag: string;
  username: string;
}

interface CacheData {
  gamers: Gamer[];
  timestamp: number;
}

function getCachedData(userId: string | null): CacheData | null {
  if (typeof window === "undefined") {
    return null;
  }
  try {
    const cached = sessionStorage.getItem(getCacheKey(userId));
    if (cached) {
      const parsed = JSON.parse(cached) as CacheData;
      const isOnline = navigator.onLine;
      const ttl = isOnline ? CACHE_TTL : OFFLINE_CACHE_TTL;
      if (Date.now() - parsed.timestamp < ttl) {
        return parsed;
      }
    }
  } catch {}
  return null;
}

function setCachedData(gamers: Gamer[], userId: string | null) {
  if (typeof window === "undefined") {
    return;
  }
  try {
    sessionStorage.setItem(
      getCacheKey(userId),
      JSON.stringify({
        gamers,
        timestamp: Date.now(),
      })
    );
  } catch {}
}

export function useDashboardData(
  currentUserId: string | null,
  authLoading: boolean
) {
  const [gamers, setGamers] = useState<Gamer[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUsername, setCurrentUsername] = useState<string | null>(null);
  const [isOffline, setIsOffline] = useState(false);
  const supabase = useMemo(() => createClient(), []);
  const fetchedRef = useRef(false);
  const lastUserIdRef = useRef<string | null>(null);
  const loadingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isFetchingRef = useRef(false);

  // Listen for online/offline status changes (PWA support)
  useEffect(() => {
    const handleOnline = () => {
      setIsOffline(false);
      // Refresh data when coming back online
      if (fetchedRef.current) {
        fetchedRef.current = false;
        setLoading(true);
      }
    };
    const handleOffline = () => setIsOffline(true);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    setIsOffline(!navigator.onLine);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const fetchGamers = useCallback(
    async (forceRefresh = false) => {
      if (authLoading) {
        return;
      }

      // Prevent concurrent fetches
      if (isFetchingRef.current && !forceRefresh) {
        return;
      }
      isFetchingRef.current = true;

      // Try cache first unless forcing refresh
      if (!forceRefresh) {
        const cached = getCachedData(currentUserId);
        if (cached) {
          const filteredGamers = currentUserId
            ? cached.gamers.filter((g) => g.id !== currentUserId)
            : cached.gamers;
          setGamers(filteredGamers);
          setLoading(false);

          // Find current user's username from cache if available
          const currentUserGamer = cached.gamers.find(
            (g) => g.id === currentUserId
          );
          if (currentUserGamer) {
            setCurrentUsername(currentUserGamer.username);
          }

          // Background refresh if cache is older than 1 minute (but don't set loading)
          if (
            Date.now() - cached.timestamp > 60 * 1000 &&
            !isFetchingRef.current
          ) {
            isFetchingRef.current = true;
            fetchGamers(true).finally(() => {
              isFetchingRef.current = false;
            });
          }
          return;
        }
      }

      try {
        // Fetch profiles with their gamertags
        const { data: profiles, error } = await supabase
          .from("profiles")
          .select(`
                    id,
                    username,
                    bio,
                    avatar_url,
                    is_online,
                    gamertags (
                        platform,
                        is_hidden
                    )
                `)
          .order("username", { ascending: true });

        if (error) {
          console.error("Dashboard: Error fetching data", error);
          setLoading(false);
          return;
        }

        if (profiles) {
          // Find current user's profile
          const currentUserProfile = profiles.find(
            (p) => p.id === currentUserId
          );
          if (currentUserProfile) {
            setCurrentUsername(currentUserProfile.username);
          }

          const formattedGamers: Gamer[] = profiles.map((profile: any) => {
            const tags = profile.gamertags || [];
            const hiddenTagsMap: { [key: string]: string } = {};
            const gamesList: string[] = [];

            tags.forEach((t: any) => {
              gamesList.push(t.platform);
              if (t.is_hidden) {
                hiddenTagsMap[t.platform] = "********";
              }
            });

            return {
              id: profile.id,
              username: profile.username || "Unknown",
              tag: `@${(profile.username || "user").toLowerCase()}`,
              games: gamesList,
              bio: profile.bio || "",
              online: profile.is_online,
              hiddenTags: hiddenTagsMap,
              avatarSeed: profile.avatar_url,
            };
          });

          // Cache all gamers scoped to current user
          setCachedData(formattedGamers, currentUserId);

          // Filter out current user for display
          const filteredGamers = currentUserId
            ? formattedGamers.filter((g) => g.id !== currentUserId)
            : formattedGamers;

          setGamers(filteredGamers);
        }
      } catch (err: any) {
        console.error("Error processing dashboard:", err);
      } finally {
        setLoading(false);
        isFetchingRef.current = false;
      }
    },
    [authLoading, currentUserId, supabase]
  );

  useEffect(() => {
    // Clear any existing timeout
    if (loadingTimeoutRef.current) {
      clearTimeout(loadingTimeoutRef.current);
    }

    if (authLoading) {
      // Reset fetchedRef when auth starts loading to allow fetch after auth completes
      fetchedRef.current = false;
      return;
    }

    // Reset and refetch if user ID changed (login/logout)
    if (lastUserIdRef.current !== currentUserId) {
      lastUserIdRef.current = currentUserId;
      fetchedRef.current = false;
      setLoading(true);
    }

    if (fetchedRef.current) {
      return;
    }

    fetchedRef.current = true;

    // Set timeout fallback - if loading takes more than 10 seconds, force stop
    loadingTimeoutRef.current = setTimeout(() => {
      console.warn("Dashboard loading timeout - forcing completion");
      setLoading(false);
      isFetchingRef.current = false;
    }, 10_000);

    fetchGamers(false).finally(() => {
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
      }
    });

    return () => {
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
      }
    };
  }, [authLoading, currentUserId, fetchGamers]);

  const refresh = useCallback(() => {
    fetchedRef.current = false;
    setLoading(true);
    fetchGamers(true);
  }, [fetchGamers]);

  return {
    gamers,
    loading,
    currentUsername,
    refresh,
    isOffline,
  };
}
