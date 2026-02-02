// Service Worker for GamerZone PWA
// Version 1.0.3 - Fixed navigation preload cancellation

const CACHE_NAME = 'gamerzone-v7';
const RUNTIME_CACHE = 'gamerzone-runtime-v7';
const DATA_CACHE = 'gamerzone-data-v1';

// Assets to precache for instant loading
const PRECACHE_ASSETS = [
    '/',
    '/explore',
    '/login',
    '/signup',
    '/manifest.json',
    '/avatars/gamer.png',
    '/avatars/samurai.png',
    '/avatars/ninja.png',
    '/avatars/hacker.png',
    '/avatars/girl_pink.png',
    '/avatars/girl_blue.png',
];

// Install event - precache critical assets
self.addEventListener('install', (event) => {
    console.log('[SW] Installing service worker v1.0.2');
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            console.log('[SW] Precaching critical assets');
            return cache.addAll(PRECACHE_ASSETS);
        }).then(() => {
            // Skip waiting to activate immediately
            return self.skipWaiting();
        })
    );
});

// Activate event - clean old caches
self.addEventListener('activate', (event) => {
    console.log('[SW] Activating service worker');
    event.waitUntil(
        Promise.all([
            // Clean old caches
            caches.keys().then((cacheNames) => {
                return Promise.all(
                    cacheNames
                        .filter((name) => name !== CACHE_NAME && name !== RUNTIME_CACHE && name !== DATA_CACHE)
                        .map((name) => {
                            console.log('[SW] Deleting old cache:', name);
                            return caches.delete(name);
                        })
                );
            }),
            // Enable navigation preload for faster page loads
            (async () => {
                if ('navigationPreload' in self.registration) {
                    await self.registration.navigationPreload.enable();
                    console.log('[SW] Navigation preload enabled');
                }
            })(),
            // Take control of all clients immediately
            self.clients.claim()
        ])
    );
});

// Fetch event - improved caching strategy
self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);

    // Skip cross-origin requests unless it's Supabase Storage
    if (url.origin !== location.origin) {
        // 1. Supabase Storage Images - Stale While Revalidate
        // Cache external images for speed, but update in background
        if (url.href.includes('/storage/v1/object/public/')) {
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

    // 2. API requests - NETWORK ONLY
    if (url.pathname.startsWith('/api/') || url.pathname.startsWith('/supabase/')) {
        return;
    }

    // 3. Next.js Static Assets - Cache First
    if (url.pathname.startsWith('/_next/static/') || url.pathname.match(/\.(js|css|woff2?|png|jpg|jpeg|gif|ico|svg)$/)) {
        event.respondWith(
            caches.match(request).then((cachedResponse) => {
                if (cachedResponse) return cachedResponse;
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

    // 4. Navigation Requests - Network First with Preload
    if (request.mode === 'navigate') {
        event.respondWith(
            (async () => {
                try {
                    // Use navigation preload if available, with proper error handling
                    // to prevent "preloadResponse cancelled" warnings on redirects
                    let preloadResponse;
                    try {
                        preloadResponse = await Promise.race([
                            event.preloadResponse,
                            // Timeout to prevent hanging if preload is cancelled
                            new Promise((_, reject) => 
                                setTimeout(() => reject(new Error('preload_timeout')), 3000)
                            )
                        ]);
                    } catch (preloadError) {
                        // Preload was cancelled (e.g., due to redirect) or timed out - fall through to fetch
                        preloadResponse = null;
                    }
                    
                    if (preloadResponse) return preloadResponse;

                    const networkResponse = await fetch(request);
                    if (networkResponse.ok) {
                        const responseClone = networkResponse.clone();
                        caches.open(RUNTIME_CACHE).then((cache) => {
                            cache.put(request, responseClone);
                        });
                    }
                    return networkResponse;
                } catch (error) {
                    const cachedResponse = await caches.match(request);
                    if (cachedResponse) return cachedResponse;

                    const offlinePage = await caches.match('/offline.html');
                    if (offlinePage) return offlinePage;

                    return new Response("Offline", { status: 503, statusText: "Offline" });
                }
            })()
        );
        return;
    }

    // 5. Fallback - Stale While Revalidate (only for GET requests)
    if (request.method !== 'GET') {
        // Don't cache non-GET requests (POST, PUT, DELETE, etc.)
        return;
    }

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
            return cachedResponse || fetchPromise;
        })
    );
});

// Push notification event
self.addEventListener('push', (event) => {
    console.log('[SW] Push notification received');

    if (event.data) {
        const data = event.data.json();
        const options = {
            body: data.body || data.message,
            icon: '/icons/icon-192x192.svg',
            badge: '/icons/icon-72x72.svg',
            vibrate: [100, 50, 100],
            tag: data.tag || 'default',
            requireInteraction: false,
            data: {
                dateOfArrival: Date.now(),
                url: data.url || '/',
            },
            actions: [
                {
                    action: 'open',
                    title: 'פתח',
                },
                {
                    action: 'close',
                    title: 'סגור',
                },
            ],
        };

        event.waitUntil(
            self.registration.showNotification(data.title || 'GamerZone', options)
        );
    }
});

// Notification click event
self.addEventListener('notificationclick', (event) => {
    console.log('[SW] Notification clicked');
    event.notification.close();

    if (event.action === 'close') {
        return;
    }

    const urlToOpen = event.notification.data.url;

    event.waitUntil(
        clients
            .matchAll({ type: 'window', includeUncontrolled: true })
            .then((clientList) => {
                // Check if there's already a window open
                for (const client of clientList) {
                    if (client.url === urlToOpen && 'focus' in client) {
                        return client.focus();
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
self.addEventListener('sync', (event) => {
    console.log('[SW] Background sync:', event.tag);

    if (event.tag === 'sync-messages') {
        event.waitUntil(syncMessages());
    }
});

async function syncMessages() {
    // This would sync queued messages when back online
    console.log('[SW] Syncing offline messages...');
    // Implementation would depend on your offline queue strategy
}

// Periodic background sync (for checking new messages)
self.addEventListener('periodicsync', (event) => {
    if (event.tag === 'check-messages') {
        event.waitUntil(checkForNewMessages());
    }
});

async function checkForNewMessages() {
    console.log('[SW] Checking for new messages...');
    // Implementation for periodic message checks
}
