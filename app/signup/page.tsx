"use client";

import { motion } from "framer-motion";
import {
  AlertTriangle,
  ArrowRight,
  Eye,
  EyeOff,
  ShieldCheck,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { clearAllCachesOnAuthChange } from "@/utils/cache-utils";
import {
  calculateAge,
  getAccountType,
  getSafetyMessage,
  requiresCOPPAConsent,
  validateDateOfBirth,
} from "@/utils/kid-safety";
import { clearAuthCookies } from "@/utils/supabase/auth-helpers";
import { createClient } from "@/utils/supabase/client";
import Logo from "../components/Logo";

export default function SignupPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const supabase = createClient();

  const [form, setForm] = useState({
    email: "",
    username: "",
    password: "",
    dateOfBirth: "",
    parentalEmail: "",
  });
  const [ageInfo, setAgeInfo] = useState<{
    age: number;
    accountType: string;
    needsConsent: boolean;
  } | null>(null);
  const [showParentalForm, setShowParentalForm] = useState(false);

  // Clear any stale auth cookies on mount to prevent refresh token errors
  useEffect(() => {
    const clearStaleSession = async () => {
      try {
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();

        // If there's a refresh token error, clear cookies
        if (
          error &&
          (error.message?.includes("refresh_token") ||
            error.message?.includes("Invalid Refresh Token"))
        ) {
          clearAuthCookies();
          await supabase.auth.signOut();
        }
      } catch (_err) {
        // Silently handle errors on signup page
        clearAuthCookies();
      }
    };

    clearStaleSession();
  }, [supabase]);

  const handleDateOfBirthChange = (value: string) => {
    setForm({ ...form, dateOfBirth: value });
    if (value) {
      const age = calculateAge(value);
      const accountType = getAccountType(value);
      const needsConsent = requiresCOPPAConsent(value);
      setAgeInfo({ age, accountType, needsConsent });
      setShowParentalForm(needsConsent);
    } else {
      setAgeInfo(null);
      setShowParentalForm(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Validate date of birth
      const dobError = validateDateOfBirth(form.dateOfBirth);
      if (dobError) {
        toast.error(dobError);
        setIsLoading(false);
        return;
      }

      // If under 13, require parental email
      if (ageInfo?.needsConsent && !form.parentalEmail) {
        toast.error("נדרש אימייל של הורה לגילאים מתחת ל-13");
        setIsLoading(false);
        return;
      }

      const accountType = getAccountType(form.dateOfBirth);
      const isMinorUser = accountType !== "standard";

      const { data, error } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
        options: {
          data: {
            username: form.username,
            full_name: form.username,
            avatar_url: `https://api.dicebear.com/7.x/avataaars/svg?seed=${form.username}`,
            date_of_birth: form.dateOfBirth,
            account_type: accountType,
            is_minor: isMinorUser,
          },
          emailRedirectTo: `${window.location.origin}/auth/callback?next=/onboarding`,
        },
      });

      if (error) {
        throw error;
      }

      // Update profile with kid safety fields
      if (data?.user) {
        await supabase
          .from("profiles")
          .update({
            date_of_birth: form.dateOfBirth,
            account_type: accountType,
            is_minor: isMinorUser,
            safe_mode: isMinorUser,
            chat_restricted: accountType === "supervised",
            profile_restricted: accountType === "supervised",
            parental_email: form.parentalEmail || null,
            max_daily_chat_minutes:
              accountType === "supervised"
                ? 60
                : accountType === "minor"
                  ? 180
                  : 0,
          })
          .eq("id", data.user.id);

        // Request parental consent if under 13
        if (ageInfo?.needsConsent && form.parentalEmail) {
          await fetch("/api/parental-consent", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              childId: data.user.id,
              parentEmail: form.parentalEmail,
            }),
          });
        }
      }

      // If email confirmation is disabled, redirect to onboarding
      if (data?.session) {
        if (isMinorUser) {
          toast.success("ברוך הבא ל-GamerZone! 🛡️", {
            description: getSafetyMessage(accountType),
          });
        } else {
          toast.success("ברוך הבא ל-GamerZone! 🎮");
        }
        clearAllCachesOnAuthChange();
        router.push("/onboarding");
      } else {
        toast.success("הרשמה בוצעה בהצלחה! בדוק את המייל לאימות.");
        router.push("/login");
      }
    } catch (error: any) {
      console.error(error); // Debugging

      // Check for Rate Limit (429)
      if (
        error?.status === 429 ||
        error?.toString().toLowerCase().includes("rate limit") ||
        error?.message?.toLowerCase().includes("too many requests")
      ) {
        toast.error("יותר מדי ניסיונות", {
          description: "אנא המתן דקה לפני ניסיון נוסף. (Supabase Rate Limit)",
        });
      } else if (
        error?.message === "User already registered" ||
        error?.code === "user_already_exists"
      ) {
        toast.error("המשתמש כבר קיים", {
          description: "כתובת האימייל הזו כבר רשומה במערכת.",
          action: {
            label: "התחבר",
            onClick: () => router.push("/login"),
          },
        });
      } else {
        toast.error("שגיאה בהרשמה", {
          description: error.message || "אירעה שגיאה בלתי צפויה",
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#050510] p-4">
      {/* Animated Background */}
      <div className="pointer-events-none absolute inset-0 bg-[url('/noise.svg')] opacity-20" />
      <div className="absolute top-[-20%] left-[-10%] h-[600px] w-[600px] animate-pulse rounded-full bg-primary/20 blur-[120px]" />
      <div className="absolute right-[-10%] bottom-[-20%] h-[600px] w-[600px] animate-pulse rounded-full bg-secondary/20 blur-[120px] delay-75" />

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
          <p className="text-gray-400">הצטרף לקהילת הגיימינג הכי חזקה בישראל</p>
        </div>

        <form className="space-y-4" onSubmit={handleSignup}>
          <div className="space-y-4">
            <button
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#5865F2] py-3 font-medium text-white transition-all hover:bg-[#4752C4]"
              onClick={() => {
                // Re-use the logic or just import it? simpler to just reproduce it here or redirect to login?
                // Let's inline the logic.
                supabase.auth
                  .signInWithOAuth({
                    provider: "discord",
                    options: {
                      redirectTo: `${window.location.origin}/auth/callback`,
                    },
                  })
                  .then(({ error }) => {
                    if (error) {
                      toast.error("שגיאה בהתחברות עם Discord", {
                        description: error.message,
                      });
                    }
                  });
              }}
              type="button"
            >
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1568 2.4189z" />
              </svg>
              הירשם עם Discord
            </button>
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-white/10 border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-[#0e0e1b] px-2 text-gray-500">
                או הירשם עם אימייל
              </span>
            </div>
          </div>

          <div className="space-y-3">
            <div className="space-y-1 text-right">
              <label className="font-medium text-gray-400 text-sm">
                שם משתמש
              </label>
              <input
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-right text-white outline-none transition-colors placeholder:text-gray-600 focus:border-primary/50"
                minLength={3}
                onChange={(e) => setForm({ ...form, username: e.target.value })}
                placeholder="Gamer123"
                required
                type="text"
                value={form.username}
              />
            </div>
            <div className="space-y-1 text-right">
              <label className="font-medium text-gray-400 text-sm">
                תאריך לידה
              </label>
              <input
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-right text-white outline-none transition-colors [color-scheme:dark] focus:border-primary/50"
                max={new Date().toISOString().split("T")[0]}
                onChange={(e) => handleDateOfBirthChange(e.target.value)}
                required
                type="date"
                value={form.dateOfBirth}
              />
              {ageInfo && (
                <div
                  className={`mt-2 flex items-center justify-end gap-2 rounded-lg p-3 text-sm ${
                    ageInfo.needsConsent
                      ? "border border-amber-500/20 bg-amber-500/10 text-amber-400"
                      : ageInfo.accountType === "minor"
                        ? "border border-blue-500/20 bg-blue-500/10 text-blue-400"
                        : "border border-green-500/20 bg-green-500/10 text-green-400"
                  }`}
                >
                  <span>
                    {ageInfo.needsConsent
                      ? "נדרש אישור הורים (מתחת לגיל 13)"
                      : ageInfo.accountType === "minor"
                        ? "חשבון צעיר - סינון תוכן מוגבר יופעל"
                        : "חשבון רגיל"}
                  </span>
                  {ageInfo.needsConsent ? (
                    <AlertTriangle size={16} />
                  ) : (
                    <ShieldCheck size={16} />
                  )}
                </div>
              )}
            </div>

            {showParentalForm && (
              <div className="space-y-1 rounded-xl border border-amber-500/10 bg-amber-500/5 p-4 text-right">
                <label className="flex items-center justify-end gap-2 font-medium text-amber-400 text-sm">
                  <span>אימייל הורה / אפוטרופוס</span>
                  <ShieldCheck size={14} />
                </label>
                <input
                  className="w-full rounded-xl border border-amber-500/20 bg-black/20 px-4 py-3 text-right text-white outline-none transition-colors placeholder:text-gray-600 focus:border-amber-500/50"
                  onChange={(e) =>
                    setForm({ ...form, parentalEmail: e.target.value })
                  }
                  placeholder="parent@example.com"
                  required={showParentalForm}
                  type="email"
                  value={form.parentalEmail}
                />
                <p className="mt-1 text-gray-500 text-xs">
                  נשלח קישור אישור לאימייל ההורה. החשבון יהיה מוגבל עד לאישור.
                </p>
              </div>
            )}

            <div className="space-y-1 text-right">
              <label className="font-medium text-gray-400 text-sm">
                אימייל
              </label>
              <input
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-right text-white outline-none transition-colors placeholder:text-gray-600 focus:border-primary/50"
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="gamer@example.com"
                required
                type="email"
                value={form.email}
              />
            </div>
            <div className="space-y-1 text-right">
              <label className="font-medium text-gray-400 text-sm">סיסמה</label>
              <div className="relative">
                <input
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 pl-10 text-right text-white outline-none transition-colors placeholder:text-gray-600 focus:border-primary/50"
                  minLength={6}
                  onChange={(e) =>
                    setForm({ ...form, password: e.target.value })
                  }
                  placeholder="••••••••"
                  required
                  type={showPassword ? "text" : "password"}
                  value={form.password}
                />
                <button
                  className="absolute top-1/2 left-3 -translate-y-1/2 text-gray-500 transition-colors hover:text-white"
                  onClick={() => setShowPassword(!showPassword)}
                  type="button"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
          </div>

          <button
            className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-white py-3 font-bold text-black transition-all hover:bg-gray-200"
            disabled={isLoading}
            type="submit"
          >
            {isLoading ? (
              <span className="h-5 w-5 animate-spin rounded-full border-2 border-black/30 border-t-black" />
            ) : (
              <>
                <span>הירשם</span>
                <ArrowRight className="rotate-180" size={18} />
              </>
            )}
          </button>
        </form>

        <p className="mt-8 text-center text-gray-400 text-sm">
          כבר יש לך משתמש?{" "}
          <Link
            className="font-bold text-primary hover:underline"
            href="/login"
          >
            התחבר
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
