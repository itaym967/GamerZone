"use client";

import { LockIcon, Tick01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import Logo from "../components/Logo";

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
        password,
      });

      if (error) {
        throw error;
      }

      toast.success("הסיסמה עודכנה בהצלחה!");
      router.push("/");
      router.refresh();
    } catch (error: any) {
      toast.error("שגיאה בעדכון הסיסמה", {
        description: error.message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-primary-foreground p-4">
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
          <h1 className="mb-2 font-bold text-2xl text-white">עדכון סיסמה</h1>
          <p className="text-gray-400">בחר סיסמה חדשה לחשבון שלך</p>
        </div>

        <form className="space-y-6" onSubmit={handleUpdate}>
          <div className="space-y-4">
            <div className="space-y-1 text-right">
              <label className="font-medium text-gray-400 text-sm">
                סיסמה חדשה
              </label>
              <div className="relative">
                <input
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 pl-10 text-right text-white outline-hidden transition-colors placeholder:text-gray-600 focus:border-primary/50"
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  type="password"
                  value={password}
                />
                <HugeiconsIcon
                  className="absolute top-1/2 left-3 -translate-y-1/2 text-gray-500"
                  icon={LockIcon}
                  size={18}
                />
              </div>
            </div>

            <div className="space-y-1 text-right">
              <label className="font-medium text-gray-400 text-sm">
                אימות סיסמה
              </label>
              <div className="relative">
                <input
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 pl-10 text-right text-white outline-hidden transition-colors placeholder:text-gray-600 focus:border-primary/50"
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  type="password"
                  value={confirmPassword}
                />
                <HugeiconsIcon
                  className="absolute top-1/2 left-3 -translate-y-1/2 text-gray-500"
                  icon={LockIcon}
                  size={18}
                />
              </div>
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
                <span>עדכן סיסמה</span>
                <HugeiconsIcon icon={Tick01Icon} size={18} />
              </>
            )}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
