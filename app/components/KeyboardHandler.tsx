"use client";

import { useKeyboardVisibility } from "@/hooks/useKeyboardVisibility";

/**
 * Invisible component that manages virtual keyboard detection.
 * Adds/removes 'keyboard-open' class on body for CSS targeting.
 */
export default function KeyboardHandler() {
    useKeyboardVisibility();
    return null;
}
