"use client";

import { useEffect } from 'react';
import { toast } from 'sonner';

/**
 * PWA Install Prompt Component
 * Shows a custom install prompt when the app can be installed
 */
export default function PWAInstallPrompt() {
    useEffect(() => {
        let deferredPrompt: any = null;

        const handleBeforeInstallPrompt = (e: Event) => {
            // Prevent the mini-infobar from appearing on mobile
            e.preventDefault();
            // Stash the event so it can be triggered later
            deferredPrompt = e;

            // Show custom install prompt after a delay
            setTimeout(() => {
                showInstallPrompt();
            }, 3000); // Wait 3 seconds before showing
        };

        const showInstallPrompt = () => {
            if (!deferredPrompt) return;

            // Check if user has already dismissed the prompt
            const dismissed = localStorage.getItem('pwa-install-dismissed');
            if (dismissed) return;

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
                        localStorage.setItem('pwa-install-dismissed', 'true');
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
