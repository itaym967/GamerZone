"use client";
import {
  Add01Icon,
  Cancel01Icon,
  Download01Icon,
  Share01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useEffect, useReducer } from "react";
import { toast } from "sonner";

const MOBILE_REGEX = /Android|iPhone|iPad|iPod/i;
const IOS_REGEX = /iPad|iPhone|iPod/;
const SAFARI_REGEX = /Safari/i;
const IOS_OTHER_BROWSER_REGEX = /CriOS|FxiOS/i;

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

interface PromptState {
  deferredPrompt: BeforeInstallPromptEvent | null;
  showBanner: boolean;
}

type PromptAction =
  | { type: "SHOW"; payload: BeforeInstallPromptEvent | null }
  | { type: "HIDE" }
  | { type: "DISMISS" };

function promptReducer(state: PromptState, action: PromptAction): PromptState {
  if (action.type === "SHOW") {
    return { showBanner: true, deferredPrompt: action.payload };
  }
  if (action.type === "DISMISS") {
    return { ...state, showBanner: false, deferredPrompt: null };
  }
  return { ...state, showBanner: false, deferredPrompt: null };
}

/**
 * PWA Install Prompt Component
 * Shows a visual install banner for Android (beforeinstallprompt)
 * and iOS Safari instructions (share → add to home screen).
 */
export default function PWAInstallPrompt() {
  const [state, dispatch] = useReducer(promptReducer, {
    showBanner: false,
    deferredPrompt: null,
  });
  const isIOS =
    typeof navigator !== "undefined" && IOS_REGEX.test(navigator.userAgent);

  useEffect(() => {
    const nav = window.navigator as Navigator & { standalone?: boolean };
    const win = window as Window & { MSStream?: unknown };

    const isStandalone = () =>
      window.matchMedia("(display-mode: standalone)").matches ||
      nav.standalone === true;

    const isMobileDevice = () =>
      MOBILE_REGEX.test(navigator.userAgent) || window.innerWidth <= 768;

    const isIOSDevice = () =>
      IOS_REGEX.test(navigator.userAgent) && !win.MSStream;

    const isIOSSafari = () =>
      SAFARI_REGEX.test(navigator.userAgent) &&
      !IOS_OTHER_BROWSER_REGEX.test(navigator.userAgent);

    // Already installed — skip
    if (isStandalone()) {
      return;
    }

    // Check dismiss cooldown (7 days)
    const dismissedData = localStorage.getItem("pwa-install-dismissed");
    if (dismissedData) {
      try {
        const { timestamp } = JSON.parse(dismissedData);
        if ((Date.now() - timestamp) / 86_400_000 < 7) {
          return;
        }
      } catch {
        /* continue */
      }
    }

    if (!isMobileDevice()) {
      return;
    }

    const ios = isIOSDevice();

    // Android / Chrome: listen for beforeinstallprompt
    const handler = (event: Event) => {
      const e = event as BeforeInstallPromptEvent;
      e.preventDefault();
      setTimeout(() => dispatch({ type: "SHOW", payload: e }), 4000);
    };
    window.addEventListener("beforeinstallprompt", handler);

    // iOS Safari: show instructions after delay
    if (ios && isIOSSafari()) {
      setTimeout(() => dispatch({ type: "SHOW", payload: null }), 4000);
    }

    // Listen for successful install
    window.addEventListener("appinstalled", () => {
      toast.success("GamerZone הותקן בהצלחה!");
      dispatch({ type: "HIDE" });
    });

    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (!state.deferredPrompt) {
      return;
    }
    state.deferredPrompt.prompt();
    const { outcome } = await state.deferredPrompt.userChoice;
    if (outcome === "accepted") {
      toast.success("תודה שהתקנת את GamerZone!");
    }
    dispatch({ type: "HIDE" });
  };

  const handleDismiss = () => {
    dispatch({ type: "DISMISS" });
    localStorage.setItem(
      "pwa-install-dismissed",
      JSON.stringify({ timestamp: Date.now() })
    );
  };

  if (!state.showBanner) {
    return null;
  }

  return (
    <div className="slide-in-from-bottom fixed right-4 bottom-20 left-4 z-60 animate-in duration-500 md:bottom-6">
      <div className="mx-auto max-w-md rounded-2xl border border-white/10 bg-card p-4 shadow-2xl shadow-black/50 backdrop-blur-xl">
        <button
          className="touch-compact absolute top-3 left-3 rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-white/10 hover:text-white"
          onClick={handleDismiss}
          type="button"
        >
          <HugeiconsIcon icon={Cancel01Icon} size={16} />
        </button>

        <div className="flex items-start gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-primary/20 bg-primary/10">
            <HugeiconsIcon
              className="text-primary"
              icon={Download01Icon}
              size={24}
            />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="mb-1 font-bold text-fluid-sm text-white">
              התקן את GamerZone
            </h3>
            <p className="mb-3 text-fluid-xs text-gray-400 leading-relaxed">
              גישה מהירה מהמסך הראשי, התראות ומצב אופליין
            </p>

            {isIOS ? (
              /* iOS Safari instructions */
              <div className="space-y-2 rounded-xl bg-white/5 p-3">
                <div className="flex items-center gap-2 text-fluid-xs text-gray-300">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-blue-500/20 font-bold text-[0.625rem] text-blue-400">
                    1
                  </span>
                  <span>לחץ על</span>
                  <HugeiconsIcon
                    className="shrink-0 text-blue-400"
                    icon={Share01Icon}
                    size={14}
                  />
                  <span>בתפריט הדפדפן</span>
                </div>
                <div className="flex items-center gap-2 text-fluid-xs text-gray-300">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-blue-500/20 font-bold text-[0.625rem] text-blue-400">
                    2
                  </span>
                  <span>בחר</span>
                  <HugeiconsIcon
                    className="shrink-0 text-blue-400"
                    icon={Add01Icon}
                    size={14}
                  />
                  <span>&quot;הוסף למסך הבית&quot;</span>
                </div>
              </div>
            ) : (
              /* Android / Chrome install button */
              <button
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-2.5 font-bold text-black text-fluid-sm transition-all hover:bg-primary/90"
                onClick={handleInstall}
                type="button"
              >
                <HugeiconsIcon icon={Download01Icon} size={16} />
                התקן עכשיו
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
