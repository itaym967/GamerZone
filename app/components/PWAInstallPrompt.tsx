"use client";
import {
  Add01Icon,
  Cancel01Icon,
  Download01Icon,
  Share01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

/**
 * PWA Install Prompt Component
 * Shows a visual install banner for Android (beforeinstallprompt)
 * and iOS Safari instructions (share → add to home screen).
 */
export default function PWAInstallPrompt() {
  const [showBanner, setShowBanner] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    // Already installed — skip
    if (
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as any).standalone === true
    ) {
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

    const isMobile =
      /Android|iPhone|iPad|iPod/i.test(navigator.userAgent) ||
      window.innerWidth <= 768;
    if (!isMobile) {
      return;
    }

    const ios =
      /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    setIsIOS(ios);

    // Android / Chrome: listen for beforeinstallprompt
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setTimeout(() => setShowBanner(true), 4000);
    };
    window.addEventListener("beforeinstallprompt", handler);

    // iOS Safari: show instructions after delay
    if (ios) {
      const iosSafari =
        /Safari/i.test(navigator.userAgent) &&
        !/CriOS|FxiOS/i.test(navigator.userAgent);
      if (iosSafari) {
        setTimeout(() => setShowBanner(true), 4000);
      }
    }

    // Listen for successful install
    window.addEventListener("appinstalled", () => {
      toast.success("GamerZone הותקן בהצלחה!");
      setShowBanner(false);
      setDeferredPrompt(null);
    });

    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) {
      return;
    }
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      toast.success("תודה שהתקנת את GamerZone!");
    }
    setDeferredPrompt(null);
    setShowBanner(false);
  };

  const handleDismiss = () => {
    setShowBanner(false);
    localStorage.setItem(
      "pwa-install-dismissed",
      JSON.stringify({ timestamp: Date.now() })
    );
  };

  if (!showBanner) {
    return null;
  }

  return (
    <div className="slide-in-from-bottom fixed right-4 bottom-20 left-4 z-[60] animate-in duration-500 md:bottom-6">
      <div className="mx-auto max-w-md rounded-2xl border border-white/10 bg-[#0e0e1b] p-4 shadow-2xl shadow-black/50 backdrop-blur-xl">
        <button
          className="touch-compact absolute top-3 left-3 rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-white/10 hover:text-white"
          onClick={handleDismiss}
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
            <h3 className="mb-1 font-bold text-sm text-white">
              התקן את GamerZone
            </h3>
            <p className="mb-3 text-gray-400 text-xs leading-relaxed">
              גישה מהירה מהמסך הראשי, התראות ומצב אופליין
            </p>

            {isIOS ? (
              /* iOS Safari instructions */
              <div className="space-y-2 rounded-xl bg-white/5 p-3">
                <div className="flex items-center gap-2 text-gray-300 text-xs">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-blue-500/20 font-bold text-[10px] text-blue-400">
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
                <div className="flex items-center gap-2 text-gray-300 text-xs">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-blue-500/20 font-bold text-[10px] text-blue-400">
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
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-2.5 font-bold text-black text-sm transition-all hover:bg-primary/90"
                onClick={handleInstall}
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
