/**
 * useDashboardData Hook
 *
 * Centralized hook for caching dashboard/explore data to prevent redundant fetches.
 * Data is cached in sessionStorage and shared across pages.
 * Optimized for PWA/mobile with offline support.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  type AvailabilityPreferences,
  parseAvailabilityPreferences,
} from "@/lib/availability";
import { createClient } from "@/lib/supabase/client";

const CACHE_KEY_PREFIX = "gamerzone_dashboard_cache";
const CACHE_TTL = 2 * 60 * 1000; // 2 minutes
const OFFLINE_CACHE_TTL = 30 * 60 * 1000; // 30 minutes for offline mode

const logDashboardCacheError = (scope: string, error: unknown) => {
  console.warn(`Dashboard cache ${scope} error`, error);
};

function getCacheKey(userId: string | null): string {
  return userId ? `${CACHE_KEY_PREFIX}_${userId}` : `${CACHE_KEY_PREFIX}_guest`;
}

interface Gamer {
  availabilitySlots: AvailabilityPreferences["slots"];
  availabilityTimezone: string | null;
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

interface GamerTagRow {
  is_hidden: boolean | null;
  platform: string | null;
}

interface ProfileRow {
  avatar_url: string | null;
  bio: string | null;
  gamertags: GamerTagRow[] | null;
  id: string;
  is_online: boolean;
  username: string | null;
  website: string | null;
}

interface CurrentUserPreferences {
  availability: AvailabilityPreferences | null;
  games: string[];
}

const getProfileGames = (profile: ProfileRow) => {
  const games = new Set<string>();
  for (const tag of profile.gamertags || []) {
    if (tag.platform) {
      games.add(tag.platform);
    }
  }
  return [...games];
};

const mapProfileToGamer = (profile: ProfileRow): Gamer => {
  const availability = parseAvailabilityPreferences(profile.website);
  const hiddenTagsMap: { [key: string]: string } = {};
  const gamesList = getProfileGames(profile);
  for (const tag of profile.gamertags || []) {
    if (!tag.platform) {
      continue;
    }
    if (tag.is_hidden) {
      hiddenTagsMap[tag.platform] = "********";
    }
  }

  return {
    availabilitySlots: availability?.slots || [],
    availabilityTimezone: availability?.timezone || null,
    id: profile.id,
    username: profile.username || "Unknown",
    tag: `@${(profile.username || "user").toLowerCase()}`,
    games: gamesList,
    bio: profile.bio || "",
    online: profile.is_online,
    hiddenTags: hiddenTagsMap,
    avatarSeed: profile.avatar_url ?? undefined,
  };
};

const filterOutCurrentUser = (
  gamers: Gamer[],
  currentUserId: string | null
) => {
  if (!currentUserId) {
    return gamers;
  }
  return gamers.filter((g) => g.id !== currentUserId);
};

const isBackgroundRefreshNeeded = (timestamp: number) => {
  return Date.now() - timestamp > 60 * 1000;
};

const applyCachedDashboardState = (
  cached: CacheData,
  currentUserId: string | null,
  setGamers: (value: Gamer[]) => void,
  setCurrentUsername: (value: string | null) => void,
  setCurrentUserPreferences: (value: CurrentUserPreferences | null) => void
) => {
  setGamers(filterOutCurrentUser(cached.gamers, currentUserId));
  const currentUserGamer = cached.gamers.find(
    (gamer) => gamer.id === currentUserId
  );
  if (currentUserGamer) {
    setCurrentUsername(currentUserGamer.username);
    setCurrentUserPreferences({
      availability: {
        slots: currentUserGamer.availabilitySlots,
        timezone: currentUserGamer.availabilityTimezone ?? "Asia/Jerusalem",
      },
      games: currentUserGamer.games,
    });
    return;
  }
  setCurrentUserPreferences(null);
};

const getDashboardProfiles = async (
  supabase: ReturnType<typeof createClient>
) => {
  const { data, error } = await supabase
    .from("profiles")
    .select(`
                    id,
                    username,
                    bio,
                    avatar_url,
                    is_online,
                    website,
                    gamertags (
                        platform,
                        is_hidden
                    )
                `)
    .order("username", { ascending: true });

  return { data: data as ProfileRow[] | null, error };
};

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
  } catch (error: unknown) {
    logDashboardCacheError("read", error);
  }
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
  } catch (error: unknown) {
    logDashboardCacheError("write", error);
  }
}

export function useDashboardData(
  currentUserId: string | null,
  authLoading: boolean
) {
  const [gamers, setGamers] = useState<Gamer[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUsername, setCurrentUsername] = useState<string | null>(null);
  const [currentUserPreferences, setCurrentUserPreferences] =
    useState<CurrentUserPreferences | null>(null);
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

  const readCachedGamers = useCallback(
    (forceRefresh: boolean) => {
      if (forceRefresh) {
        return { usedCache: false, needsBackgroundRefresh: false };
      }

      const cached = getCachedData(currentUserId);
      if (!cached) {
        return { usedCache: false, needsBackgroundRefresh: false };
      }

      applyCachedDashboardState(
        cached,
        currentUserId,
        setGamers,
        setCurrentUsername,
        setCurrentUserPreferences
      );
      setLoading(false);

      return {
        usedCache: true,
        needsBackgroundRefresh: isBackgroundRefreshNeeded(cached.timestamp),
      };
    },
    [currentUserId]
  );

  const loadGamersFromDatabase = useCallback(async () => {
    const { data: profiles, error } = await getDashboardProfiles(supabase);

    if (error) {
      console.error("Dashboard: Error fetching data", error);
      setLoading(false);
      return;
    }

    if (!profiles) {
      return;
    }

    const currentUserProfile = profiles.find((p) => p.id === currentUserId);
    if (currentUserProfile) {
      setCurrentUsername(currentUserProfile.username);
      setCurrentUserPreferences({
        availability: parseAvailabilityPreferences(currentUserProfile.website),
        games: getProfileGames(currentUserProfile),
      });
    } else {
      setCurrentUserPreferences(null);
    }

    const formattedGamers: Gamer[] = profiles.map((profile) =>
      mapProfileToGamer(profile)
    );
    setCachedData(formattedGamers, currentUserId);
    setGamers(filterOutCurrentUser(formattedGamers, currentUserId));
  }, [currentUserId, supabase]);

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

      const cacheState = readCachedGamers(forceRefresh);
      if (cacheState.usedCache) {
        isFetchingRef.current = false;
        if (cacheState.needsBackgroundRefresh) {
          fetchGamers(true).catch((error: unknown) => {
            console.error("Dashboard background refresh failed", error);
          });
        }
        return;
      }

      try {
        await loadGamersFromDatabase();
      } catch (err: unknown) {
        console.error("Error processing dashboard:", err);
      } finally {
        setLoading(false);
        isFetchingRef.current = false;
      }
    },
    [authLoading, loadGamersFromDatabase, readCachedGamers]
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
      setCurrentUserPreferences(null);
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
    currentUserPreferences,
    refresh,
    isOffline,
  };
}
