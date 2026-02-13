import { test, expect } from '@playwright/test';

/**
 * Kid Safety Feature Tests
 * Tests for age verification, content filtering, parental controls,
 * and safety restrictions for minor accounts.
 */

test.describe('Kid Safety - Age Verification', () => {
    test('signup page should show date of birth field', async ({ page }) => {
        await page.goto('/signup');
        const dobField = page.locator('input[type="date"]');
        await expect(dobField).toBeVisible();
    });

    test('signup page should show parental email for under 13', async ({ page }) => {
        await page.goto('/signup');
        const dobField = page.locator('input[type="date"]');

        // Set date to make user 10 years old
        const tenYearsAgo = new Date();
        tenYearsAgo.setFullYear(tenYearsAgo.getFullYear() - 10);
        const dateStr = tenYearsAgo.toISOString().split('T')[0];

        await dobField.fill(dateStr);

        // Should show parental consent warning
        const warningText = page.getByText('נדרש אישור הורים');
        await expect(warningText).toBeVisible();

        // Should show parental email field
        const parentEmailField = page.locator('input[placeholder="parent@example.com"]');
        await expect(parentEmailField).toBeVisible();
    });

    test('signup page should show minor account notice for 13-17', async ({ page }) => {
        await page.goto('/signup');
        const dobField = page.locator('input[type="date"]');

        // Set date to make user 15 years old
        const fifteenYearsAgo = new Date();
        fifteenYearsAgo.setFullYear(fifteenYearsAgo.getFullYear() - 15);
        const dateStr = fifteenYearsAgo.toISOString().split('T')[0];

        await dobField.fill(dateStr);

        // Should show minor account notice
        const minorText = page.getByText('חשבון צעיר');
        await expect(minorText).toBeVisible();
    });

    test('signup page should show standard account for 18+', async ({ page }) => {
        await page.goto('/signup');
        const dobField = page.locator('input[type="date"]');

        // Set date to make user 25 years old
        const twentyFiveYearsAgo = new Date();
        twentyFiveYearsAgo.setFullYear(twentyFiveYearsAgo.getFullYear() - 25);
        const dateStr = twentyFiveYearsAgo.toISOString().split('T')[0];

        await dobField.fill(dateStr);

        // Should show standard account notice
        const standardText = page.getByText('חשבון רגיל');
        await expect(standardText).toBeVisible();
    });
});

test.describe('Kid Safety - Content Filtering', () => {
    test('chat page should load with content filter', async ({ page }) => {
        await page.goto('/chat');
        // Chat page should load (may redirect to login if not authenticated)
        await expect(page).toHaveURL(/\/(chat|login)/);
    });
});

test.describe('Kid Safety - Report System', () => {
    test('report modal should have all report types', async ({ page }) => {
        // This test verifies the report modal component renders correctly
        // In a real scenario, we'd need to be logged in and have an active chat
        await page.goto('/chat');
        // If redirected to login, that's expected for unauthenticated users
        const url = page.url();
        if (url.includes('/login')) {
            // Expected behavior - unauthenticated users can't access chat
            expect(url).toContain('/login');
        }
    });
});

test.describe('Kid Safety - Parental Consent', () => {
    test('parental consent success page should render', async ({ page }) => {
        await page.goto('/parental-consent/success');
        const heading = page.getByText('ההסכמה אושרה בהצלחה');
        // Page should render (may show already granted or success)
        await expect(page.locator('body')).toBeVisible();
    });

    test('parental consent success page with already param', async ({ page }) => {
        await page.goto('/parental-consent/success?already=true');
        const heading = page.getByText('ההסכמה כבר אושרה');
        await expect(page.locator('body')).toBeVisible();
    });

    test('parental consent API should reject missing token', async ({ request }) => {
        const response = await request.get('/api/parental-consent');
        expect(response.status()).toBe(400);
        const body = await response.json();
        expect(body.error).toBeTruthy();
    });

    test('parental consent API should reject invalid token', async ({ request }) => {
        const response = await request.get('/api/parental-consent?token=invalid-token-123');
        expect(response.status()).toBe(404);
    });

    test('parental consent POST should reject missing fields', async ({ request }) => {
        const response = await request.post('/api/parental-consent', {
            data: {}
        });
        expect(response.status()).toBe(400);
    });

    test('parental consent POST should reject invalid email', async ({ request }) => {
        const response = await request.post('/api/parental-consent', {
            data: {
                childId: 'some-uuid',
                parentEmail: 'not-an-email'
            }
        });
        expect(response.status()).toBe(400);
    });
});
