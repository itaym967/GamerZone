"use client";

import {
  ArrowRight01Icon,
  ViewIcon,
  ViewOffIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { motion } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import Logo from "../components/Logo";

function isRefreshTokenError(error: any): boolean {
  const message = error?.message || error?.error_description || "";
  return (
    message.includes("refresh_token_not_found") ||
    message.includes("Invalid Refresh Token") ||
    message.includes("refresh token") ||
    error?.code === "refresh_token_not_found"
  );
}

export default function LoginPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const supabase = createClient();

  // Redirect if already logged in
  useEffect(() => {
    const checkSession = async () => {
      try {
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();
        if (error && isRefreshTokenError(error)) {
          await supabase.auth.signOut();
          return;
        }
        if (session?.user) {
          router.replace("/");
        }
      } catch {
        // Silently handle errors on login page
      }
    };
    checkSession();
  }, [supabase, router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    // Prevent multiple simultaneous login attempts
    if (isLoading) {
      return;
    }

    setIsLoading(true);

    try {
      const {
        data: { session },
        error,
      } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        if (isRefreshTokenError(error)) {
          await supabase.auth.signOut();
          throw new Error("פג תוקף ההתחברות. נסה שוב.");
        }
        throw error;
      }

      if (session?.user) {
        toast.success("ברוך הבא ל-GamerZone! 🎮");
        router.replace("/");
      }
    } catch (error: any) {
      toast.error("שגיאה בהתחברות", {
        description:
          error.message === "Invalid login credentials"
            ? "פרטי ההתחברות שגויים"
            : error.message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSocialLogin = async (provider: "discord") => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        throw error;
      }
    } catch (error: any) {
      toast.error(`שגיאה בהתחברות עם ${provider}`, {
        description: error.message,
      });
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-primary-foreground p-4">
      {/* Animated Background */}
      <div className="pointer-events-none absolute inset-0 bg-[url('/noise.svg')] opacity-20" />
      <div className="absolute top-[-20%] left-[-10%] h-[37.5rem] w-[37.5rem] animate-pulse rounded-full bg-primary/20 blur-[7.5rem]" />
      <div className="absolute right-[-10%] bottom-[-20%] h-[37.5rem] w-[37.5rem] animate-pulse rounded-full bg-secondary/20 blur-[7.5rem] delay-75" />

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
          <p className="text-gray-400">התחבר כדי למצוא את הסקוואד שלך</p>
        </div>

        <form className="space-y-4" onSubmit={handleLogin}>
          <div className="space-y-4">
            <button
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#5865F2] py-3 font-medium text-white transition-all hover:bg-[#4752C4]"
              onClick={() => handleSocialLogin("discord")}
              type="button"
            >
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1568 2.4189z" />
              </svg>
              התחבר עם Discord
            </button>
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-white/10 border-t" />
            </div>
            <div className="relative flex justify-center text-fluid-xs uppercase">
              <span className="bg-card px-2 text-gray-500">
                או התחבר עם אימייל
              </span>
            </div>
          </div>

          <div className="space-y-3">
            <div className="space-y-1 text-right">
              <label className="font-medium text-fluid-sm text-gray-400">
                אימייל
              </label>
              <input
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-right text-white outline-hidden transition-colors placeholder:text-gray-600 focus:border-primary/50"
                onChange={(e) => setEmail(e.target.value)}
                placeholder="gamer@example.com"
                type="email"
                value={email}
              />
            </div>
            <div className="space-y-1 text-right">
              <label className="font-medium text-fluid-sm text-gray-400">
                סיסמה
              </label>
              <div className="relative">
                <input
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 pl-10 text-right text-white outline-hidden transition-colors placeholder:text-gray-600 focus:border-primary/50"
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  type={showPassword ? "text" : "password"}
                  value={password}
                />
                <button
                  className="absolute top-1/2 left-3 -translate-y-1/2 text-gray-500 transition-colors hover:text-white"
                  onClick={() => setShowPassword(!showPassword)}
                  type="button"
                >
                  {showPassword ? (
                    <HugeiconsIcon icon={ViewOffIcon} size={18} />
                  ) : (
                    <HugeiconsIcon icon={ViewIcon} size={18} />
                  )}
                </button>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between text-fluid-xs text-gray-400">
            <Link
              className="transition-colors hover:text-primary"
              href="/forgot-password"
            >
              שכחת סיסמה?
            </Link>
            <div className="flex items-center gap-2">
              <label className="cursor-pointer" htmlFor="remember">
                זכור אותי
              </label>
              <input
                className="rounded-xs border-white/20 bg-white/10 text-primary focus:ring-primary"
                id="remember"
                type="checkbox"
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
                <span>התחבר</span>
                <HugeiconsIcon
                  className="rotate-180"
                  icon={ArrowRight01Icon}
                  size={18}
                />
              </>
            )}
          </button>
        </form>

        <p className="mt-8 text-center text-fluid-sm text-gray-400">
          אין לך משתמש?{" "}
          <Link
            className="font-bold text-primary hover:underline"
            href="/signup"
          >
            הירשם עכשיו
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
