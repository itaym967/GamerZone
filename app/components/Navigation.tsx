"use client";

import { Home, Search, MessageCircle, User, Settings, Gamepad2, ShieldAlert } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Logo from "./Logo";
import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";

const navItems = [
    { icon: Home, label: "לוח בקרה", href: "/" },
    { icon: Search, label: "גלה שחקנים", href: "/explore" },
    { icon: MessageCircle, label: "צ'אט", href: "/chat" },
    { icon: User, label: "פרופיל", href: "/profile" },
    { icon: ShieldAlert, label: "ניהול", href: "/admin" },
];

export default function Navigation() {
    const pathname = usePathname();
    const [isAdmin, setIsAdmin] = useState(false);

    useEffect(() => {
        const checkAdmin = async () => {
            const supabase = createClient();
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('role')
                    .eq('id', user.id)
                    .single();

                if (profile?.role === 'admin') {
                    setIsAdmin(true);
                }
            }
        };
        checkAdmin();
    }, []);

    // Filter nav items based on role
    const filteredNavItems = navItems.filter(item => {
        if (item.href === '/admin') return isAdmin;
        return true;
    });

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
                    {filteredNavItems.map((item) => {
                        const isActive = pathname === item.href;
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 group relative ${isActive ? "bg-white/10 text-primary" : "text-gray-400 hover:text-white hover:bg-white/5"
                                    }`}
                            >
                                <item.icon size={20} className={isActive ? "text-primary" : "group-hover:text-primary transition-colors"} />
                                <span className="font-medium">{item.label}</span>
                                {isActive && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 rounded-r-full bg-primary shadow-[0_0_10px_#00ff9d]" />}
                            </Link>
                        );
                    })}
                </nav>

                <div className="mt-auto pt-6 border-t border-white/5">
                    <button className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-gray-400 hover:text-white hover:bg-white/5 transition-all">
                        <Settings size={20} />
                        <span className="font-medium">הגדרות</span>
                    </button>
                </div>
            </aside>

            {/* Mobile Bottom Nav */}
            <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-[#050510]/95 backdrop-blur-xl border-t border-white/10 z-50 safe-area-bottom pb- safe-area-pb">
                <div className="flex justify-around items-center p-4">
                    {filteredNavItems.map((item) => {
                        const isActive = pathname === item.href;
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`flex flex-col items-center gap-1 transition-colors ${isActive ? "text-primary" : "text-gray-500"
                                    }`}
                            >
                                <div className={`p-1.5 rounded-full transition-all ${isActive ? "bg-primary/20" : ""}`}>
                                    <item.icon size={24} />
                                </div>
                                <span className="text-[10px] font-medium">{item.label}</span>
                            </Link>
                        );
                    })}
                </div>
            </nav>
        </>
    );
}
