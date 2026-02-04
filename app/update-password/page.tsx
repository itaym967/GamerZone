"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, ArrowRight, Lock, Check } from "lucide-react";
import Logo from "../components/Logo";
import { toast } from "sonner";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";

export default function UpdatePasswordPage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const supabase = createClient();

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();

        if (password !== confirmPassword) {
            toast.error("הסיסמאות אינן תואמות");
            return;
        }

        if (password.length < 6) {
            toast.error("הסיסמה חייבת להכיל לפחות 6 תווים");
            return;
        }

        setIsLoading(true);

        try {
            const { error } = await supabase.auth.updateUser({
                password: password
            });

            if (error) throw error;

            toast.success("הסיסמה עודכנה בהצלחה!");
            router.push("/");
            router.refresh();
        } catch (error: any) {
            toast.error("שגיאה בעדכון הסיסמה", {
                description: error.message
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-[#050510]">
            {/* Animated Background */}
            <div className="absolute inset-0 bg-[url('/noise.svg')] opacity-20 pointer-events-none"></div>
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
                    <h1 className="text-2xl font-bold text-white mb-2">עדכון סיסמה</h1>
                    <p className="text-gray-400">בחר סיסמה חדשה לחשבון שלך</p>
                </div>

                <form onSubmit={handleUpdate} className="space-y-6">
                    <div className="space-y-4">
                        <div className="space-y-1 text-right">
                            <label className="text-sm font-medium text-gray-400">סיסמה חדשה</label>
                            <div className="relative">
                                <input
                                    type="password"
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 pl-10 text-white outline-none focus:border-primary/50 transition-colors placeholder:text-gray-600 text-right"
                                    required
                                />
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                            </div>
                        </div>

                        <div className="space-y-1 text-right">
                            <label className="text-sm font-medium text-gray-400">אימות סיסמה</label>
                            <div className="relative">
                                <input
                                    type="password"
                                    placeholder="••••••••"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 pl-10 text-white outline-none focus:border-primary/50 transition-colors placeholder:text-gray-600 text-right"
                                    required
                                />
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                            </div>
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
                                <span>עדכן סיסמה</span>
                                <Check size={18} />
                            </>
                        )}
                    </button>
                </form>
            </motion.div>
        </div>
    );
}
