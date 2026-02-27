"use client";

import { motion } from "framer-motion";
import { ArrowLeft, ArrowRight, Mail } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import { createClient } from "@/utils/supabase/client";
import Logo from "../components/Logo";

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
        redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent("/update-password")}`,
      });

      if (error) {
        throw error;
      }

      setIsSent(true);
      toast.success("המייל נשלח בהצלחה!");
    } catch (error: any) {
      toast.error("שגיאה בשליחת המייל", {
        description: error.message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#050510] p-4">
      {/* Animated Background */}
      <div className="pointer-events-none absolute inset-0 bg-[url('/noise.svg')] opacity-20" />
      <div className="absolute top-[-20%] right-[-10%] h-[600px] w-[600px] animate-pulse rounded-full bg-primary/20 blur-[120px]" />
      <div className="absolute bottom-[-20%] left-[-10%] h-[600px] w-[600px] animate-pulse rounded-full bg-secondary/20 blur-[120px] delay-75" />

      <motion.div
        animate={{ opacity: 1, scale: 1 }}
        className="glass-panel relative z-10 w-full max-w-md rounded-3xl border border-white/10 p-8"
        initial={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.5 }}
      >
        <div className="mb-8 text-center">
          <div className="mb-6 flex justify-center">
            <Logo className="justify-center" size="lg" />
          </div>
          <h1 className="mb-2 font-bold text-2xl text-white">איפוס סיסמה</h1>
          <p className="text-gray-400">
            {isSent
              ? "הוראות לאיפוס הסיסמה נשלחו למייל שלך."
              : "הכנס את המייל שלך ונשלח לך קישור לאיפוס הסיסמה."}
          </p>
        </div>

        {isSent ? (
          <div className="space-y-6">
            <div className="rounded-xl border border-white/10 bg-white/5 p-6 text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-500/20 text-green-500">
                <Mail size={24} />
              </div>
              <p className="text-gray-300 text-sm">
                בדוק את תיבת המייל שלך (וגם את הספאם). שם מחכה לך הקישור לאיפוס
                הסיסמה.
              </p>
            </div>
          </div>
        ) : (
          <form className="space-y-6" onSubmit={handleReset}>
            <div className="space-y-1 text-right">
              <label className="font-medium text-gray-400 text-sm">
                אימייל
              </label>
              <div className="relative">
                <input
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 pl-10 text-right text-white outline-none transition-colors placeholder:text-gray-600 focus:border-primary/50"
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="gamer@example.com"
                  required
                  type="email"
                  value={email}
                />
                <Mail
                  className="absolute top-1/2 left-3 -translate-y-1/2 text-gray-500"
                  size={18}
                />
              </div>
            </div>

            <button
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-white py-3 font-bold text-black transition-all hover:bg-gray-200"
              disabled={isLoading}
              type="submit"
            >
              {isLoading ? (
                <span className="h-5 w-5 animate-spin rounded-full border-2 border-black/30 border-t-black" />
              ) : (
                <>
                  <span>שלח קישור לאיפוס</span>
                  <ArrowRight className="rotate-180" size={18} />
                </>
              )}
            </button>
          </form>
        )}

        <div className="mt-8 text-center">
          <Link
            className="flex items-center justify-center gap-2 text-gray-400 text-sm transition-colors hover:text-white"
            href="/login"
          >
            <ArrowLeft className="rotate-180" size={16} />
            <span>חזרה להתחברות</span>
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
