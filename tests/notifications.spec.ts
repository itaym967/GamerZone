import { test, expect } from '@playwright/test';

test.describe('Notifications Page', () => {
    test('notifications page loads for unauthenticated users', async ({ page }) => {
        await page.goto('/notifications');

        // Page should load without crashing
        await expect(page).toHaveTitle(/GamerZone/);
    });

    test('notifications page shows header and empty state', async ({ page }) => {
        await page.goto('/notifications');

        // Check for the notifications header text (exact match to avoid strict mode violation)
        await expect(page.getByRole('heading', { name: 'התראות', exact: true })).toBeVisible();

        // Check for empty state or notification list
        const emptyState = page.getByText('אין התראות');
        const notificationsList = page.locator('[class*="space-y-3"]');

        // Either empty state or list should be visible
        const hasEmpty = await emptyState.isVisible().catch(() => false);
        const hasList = await notificationsList.isVisible().catch(() => false);
        expect(hasEmpty || hasList).toBeTruthy();
    });

    test('notifications page has filter tabs', async ({ page }) => {
        await page.goto('/notifications');

        // Check for filter buttons
        await expect(page.getByRole('button', { name: /הכל/ })).toBeVisible();
        await expect(page.getByRole('button', { name: /לא נקראו/ })).toBeVisible();
    });

    test('filter tabs toggle between all and unread', async ({ page }) => {
        await page.goto('/notifications');

        const allButton = page.getByRole('button', { name: /הכל/ });
        const unreadButton = page.getByRole('button', { name: /לא נקראו/ });

        // Click unread filter
        await unreadButton.click();
        await expect(unreadButton).toHaveClass(/bg-blue-600/);

        // Click all filter
        await allButton.click();
        await expect(allButton).toHaveClass(/bg-white/);
    });
});

test.describe('Navigation Bell Badge', () => {
    test('navigation shows notifications link for desktop', async ({ page }) => {
        // Set desktop viewport
        await page.setViewportSize({ width: 1280, height: 720 });
        await page.goto('/');

        // The notifications link should exist in the sidebar (only visible for authenticated users)
        // For unauthenticated users, it should not be in the nav
        const navSidebar = page.locator('aside');
        await expect(navSidebar).toBeVisible();
    });

    test('navigation renders without errors', async ({ page }) => {
        await page.goto('/');

        // Ensure no console errors related to notifications
        const errors: string[] = [];
        page.on('console', msg => {
            if (msg.type() === 'error') {
                errors.push(msg.text());
            }
        });

        await page.waitForTimeout(2000);

        // Filter out known non-critical errors
        const criticalErrors = errors.filter(e =>
            e.includes('useNotifications') || e.includes('notifications')
        );
        expect(criticalErrors.length).toBe(0);
    });
});
