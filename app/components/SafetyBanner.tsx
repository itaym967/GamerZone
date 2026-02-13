"use client";

import { ShieldCheck, X } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/context/AuthContext";

/**
 * Safety banner displayed for minor accounts.
 * Shows age-appropriate safety reminders and restrictions info.
 */
export default function SafetyBanner() {
    const { profile } = useAuth();
    const [dismissed, setDismissed] = useState(false);

    if (!profile || !profile.is_minor || dismissed) return null;

    const isSupervisedAccount = profile.account_type === "supervised";

    return (
        <div className={`w-full px-4 py-2.5 flex items-center justify-between gap-3 text-sm ${
            isSupervisedAccount
                ? "bg-amber-500/10 border-b border-amber-500/20 text-amber-400"
                : "bg-blue-500/10 border-b border-blue-500/20 text-blue-400"
        }`}>
            <div className="flex items-center gap-2 flex-1 justify-end">
                <span>
                    {isSupervisedAccount
                        ? "חשבון מפוקח - חלק מהתכונות מוגבלות להגנתך"
                        : "מצב בטוח פעיל - סינון תוכן מוגבר"
                    }
                </span>
                <ShieldCheck size={16} />
            </div>
            <button
                onClick={() => setDismissed(true)}
                className="p-1 hover:bg-white/10 rounded-lg transition-colors"
            >
                <X size={14} />
            </button>
        </div>
    );
}
