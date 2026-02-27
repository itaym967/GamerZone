"use client";

import {
  Bell,
  Gamepad2,
  HeartHandshake,
  Home,
  LogIn,
  LogOut,
  Menu,
  MessageCircle,
  Search,
  ShieldAlert,
  User,
  Users,
  X,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import OptimizedAvatar from "./OptimizedAvatar";

interface MobileNavProps {
  isAdmin: boolean;
  isMounted: boolean;
  isSigningOut: boolean;
  onSignOut: () => void;
  profile: any;
  showSkeleton: boolean;
  unreadCount: number;
  user: any;
}

const bottomNavItems = [
  { icon: Home, label: "בית", href: "/" },
  { icon: Search, label: "גלה", href: "/explore" },
  { icon: Gamepad2, label: "לוח חי", href: "/lfg", isLive: true },
];

const drawerNavItems = [
  { icon: Users, label: "מוצא קבוצות", href: "/party-finder" },
  { icon: HeartHandshake, label: "חברים", href: "/friends", authOnly: true },
  {
    icon: Bell,
    label: "התראות",
    href: "/notifications",
    authOnly: true,
    showBadge: true,
  },
  { icon: MessageCircle, label: "צ'אט", href: "/chat", authOnly: true },
  { icon: User, label: "פרופיל", href: "/profile", authOnly: true },
];

export default function MobileNav({
  user,
  profile,
  isAdmin,
  isMounted,
  showSkeleton,
  isSigningOut,
  unreadCount,
  onSignOut,
}: MobileNavProps) {
  const pathname = usePathname();
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Close drawer on route change
  useEffect(() => {
    setDrawerOpen(false);
  }, []);

  // Prevent body scroll when drawer is open
  useEffect(() => {
    if (drawerOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [drawerOpen]);

  const toggleDrawer = useCallback(() => {
    setDrawerOpen((prev) => !prev);
  }, []);

  const visibleDrawerItems = drawerNavItems.filter(
    (item) => !item.authOnly || user
  );

  const isDrawerItemActive =
    visibleDrawerItems.some((item) => pathname === item.href) ||
    (isAdmin && pathname === "/admin");

  return (
    <>
      {/* Bottom Nav Bar - 4 items max */}
      <nav className="safe-area-pb mobile-bottom-nav fixed right-0 bottom-0 left-0 z-50 border-white/10 border-t bg-[#050510]/95 backdrop-blur-xl transition-transform duration-200 md:hidden">
        <div className="flex items-center justify-around px-2 py-2">
          {bottomNavItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                className={`flex min-w-[56px] flex-col items-center gap-0.5 py-1 transition-colors ${isActive ? "text-primary" : "text-gray-500"}`}
                href={item.href}
                key={item.href}
              >
                <div
                  className={`relative rounded-xl p-2 transition-all ${isActive ? "bg-primary/15" : ""}`}
                >
                  <item.icon size={22} />
                  {item.isLive && (
                    <span className="absolute top-1 right-1 h-2 w-2 animate-pulse rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)]" />
                  )}
                </div>
                <span className="font-medium text-[10px] leading-tight">
                  {item.label}
                </span>
              </Link>
            );
          })}

          {/* Menu / Hamburger Button */}
          <button
            className={`relative flex min-w-[56px] flex-col items-center gap-0.5 py-1 transition-colors ${drawerOpen || isDrawerItemActive ? "text-primary" : "text-gray-500"}`}
            onClick={toggleDrawer}
          >
            <div
              className={`rounded-xl p-2 transition-all ${drawerOpen || isDrawerItemActive ? "bg-primary/15" : ""}`}
            >
              {drawerOpen ? <X size={22} /> : <Menu size={22} />}
              {/* Show notification dot if there are unread notifications */}
              {!drawerOpen && unreadCount > 0 && (
                <span className="absolute top-0.5 right-2.5 flex h-[16px] min-w-[16px] items-center justify-center rounded-full bg-blue-500 px-0.5 font-bold text-[9px] text-white shadow-[0_0_8px_rgba(59,130,246,0.6)]">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </div>
            <span className="font-medium text-[10px] leading-tight">תפריט</span>
          </button>
        </div>
      </nav>

      {/* Overlay */}
      {drawerOpen && (
        <div
          className="fixed inset-0 z-[45] bg-black/60 backdrop-blur-sm transition-opacity md:hidden"
          onClick={() => setDrawerOpen(false)}
        />
      )}

      {/* Side Drawer - slides from right (RTL) */}
      <div
        className={`fixed top-0 right-0 z-[46] flex w-72 transform flex-col border-white/10 border-l bg-[#0a0a1e] transition-transform duration-300 ease-out md:hidden ${drawerOpen ? "translate-x-0" : "translate-x-full"}`}
        style={{ height: "calc(100dvh - 72px)" }}
      >
        {/* Drawer Header */}
        <div className="border-white/5 border-b p-5 pt-12">
          {!isMounted || showSkeleton ? (
            <div className="flex animate-pulse items-center gap-3">
              <div className="h-12 w-12 rounded-full bg-white/10" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-24 rounded bg-white/10" />
                <div className="h-3 w-16 rounded bg-white/10" />
              </div>
            </div>
          ) : user ? (
            <div className="flex items-center gap-3">
              <OptimizedAvatar
                className="rounded-full border-2 border-primary/30 bg-black"
                seed={profile?.avatar_url || "/avatars/gamer.png"}
                size={48}
              />
              <div className="min-w-0 flex-1">
                <p className="truncate font-bold text-base text-white">
                  {profile?.username || "Gamer"}
                </p>
                <p className="flex items-center gap-1 text-primary text-xs">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary" />
                  מחובר
                </p>
              </div>
            </div>
          ) : (
            <Link
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 font-bold text-black transition-all hover:bg-primary/90"
              href="/login"
              onClick={() => setDrawerOpen(false)}
            >
              <LogIn size={20} />
              <span>התחברות</span>
            </Link>
          )}
        </div>

        {/* Drawer Nav Items */}
        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-3">
          {visibleDrawerItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                className={`flex items-center gap-3 rounded-xl px-4 py-3 transition-all ${isActive ? "bg-primary/15 text-primary" : "text-gray-400 hover:bg-white/5 hover:text-white"}`}
                href={item.href}
                key={item.href}
                onClick={() => setDrawerOpen(false)}
              >
                <div className="relative">
                  <item.icon size={20} />
                  {item.showBadge && unreadCount > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-blue-500 px-1 font-bold text-[10px] text-white shadow-[0_0_8px_rgba(59,130,246,0.6)]">
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                  )}
                </div>
                <span className="font-medium text-sm">{item.label}</span>
                {isActive && (
                  <div className="mr-auto h-1.5 w-1.5 rounded-full bg-primary shadow-[0_0_6px_#00ff9d]" />
                )}
              </Link>
            );
          })}

          {/* Admin link */}
          {isAdmin && (
            <Link
              className={`flex items-center gap-3 rounded-xl px-4 py-3 transition-all ${pathname === "/admin" ? "bg-primary/15 text-primary" : "text-gray-400 hover:bg-white/5 hover:text-white"}`}
              href="/admin"
              onClick={() => setDrawerOpen(false)}
            >
              <ShieldAlert size={20} />
              <span className="font-medium text-sm">ניהול</span>
            </Link>
          )}
        </nav>

        {/* Drawer Footer */}
        {isMounted && !showSkeleton && user && (
          <div className="border-white/5 border-t p-4">
            <button
              className="flex w-full items-center gap-3 rounded-xl px-4 py-3 font-medium text-red-400 text-sm transition-all hover:bg-red-500/10 hover:text-red-300 disabled:cursor-not-allowed disabled:opacity-50"
              disabled={isSigningOut}
              onClick={() => {
                onSignOut();
                setDrawerOpen(false);
              }}
            >
              {isSigningOut ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-red-400/30 border-t-red-400" />
              ) : (
                <LogOut size={18} />
              )}
              <span>{isSigningOut ? "מתנתק..." : "התנתק"}</span>
            </button>
          </div>
        )}
      </div>
    </>
  );
}
