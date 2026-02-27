/**
 * Haptic feedback utility for mobile PWA.
 * Uses the Vibration API where available.
 */

type HapticPattern =
  | "light"
  | "medium"
  | "heavy"
  | "success"
  | "error"
  | "warning";

const PATTERNS: Record<HapticPattern, number[]> = {
  light: [10],
  medium: [20],
  heavy: [40],
  success: [10, 50, 10],
  error: [30, 50, 30, 50, 30],
  warning: [20, 40, 20],
};

/**
 * Trigger haptic feedback if the device supports vibration.
 *
 * @param pattern - The haptic pattern to use
 */
export function haptic(pattern: HapticPattern = "light") {
  if (typeof navigator === "undefined") {
    return;
  }
  if (!("vibrate" in navigator)) {
    return;
  }

  try {
    navigator.vibrate(PATTERNS[pattern]);
  } catch {
    // Silently fail - vibration not critical
  }
}

/**
 * Check if haptic feedback is supported on this device.
 */
export function isHapticSupported(): boolean {
  return typeof navigator !== "undefined" && "vibrate" in navigator;
}
