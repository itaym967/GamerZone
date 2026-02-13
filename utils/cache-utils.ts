/**
 * Centralized cache utilities for GamerZone
 * Handles clearing all browser caches on auth state changes
 */

const PROFILE_CACHE_KEY = 'gamerzone_profile_cache';
const DASHBOARD_CACHE_PREFIX = 'gamerzone_dashboard_cache';

/**
 * Clear all app-related sessionStorage caches
 */
export function clearAllSessionCaches() {
    if (typeof window === 'undefined') return;
    try {
        const keysToRemove: string[] = [];
        for (let i = 0; i < sessionStorage.length; i++) {
            const key = sessionStorage.key(i);
            if (key && key.startsWith('gamerzone_')) {
                keysToRemove.push(key);
            }
        }
        keysToRemove.forEach(key => sessionStorage.removeItem(key));
    } catch {}
}

/**
 * Tell the Service Worker to clear its runtime caches
 */
export function clearServiceWorkerCaches() {
    if (typeof window === 'undefined') return;
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({
            type: 'CLEAR_CACHES'
        });
    }
}

/**
 * Clear everything on auth state change (sign-in, sign-out)
 * This is the nuclear option that fixes all stale data issues
 */
export function clearAllCachesOnAuthChange() {
    clearAllSessionCaches();
    clearServiceWorkerCaches();
}
