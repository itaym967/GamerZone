// Service Worker for GamerZone PWA
// Version 2.0.1 - cache bust for production clients

const CACHE_NAME = "gamerzone-v14";
const RUNTIME_CACHE = "gamerzone-runtime-v14";
const STATIC_ASSET_REGEX = /\.(woff2?|png|jpg|jpeg|gif|ico|svg)$/;

// Precache static assets + offline fallback page
const PRECACHE_ASSETS = [
  "/manifest.json",
  "/offline.html",
  "/avatars/gamer.png",
  "/avatars/samurai.png",
  "/avatars/ninja.png",
  "/avatars/hacker.png",
  "/avatars/girl_pink.png",
  "/avatars/girl_blue.png",
];

// Install event - precache critical assets
self.addEventListener("install", (event) => {
  console.log("[SW] Installing service worker v2.0.1");
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => {
        console.log("[SW] Precaching critical assets");
        return cache.addAll(PRECACHE_ASSETS);
      })
      .then(() => {
        // Skip waiting to activate immediately
        return self.skipWaiting();
      })
  );
});

// Activate event - clean old caches
self.addEventListener("activate", (event) => {
  console.log("[SW] Activating service worker");
  event.waitUntil(
    Promise.all([
      // Clean old caches
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((name) => name !== CACHE_NAME && name !== RUNTIME_CACHE)
            .map((name) => {
              console.log("[SW] Deleting old cache:", name);
              return caches.delete(name);
            })
        );
      }),
      // Take control of all clients immediately
      self.clients.claim(),
    ])
  );
});

// Listen for messages from the app (e.g. auth state changes)
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "CLEAR_CACHES") {
    console.log("[SW] Clearing all runtime caches due to auth change");
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name === RUNTIME_CACHE)
          .map((name) => caches.delete(name))
      );
    });
  }
});

// Fetch event - improved caching strategy
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip cross-origin requests unless it's Supabase Storage
  if (url.origin !== location.origin) {
    // 1. Supabase Storage Images - Stale While Revalidate
    // Cache external images for speed, but update in background
    if (url.href.includes("/storage/v1/object/public/")) {
      event.respondWith(
        caches.match(request).then((cachedResponse) => {
          const fetchPromise = fetch(request).then((networkResponse) => {
            if (networkResponse.ok) {
              const responseClone = networkResponse.clone();
              caches.open(RUNTIME_CACHE).then((cache) => {
                cache.put(request, responseClone);
              });
            }
            return networkResponse;
          });
          // Return cached response immediately if available, else fetch
          return cachedResponse || fetchPromise;
        })
      );
    }
    return;
  }

  // 2. API requests, Auth, and Next.js data requests - NETWORK ONLY (never cache)
  if (
    url.pathname.startsWith("/api/") ||
    url.pathname.startsWith("/supabase/") ||
    url.pathname.startsWith("/auth/") ||
    url.pathname.startsWith("/_next/data/") ||
    url.pathname === "/login" ||
    url.pathname === "/signup" ||
    url.pathname === "/logout" ||
    url.href.includes("supabase.co") ||
    request.headers.get("RSC") === "1" ||
    request.headers.get("Next-Router-State-Tree")
  ) {
    return;
  }

  // 3. Next.js build assets/chunks - DO NOT CACHE in SW
  // Prevent stale chunk/module errors after deploys or icon-library migrations.
  if (url.pathname.startsWith("/_next/static/")) {
    return;
  }

  // 4. Static media assets - Cache First
  if (url.pathname.match(STATIC_ASSET_REGEX)) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }
        return fetch(request).then((response) => {
          if (response.ok) {
            const responseClone = response.clone();
            caches.open(RUNTIME_CACHE).then((cache) => {
              cache.put(request, responseClone);
            });
          }
          return response;
        });
      })
    );
    return;
  }

  // 5. Navigation Requests - NETWORK ONLY (never cache HTML pages)
  // HTML pages contain auth-dependent content and must always be fresh
  if (request.mode === "navigate") {
    event.respondWith(
      (async () => {
        try {
          // Consume preloadResponse if available to avoid warnings
          if (event.preloadResponse) {
            const preloadResponse = await event.preloadResponse.catch(
              () => null
            );
            if (preloadResponse) {
              return preloadResponse;
            }
          }
          return await fetch(request);
        } catch (_error) {
          // Only serve offline fallback page when network fails
          const offlinePage = await caches.match("/offline.html");
          if (offlinePage) {
            return offlinePage;
          }
          return new Response("Offline", {
            status: 503,
            statusText: "Offline",
          });
        }
      })()
    );
    return;
  }

  // 6. All other requests - Network only (no dangerous SWR fallback)
  // This prevents caching Next.js RSC payloads and dynamic data
});

// Push notification event - improved with tag-based dedup and renotify
self.addEventListener("push", (event) => {
  console.log("[SW] Push notification received");

  if (event.data) {
    let data;
    try {
      data = event.data.json();
    } catch (e) {
      console.error("[SW] Failed to parse push data:", e);
      return;
    }

    // Tag-based dedup: same tag replaces previous notification
    const tag = data.tag || `gz-${Date.now()}`;
    const options = {
      body: data.body || data.message,
      icon: "/icons/icon-192x192.svg",
      badge: "/icons/icon-72x72.svg",
      vibrate: [100, 50, 100],
      tag,
      renotify: true,
      requireInteraction: false,
      silent: data.silent,
      data: {
        dateOfArrival: Date.now(),
        url: data.url || "/",
        type: data.type || "general",
      },
      actions: [
        {
          action: "open",
          title: "פתח",
        },
        {
          action: "close",
          title: "סגור",
        },
      ],
    };

    event.waitUntil(
      self.registration.showNotification(data.title || "GamerZone", options)
    );
  }
});

// Notification click event - improved with full URL resolution
self.addEventListener("notificationclick", (event) => {
  console.log("[SW] Notification clicked:", event.action);
  event.notification.close();

  if (event.action === "close") {
    return;
  }

  const urlToOpen = new URL(
    event.notification.data.url || "/",
    self.location.origin
  ).href;

  event.waitUntil(
    clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clientList) => {
        // Try to focus existing window and navigate
        for (const client of clientList) {
          if ("focus" in client) {
            client.focus();
            client.postMessage({
              type: "NOTIFICATION_CLICK",
              url: urlToOpen,
            });
            return;
          }
        }
        // Open new window if none found
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })
  );
});

// Background sync event (for offline message queue)
self.addEventListener("sync", (event) => {
  console.log("[SW] Background sync:", event.tag);

  if (event.tag === "sync-messages") {
    event.waitUntil(syncMessages());
  }
});

async function syncMessages() {
  console.log("[SW] Syncing offline messages...");
  try {
    // Read queued messages from IndexedDB
    const db = await openOfflineDB();
    const tx = db.transaction("outbox", "readonly");
    const store = tx.objectStore("outbox");
    const messages = await getAllFromStore(store);

    if (messages.length === 0) {
      console.log("[SW] No offline messages to sync");
      return;
    }

    console.log(`[SW] Syncing ${messages.length} offline messages`);

    // Send each queued message
    for (const msg of messages) {
      try {
        const response = await fetch("/api/send-offline-message", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(msg.data),
        });

        if (response.ok) {
          // Remove from outbox on success
          const deleteTx = db.transaction("outbox", "readwrite");
          deleteTx.objectStore("outbox").delete(msg.id);
        }
      } catch (err) {
        console.error("[SW] Failed to sync message:", err);
      }
    }
  } catch (err) {
    console.error("[SW] Sync failed:", err);
  }
}

// IndexedDB helpers for offline queue
function openOfflineDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("gamerzone-offline", 1);
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains("outbox")) {
        db.createObjectStore("outbox", { keyPath: "id", autoIncrement: true });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function getAllFromStore(store) {
  return new Promise((resolve, reject) => {
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// Periodic background sync (for checking new messages)
self.addEventListener("periodicsync", (event) => {
  if (event.tag === "check-messages") {
    event.waitUntil(checkForNewMessages());
  }
});

function checkForNewMessages() {
  console.log("[SW] Checking for new messages...");
  // Implementation for periodic message checks
}
