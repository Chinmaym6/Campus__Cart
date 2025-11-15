import { test, expect } from '@playwright/test';

test.describe('Navbar Authentication and Page Redirects', () => {
  test.beforeEach(async ({ page }) => {
    // Clear localStorage before each test
    await page.addInitScript(() => {
      localStorage.clear();
    });
  });

  test('should show login and register links when not logged in', async ({ page }) => {
    await page.goto('http://localhost:5174/');
    await expect(page.locator('nav .nav-links')).toContainText('Login');
    await expect(page.locator('nav .nav-links')).toContainText('Register');
    await expect(page.locator('nav .nav-links')).not.toContainText('Dashboard');
    await expect(page.locator('nav .nav-links')).not.toContainText('Logout');
  });

  test('should redirect to dashboard when accessing login page while logged in', async ({ page }) => {
    // Simulate login by setting token
    await page.addInitScript(() => {
      localStorage.setItem('token', 'fake-token');
      localStorage.setItem('user', JSON.stringify({ id: 1, email: 'test@example.com' }));
    });
    await page.goto('http://localhost:5174/login');
    await expect(page).toHaveURL('http://localhost:5174/dashboard');
  });

  test('should redirect to dashboard when accessing register page while logged in', async ({ page }) => {
    // Simulate login
    await page.addInitScript(() => {
      localStorage.setItem('token', 'fake-token');
      localStorage.setItem('user', JSON.stringify({ id: 1, email: 'test@example.com' }));
    });
    await page.goto('http://localhost:5174/register');
    await expect(page).toHaveURL('http://localhost:5174/dashboard');
  });

  test('should show dashboard and logout links after login', async ({ page }) => {
    await page.goto('http://localhost:5174/login');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL('http://localhost:5174/dashboard');
    await expect(page.locator('nav .nav-links')).toContainText('Dashboard');
    await expect(page.locator('nav .nav-links')).toContainText('Logout');
    await expect(page.locator('nav .nav-links')).not.toContainText('Login');
    await expect(page.locator('nav .nav-links')).not.toContainText('Register');
  });

  test('should show login and register links after logout', async ({ page }) => {
    // First login
    await page.addInitScript(() => {
      localStorage.setItem('token', 'fake-token');
      localStorage.setItem('user', JSON.stringify({ id: 1, email: 'test@example.com' }));
    });
    await page.goto('http://localhost:5174/dashboard');
    await expect(page.locator('nav .nav-links')).toContainText('Dashboard');
    await expect(page.locator('nav .nav-links')).toContainText('Logout');

    // Click logout
    await page.click('nav .nav-links button');
    await expect(page).toHaveURL('http://localhost:5174/');
    await expect(page.locator('nav .nav-links')).toContainText('Login');
    await expect(page.locator('nav .nav-links')).toContainText('Register');
    await expect(page.locator('nav .nav-links')).not.toContainText('Dashboard');
    await expect(page.locator('nav .nav-links')).not.toContainText('Logout');
  });

  test('should redirect to login when accessing dashboard without token', async ({ page }) => {
    await page.goto('http://localhost:5174/dashboard');
    await expect(page).toHaveURL(/\/login/);
  });
});