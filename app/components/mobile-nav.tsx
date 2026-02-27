"use client";

import {
  Cancel01Icon,
  GameController02Icon,
  HeartCheckIcon,
  Home01Icon,
  Login01Icon,
  Logout01Icon,
  Menu01Icon,
  MessageCircle,
  Notification01Icon,
  Search01Icon,
  Shield01Icon,
  UserGroupIcon,
  UserIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import OptimizedAvatar from "./optimized-avatar";

interface MobileNavProps {
  isAdmin: boolean;
  isMounted: boolean;
  isSigningOut: boolean;
  onSignOut: () => void;
  profile: { avatar_url?: string | null; username?: string | null } | null;
  showSkeleton: boolean;
  unreadCount: number;
  user: { id: string } | null;
}

const bottomNavItems = [
  { icon: Home01Icon, label: "בית", href: "/" },
  { icon: Search01Icon, label: "גלה", href: "/explore" },
  { icon: GameController02Icon, label: "לוח חי", href: "/lfg", isLive: true },
];

const drawerNavItems = [
  { icon: UserGroupIcon, label: "מוצא קבוצות", href: "/party-finder" },
  { icon: HeartCheckIcon, label: "חברים", href: "/friends", authOnly: true },
  {
    icon: Notification01Icon,
    label: "התראות",
    href: "/notifications",
    authOnly: true,
    showBadge: true,
  },
  { icon: MessageCircle, label: "צ'אט", href: "/chat", authOnly: true },
  { icon: UserIcon, label: "פרופיל", href: "/profile", authOnly: true },
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

  const renderDrawerHeaderContent = () => {
    if (!isMounted || showSkeleton) {
      return (
        <div className="flex animate-pulse items-center gap-3">
          <div className="h-12 w-12 rounded-full bg-white/10" />
          <div className="flex-1 space-y-2">
            <div className="h-4 w-24 rounded-xs bg-white/10" />
            <div className="h-3 w-16 rounded-xs bg-white/10" />
          </div>
        </div>
      );
    }

    if (user) {
      return (
        <div className="flex items-center gap-3">
          <OptimizedAvatar
            className="rounded-full border-2 border-primary/30 bg-black"
            seed={profile?.avatar_url || "/avatars/gamer.png"}
            size={48}
          />
          <div className="min-w-0 flex-1">
            <p className="truncate font-bold text-fluid-base text-white">
              {profile?.username || "Gamer"}
            </p>
            <p className="flex items-center gap-1 text-fluid-xs text-primary">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary" />
              מחובר
            </p>
          </div>
        </div>
      );
    }

    return (
      <Link
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 font-bold text-black transition-all hover:bg-primary/90"
        href="/login"
        onClick={() => setDrawerOpen(false)}
      >
        <HugeiconsIcon icon={Login01Icon} size={20} />
        <span>התחברות</span>
      </Link>
    );
  };

  return (
    <>
      {/* Bottom Nav Bar - 4 items max */}
      <nav className="safe-area-pb mobile-bottom-nav fixed right-0 bottom-0 left-0 z-50 border-white/10 border-t bg-primary-foreground/95 backdrop-blur-xl transition-transform duration-200 md:hidden">
        <div className="flex items-center justify-around px-2 py-2">
          {bottomNavItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                className={`flex min-w-14 flex-col items-center gap-0.5 py-1 transition-colors ${isActive ? "text-primary" : "text-gray-500"}`}
                href={item.href}
                key={item.href}
              >
                <div
                  className={`relative rounded-xl p-2 transition-all ${isActive ? "bg-primary/15" : ""}`}
                >
                  <HugeiconsIcon icon={item.icon} size={22} />
                  {item.isLive && (
                    <span className="absolute top-1 right-1 h-2 w-2 animate-pulse rounded-full bg-red-500 shadow-[0_0_0.5rem_rgba(239,68,68,0.8)]" />
                  )}
                </div>
                <span className="font-medium text-[0.625rem] leading-tight">
                  {item.label}
                </span>
              </Link>
            );
          })}

          {/* Menu / Hamburger Button */}
          <button
            className={`relative flex min-w-14 flex-col items-center gap-0.5 py-1 transition-colors ${drawerOpen || isDrawerItemActive ? "text-primary" : "text-gray-500"}`}
            onClick={toggleDrawer}
            type="button"
          >
            <div
              className={`rounded-xl p-2 transition-all ${drawerOpen || isDrawerItemActive ? "bg-primary/15" : ""}`}
            >
              {drawerOpen ? (
                <HugeiconsIcon icon={Cancel01Icon} size={22} />
              ) : (
                <HugeiconsIcon icon={Menu01Icon} size={22} />
              )}
              {/* Show notification dot if there are unread notifications */}
              {!drawerOpen && unreadCount > 0 && (
                <span className="absolute top-0.5 right-2.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-blue-500 px-0.5 font-bold text-[0.5625rem] text-white shadow-[0_0_0.5rem_rgba(59,130,246,0.6)]">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </div>
            <span className="font-medium text-[0.625rem] leading-tight">
              תפריט
            </span>
          </button>
        </div>
      </nav>

      {/* Overlay */}
      {drawerOpen && (
        <button
          aria-label="Close menu drawer"
          className="fixed inset-0 z-45 bg-black/60 backdrop-blur-xs transition-opacity md:hidden"
          onClick={() => setDrawerOpen(false)}
          type="button"
        />
      )}

      {/* Side Drawer - slides from right (RTL) */}
      <div
        className={`fixed top-0 right-0 z-46 flex w-72 transform flex-col border-white/10 border-l bg-[#0a0a1e] transition-transform duration-300 ease-out md:hidden ${drawerOpen ? "translate-x-0" : "translate-x-full"}`}
        style={{ height: "calc(100dvh - 4.5rem)" }}
      >
        {/* Drawer Header */}
        <div className="border-white/5 border-b p-5 pt-12">
          {renderDrawerHeaderContent()}
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
                  <HugeiconsIcon icon={item.icon} size={20} />
                  {item.showBadge && unreadCount > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 flex h-4.5 min-w-4.5 items-center justify-center rounded-full bg-blue-500 px-1 font-bold text-[0.625rem] text-white shadow-[0_0_0.5rem_rgba(59,130,246,0.6)]">
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                  )}
                </div>
                <span className="font-medium text-fluid-sm">{item.label}</span>
                {isActive && (
                  <div className="mr-auto h-1.5 w-1.5 rounded-full bg-primary shadow-[0_0_0.375rem_#00ff9d]" />
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
              <HugeiconsIcon icon={Shield01Icon} size={20} />
              <span className="font-medium text-fluid-sm">ניהול</span>
            </Link>
          )}
        </nav>

        {/* Drawer Footer */}
        {isMounted && !showSkeleton && user && (
          <div className="border-white/5 border-t p-4">
            <button
              className="flex w-full items-center gap-3 rounded-xl px-4 py-3 font-medium text-fluid-sm text-red-400 transition-all hover:bg-red-500/10 hover:text-red-300 disabled:cursor-not-allowed disabled:opacity-50"
              disabled={isSigningOut}
              onClick={() => {
                onSignOut();
                setDrawerOpen(false);
              }}
              type="button"
            >
              {isSigningOut ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-red-400/30 border-t-red-400" />
              ) : (
                <HugeiconsIcon icon={Logout01Icon} size={18} />
              )}
              <span>{isSigningOut ? "מתנתק..." : "התנתק"}</span>
            </button>
          </div>
        )}
      </div>
    </>
  );
}
