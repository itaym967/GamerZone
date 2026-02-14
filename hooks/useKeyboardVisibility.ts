"use client";

import { useState, useEffect } from "react";

/**
 * Detects virtual keyboard visibility on mobile devices.
 * Adds/removes 'keyboard-open' class on document body for CSS targeting.
 */
export function useKeyboardVisibility() {
    const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);

    useEffect(() => {
        // Use visualViewport API (best support)
        const viewport = window.visualViewport;
        if (!viewport) return;

        const THRESHOLD = 150; // px difference to consider keyboard open

        const handleResize = () => {
            const heightDiff = window.innerHeight - viewport.height;
            const open = heightDiff > THRESHOLD;
            setIsKeyboardOpen(open);

            if (open) {
                document.body.classList.add("keyboard-open");
            } else {
                document.body.classList.remove("keyboard-open");
            }
        };

        viewport.addEventListener("resize", handleResize);

        return () => {
            viewport.removeEventListener("resize", handleResize);
            document.body.classList.remove("keyboard-open");
        };
    }, []);

    return isKeyboardOpen;
}
