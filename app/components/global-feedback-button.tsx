"use client";

import { SentIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/auth-context";

const FEEDBACK_EMAIL = "itay.machllof@gmail.com";

function buildFeedbackMailto(params: { pathname: string; userEmail?: string }) {
  const subject = "GamerZone Feedback";
  const bodyLines = [
    "Hello,",
    "",
    "Here is my feedback about GamerZone:",
    "",
    "Details:",
    "",
    "---",
    `User: ${params.userEmail ?? "unknown"}`,
    `Page: ${params.pathname}`,
    `Time: ${new Date().toISOString()}`,
  ];
  const body = bodyLines.join("\n");
  return `mailto:${FEEDBACK_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

export default function GlobalFeedbackButton() {
  const { user } = useAuth();
  const pathname = usePathname();
  const mailtoUrl = buildFeedbackMailto({
    pathname: pathname ?? "/",
    userEmail: user?.email,
  });

  return (
    <a
      className="fixed right-3 bottom-24 z-9998 inline-flex items-center gap-2 rounded-full border border-primary/40 bg-black/70 px-3 py-2 font-medium text-primary text-xs shadow-xl backdrop-blur-md transition-colors hover:bg-black/85 hover:text-primary md:right-6 md:bottom-6"
      href={mailtoUrl}
    >
      <HugeiconsIcon icon={SentIcon} size={14} />
      <span>Feedback</span>
    </a>
  );
}
