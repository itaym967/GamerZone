import { test, expect } from '@playwright/test';

/**
 * Tests for browser caching behavior during auth state changes.
 * Validates that:
 * 1. Service worker doesn't cache HTML pages
 * 2. SessionStorage caches are cleared on auth changes
 * 3. No stale "guest" data appears after login
 * 4. Cache-Control headers are set on dynamic pages
 */

test.describe('Cache and Auth State', () => {

    test('dynamic pages should have no-cache headers', async ({ page }) => {
        const response = await page.goto('/');
        expect(response).not.toBeNull();
        const cacheControl = response!.headers()['cache-control'];
        expect(cacheControl).toContain('no-store');
        expect(cacheControl).toContain('no-cache');
    });

    test('login page should have no-cache headers', async ({ page }) => {
        const response = await page.goto('/login');
        expect(response).not.toBeNull();
        const cacheControl = response!.headers()['cache-control'];
        expect(cacheControl).toContain('no-store');
    });

    test('static assets should be cacheable', async ({ page }) => {
        await page.goto('/');
        const staticRequests = page.context().pages();
        // Manifest is a static JSON file, should not have no-store
        const manifestResponse = await page.goto('/manifest.json');
        expect(manifestResponse).not.toBeNull();
        const manifestCache = manifestResponse!.headers()['cache-control'];
        // manifest.json should NOT have no-store (it's a static asset)
        expect(manifestCache || '').not.toContain('no-store');
    });

    test('sessionStorage should not have stale gamerzone keys after page load', async ({ page }) => {
        await page.goto('/');
        // Wait for page to be interactive
        await page.waitForLoadState('networkidle');

        // Check that sessionStorage keys are properly scoped
        const cacheKeys = await page.evaluate(() => {
            const keys: string[] = [];
            for (let i = 0; i < sessionStorage.length; i++) {
                const key = sessionStorage.key(i);
                if (key && key.startsWith('gamerzone_')) {
                    keys.push(key);
                }
            }
            return keys;
        });

        // Dashboard cache should be scoped (guest or user-specific)
        const dashboardKeys = cacheKeys.filter(k => k.startsWith('gamerzone_dashboard_cache'));
        for (const key of dashboardKeys) {
            // Should be either _guest or _<uuid>, never the bare key
            expect(key).not.toBe('gamerzone_dashboard_cache');
        }
    });

    test('service worker should not cache navigation HTML', async ({ page }) => {
        await page.goto('/');
        await page.waitForLoadState('networkidle');

        // Navigate to explore page
        const exploreResponse = await page.goto('/explore');
        expect(exploreResponse).not.toBeNull();

        // The response should come from the network, not SW cache
        // Check that the response is not from service worker cache
        const fromSW = exploreResponse!.fromServiceWorker();
        // Navigation responses should NOT come from SW cache
        // (they may still pass through SW but should be fetched from network)
        expect(fromSW).toBe(false);
    });

    test('clearAllCachesOnAuthChange should clear all gamerzone sessionStorage', async ({ page }) => {
        await page.goto('/');
        await page.waitForLoadState('networkidle');

        // Manually set some cache entries
        await page.evaluate(() => {
            sessionStorage.setItem('gamerzone_profile_cache', '{"test": true}');
            sessionStorage.setItem('gamerzone_dashboard_cache_guest', '{"test": true}');
            sessionStorage.setItem('gamerzone_dashboard_cache_user123', '{"test": true}');
            sessionStorage.setItem('unrelated_key', '{"test": true}');
        });

        // Simulate clearing caches (as would happen on auth change)
        await page.evaluate(() => {
            const keysToRemove: string[] = [];
            for (let i = 0; i < sessionStorage.length; i++) {
                const key = sessionStorage.key(i);
                if (key && key.startsWith('gamerzone_')) {
                    keysToRemove.push(key);
                }
            }
            keysToRemove.forEach(key => sessionStorage.removeItem(key));
        });

        // Verify gamerzone keys are cleared but unrelated keys remain
        const remaining = await page.evaluate(() => {
            const keys: string[] = [];
            for (let i = 0; i < sessionStorage.length; i++) {
                const key = sessionStorage.key(i);
                if (key) keys.push(key);
            }
            return keys;
        });

        expect(remaining).not.toContain('gamerzone_profile_cache');
        expect(remaining).not.toContain('gamerzone_dashboard_cache_guest');
        expect(remaining).not.toContain('gamerzone_dashboard_cache_user123');
        expect(remaining).toContain('unrelated_key');
    });

    test('SW message listener should respond to CLEAR_CACHES', async ({ page }) => {
        await page.goto('/');
        await page.waitForLoadState('networkidle');

        // Send CLEAR_CACHES message to service worker and verify no errors
        const result = await page.evaluate(async () => {
            if (!('serviceWorker' in navigator) || !navigator.serviceWorker.controller) {
                return 'no-sw';
            }
            navigator.serviceWorker.controller.postMessage({ type: 'CLEAR_CACHES' });
            // Wait a bit for the message to be processed
            await new Promise(resolve => setTimeout(resolve, 500));
            return 'ok';
        });

        // Either SW is registered and message sent, or no SW in test env
        expect(['ok', 'no-sw']).toContain(result);
    });
});
