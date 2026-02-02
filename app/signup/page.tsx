"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Eye, EyeOff } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Logo from "../components/Logo";
import { toast } from "sonner";
import { createClient } from "@/utils/supabase/client";
import { clearAuthCookies } from "@/utils/supabase/auth-helpers";

export default function SignupPage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const supabase = createClient();

    const [form, setForm] = useState({
        email: "",
        username: "",
        password: ""
    });

    // Clear any stale auth cookies on mount to prevent refresh token errors
    useEffect(() => {
        const clearStaleSession = async () => {
            try {
                const { data: { session }, error } = await supabase.auth.getSession();
                
                // If there's a refresh token error, clear cookies
                if (error && (error.message?.includes('refresh_token') || error.message?.includes('Invalid Refresh Token'))) {
                    clearAuthCookies();
                    await supabase.auth.signOut();
                }
            } catch (err) {
                // Silently handle errors on signup page
                clearAuthCookies();
            }
        };
        
        clearStaleSession();
    }, [supabase]);

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const { data, error } = await supabase.auth.signUp({
                email: form.email,
                password: form.password,
                options: {
                    data: {
                        username: form.username,
                        full_name: form.username,
                        avatar_url: `https://api.dicebear.com/7.x/avataaars/svg?seed=${form.username}`
                    },
                    emailRedirectTo: `${window.location.origin}/auth/callback?next=/onboarding`
                }
            });

            if (error) throw error;

            // If email confirmation is disabled, redirect to onboarding
            if (data?.session) {
                toast.success("ברוך הבא ל-GamerZone! 🎮");
                router.push("/onboarding");
            } else {
                toast.success("הרשמה בוצעה בהצלחה! בדוק את המייל לאימות.");
                router.push("/login");
            }

        } catch (error: any) {
            console.error(error); // Debugging

            // Check for Rate Limit (429)
            if (error?.status === 429 || error?.toString().toLowerCase().includes("rate limit") || error?.message?.toLowerCase().includes("too many requests")) {
                toast.error("יותר מדי ניסיונות", {
                    description: "אנא המתן דקה לפני ניסיון נוסף. (Supabase Rate Limit)"
                });
            } else if (error?.message === "User already registered" || error?.code === "user_already_exists") {
                toast.error("המשתמש כבר קיים", {
                    description: "כתובת האימייל הזו כבר רשומה במערכת.",
                    action: {
                        label: "התחבר",
                        onClick: () => router.push("/login")
                    }
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
                    <div className="space-y-4">
                        <button
                            type="button"
                            onClick={() => {
                                // Re-use the logic or just import it? simpler to just reproduce it here or redirect to login?
                                // Let's inline the logic.
                                supabase.auth.signInWithOAuth({
                                    provider: 'discord',
                                    options: {
                                        redirectTo: `${window.location.origin}/auth/callback`,
                                    },
                                }).then(({ error }) => {
                                    if (error) toast.error("שגיאה בהתחברות עם Discord", { description: error.message });
                                });
                            }}
                            className="w-full bg-[#5865F2] hover:bg-[#4752C4] text-white py-3 rounded-xl font-medium flex items-center justify-center gap-2 transition-all"
                        >
                            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1568 2.4189z" />
                            </svg>
                            הירשם עם Discord
                        </button>
                    </div>

                    <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                            <span className="w-full border-t border-white/10"></span>
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                            <span className="bg-[#0e0e1b] px-2 text-gray-500">או הירשם עם אימייל</span>
                        </div>
                    </div>

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
                            <div className="relative">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    placeholder="••••••••"
                                    value={form.password}
                                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-primary/50 transition-colors placeholder:text-gray-600 text-right pl-10"
                                    required
                                    minLength={6}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors"
                                >
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
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
