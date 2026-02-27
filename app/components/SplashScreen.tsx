"use client";
import { GameController02Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useEffect, useState } from "react";

/**
 * Splash screen shown when app launches in standalone (installed) PWA mode.
 * Fades out after content is ready.
 */
export default function SplashScreen() {
  const [visible, setVisible] = useState(true);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as any).standalone === true;
    setIsStandalone(standalone);

    if (!standalone) {
      setVisible(false);
      return;
    }

    // Hide splash after app content is ready
    const timer = setTimeout(() => setVisible(false), 1800);
    return () => clearTimeout(timer);
  }, []);

  if (!(isStandalone && visible)) {
    return null;
  }

  return (
    <div className={`splash-screen ${visible ? "" : "hidden"}`}>
      <div className="splash-icon mb-6 rounded-2xl bg-primary p-5 text-black">
        <HugeiconsIcon icon={GameController02Icon} size={48} />
      </div>
      <h1 className="mb-2 font-bold text-fluid-xl text-white">GamerZone</h1>
      <p className="text-fluid-sm text-gray-400">מצא את הסקוואד שלך</p>
      <div className="mt-8 flex gap-1.5">
        <span className="h-2 w-2 animate-bounce rounded-full bg-primary [animation-delay:-0.3s]" />
        <span className="h-2 w-2 animate-bounce rounded-full bg-primary [animation-delay:-0.15s]" />
        <span className="h-2 w-2 animate-bounce rounded-full bg-primary" />
      </div>
    </div>
  );
}
