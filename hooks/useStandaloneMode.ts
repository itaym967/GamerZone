"use client";

import { useState, useEffect } from "react";

/**
 * Detects if the app is running as an installed PWA (standalone mode).
 * Also detects iOS Safari for install instructions.
 */
export function useStandaloneMode() {
    const [isStandalone, setIsStandalone] = useState(false);
    const [isIOS, setIsIOS] = useState(false);
    const [isIOSSafari, setIsIOSSafari] = useState(false);

    useEffect(() => {
        // Check standalone mode
        const standalone =
            window.matchMedia("(display-mode: standalone)").matches ||
            (window.navigator as any).standalone === true;
        setIsStandalone(standalone);

        // Check iOS
        const ios = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
        setIsIOS(ios);

        // Check iOS Safari (not in-app browser)
        const iosSafari = ios && /Safari/i.test(navigator.userAgent) && !/CriOS|FxiOS|OPiOS/i.test(navigator.userAgent);
        setIsIOSSafari(iosSafari);

        // Listen for display mode changes
        const mediaQuery = window.matchMedia("(display-mode: standalone)");
        const handler = (e: MediaQueryListEvent) => setIsStandalone(e.matches);
        mediaQuery.addEventListener("change", handler);

        return () => mediaQuery.removeEventListener("change", handler);
    }, []);

    return { isStandalone, isIOS, isIOSSafari };
}
