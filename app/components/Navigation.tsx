"use client";

import {
  Bell,
  Gamepad2,
  HeartHandshake,
  Home,
  LogIn,
  LogOut,
  MessageCircle,
  Search,
  ShieldAlert,
  User,
  Users,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useNotifications } from "@/hooks/useNotifications";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import Logo from "./Logo";
import MobileNav from "./MobileNav";
import OptimizedAvatar from "./OptimizedAvatar";

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
    }
    setShowSkeleton(false);
  }, [isLoading]);

  const handleSignOut = useCallback(async () => {
    setIsSigningOut(true);
    try {
      await signOut();
    } catch (error) {
      console.error("Sign out error:", error);
      setIsSigningOut(false);
    }
  }, [signOut]);

  // Memoize nav items to prevent recalculation on every render
  const currentNavItems = useMemo(
    () => [
      ...navItems,
      ...(user ? authenticatedNavItems : []),
      ...(isAdmin
        ? [{ icon: ShieldAlert, label: "ניהול", href: "/admin" }]
        : []),
    ],
    [user, isAdmin]
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="glass-panel fixed top-0 right-0 z-50 hidden h-screen w-64 flex-col border-white/5 border-l bg-[#050510] p-6 md:flex">
        <div className="mb-10 flex items-center gap-2 px-2">
          <div className="rounded-lg bg-primary p-2 text-black">
            <Gamepad2 size={24} />
          </div>
          <Logo />
        </div>

        <nav className="flex-1 space-y-2">
          {currentNavItems.map((item) => {
            const isActive = pathname === item.href;
            const isLiveBoard = item.href === "/lfg";
            return (
              <Link
                className={`group relative flex items-center gap-3 rounded-xl px-4 py-3 transition-all duration-300 ${
                  isActive
                    ? "bg-white/10 text-primary"
                    : "text-gray-400 hover:bg-white/5 hover:text-white"
                }`}
                href={item.href}
                key={item.href}
              >
                <div className="relative">
                  <item.icon
                    className={
                      isActive
                        ? "text-primary"
                        : "transition-colors group-hover:text-primary"
                    }
                    size={20}
                  />
                  {isLiveBoard && (
                    <span className="absolute -top-1 -right-1 h-2 w-2 animate-pulse rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)]" />
                  )}
                  {item.href === "/notifications" && unreadCount > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-blue-500 px-1 font-bold text-[10px] text-white shadow-[0_0_8px_rgba(59,130,246,0.6)]">
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                  )}
                </div>
                <span className="font-medium">{item.label}</span>
                {isActive && (
                  <div className="absolute top-1/2 left-0 h-8 w-1 -translate-y-1/2 rounded-r-full bg-primary shadow-[0_0_10px_#00ff9d]" />
                )}
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto space-y-3 border-white/5 border-t pt-6">
          {isMounted ? (
            showSkeleton ? (
              // Loading Skeleton - only shown after delay
              <div className="flex animate-pulse items-center gap-3 rounded-xl border border-white/5 bg-white/5 px-4 py-3">
                <div className="h-8 w-8 rounded-full bg-white/10" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 w-20 rounded bg-white/10" />
                  <div className="h-2 w-12 rounded bg-white/10" />
                </div>
              </div>
            ) : user && !subscription ? (
              <button
                className="flex w-full items-center gap-3 rounded-xl px-4 py-3 font-medium text-yellow-400 transition-all hover:bg-yellow-400/10 hover:text-yellow-300"
                onClick={() => subscribeToPush()}
              >
                <Bell size={20} />
                <span>הפעל התראות</span>
              </button>
            ) : null
          ) : (
            // Render placeholder during SSR to match initial client render
            <div className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 font-bold text-black opacity-50">
              <LogIn size={20} />
              <span>התחברות</span>
            </div>
          )}

          {isMounted ? (
            showSkeleton ? null : user ? (
              <>
                {/* Mini Profile Summary */}
                <div className="flex items-center gap-3 rounded-xl border border-white/5 bg-white/5 px-4 py-3">
                  <OptimizedAvatar
                    className="rounded-full border border-primary/20 bg-black"
                    seed={profile?.avatar_url || "/avatars/gamer.png"}
                    size={32}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-bold text-sm text-white">
                      {profile?.username || "Gamer"}
                    </p>
                    <p className="truncate text-[10px] text-gray-500">מחובר</p>
                  </div>
                </div>

                <button
                  className="flex w-full items-center gap-3 rounded-xl px-4 py-3 font-medium text-red-400 text-sm transition-all hover:bg-red-500/10 hover:text-red-300 disabled:cursor-not-allowed disabled:opacity-50"
                  disabled={isSigningOut}
                  onClick={handleSignOut}
                >
                  {isSigningOut ? (
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-red-400/30 border-t-red-400" />
                  ) : (
                    <LogOut size={18} />
                  )}
                  <span>{isSigningOut ? "מתנתק..." : "התנתק"}</span>
                </button>
              </>
            ) : (
              <Link
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 font-bold text-black transition-all hover:bg-primary/90"
                href="/login"
              >
                <LogIn size={20} />
                <span>התחברות</span>
              </Link>
            )
          ) : null}
        </div>
      </aside>

      {/* Mobile Navigation - Bottom bar + Side drawer */}
      <MobileNav
        isAdmin={isAdmin}
        isMounted={isMounted}
        isSigningOut={isSigningOut}
        onSignOut={handleSignOut}
        profile={profile}
        showSkeleton={showSkeleton}
        unreadCount={unreadCount}
        user={user}
      />
    </>
  );
}
