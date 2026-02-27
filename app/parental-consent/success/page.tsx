"use client";

import {
  CheckmarkCircle01Icon,
  SecurityCheckIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import Logo from "../../components/logo";

function SuccessContent() {
  const searchParams = useSearchParams();
  const alreadyGranted = searchParams.get("already") === "true";

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-primary-foreground p-4">
      <div className="absolute top-[-20%] right-[-10%] h-125 w-125 rounded-full bg-green-500/10 blur-[7.5rem]" />
      <div className="absolute bottom-[-20%] left-[-10%] h-125 w-125 rounded-full bg-primary/10 blur-[7.5rem]" />

      <div className="relative z-10 w-full max-w-md text-center">
        <Logo className="mb-8 justify-center" size="lg" />

        <div className="rounded-3xl border border-white/10 bg-card p-8 shadow-2xl">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-green-500/20">
            {alreadyGranted ? (
              <HugeiconsIcon
                className="text-green-500"
                icon={SecurityCheckIcon}
                size={40}
              />
            ) : (
              <HugeiconsIcon
                className="text-green-500"
                icon={CheckmarkCircle01Icon}
                size={40}
              />
            )}
          </div>

          <h1 className="mb-3 font-bold text-fluid-xl text-white">
            {alreadyGranted ? "ההסכמה כבר אושרה" : "ההסכמה אושרה בהצלחה!"}
          </h1>

          <p className="mb-6 text-gray-400">
            {alreadyGranted
              ? "כבר אישרת את החשבון של ילדך. החשבון פעיל עם הגנות בטיחות."
              : "תודה שאישרת את החשבון של ילדך ב-GamerZone. החשבון כעת פעיל עם הגנות בטיחות מוגברות."}
          </p>

          <div className="mb-6 space-y-3 rounded-xl bg-white/5 p-4 text-right">
            <h3 className="flex items-center justify-end gap-2 font-bold text-fluid-sm text-white">
              <span>הגנות פעילות</span>
              <HugeiconsIcon
                className="text-green-500"
                icon={SecurityCheckIcon}
                size={16}
              />
            </h3>
            <ul className="space-y-2 text-fluid-sm text-gray-400">
              <li className="flex items-center justify-end gap-2">
                <span>סינון תוכן מוגבר</span>
                <span className="h-2 w-2 rounded-full bg-green-500" />
              </li>
              <li className="flex items-center justify-end gap-2">
                <span>הגבלת שיתוף מידע אישי</span>
                <span className="h-2 w-2 rounded-full bg-green-500" />
              </li>
              <li className="flex items-center justify-end gap-2">
                <span>יומן פעילות</span>
                <span className="h-2 w-2 rounded-full bg-green-500" />
              </li>
              <li className="flex items-center justify-end gap-2">
                <span>הגבלת זמן צ&apos;אט יומי</span>
                <span className="h-2 w-2 rounded-full bg-green-500" />
              </li>
            </ul>
          </div>

          <p className="text-fluid-xs text-gray-500">
            ניתן לפנות אלינו בכל שאלה בנוגע לבטיחות ילדים בפלטפורמה.
          </p>
        </div>
      </div>
    </div>
  );
}

export default function ParentalConsentSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-primary-foreground">
          <div className="h-16 w-16 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      }
    >
      <SuccessContent />
    </Suspense>
  );
}
