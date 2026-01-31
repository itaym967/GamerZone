"use client";

import { useState, useEffect } from "react";
import { WifiOff } from "lucide-react";

export default function OfflineIndicator() {
    const [isOffline, setIsOffline] = useState(false);
    const [showBanner, setShowBanner] = useState(false);

    useEffect(() => {
        const handleOnline = () => {
            setIsOffline(false);
            setShowBanner(false);
        };
        const handleOffline = () => {
            setIsOffline(true);
            setShowBanner(true);
        };

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);
        setIsOffline(!navigator.onLine);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    if (!isOffline || !showBanner) return null;

    return (
        <div className="fixed top-0 left-0 right-0 z-[100] bg-yellow-500/90 text-black px-4 py-2 flex items-center justify-center gap-2 text-sm font-medium backdrop-blur-sm safe-area-pt">
            <WifiOff size={16} />
            <span>אתה במצב לא מקוון - חלק מהתכנים עשויים להיות לא מעודכנים</span>
            <button 
                onClick={() => setShowBanner(false)}
                className="mr-2 text-black/70 hover:text-black"
            >
                ✕
            </button>
        </div>
    );
}
