"use client";

import { Cancel01Icon, SecurityCheckIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useState } from "react";
import { useAuth } from "@/context/AuthContext";

/**
 * Safety banner displayed for minor accounts.
 * Shows age-appropriate safety reminders and restrictions info.
 */
export default function SafetyBanner() {
  const { profile } = useAuth();
  const [dismissed, setDismissed] = useState(false);

  if (!profile?.is_minor || dismissed) {
    return null;
  }

  const isSupervisedAccount = profile.account_type === "supervised";

  return (
    <div
      className={`flex w-full items-center justify-between gap-3 px-4 py-2.5 text-sm ${
        isSupervisedAccount
          ? "border-amber-500/20 border-b bg-amber-500/10 text-amber-400"
          : "border-blue-500/20 border-b bg-blue-500/10 text-blue-400"
      }`}
    >
      <div className="flex flex-1 items-center justify-end gap-2">
        <span>
          {isSupervisedAccount
            ? "חשבון מפוקח - חלק מהתכונות מוגבלות להגנתך"
            : "מצב בטוח פעיל - סינון תוכן מוגבר"}
        </span>
        <HugeiconsIcon icon={SecurityCheckIcon} size={16} />
      </div>
      <button
        className="rounded-lg p-1 transition-colors hover:bg-white/10"
        onClick={() => setDismissed(true)}
      >
        <HugeiconsIcon icon={Cancel01Icon} size={14} />
      </button>
    </div>
  );
}
