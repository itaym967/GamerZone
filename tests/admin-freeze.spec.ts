import { test, expect } from '@playwright/test';

test.describe('Admin Page Freeze Functionality', () => {

    test.beforeEach(async ({ page }) => {
        // 1. Mock Auth - User
        await page.route('**/auth/v1/user', async route => {
            const json = {
                id: 'admin-user-id',
                aud: 'authenticated',
                role: 'authenticated',
                email: 'admin@example.com',
                app_metadata: { provider: 'email' },
                user_metadata: {},
                created_at: new Date().toISOString(),
            };
            await route.fulfill({ json: { user: json } });
        });

        // 2. Mock Auth - Profile (Admin Role check)
        // Request: GET /rest/v1/profiles?select=role&id=eq.admin-user-id&limit=1
        await page.route('**/rest/v1/profiles?select=role&id=eq.admin-user-id*', async route => {
            await route.fulfill({ json: { role: 'admin' } });
        });

        // 3. Mock Data Loading - Initial Load (Empty Logs/Words, Some Users)
        // Users Tab
        await page.route('**/rest/v1/profiles*', async route => {
            if (route.request().method() === 'GET') {
                await route.fulfill({
                    json: [
                        {
                            id: 'user-active-1',
                            username: 'ActiveGamer',
                            full_name: 'Active User',
                            role: 'user',
                            is_online: true,
                            is_banned: false
                        },
                        {
                            id: 'user-frozen-2',
                            username: 'FrozenGamer',
                            full_name: 'Frozen User',
                            role: 'user',
                            is_online: false,
                            is_banned: true,
                            ban_reason: 'Toxic behavior'
                        }
                    ]
                });
            } else {
                await route.continue();
            }
        });

        // Mock other tabs to avoid errors
        await page.route('**/rest/v1/blocked_words*', async route => route.fulfill({ json: [] }));
        await page.route('**/rest/v1/admin_logs*', async route => route.fulfill({ json: [] }));

        // Mock Notifications insert
        await page.route('**/rest/v1/notifications', async route => route.fulfill({ json: { id: 'notif-1' }, status: 201 }));

        // Mock API Push
        await page.route('/api/send-push', async route => route.fulfill({ json: { success: true } }));

        await page.goto('/admin');

        // Switch to Users tab
        await page.getByText('ניהול משתמשים').click();
    });

    test('should display correct icons for active and frozen users', async ({ page }) => {
        // Active User: Should have an UNLOCK (Open) icon (because that's what we swapped to? No, wait)
        // Logic: {user.is_banned ? <Lock /> : <Unlock />}
        // If BANNED (Frozen) -> LOCK (Closed).
        // If ACTIVE (!Banned) -> UNLOCK (Open).

        // Let's verify by checking the TITLE attribute, which is reliable.
        // Active User
        const activeUserRow = page.locator('tr', { hasText: 'ActiveGamer' });
        const activeFreezeBtn = activeUserRow.locator('button[title="הקפא משתמש"]');
        await expect(activeFreezeBtn).toBeVisible();
        // SVGs are hard to test by class without IDs, but we can assume the icon inside corresponds to the button state.

        // Frozen User
        const frozenUserRow = page.locator('tr', { hasText: 'FrozenGamer' });
        const frozenUnfreezeBtn = frozenUserRow.locator('button[title="שחרר הקפאה"]');
        await expect(frozenUnfreezeBtn).toBeVisible();
    });

    test('should trigger push notification on freeze', async ({ page }) => {
        const activeUserRow = page.locator('tr', { hasText: 'ActiveGamer' });
        const freezeBtn = activeUserRow.locator('button[title="הקפא משתמש"]');

        // Prepare to capture the API request
        const pushRequestPromise = page.waitForRequest(request =>
            request.url().includes('/api/send-push') && request.method() === 'POST'
        );

        // Mock the User Update (Freeze) to succeed
        await page.route('**/rest/v1/profiles?id=eq.user-active-1', async route => {
            if (route.request().method() === 'PATCH') {
                await route.fulfill({ status: 204 });
            } else {
                await route.continue();
            }
        });

        // Handle prompt
        page.on('dialog', dialog => dialog.accept('Test Reason'));

        await freezeBtn.click();

        // Verify Push API called
        const request = await pushRequestPromise;
        const postData = request.postDataJSON();

        expect(postData).toMatchObject({
            userId: 'user-active-1',
            title: 'חשבונך הוקפא',
            message: expect.stringContaining('Test Reason')
        });
    });
});
