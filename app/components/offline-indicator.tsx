"use client";
import { WifiOff01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useEffect, useState } from "react";

export default function OfflineIndicator() {
  const initialOffline =
    typeof navigator !== "undefined" ? !navigator.onLine : false;
  const [isOffline, setIsOffline] = useState(initialOffline);
  const [showBanner, setShowBanner] = useState(initialOffline);

  useEffect(() => {
    const handleOnline = () => {
      setIsOffline(false);
      setShowBanner(false);
    };
    const handleOffline = () => {
      setIsOffline(true);
      setShowBanner(true);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  if (!(isOffline && showBanner)) {
    return null;
  }

  return (
    <div className="safe-area-pt fixed top-0 right-0 left-0 z-100 flex items-center justify-center gap-2 bg-yellow-500/90 px-4 py-2 font-medium text-black text-fluid-sm backdrop-blur-xs">
      <HugeiconsIcon icon={WifiOff01Icon} size={16} />
      <span>אתה במצב לא מקוון - חלק מהתכנים עשויים להיות לא מעודכנים</span>
      <button
        className="mr-2 text-black/70 hover:text-black"
        onClick={() => setShowBanner(false)}
        type="button"
      >
        ✕
      </button>
    </div>
  );
}
