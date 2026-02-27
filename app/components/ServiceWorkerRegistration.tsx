"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { toast } from "sonner";

/**
 * Service Worker Registration Component
 * Registers the service worker, handles updates, and listens for
 * notification click messages to navigate within the app.
 */
export default function ServiceWorkerRegistration() {
  const router = useRouter();

  useEffect(() => {
    if (!("serviceWorker" in navigator)) {
      return;
    }

    // Track whether we already had a controller when the page loaded.
    // If not, the first controllerchange is just the initial activation
    // and should NOT trigger a reload.
    const hadController = !!navigator.serviceWorker.controller;
    let reloading = false;

    navigator.serviceWorker
      .register("/sw.js")
      .then((registration) => {
        console.log("[SW] Service Worker registered:", registration.scope);

        // Check for updates periodically
        setInterval(() => registration.update(), 60_000);

        // Listen for updates
        registration.addEventListener("updatefound", () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener("statechange", () => {
              if (
                newWorker.state === "installed" &&
                navigator.serviceWorker.controller
              ) {
                console.log("[SW] New service worker available");
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
      console.log("[SW] Controller changed (update), reloading");
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
        router.push(url.pathname + url.search);
      }
    };
    navigator.serviceWorker.addEventListener("message", handleMessage);

    return () => {
      navigator.serviceWorker.removeEventListener(
        "controllerchange",
        onControllerChange
      );
      navigator.serviceWorker.removeEventListener("message", handleMessage);
    };
  }, [router]);

  return null;
}
