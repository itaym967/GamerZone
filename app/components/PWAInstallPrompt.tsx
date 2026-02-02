"use client";

import { useEffect, useState } from 'react';
import { toast } from 'sonner';

/**
 * PWA Install Prompt Component
 * Shows a custom install prompt when the app can be installed (mobile only)
 */
export default function PWAInstallPrompt() {
    const [hasShownPrompt, setHasShownPrompt] = useState(false);

    useEffect(() => {
        let deferredPrompt: any = null;

        // Check if device is mobile
        const isMobile = () => {
            return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
                   (window.innerWidth <= 768);
        };

        const handleBeforeInstallPrompt = (e: Event) => {
            // Only show on mobile devices
            if (!isMobile()) {
                return;
            }

            // Prevent the mini-infobar from appearing on mobile
            e.preventDefault();
            // Stash the event so it can be triggered later
            deferredPrompt = e;

            // Show custom install prompt after a delay
            setTimeout(() => {
                showInstallPrompt();
            }, 5000); // Wait 5 seconds before showing
        };

        const showInstallPrompt = () => {
            if (!deferredPrompt || hasShownPrompt) return;

            // Check if user has already dismissed the prompt (with expiry)
            const dismissedData = localStorage.getItem('pwa-install-dismissed');
            if (dismissedData) {
                try {
                    const { timestamp } = JSON.parse(dismissedData);
                    const daysSinceDismissed = (Date.now() - timestamp) / (1000 * 60 * 60 * 24);
                    // Only show again after 7 days
                    if (daysSinceDismissed < 7) return;
                } catch {
                    // Invalid data, continue to show prompt
                }
            }

            setHasShownPrompt(true);

            toast('התקן את GamerZone', {
                description: 'קבל גישה מהירה ועבוד במצב לא מקוון',
                duration: 10000,
                action: {
                    label: 'התקן',
                    onClick: async () => {
                        if (deferredPrompt) {
                            // Show the install prompt
                            deferredPrompt.prompt();

                            // Wait for the user to respond to the prompt
                            const { outcome } = await deferredPrompt.userChoice;

                            console.log(`User response to install prompt: ${outcome}`);

                            if (outcome === 'accepted') {
                                toast.success('תודה שהתקנת את GamerZone! 🎮');
                            }

                            // Clear the deferredPrompt
                            deferredPrompt = null;
                        }
                    },
                },
                cancel: {
                    label: 'אולי מאוחר יותר',
                    onClick: () => {
                        localStorage.setItem('pwa-install-dismissed', JSON.stringify({
                            timestamp: Date.now()
                        }));
                    },
                },
            });
        };

        // Listen for the beforeinstallprompt event
        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

        // Check if app is already installed
        if (window.matchMedia('(display-mode: standalone)').matches) {
            console.log('App is running in standalone mode (installed)');
        }

        // Listen for app installed event
        window.addEventListener('appinstalled', () => {
            console.log('PWA was installed');
            toast.success('GamerZone הותקן בהצלחה! 🎉');
            deferredPrompt = null;
        });

        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        };
    }, []);

    return null; // This component doesn't render anything
}
