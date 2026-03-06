"use client";

import {
  ArrowLeft01Icon,
  ArrowRight01Icon,
  Mail01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { domAnimation, LazyMotion, m } from "framer-motion";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import { buildAuthCallbackUrl } from "@/lib/auth/redirect-url";
import { createClient } from "@/lib/supabase/client";
import Logo from "../components/logo";

const getErrorText = (error: unknown) =>
  error instanceof Error ? error.message : "אירעה שגיאה בלתי צפויה";

const RESET_EMAIL_INPUT_ID = "forgot-password-email";

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
        redirectTo: buildAuthCallbackUrl("/update-password"),
      });

      if (error) {
        toast.error("שגיאה בשליחת המייל", {
          description: getErrorText(error),
        });
        setIsLoading(false);
        return;
      }

      setIsSent(true);
      toast.success("המייל נשלח בהצלחה!");
    } catch (error: unknown) {
      toast.error("שגיאה בשליחת המייל", {
        description: getErrorText(error),
      });
    }
    setIsLoading(false);
  };

  return (
    <LazyMotion features={domAnimation}>
      <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-primary-foreground p-4">
        {/* Animated Background */}
        <div className="pointer-events-none absolute inset-0 bg-[url('/noise.svg')] opacity-20" />
        <div className="absolute top-[-20%] right-[-10%] h-150 w-150 animate-pulse rounded-full bg-primary/20 blur-[7.5rem]" />
        <div className="absolute bottom-[-20%] left-[-10%] h-150 w-150 animate-pulse rounded-full bg-secondary/20 blur-[7.5rem] delay-75" />

        <m.div
          animate={{ opacity: 1, scale: 1 }}
          className="glass-panel relative z-10 w-full max-w-md rounded-3xl border border-white/10 p-8"
          initial={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.5 }}
        >
          <div className="mb-8 text-center">
            <div className="mb-6 flex justify-center">
              <Logo className="justify-center" size="lg" />
            </div>
            <h1 className="mb-2 font-bold text-fluid-xl text-white">
              איפוס סיסמה
            </h1>
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
                  <HugeiconsIcon icon={Mail01Icon} size={24} />
                </div>
                <p className="text-fluid-sm text-gray-300">
                  בדוק את תיבת המייל שלך (וגם את הספאם). שם מחכה לך הקישור
                  לאיפוס הסיסמה.
                </p>
              </div>
            </div>
          ) : (
            <form className="space-y-6" onSubmit={handleReset}>
              <div className="space-y-1 text-right">
                <label
                  className="font-medium text-fluid-sm text-gray-400"
                  htmlFor={RESET_EMAIL_INPUT_ID}
                >
                  אימייל
                </label>
                <div className="relative">
                  <input
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 pl-10 text-right text-white outline-hidden transition-colors placeholder:text-gray-600 focus:border-primary/50"
                    id={RESET_EMAIL_INPUT_ID}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="gamer@example.com"
                    required
                    type="email"
                    value={email}
                  />
                  <HugeiconsIcon
                    className="absolute top-1/2 left-3 -translate-y-1/2 text-gray-500"
                    icon={Mail01Icon}
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
                    <HugeiconsIcon
                      className="rotate-180"
                      icon={ArrowRight01Icon}
                      size={18}
                    />
                  </>
                )}
              </button>
            </form>
          )}

          <div className="mt-8 text-center">
            <Link
              className="flex items-center justify-center gap-2 text-fluid-sm text-gray-400 transition-colors hover:text-white"
              href="/login"
              prefetch={false}
            >
              <HugeiconsIcon
                className="rotate-180"
                icon={ArrowLeft01Icon}
                size={16}
              />
              <span>חזרה להתחברות</span>
            </Link>
          </div>
        </m.div>
      </div>
    </LazyMotion>
  );
}
