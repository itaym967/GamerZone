"use client";

import { useEffect } from "react";
import { toast } from "sonner";

/**
 * Service Worker Registration Component
 * Registers the service worker, handles updates, and listens for
 * notification click messages to navigate within the app.
 */
export default function ServiceWorkerRegistration() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) {
      return;
    }

    // Track whether we already had a controller when the page loaded.
    // If not, the first controllerchange is just the initial activation
    // and should NOT trigger a reload.
    const hadController = !!navigator.serviceWorker.controller;
    let reloading = false;
    let updateInterval: ReturnType<typeof setInterval> | undefined;
    let isUnmounted = false;

    const SW_VERSION = "2026-03-02-logout-fix";

    navigator.serviceWorker
      .register(`/sw.js?v=${SW_VERSION}`)
      .then((registration) => {
        if (isUnmounted) {
          return;
        }
        // Check for updates periodically
        updateInterval = setInterval(() => {
          if (
            !(
              registration.active ||
              registration.waiting ||
              registration.installing
            )
          ) {
            return;
          }
          registration.update().catch((error: unknown) => {
            console.warn("[SW] Update check failed:", error);
          });
        }, 60_000);

        // Listen for updates
        registration.addEventListener("updatefound", () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener("statechange", () => {
              if (
                newWorker.state === "installed" &&
                navigator.serviceWorker.controller
              ) {
                toast.info("עדכון חדש זמין!", {
                  description: "לחץ כאן כדי לרענן את האפליקציה",
                  duration: 10_000,
                  action: {
                    label: "רענן",
                    onClick: () => window.location.reload(),
                  },
                });
              }
            });
          }
        });
      })
      .catch((error) => {
        console.error("[SW] Registration failed:", error);
      });

    // Handle controller change (new service worker activated)
    // Only reload if we already had a controller (i.e. this is an UPDATE,
    // not the very first SW activation). Guard against multiple reloads.
    const onControllerChange = () => {
      if (!hadController || reloading) {
        return;
      }
      reloading = true;
      window.location.reload();
    };
    navigator.serviceWorker.addEventListener(
      "controllerchange",
      onControllerChange
    );

    // Handle notification click navigation from SW
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === "NOTIFICATION_CLICK" && event.data.url) {
        const url = new URL(event.data.url);
        window.location.assign(url.pathname + url.search);
      }
    };
    navigator.serviceWorker.addEventListener("message", handleMessage);

    return () => {
      isUnmounted = true;
      if (updateInterval) {
        clearInterval(updateInterval);
      }
      navigator.serviceWorker.removeEventListener(
        "controllerchange",
        onControllerChange
      );
      navigator.serviceWorker.removeEventListener("message", handleMessage);
    };
  }, []);

  return null;
}
