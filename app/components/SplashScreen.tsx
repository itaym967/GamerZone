"use client";

import { Gamepad2 } from "lucide-react";
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
        <Gamepad2 size={48} />
      </div>
      <h1 className="mb-2 font-bold text-2xl text-white">GamerZone</h1>
      <p className="text-gray-400 text-sm">מצא את הסקוואד שלך</p>
      <div className="mt-8 flex gap-1.5">
        <span className="h-2 w-2 animate-bounce rounded-full bg-primary [animation-delay:-0.3s]" />
        <span className="h-2 w-2 animate-bounce rounded-full bg-primary [animation-delay:-0.15s]" />
        <span className="h-2 w-2 animate-bounce rounded-full bg-primary" />
      </div>
    </div>
  );
}
