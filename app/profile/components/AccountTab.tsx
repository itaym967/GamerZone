"use client";

import { useState } from "react";
import { Settings, Mail, Key, AlertTriangle, LogOut } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";

interface AccountTabProps {
    userEmail: string | null;
}

export default function AccountTab({ userEmail }: AccountTabProps) {
    const { signOut } = useAuth();
    const [isSigningOut, setIsSigningOut] = useState(false);

    const handleSignOut = async () => {
        setIsSigningOut(true);
        try {
            await signOut();
        } catch (error) {
            console.error('Sign out error:', error);
            setIsSigningOut(false);
        }
    };

    return (
        <div className="glass-panel p-6 rounded-2xl border border-white/5 space-y-6">
            <div className="flex items-center gap-2 mb-4">
                <div className="bg-white/10 p-2 rounded-lg text-gray-400">
                    <Settings size={24} />
                </div>
                <h2 className="text-xl font-bold text-white">הגדרות חשבון</h2>
            </div>

            {/* Email */}
            <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                <div className="flex items-center gap-3">
                    <Mail size={18} className="text-gray-400" />
                    <div className="flex-1">
                        <p className="text-xs text-gray-500 mb-0.5">כתובת אימייל</p>
                        <p className="text-sm text-white font-mono" dir="ltr">{userEmail || 'לא זמין'}</p>
                    </div>
                </div>
            </div>

            {/* Password */}
            <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                <div className="flex items-center gap-3">
                    <Key size={18} className="text-gray-400" />
                    <div className="flex-1">
                        <p className="text-xs text-gray-500 mb-0.5">סיסמה</p>
                        <p className="text-sm text-gray-400">••••••••</p>
                    </div>
                    <Link
                        href="/update-password"
                        className="text-xs text-primary hover:text-primary/80 transition-colors font-medium"
                    >
                        שנה סיסמה
                    </Link>
                </div>
            </div>

            {/* Sign Out */}
            <button
                onClick={handleSignOut}
                disabled={isSigningOut}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-white/10 text-gray-400 hover:text-white hover:bg-white/5 transition-all disabled:opacity-50"
            >
                {isSigningOut ? (
                    <div className="w-4 h-4 border-2 border-gray-400/30 border-t-gray-400 rounded-full animate-spin" />
                ) : (
                    <LogOut size={18} />
                )}
                <span>{isSigningOut ? 'מתנתק...' : 'התנתק'}</span>
            </button>

            {/* Danger Zone */}
            <div className="border-t border-red-500/20 pt-4">
                <div className="flex items-center gap-2 mb-3">
                    <AlertTriangle size={16} className="text-red-400" />
                    <h3 className="text-sm font-bold text-red-400">אזור מסוכן</h3>
                </div>
                <p className="text-xs text-gray-500 mb-3">
                    פעולות אלו הן בלתי הפיכות. אנא היזהר.
                </p>
                <button
                    disabled
                    className="w-full py-2.5 rounded-xl border border-red-500/20 text-red-400/50 text-sm cursor-not-allowed"
                    title="פיצ'ר זה יהיה זמין בקרוב"
                >
                    מחק חשבון (בקרוב)
                </button>
            </div>
        </div>
    );
}
