import { test, expect } from '@playwright/test';

test.describe('Login with Location Detection', () => {
  test('should login and store location when permission granted', async ({ page, context }) => {
    // Grant geolocation permission
    await context.grantPermissions(['geolocation']);
    // Set mock location
    await context.setGeolocation({ latitude: 40.7128, longitude: -74.0060 }); // New York

    // Navigate to login
    await page.goto('http://localhost:5173/login');

    // Fill login form
    await page.fill('input[name="email"]', 'test@university.edu'); // Assume test user exists
    await page.fill('input[name="password"]', 'password123');

    // Submit
    await page.click('button[type="submit"]');

    // Wait for navigation to dashboard
    await page.waitForURL('**/dashboard');

    // Verify login success
    await expect(page).toHaveURL(/dashboard/);
  });

  test('should login without location when permission denied', async ({ page, context }) => {
    // Deny geolocation permission
    await context.clearPermissions();
    // Don't grant

    // Navigate to login
    await page.goto('http://localhost:5173/login');

    // Fill login form
    await page.fill('input[name="email"]', 'test@university.edu');
    await page.fill('input[name="password"]', 'password123');

    // Submit
    await page.click('button[type="submit"]');

    // Wait for navigation to dashboard
    await page.waitForURL('**/dashboard');

    // Verify login success
    await expect(page).toHaveURL(/dashboard/);
  });
});