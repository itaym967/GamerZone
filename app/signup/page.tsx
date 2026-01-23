"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Logo from "../components/Logo";
import { toast } from "sonner";
import { createClient } from "@/utils/supabase/client";

export default function SignupPage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const supabase = createClient();

    const [form, setForm] = useState({
        email: "",
        username: "",
        password: ""
    });

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const { error } = await supabase.auth.signUp({
                email: form.email,
                password: form.password,
                options: {
                    data: {
                        username: form.username,
                        full_name: form.username, // Default to username as name for now
                        avatar_url: `https://api.dicebear.com/7.x/avataaars/svg?seed=${form.username}`
                    }
                }
            });

            if (error) throw error;

            toast.success("הרשמה בוצעה בהצלחה! בדוק את המייל לאימות.");
            router.push("/login");

        } catch (error: any) {
            console.error(error); // Debugging

            // Check for Rate Limit (429)
            if (error?.status === 429 || error?.toString().toLowerCase().includes("rate limit") || error?.message?.toLowerCase().includes("too many requests")) {
                toast.error("יותר מדי ניסיונות", {
                    description: "אנא המתן דקה לפני ניסיון נוסף. (Supabase Rate Limit)"
                });
            } else {
                toast.error("שגיאה בהרשמה", {
                    description: error.message || "אירעה שגיאה בלתי צפויה"
                });
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-[#050510]">
            {/* Animated Background */}
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none"></div>
            <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-primary/20 rounded-full blur-[120px] animate-pulse" />
            <div className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] bg-secondary/20 rounded-full blur-[120px] animate-pulse delay-75" />

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
                    <p className="text-gray-400">הצטרף לקהילת הגיימינג הכי חזקה בישראל</p>
                </div>

                <form onSubmit={handleSignup} className="space-y-4">
                    <div className="space-y-3">
                        <div className="space-y-1 text-right">
                            <label className="text-sm font-medium text-gray-400">שם משתמש</label>
                            <input
                                type="text"
                                placeholder="Gamer123"
                                value={form.username}
                                onChange={(e) => setForm({ ...form, username: e.target.value })}
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-primary/50 transition-colors placeholder:text-gray-600 text-right"
                                required
                                minLength={3}
                            />
                        </div>
                        <div className="space-y-1 text-right">
                            <label className="text-sm font-medium text-gray-400">אימייל</label>
                            <input
                                type="email"
                                placeholder="gamer@example.com"
                                value={form.email}
                                onChange={(e) => setForm({ ...form, email: e.target.value })}
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-primary/50 transition-colors placeholder:text-gray-600 text-right"
                                required
                            />
                        </div>
                        <div className="space-y-1 text-right">
                            <label className="text-sm font-medium text-gray-400">סיסמה</label>
                            <input
                                type="password"
                                placeholder="••••••••"
                                value={form.password}
                                onChange={(e) => setForm({ ...form, password: e.target.value })}
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-primary/50 transition-colors placeholder:text-gray-600 text-right"
                                required
                                minLength={6}
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full bg-white text-black font-bold py-3 rounded-xl hover:bg-gray-200 transition-all flex items-center justify-center gap-2 mt-2"
                    >
                        {isLoading ? (
                            <span className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                        ) : (
                            <>
                                <span>הירשם</span>
                                <ArrowRight size={18} className="rotate-180" />
                            </>
                        )}
                    </button>
                </form>

                <p className="mt-8 text-center text-sm text-gray-400">
                    כבר יש לך משתמש? {' '}
                    <Link href="/login" className="text-primary font-bold hover:underline">
                        התחבר
                    </Link>
                </p>
            </motion.div>
        </div>
    );
}
