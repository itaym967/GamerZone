"use client";

import { useState, useEffect } from "react";
import { Gamepad2 } from "lucide-react";

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

    if (!isStandalone || !visible) return null;

    return (
        <div className={`splash-screen ${!visible ? "hidden" : ""}`}>
            <div className="splash-icon bg-primary p-5 rounded-2xl text-black mb-6">
                <Gamepad2 size={48} />
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">GamerZone</h1>
            <p className="text-gray-400 text-sm">מצא את הסקוואד שלך</p>
            <div className="mt-8 flex gap-1.5">
                <span className="w-2 h-2 rounded-full bg-primary animate-bounce [animation-delay:-0.3s]" />
                <span className="w-2 h-2 rounded-full bg-primary animate-bounce [animation-delay:-0.15s]" />
                <span className="w-2 h-2 rounded-full bg-primary animate-bounce" />
            </div>
        </div>
    );
}
