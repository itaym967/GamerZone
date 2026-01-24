// Service Worker for GamerZone PWA
// Version 1.0.0

const CACHE_NAME = 'gamerzone-v1';
const RUNTIME_CACHE = 'gamerzone-runtime-v1';

// Assets to cache on install
const PRECACHE_ASSETS = [
    '/',
    '/login',
    '/signup',
    '/chat',
    '/explore',
    '/profile',
    '/globals.css',
    '/favicon.ico',
];

// Install event - cache essential assets
self.addEventListener('install', (event) => {
    console.log('[SW] Installing service worker...');
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            console.log('[SW] Precaching app shell');
            return cache.addAll(PRECACHE_ASSETS);
        })
    );
    self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
    console.log('[SW] Activating service worker...');
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME && cacheName !== RUNTIME_CACHE) {
                        console.log('[SW] Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
    self.clients.claim();
});

// Fetch event - network first, fallback to cache
self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);

    // Skip cross-origin requests
    if (url.origin !== location.origin) {
        return;
    }

    // API requests - network first, cache fallback
    if (url.pathname.startsWith('/api/')) {
        event.respondWith(
            fetch(request)
                .then((response) => {
                    // Clone and cache successful responses
                    if (response.ok) {
                        const responseClone = response.clone();
                        caches.open(RUNTIME_CACHE).then((cache) => {
                            cache.put(request, responseClone);
                        });
                    }
                    return response;
                })
                .catch(() => {
                    // Fallback to cache
                    return caches.match(request);
                })
        );
        return;
    }

    // Static assets - cache first, network fallback
    event.respondWith(
        caches.match(request).then((cachedResponse) => {
            if (cachedResponse) {
                return cachedResponse;
            }

            return fetch(request).then((response) => {
                // Cache successful responses
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
});

// Push notification event
self.addEventListener('push', (event) => {
    console.log('[SW] Push notification received');

    if (event.data) {
        const data = event.data.json();
        const options = {
            body: data.body || data.message,
            icon: '/icons/icon-192x192.png',
            badge: '/icons/icon-72x72.png',
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
