"use client";

import { useEffect } from 'react';

/**
 * Service Worker Registration Component
 * Registers the service worker for PWA functionality
 */
export default function ServiceWorkerRegistration() {
    useEffect(() => {
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker
                .register('/sw.js')
                .then((registration) => {
                    console.log('[SW] Service Worker registered successfully:', registration.scope);

                    // Check for updates periodically
                    setInterval(() => {
                        registration.update();
                    }, 60000); // Check every minute

                    // Listen for updates
                    registration.addEventListener('updatefound', () => {
                        const newWorker = registration.installing;
                        if (newWorker) {
                            newWorker.addEventListener('statechange', () => {
                                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                                    // New service worker available
                                    console.log('[SW] New service worker available');

                                    // Optionally show update notification
                                    if (confirm('עדכון חדש זמין! לחץ OK כדי לרענן את האפליקציה.')) {
                                        window.location.reload();
                                    }
                                }
                            });
                        }
                    });
                })
                .catch((error) => {
                    console.error('[SW] Service Worker registration failed:', error);
                });

            // Handle controller change (new service worker activated)
            navigator.serviceWorker.addEventListener('controllerchange', () => {
                console.log('[SW] Controller changed, reloading page');
                window.location.reload();
            });
        }
    }, []);

    return null;
}
