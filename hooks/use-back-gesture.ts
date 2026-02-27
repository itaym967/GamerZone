"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

/**
 * Handles the hardware/software back button in standalone PWA mode.
 * Prevents the app from closing when pressing back - navigates instead.
 */
export function useBackGesture() {
  const router = useRouter();

  useEffect(() => {
    const standaloneNavigator = window.navigator as Navigator & {
      standalone?: boolean;
    };
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      standaloneNavigator.standalone === true;

    if (!isStandalone) {
      return;
    }

    // Push an initial state so we have history to go back to
    if (window.history.length <= 1) {
      window.history.pushState({ pwa: true }, "");
    }

    const handlePopState = (_e: PopStateEvent) => {
      // Push state again to keep the app from closing
      window.history.pushState({ pwa: true }, "");

      // Navigate back using Next.js router
      router.back();
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [router]);
}
