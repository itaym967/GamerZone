"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, ArrowRight, Mail } from "lucide-react";
import Link from "next/link";
import Logo from "../components/Logo";
import { toast } from "sonner";
import { createClient } from "@/utils/supabase/client";

export default function ForgotPasswordPage() {
    const [isLoading, setIsLoading] = useState(false);
    const [email, setEmail] = useState("");
    const [isSent, setIsSent] = useState(false);
    const supabase = createClient();

    const handleReset = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const { error } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: `${window.location.origin}/auth/callback?next=/update-password`,
            });

            if (error) throw error;

            setIsSent(true);
            toast.success("המייל נשלח בהצלחה!");
        } catch (error: any) {
            toast.error("שגיאה בשליחת המייל", {
                description: error.message
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-[#050510]">
            {/* Animated Background */}
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none"></div>
            <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] bg-primary/20 rounded-full blur-[120px] animate-pulse" />
            <div className="absolute bottom-[-20%] left-[-10%] w-[600px] h-[600px] bg-secondary/20 rounded-full blur-[120px] animate-pulse delay-75" />

            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
                className="glass-panel w-full max-w-md p-8 rounded-3xl border border-white/10 relative z-10"
            >
                <div className="text-center mb-8">
                    <div className="flex justify-center mb-6">
                        <Logo size="lg" className="justify-center" />
                    </div>
                    <h1 className="text-2xl font-bold text-white mb-2">איפוס סיסמה</h1>
                    <p className="text-gray-400">
                        {isSent
                            ? "הוראות לאיפוס הסיסמה נשלחו למייל שלך."
                            : "הכנס את המייל שלך ונשלח לך קישור לאיפוס הסיסמה."
                        }
                    </p>
                </div>

                {!isSent ? (
                    <form onSubmit={handleReset} className="space-y-6">
                        <div className="space-y-1 text-right">
                            <label className="text-sm font-medium text-gray-400">אימייל</label>
                            <div className="relative">
                                <input
                                    type="email"
                                    placeholder="gamer@example.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 pl-10 text-white outline-none focus:border-primary/50 transition-colors placeholder:text-gray-600 text-right"
                                    required
                                />
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full bg-white text-black font-bold py-3 rounded-xl hover:bg-gray-200 transition-all flex items-center justify-center gap-2"
                        >
                            {isLoading ? (
                                <span className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                            ) : (
                                <>
                                    <span>שלח קישור לאיפוס</span>
                                    <ArrowRight size={18} className="rotate-180" />
                                </>
                            )}
                        </button>
                    </form>
                ) : (
                    <div className="space-y-6">
                        <div className="bg-white/5 border border-white/10 rounded-xl p-6 text-center">
                            <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center text-green-500 mx-auto mb-4">
                                <Mail size={24} />
                            </div>
                            <p className="text-sm text-gray-300">
                                בדוק את תיבת המייל שלך (וגם את הספאם). שם מחכה לך הקישור לאיפוס הסיסמה.
                            </p>
                        </div>
                    </div>
                )}

                <div className="mt-8 text-center">
                    <Link href="/login" className="text-gray-400 hover:text-white transition-colors text-sm flex items-center justify-center gap-2">
                        <ArrowLeft size={16} className="rotate-180" />
                        <span>חזרה להתחברות</span>
                    </Link>
                </div>
            </motion.div>
        </div>
    );
}
