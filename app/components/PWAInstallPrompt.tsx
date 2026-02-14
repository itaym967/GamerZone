"use client";

import { useEffect, useState } from 'react';
import { Download, Share, X, Plus } from 'lucide-react';
import { toast } from 'sonner';

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
        if (window.matchMedia('(display-mode: standalone)').matches ||
            (window.navigator as any).standalone === true) {
            return;
        }

        // Check dismiss cooldown (7 days)
        const dismissedData = localStorage.getItem('pwa-install-dismissed');
        if (dismissedData) {
            try {
                const { timestamp } = JSON.parse(dismissedData);
                if ((Date.now() - timestamp) / 86400000 < 7) return;
            } catch { /* continue */ }
        }

        const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent) || window.innerWidth <= 768;
        if (!isMobile) return;

        const ios = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
        setIsIOS(ios);

        // Android / Chrome: listen for beforeinstallprompt
        const handler = (e: Event) => {
            e.preventDefault();
            setDeferredPrompt(e);
            setTimeout(() => setShowBanner(true), 4000);
        };
        window.addEventListener('beforeinstallprompt', handler);

        // iOS Safari: show instructions after delay
        if (ios) {
            const iosSafari = /Safari/i.test(navigator.userAgent) && !/CriOS|FxiOS/i.test(navigator.userAgent);
            if (iosSafari) {
                setTimeout(() => setShowBanner(true), 4000);
            }
        }

        // Listen for successful install
        window.addEventListener('appinstalled', () => {
            toast.success('GamerZone הותקן בהצלחה!');
            setShowBanner(false);
            setDeferredPrompt(null);
        });

        return () => window.removeEventListener('beforeinstallprompt', handler);
    }, []);

    const handleInstall = async () => {
        if (!deferredPrompt) return;
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') {
            toast.success('תודה שהתקנת את GamerZone!');
        }
        setDeferredPrompt(null);
        setShowBanner(false);
    };

    const handleDismiss = () => {
        setShowBanner(false);
        localStorage.setItem('pwa-install-dismissed', JSON.stringify({ timestamp: Date.now() }));
    };

    if (!showBanner) return null;

    return (
        <div className="fixed bottom-20 md:bottom-6 left-4 right-4 z-[60] animate-in slide-in-from-bottom duration-500">
            <div className="max-w-md mx-auto bg-[#0e0e1b] border border-white/10 rounded-2xl p-4 shadow-2xl shadow-black/50 backdrop-blur-xl">
                <button
                    onClick={handleDismiss}
                    className="absolute top-3 left-3 p-1.5 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors touch-compact"
                >
                    <X size={16} />
                </button>

                <div className="flex items-start gap-3">
                    <div className="shrink-0 w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center border border-primary/20">
                        <Download size={24} className="text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <h3 className="text-white font-bold text-sm mb-1">התקן את GamerZone</h3>
                        <p className="text-gray-400 text-xs leading-relaxed mb-3">
                            גישה מהירה מהמסך הראשי, התראות ומצב אופליין
                        </p>

                        {isIOS ? (
                            /* iOS Safari instructions */
                            <div className="bg-white/5 rounded-xl p-3 space-y-2">
                                <div className="flex items-center gap-2 text-xs text-gray-300">
                                    <span className="shrink-0 w-5 h-5 bg-blue-500/20 rounded-md flex items-center justify-center text-blue-400 font-bold text-[10px]">1</span>
                                    <span>לחץ על</span>
                                    <Share size={14} className="text-blue-400 shrink-0" />
                                    <span>בתפריט הדפדפן</span>
                                </div>
                                <div className="flex items-center gap-2 text-xs text-gray-300">
                                    <span className="shrink-0 w-5 h-5 bg-blue-500/20 rounded-md flex items-center justify-center text-blue-400 font-bold text-[10px]">2</span>
                                    <span>בחר</span>
                                    <Plus size={14} className="text-blue-400 shrink-0" />
                                    <span>&quot;הוסף למסך הבית&quot;</span>
                                </div>
                            </div>
                        ) : (
                            /* Android / Chrome install button */
                            <button
                                onClick={handleInstall}
                                className="w-full bg-primary text-black font-bold py-2.5 rounded-xl text-sm hover:bg-primary/90 transition-all flex items-center justify-center gap-2"
                            >
                                <Download size={16} />
                                התקן עכשיו
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
