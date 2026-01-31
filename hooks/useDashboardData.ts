/**
 * useDashboardData Hook
 * 
 * Centralized hook for caching dashboard/explore data to prevent redundant fetches.
 * Data is cached in sessionStorage and shared across pages.
 * Optimized for PWA/mobile with offline support.
 */

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { createClient } from '@/utils/supabase/client';

const CACHE_KEY = 'gamerzone_dashboard_cache';
const CACHE_TTL = 2 * 60 * 1000; // 2 minutes
const OFFLINE_CACHE_TTL = 30 * 60 * 1000; // 30 minutes for offline mode

interface Gamer {
    id: string;
    username: string;
    tag: string;
    games: string[];
    bio: string;
    online: boolean;
    hiddenTags: { [key: string]: string };
    avatarSeed?: string;
}

interface CacheData {
    gamers: Gamer[];
    timestamp: number;
}

function getCachedData(): CacheData | null {
    if (typeof window === 'undefined') return null;
    try {
        const cached = sessionStorage.getItem(CACHE_KEY);
        if (cached) {
            const parsed = JSON.parse(cached) as CacheData;
            // Use longer TTL when offline for PWA support
            const isOnline = navigator.onLine;
            const ttl = isOnline ? CACHE_TTL : OFFLINE_CACHE_TTL;
            if (Date.now() - parsed.timestamp < ttl) {
                return parsed;
            }
        }
    } catch {}
    return null;
}

function setCachedData(gamers: Gamer[]) {
    if (typeof window === 'undefined') return;
    try {
        sessionStorage.setItem(CACHE_KEY, JSON.stringify({
            gamers,
            timestamp: Date.now()
        }));
    } catch {}
}

export function useDashboardData(currentUserId: string | null, authLoading: boolean) {
    const [gamers, setGamers] = useState<Gamer[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentUsername, setCurrentUsername] = useState<string | null>(null);
    const [isOffline, setIsOffline] = useState(false);
    const supabase = useMemo(() => createClient(), []);
    const fetchedRef = useRef(false);

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

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);
        setIsOffline(!navigator.onLine);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    const fetchGamers = useCallback(async (forceRefresh = false) => {
        if (authLoading) return;

        // Try cache first unless forcing refresh
        if (!forceRefresh) {
            const cached = getCachedData();
            if (cached) {
                const filteredGamers = currentUserId 
                    ? cached.gamers.filter(g => g.id !== currentUserId)
                    : cached.gamers;
                setGamers(filteredGamers);
                setLoading(false);
                
                // Find current user's username from cache if available
                const currentUserGamer = cached.gamers.find(g => g.id === currentUserId);
                if (currentUserGamer) {
                    setCurrentUsername(currentUserGamer.username);
                }
                
                // Background refresh if cache is older than 1 minute
                if (Date.now() - cached.timestamp > 60 * 1000) {
                    fetchGamers(true);
                }
                return;
            }
        }

        try {
            const { data, error } = await supabase.rpc('get_dashboard_data');

            if (error) {
                console.error("Dashboard: Error fetching data", error);
                return;
            }

            if (data) {
                const profiles = data as any[];

                // Find current user's profile
                const currentUserProfile = profiles.find(p => p.id === currentUserId);
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
                        tag: "@" + (profile.username || "user").toLowerCase(),
                        games: gamesList,
                        bio: profile.bio || "",
                        online: profile.is_online || false,
                        hiddenTags: hiddenTagsMap,
                        avatarSeed: profile.avatar_url
                    };
                });

                // Cache all gamers (including current user for username lookup)
                setCachedData(formattedGamers);

                // Filter out current user for display
                const filteredGamers = currentUserId 
                    ? formattedGamers.filter(g => g.id !== currentUserId)
                    : formattedGamers;
                
                setGamers(filteredGamers);
            }
        } catch (err: any) {
            console.error("Error processing dashboard:", err);
        } finally {
            setLoading(false);
        }
    }, [authLoading, currentUserId, supabase]);

    useEffect(() => {
        if (authLoading || fetchedRef.current) return;
        fetchedRef.current = true;
        fetchGamers(false);
    }, [authLoading, fetchGamers]);

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
        isOffline
    };
}
