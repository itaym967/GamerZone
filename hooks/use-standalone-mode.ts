"use client";

import { useEffect, useState } from "react";

const IOS_DEVICE_REGEX = /iPad|iPhone|iPod/;
const IOS_SAFARI_REGEX = /Safari/i;
const IOS_OTHER_BROWSERS_REGEX = /CriOS|FxiOS|OPiOS/i;

/**
 * Detects if the app is running as an installed PWA (standalone mode).
 * Also detects iOS Safari for install instructions.
 */
export function useStandaloneMode() {
  const [isStandalone, setIsStandalone] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isIOSSafari, setIsIOSSafari] = useState(false);

  useEffect(() => {
    const standaloneNavigator = window.navigator as Navigator & {
      standalone?: boolean;
      MSStream?: unknown;
    };
    // Check standalone mode
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      standaloneNavigator.standalone === true;
    setIsStandalone(standalone);

    // Check iOS
    const ios =
      IOS_DEVICE_REGEX.test(navigator.userAgent) &&
      !standaloneNavigator.MSStream;
    setIsIOS(ios);

    // Check iOS Safari (not in-app browser)
    const iosSafari =
      ios &&
      IOS_SAFARI_REGEX.test(navigator.userAgent) &&
      !IOS_OTHER_BROWSERS_REGEX.test(navigator.userAgent);
    setIsIOSSafari(iosSafari);

    // Listen for display mode changes
    const mediaQuery = window.matchMedia("(display-mode: standalone)");
    const handler = (e: MediaQueryListEvent) => setIsStandalone(e.matches);
    mediaQuery.addEventListener("change", handler);

    return () => mediaQuery.removeEventListener("change", handler);
  }, []);

  return { isStandalone, isIOS, isIOSSafari };
}
