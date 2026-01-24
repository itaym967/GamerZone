import { test, expect } from '@playwright/test';

test('homepage has title and main text', async ({ page }) => {
    await page.goto('/');

    // Expect a title "to contain" a substring.
    await expect(page).toHaveTitle(/GamerZone/);

    // Check for the main heading text (hebrew)
    // "מוכן למצוא את הסקוואד הבא שלך?"
    await expect(page.getByText('מוכן למצוא את הסקוואד הבא שלך?')).toBeVisible();
});

test('login page loads and has email input', async ({ page }) => {
    await page.goto('/login');

    // Check for email input by placeholder
    await expect(page.getByPlaceholder('gamer@example.com')).toBeVisible();

    // Check for password input
    await expect(page.getByPlaceholder('••••••••')).toBeVisible();
});
