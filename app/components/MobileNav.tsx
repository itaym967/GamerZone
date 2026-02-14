"use client";

import { useState, useCallback, useEffect } from "react";
import { Home, Search, Gamepad2, Menu, X, Users, HeartHandshake, Bell, MessageCircle, User, ShieldAlert, LogOut, LogIn } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import OptimizedAvatar from "./OptimizedAvatar";

interface MobileNavProps {
    user: any;
    profile: any;
    isAdmin: boolean;
    isMounted: boolean;
    showSkeleton: boolean;
    isSigningOut: boolean;
    unreadCount: number;
    onSignOut: () => void;
}

const bottomNavItems = [
    { icon: Home, label: "בית", href: "/" },
    { icon: Search, label: "גלה", href: "/explore" },
    { icon: Gamepad2, label: "לוח חי", href: "/lfg", isLive: true },
];

const drawerNavItems = [
    { icon: Users, label: "מוצא קבוצות", href: "/party-finder" },
    { icon: HeartHandshake, label: "חברים", href: "/friends", authOnly: true },
    { icon: Bell, label: "התראות", href: "/notifications", authOnly: true, showBadge: true },
    { icon: MessageCircle, label: "צ'אט", href: "/chat", authOnly: true },
    { icon: User, label: "פרופיל", href: "/profile", authOnly: true },
];

export default function MobileNav({
    user, profile, isAdmin, isMounted, showSkeleton,
    isSigningOut, unreadCount, onSignOut,
}: MobileNavProps) {
    const pathname = usePathname();
    const [drawerOpen, setDrawerOpen] = useState(false);

    // Close drawer on route change
    useEffect(() => {
        setDrawerOpen(false);
    }, [pathname]);

    // Prevent body scroll when drawer is open
    useEffect(() => {
        if (drawerOpen) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "";
        }
        return () => { document.body.style.overflow = ""; };
    }, [drawerOpen]);

    const toggleDrawer = useCallback(() => {
        setDrawerOpen(prev => !prev);
    }, []);

    const visibleDrawerItems = drawerNavItems.filter(
        item => !item.authOnly || user
    );

    const isDrawerItemActive = visibleDrawerItems.some(item => pathname === item.href)
        || (isAdmin && pathname === "/admin");

    return (
        <>
            {/* Bottom Nav Bar - 4 items max */}
            <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-[#050510]/95 backdrop-blur-xl border-t border-white/10 z-50 safe-area-pb mobile-bottom-nav transition-transform duration-200">
                <div className="flex justify-around items-center px-2 py-2">
                    {bottomNavItems.map((item) => {
                        const isActive = pathname === item.href;
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`flex flex-col items-center gap-0.5 min-w-[56px] py-1 transition-colors ${isActive ? "text-primary" : "text-gray-500"}`}
                            >
                                <div className={`p-2 rounded-xl transition-all relative ${isActive ? "bg-primary/15" : ""}`}>
                                    <item.icon size={22} />
                                    {item.isLive && (
                                        <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.8)]" />
                                    )}
                                </div>
                                <span className="text-[10px] font-medium leading-tight">{item.label}</span>
                            </Link>
                        );
                    })}

                    {/* Menu / Hamburger Button */}
                    <button
                        onClick={toggleDrawer}
                        className={`flex flex-col items-center gap-0.5 min-w-[56px] py-1 transition-colors relative ${drawerOpen || isDrawerItemActive ? "text-primary" : "text-gray-500"}`}
                    >
                        <div className={`p-2 rounded-xl transition-all ${drawerOpen || isDrawerItemActive ? "bg-primary/15" : ""}`}>
                            {drawerOpen ? <X size={22} /> : <Menu size={22} />}
                            {/* Show notification dot if there are unread notifications */}
                            {!drawerOpen && unreadCount > 0 && (
                                <span className="absolute top-0.5 right-2.5 min-w-[16px] h-[16px] bg-blue-500 rounded-full text-[9px] font-bold text-white flex items-center justify-center px-0.5 shadow-[0_0_8px_rgba(59,130,246,0.6)]">
                                    {unreadCount > 9 ? '9+' : unreadCount}
                                </span>
                            )}
                        </div>
                        <span className="text-[10px] font-medium leading-tight">תפריט</span>
                    </button>
                </div>
            </nav>

            {/* Overlay */}
            {drawerOpen && (
                <div
                    className="md:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-[45] transition-opacity"
                    onClick={() => setDrawerOpen(false)}
                />
            )}

            {/* Side Drawer - slides from right (RTL) */}
            <div
                style={{ height: 'calc(100dvh - 72px)' }}
                className={`md:hidden fixed top-0 right-0 w-72 bg-[#0a0a1e] border-l border-white/10 z-[46] transform transition-transform duration-300 ease-out flex flex-col ${drawerOpen ? "translate-x-0" : "translate-x-full"}`}
            >
                {/* Drawer Header */}
                <div className="p-5 pt-12 border-b border-white/5">
                    {!isMounted || showSkeleton ? (
                        <div className="flex items-center gap-3 animate-pulse">
                            <div className="w-12 h-12 rounded-full bg-white/10" />
                            <div className="flex-1 space-y-2">
                                <div className="h-4 w-24 bg-white/10 rounded" />
                                <div className="h-3 w-16 bg-white/10 rounded" />
                            </div>
                        </div>
                    ) : user ? (
                        <div className="flex items-center gap-3">
                            <OptimizedAvatar
                                seed={profile?.avatar_url || "/avatars/gamer.png"}
                                size={48}
                                className="rounded-full bg-black border-2 border-primary/30"
                            />
                            <div className="flex-1 min-w-0">
                                <p className="text-base font-bold text-white truncate">{profile?.username || "Gamer"}</p>
                                <p className="text-xs text-primary flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                                    מחובר
                                </p>
                            </div>
                        </div>
                    ) : (
                        <Link
                            href="/login"
                            onClick={() => setDrawerOpen(false)}
                            className="flex items-center justify-center gap-2 w-full bg-primary text-black font-bold py-3 rounded-xl hover:bg-primary/90 transition-all"
                        >
                            <LogIn size={20} />
                            <span>התחברות</span>
                        </Link>
                    )}
                </div>

                {/* Drawer Nav Items */}
                <nav className="flex-1 overflow-y-auto py-3 px-3 space-y-1">
                    {visibleDrawerItems.map((item) => {
                        const isActive = pathname === item.href;
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                onClick={() => setDrawerOpen(false)}
                                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${isActive ? "bg-primary/15 text-primary" : "text-gray-400 hover:text-white hover:bg-white/5"}`}
                            >
                                <div className="relative">
                                    <item.icon size={20} />
                                    {item.showBadge && unreadCount > 0 && (
                                        <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] bg-blue-500 rounded-full text-[10px] font-bold text-white flex items-center justify-center px-1 shadow-[0_0_8px_rgba(59,130,246,0.6)]">
                                            {unreadCount > 9 ? '9+' : unreadCount}
                                        </span>
                                    )}
                                </div>
                                <span className="font-medium text-sm">{item.label}</span>
                                {isActive && (
                                    <div className="mr-auto w-1.5 h-1.5 rounded-full bg-primary shadow-[0_0_6px_#00ff9d]" />
                                )}
                            </Link>
                        );
                    })}

                    {/* Admin link */}
                    {isAdmin && (
                        <Link
                            href="/admin"
                            onClick={() => setDrawerOpen(false)}
                            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${pathname === "/admin" ? "bg-primary/15 text-primary" : "text-gray-400 hover:text-white hover:bg-white/5"}`}
                        >
                            <ShieldAlert size={20} />
                            <span className="font-medium text-sm">ניהול</span>
                        </Link>
                    )}
                </nav>

                {/* Drawer Footer */}
                {isMounted && !showSkeleton && user && (
                    <div className="p-4 border-t border-white/5">
                        <button
                            onClick={() => { onSignOut(); setDrawerOpen(false); }}
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
                    </div>
                )}
            </div>
        </>
    );
}
