import { device, element, by, expect } from 'detox';

describe('Admin Dashboard E2E', () => {
    beforeAll(async () => {
        await device.launchApp();
        await loginAsAdmin();
    });

    beforeEach(async () => {
        await device.reloadReactNative();
    });

    async function loginAsAdmin() {
        const email = process.env.TEST_ADMIN_EMAIL || "default@example.com";
        const password = process.env.TEST_ADMIN_PASSWORD || "defaultpassword";
        await element(by.id('email')).typeText(email);
        await element(by.id('password')).typeText(password);
        await element(by.id('login-button')).tap();
        await expect(element(by.id('admin-dashboard'))).toBeVisible();
    }

    describe('Dashboard Navigation', () => {
        it('should navigate through all sections', async () => {
            // User Management
            await element(by.id('user-management-tab')).tap();
            await expect(element(by.id('user-list'))).toBeVisible();

            // Reports
            await element(by.id('reports-tab')).tap();
            await expect(element(by.id('reports-dashboard'))).toBeVisible();

            // Settings
            await element(by.id('settings-tab')).tap();
            await expect(element(by.id('system-settings'))).toBeVisible();

            // Moderation
            await element(by.id('moderation-tab')).tap();
            await expect(element(by.id('content-moderation'))).toBeVisible();
        });
    });

    describe('User Management', () => {
        beforeEach(async () => {
            await element(by.id('user-management-tab')).tap();
        });

        it('should search for users', async () => {
            await element(by.id('user-search')).typeText('test');
            await element(by.id('search-button')).tap();
            await expect(element(by.id('user-list'))).toBeVisible();
        });

        it('should ban a user', async () => {
            await element(by.id('user-action-button')).tap();
            await element(by.id('ban-user')).tap();
            await element(by.id('ban-reason')).typeText('violation');
            await element(by.id('confirm-ban')).tap();
            await expect(element(by.text('User banned successfully'))).toBeVisible();
        });
    });

    describe('Content Moderation', () => {
        beforeEach(async () => {
            await element(by.id('moderation-tab')).tap();
        });

        it('should handle reported content', async () => {
            await element(by.id('reported-content-tab')).tap();
            await element(by.id('report-action-button')).tap();
            await element(by.id('resolve-report')).tap();
            await expect(element(by.text('Report handled successfully'))).toBeVisible();
        });

        it('should moderate chat messages', async () => {
            await element(by.id('chat-moderation-tab')).tap();
            await element(by.id('message-action-button')).tap();
            await element(by.id('delete-message')).tap();
            await expect(element(by.text('Message deleted successfully'))).toBeVisible();
        });
    });

    describe('System Settings', () => {
        beforeEach(async () => {
            await element(by.id('settings-tab')).tap();
        });

        it('should update system settings', async () => {
            await element(by.id('maintenance-mode')).tap();
            await element(by.id('save-settings')).tap();
            await expect(element(by.text('Settings saved successfully'))).toBeVisible();
        });
    });
});
