"use client";
import {
  Alert01Icon,
  Key01Icon,
  Logout01Icon,
  Mail01Icon,
  Settings01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import Link from "next/link";
import { useState } from "react";
import { useAuth } from "@/context/auth-context";

interface AccountTabProps {
  userEmail: string | null;
}

export default function AccountTab({ userEmail }: AccountTabProps) {
  const { signOut } = useAuth();
  const [isSigningOut, setIsSigningOut] = useState(false);

  const handleSignOut = async () => {
    setIsSigningOut(true);
    try {
      await signOut();
    } catch (error) {
      console.error("Sign out error:", error);
      setIsSigningOut(false);
    }
  };

  return (
    <div className="glass-panel space-y-6 rounded-2xl border border-white/5 p-6">
      <div className="mb-4 flex items-center gap-2">
        <div className="rounded-lg bg-white/10 p-2 text-gray-400">
          <HugeiconsIcon icon={Settings01Icon} size={24} />
        </div>
        <h2 className="font-bold text-fluid-lg text-white">הגדרות חשבון</h2>
      </div>

      {/* Email */}
      <div className="rounded-xl border border-white/10 bg-white/5 p-4">
        <div className="flex items-center gap-3">
          <HugeiconsIcon
            className="text-gray-400"
            icon={Mail01Icon}
            size={18}
          />
          <div className="flex-1">
            <p className="mb-0.5 text-fluid-xs text-gray-500">כתובת אימייל</p>
            <p className="font-mono text-fluid-sm text-white" dir="ltr">
              {userEmail || "לא זמין"}
            </p>
          </div>
        </div>
      </div>

      {/* Password */}
      <div className="rounded-xl border border-white/10 bg-white/5 p-4">
        <div className="flex items-center gap-3">
          <HugeiconsIcon className="text-gray-400" icon={Key01Icon} size={18} />
          <div className="flex-1">
            <p className="mb-0.5 text-fluid-xs text-gray-500">סיסמה</p>
            <p className="text-fluid-sm text-gray-400">••••••••</p>
          </div>
          <Link
            className="font-medium text-fluid-xs text-primary transition-colors hover:text-primary/80"
            href="/update-password"
            prefetch={false}
          >
            שנה סיסמה
          </Link>
        </div>
      </div>

      {/* Sign Out */}
      <button
        className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 py-3 text-gray-400 transition-all hover:bg-white/5 hover:text-white disabled:opacity-50"
        disabled={isSigningOut}
        onClick={handleSignOut}
        type="button"
      >
        {isSigningOut ? (
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-400/30 border-t-gray-400" />
        ) : (
          <HugeiconsIcon icon={Logout01Icon} size={18} />
        )}
        <span>{isSigningOut ? "מתנתק..." : "התנתק"}</span>
      </button>

      {/* Danger Zone */}
      <div className="border-red-500/20 border-t pt-4">
        <div className="mb-3 flex items-center gap-2">
          <HugeiconsIcon
            className="text-red-400"
            icon={Alert01Icon}
            size={16}
          />
          <h3 className="font-bold text-fluid-sm text-red-400">אזור מסוכן</h3>
        </div>
        <p className="mb-3 text-fluid-xs text-gray-500">
          פעולות אלו הן בלתי הפיכות. אנא היזהר.
        </p>
        <button
          className="w-full cursor-not-allowed rounded-xl border border-red-500/20 py-2.5 text-fluid-sm text-red-400/50"
          disabled
          title="פיצ'ר זה יהיה זמין בקרוב"
          type="button"
        >
          מחק חשבון (בקרוב)
        </button>
      </div>
    </div>
  );
}
