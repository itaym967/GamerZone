"use client";

import { createContext, useContext, useEffect, useState, useMemo, useCallback, useRef } from "react";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";

interface Profile {
    id: string;
    username: string | null;
    full_name: string | null;
    avatar_url: string | null;
    role: string | null;
    is_banned?: boolean | null;
    ban_reason?: string | null;
}

interface AuthContextType {
    user: any | null;
    profile: Profile | null;
    isLoading: boolean;
    isAdmin: boolean;
    signOut: () => Promise<void>;
    refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const PROFILE_CACHE_KEY = 'gamerzone_profile_cache';
const PROFILE_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

function getCachedProfile(): { profile: Profile; timestamp: number } | null {
    if (typeof window === 'undefined') return null;
    try {
        const cached = sessionStorage.getItem(PROFILE_CACHE_KEY);
        if (cached) {
            const parsed = JSON.parse(cached);
            if (Date.now() - parsed.timestamp < PROFILE_CACHE_TTL) {
                return parsed;
            }
        }
    } catch {}
    return null;
}

function setCachedProfile(profile: Profile) {
    if (typeof window === 'undefined') return;
    try {
        sessionStorage.setItem(PROFILE_CACHE_KEY, JSON.stringify({
            profile,
            timestamp: Date.now()
        }));
    } catch {}
}

function clearCachedProfile() {
    if (typeof window === 'undefined') return;
    try {
        sessionStorage.removeItem(PROFILE_CACHE_KEY);
    } catch {}
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<any>(null);
    const [profile, setProfile] = useState<Profile | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isAdmin, setIsAdmin] = useState(false);
    const supabase = useMemo(() => createClient(), []);
    const router = useRouter();
    const initRef = useRef(false);
    const profileChannelRef = useRef<any>(null);

    const fetchProfile = useCallback(async (userId: string, useCache = true) => {
        try {
            // Try cache first for faster initial load
            if (useCache) {
                const cached = getCachedProfile();
                if (cached && cached.profile.id === userId) {
                    setProfile(cached.profile);
                    setIsAdmin(cached.profile.role === 'admin');
                    // Still fetch fresh data in background
                    fetchProfile(userId, false);
                    return;
                }
            }

            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', userId)
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
                    router.push('/login');
                    return;
                }

                setProfile(data);
                setIsAdmin(data.role === 'admin');
                setCachedProfile(data);

                // Clean up old channel if exists
                if (profileChannelRef.current) {
                    supabase.removeChannel(profileChannelRef.current);
                }

                // Listen for changes to this profile (e.g. banning)
                const channel = supabase
                    .channel(`profile-${userId}`)
                    .on(
                        'postgres_changes',
                        {
                            event: 'UPDATE',
                            schema: 'public',
                            table: 'profiles',
                            filter: `id=eq.${userId}`
                        },
                        async (payload) => {
                            if (payload.new.is_banned) {
                                clearCachedProfile();
                                await supabase.auth.signOut();
                                setUser(null);
                                setProfile(null);
                                router.push('/login');
                            } else {
                                const updatedProfile = { ...data, ...payload.new } as Profile;
                                setProfile(updatedProfile);
                                setIsAdmin(payload.new.role === 'admin');
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
    }, [supabase, router]);

    useEffect(() => {
        if (initRef.current) return;
        initRef.current = true;

        let mounted = true;

        const initAuth = async () => {
            try {
                const { data: { session } } = await supabase.auth.getSession();

                if (session?.user) {
                    setUser(session.user);
                    await fetchProfile(session.user.id, true);
                } else {
                    setUser(null);
                    setProfile(null);
                    clearCachedProfile();
                }
            } catch (error) {
                console.error("AuthContext: Error checking session", error);
            } finally {
                if (mounted) setIsLoading(false);
            }
        };

        initAuth();

        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            if (!mounted) return;

            if (event === 'SIGNED_IN' && session?.user) {
                setUser(session.user);
                await fetchProfile(session.user.id, false);
            } else if (event === 'SIGNED_OUT') {
                setUser(null);
                setProfile(null);
                setIsAdmin(false);
                clearCachedProfile();
                router.refresh();
            } else if (event === 'TOKEN_REFRESHED' && session?.user) {
                setUser(session.user);
            }

            setIsLoading(false);
        });

        return () => {
            mounted = false;
            subscription.unsubscribe();
            if (profileChannelRef.current) {
                supabase.removeChannel(profileChannelRef.current);
            }
        };
    }, [supabase, fetchProfile, router]);

    const signOut = useCallback(async () => {
        clearCachedProfile();
        await supabase.auth.signOut();
        router.push('/login');
    }, [supabase, router]);

    const refreshProfile = useCallback(async () => {
        if (user?.id) {
            await fetchProfile(user.id, false);
        }
    }, [user?.id, fetchProfile]);

    const value = useMemo(() => ({
        user,
        profile,
        isLoading,
        isAdmin,
        signOut,
        refreshProfile
    }), [user, profile, isLoading, isAdmin, signOut, refreshProfile]);

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
};
