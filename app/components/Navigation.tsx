"use client";

import { memo, useMemo, useCallback, useState, useEffect } from "react";
import { Home, Search, MessageCircle, User, Gamepad2, ShieldAlert, LogOut, Bell, LogIn, Users, HeartHandshake } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Logo from "./Logo";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { useNotifications } from "@/hooks/useNotifications";
import OptimizedAvatar from "./OptimizedAvatar";
import { useAuth } from "@/context/AuthContext";
import MobileNav from "./MobileNav";

const navItems = [
    { icon: Home, label: "בית", href: "/" },
    { icon: Search, label: "גלה שחקנים", href: "/explore" },
    { icon: Users, label: "מוצא קבוצות", href: "/party-finder" },
    { icon: Gamepad2, label: "לוח חי", href: "/lfg" },
];

const authenticatedNavItems = [
    { icon: HeartHandshake, label: "חברים", href: "/friends" },
    { icon: Bell, label: "התראות", href: "/notifications" },
    { icon: MessageCircle, label: "צ'אט", href: "/chat" },
    { icon: User, label: "פרופיל", href: "/profile" },
];

export default function Navigation() {
    const pathname = usePathname();
    const { user, profile, isAdmin, signOut, isLoading } = useAuth();
    const { subscribeToPush, subscription } = usePushNotifications();
    const { unreadCount } = useNotifications(user?.id);
    const [showSkeleton, setShowSkeleton] = useState(false);
    const [isSigningOut, setIsSigningOut] = useState(false);
    const [isMounted, setIsMounted] = useState(false);

    // Set mounted state to prevent hydration mismatch
    useEffect(() => {
        setIsMounted(true);
    }, []);

    // Only show skeleton after a delay to prevent flashing
    useEffect(() => {
        if (isLoading) {
            const timer = setTimeout(() => setShowSkeleton(true), 300);
            return () => clearTimeout(timer);
        } else {
            setShowSkeleton(false);
        }
    }, [isLoading]);

    const handleSignOut = useCallback(async () => {
        setIsSigningOut(true);
        try {
            await signOut();
        } catch (error) {
            console.error('Sign out error:', error);
            setIsSigningOut(false);
        }
    }, [signOut]);

    // Memoize nav items to prevent recalculation on every render
    const currentNavItems = useMemo(() => [
        ...navItems,
        ...(user ? authenticatedNavItems : []),
        ...(isAdmin ? [{ icon: ShieldAlert, label: "ניהול", href: "/admin" }] : [])
    ], [user, isAdmin]);

    return (
        <>
            {/* Desktop Sidebar */}
            <aside className="hidden md:flex flex-col w-64 h-screen fixed right-0 top-0 border-l border-white/5 bg-[#050510] glass-panel p-6 z-50">
                <div className="flex items-center gap-2 mb-10 px-2">
                    <div className="bg-primary p-2 rounded-lg text-black">
                        <Gamepad2 size={24} />
                    </div>
                    <Logo />
                </div>

                <nav className="flex-1 space-y-2">
                    {currentNavItems.map((item) => {
                        const isActive = pathname === item.href;
                        const isLiveBoard = item.href === '/lfg';
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 group relative ${isActive ? "bg-white/10 text-primary" : "text-gray-400 hover:text-white hover:bg-white/5"
                                    }`}
                            >
                                <div className="relative">
                                    <item.icon size={20} className={isActive ? "text-primary" : "group-hover:text-primary transition-colors"} />
                                    {isLiveBoard && (
                                        <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.8)]" />
                                    )}
                                    {item.href === '/notifications' && unreadCount > 0 && (
                                        <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] bg-blue-500 rounded-full text-[10px] font-bold text-white flex items-center justify-center px-1 shadow-[0_0_8px_rgba(59,130,246,0.6)]">
                                            {unreadCount > 9 ? '9+' : unreadCount}
                                        </span>
                                    )}
                                </div>
                                <span className="font-medium">{item.label}</span>
                                {isActive && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 rounded-r-full bg-primary shadow-[0_0_10px_#00ff9d]" />}
                            </Link>
                        );
                    })}
                </nav>

                <div className="mt-auto pt-6 border-t border-white/5 space-y-3">
                    {!isMounted ? (
                        // Render placeholder during SSR to match initial client render
                        <div className="flex items-center justify-center gap-2 w-full bg-primary text-black font-bold py-3 rounded-xl opacity-50">
                            <LogIn size={20} />
                            <span>התחברות</span>
                        </div>
                    ) : showSkeleton ? (
                        // Loading Skeleton - only shown after delay
                        <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white/5 border border-white/5 animate-pulse">
                            <div className="w-8 h-8 rounded-full bg-white/10" />
                            <div className="flex-1 space-y-2">
                                <div className="h-3 w-20 bg-white/10 rounded" />
                                <div className="h-2 w-12 bg-white/10 rounded" />
                            </div>
                        </div>
                    ) : user && !subscription ? (
                        <button
                            onClick={() => subscribeToPush()}
                            className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-yellow-400 hover:text-yellow-300 hover:bg-yellow-400/10 transition-all font-medium"
                        >
                            <Bell size={20} />
                            <span>הפעל התראות</span>
                        </button>
                    ) : null}

                    {!isMounted ? null : showSkeleton ? null : user ? (
                        <>
                            {/* Mini Profile Summary */}
                            <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white/5 border border-white/5">
                                <OptimizedAvatar
                                    seed={profile?.avatar_url || "/avatars/gamer.png"}
                                    size={32}
                                    className="rounded-full bg-black border border-primary/20"
                                />
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-bold text-white truncate">{profile?.username || "Gamer"}</p>
                                    <p className="text-[10px] text-gray-500 truncate">מחובר</p>
                                </div>
                            </div>

                            <button
                                onClick={handleSignOut}
                                disabled={isSigningOut}
                                className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-all font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isSigningOut ? (
                                    <div className="w-4 h-4 border-2 border-red-400/30 border-t-red-400 rounded-full animate-spin" />
                                ) : (
                                    <LogOut size={18} />
                                )}
                                <span>{isSigningOut ? 'מתנתק...' : 'התנתק'}</span>
                            </button>
                        </>
                    ) : (
                        <Link
                            href="/login"
                            className="flex items-center justify-center gap-2 w-full bg-primary text-black font-bold py-3 rounded-xl hover:bg-primary/90 transition-all"
                        >
                            <LogIn size={20} />
                            <span>התחברות</span>
                        </Link>
                    )}
                </div>
            </aside>

            {/* Mobile Navigation - Bottom bar + Side drawer */}
            <MobileNav
                user={user}
                profile={profile}
                isAdmin={isAdmin}
                isMounted={isMounted}
                showSkeleton={showSkeleton}
                isSigningOut={isSigningOut}
                unreadCount={unreadCount}
                onSignOut={handleSignOut}
            />
        </>
    );
}
