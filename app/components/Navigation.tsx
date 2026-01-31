"use client";

import { Home, Search, MessageCircle, User, Gamepad2, ShieldAlert, LogOut, Bell, LogIn, Users } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import Logo from "./Logo";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import OptimizedAvatar from "./OptimizedAvatar";
import { useAuth } from "@/context/AuthContext";

const navItems = [
    { icon: Home, label: "בית", href: "/" },
    { icon: Search, label: "גלה שחקנים", href: "/explore" },
    { icon: Users, label: "לוח חי", href: "/lfg" },
];

const authenticatedNavItems = [
    { icon: MessageCircle, label: "צ'אט", href: "/chat" },
    { icon: User, label: "פרופיל", href: "/profile" },
];

export default function Navigation() {
    const pathname = usePathname();
    const router = useRouter();
    const { user, profile, isAdmin, signOut, isLoading } = useAuth();
    const { subscribeToPush, subscription } = usePushNotifications();

    const handleSignOut = async () => {
        await signOut();
    };

    // Combine nav items based on auth state
    const currentNavItems = [
        ...navItems,
        ...(user ? authenticatedNavItems : []),
        ...(isAdmin ? [{ icon: ShieldAlert, label: "ניהול", href: "/admin" }] : [])
    ];

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

                <nav className="flex-1 space-y-2" suppressHydrationWarning>
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
                                </div>
                                <span className="font-medium">{item.label}</span>
                                {isActive && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 rounded-r-full bg-primary shadow-[0_0_10px_#00ff9d]" />}
                            </Link>
                        );
                    })}
                </nav>

                <div className="mt-auto pt-6 border-t border-white/5 space-y-3" suppressHydrationWarning>
                    {isLoading ? (
                        // Loading Skeleton
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

                    {isLoading ? null : user ? (
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
                                className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-all font-medium text-sm"
                            >
                                <LogOut size={18} />
                                <span>התנתק</span>
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

            {/* Mobile Bottom Nav */}
            <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-[#050510]/95 backdrop-blur-xl border-t border-white/10 z-50 safe-area-pb">
                <div className="flex justify-around items-center p-3" suppressHydrationWarning>
                    {currentNavItems.map((item) => {
                        const isActive = pathname === item.href;
                        const isLiveBoard = item.href === '/lfg';
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`flex flex-col items-center gap-1 transition-colors ${isActive ? "text-primary" : "text-gray-500"
                                    }`}
                            >
                                <div className={`p-1.5 rounded-full transition-all relative ${isActive ? "bg-primary/20" : ""}`}>
                                    <item.icon size={24} />
                                    {isLiveBoard && (
                                        <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.8)]" />
                                    )}
                                </div>
                                <span className="text-[10px] font-medium">{item.label}</span>
                            </Link>
                        );
                    })}

                    {!user && (
                        <Link
                            href="/login"
                            className="flex flex-col items-center gap-1 text-gray-500 hover:text-primary transition-colors"
                        >
                            <div className="p-1.5 rounded-full">
                                <LogIn size={24} />
                            </div>
                            <span className="text-[10px] font-medium">התחבר</span>
                        </Link>
                    )}
                </div>
            </nav>
        </>
    );
}
