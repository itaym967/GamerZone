"use client";

import { useKeyboardVisibility } from "@/hooks/use-keyboard-visibility";

/**
 * Invisible component that manages virtual keyboard detection.
 * Adds/removes 'keyboard-open' class on body for CSS targeting.
 */
export default function KeyboardHandler() {
  useKeyboardVisibility();
  return null;
}
