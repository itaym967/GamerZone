"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";

interface Profile {
    id: string;
    username: string;
    full_name: string;
    avatar_url: string;
    role: string;
    is_banned?: boolean;
    ban_reason?: string;
}

interface AuthContextType {
    user: any | null;
    profile: Profile | null;
    isLoading: boolean;
    isAdmin: boolean;
    signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<any>(null);
    const [profile, setProfile] = useState<Profile | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isAdmin, setIsAdmin] = useState(false);
    const supabase = createClient();
    const router = useRouter();

    useEffect(() => {
        let mounted = true;

        const initAuth = async () => {
            try {
                const { data: { session } } = await supabase.auth.getSession();

                if (session?.user) {
                    setUser(session.user);
                    await fetchProfile(session.user.id);
                } else {
                    setUser(null);
                    setProfile(null);
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
                await fetchProfile(session.user.id);
            } else if (event === 'SIGNED_OUT') {
                setUser(null);
                setProfile(null);
                setIsAdmin(false);
                router.refresh();
            } else if (event === 'TOKEN_REFRESHED' && session?.user) {
                // Just update user object, profile likely unchanged
                setUser(session.user);
            }

            setIsLoading(false);
        });

        return () => {
            mounted = false;
            subscription.unsubscribe();
        };
    }, []);

    const fetchProfile = async (userId: string) => {
        try {
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
                    await supabase.auth.signOut();
                    setUser(null);
                    setProfile(null);
                    router.push('/login');
                    return;
                }

                setProfile(data);
                setIsAdmin(data.role === 'admin');

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
                                await supabase.auth.signOut();
                                setUser(null);
                                setProfile(null);
                                router.push('/login');
                            } else {
                                // Update profile data (e.g. role change, avatar update)
                                setProfile({ ...data, ...payload.new });
                                setIsAdmin(payload.new.role === 'admin');
                            }
                        }
                    )
                    .subscribe();

                return () => {
                    supabase.removeChannel(channel);
                };
            }
        } catch (error) {
            console.error("AuthContext: Unexpected fetch error", error);
        }
    };

    const signOut = async () => {
        await supabase.auth.signOut();
        router.push('/login');
    };

    return (
        <AuthContext.Provider value={{ user, profile, isLoading, isAdmin, signOut }}>
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
