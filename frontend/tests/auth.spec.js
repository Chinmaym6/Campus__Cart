import { test, expect } from '@playwright/test';

test.describe('Authentication UI', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5173/login');
  });

  test('should display login tab active by default on /login', async ({ page }) => {
    await expect(page.locator('.auth-tab.active').locator('text=Login')).toBeVisible();
  });

  test('should display register tab active by default on /register', async ({ page }) => {
    await page.goto('http://localhost:5173/register');
    await expect(page.locator('.auth-tab.active').locator('text=Register')).toBeVisible();
  });

  test('should toggle between login and register tabs', async ({ page }) => {
    // Start on login
    await expect(page.locator('.auth-tab.active').locator('text=Login')).toBeVisible();

    // Click register tab
    await page.locator('.auth-tab').filter({ hasText: 'Register' }).click();
    await expect(page.locator('.auth-tab.active').locator('text=Register')).toBeVisible();

    // Click login tab
    await page.locator('.auth-tab').filter({ hasText: 'Login' }).click();
    await expect(page.locator('.auth-tab.active').locator('text=Login')).toBeVisible();
  });

  test('should have sliding animation when toggling', async ({ page }) => {
    const forms = page.locator('.auth-forms');
    const initialTransform = await forms.evaluate(el => getComputedStyle(el).transform);

    await page.locator('.auth-tab').filter({ hasText: 'Register' }).click();
    await page.waitForTimeout(600); // Wait for animation
    const newTransform = await forms.evaluate(el => getComputedStyle(el).transform);

    expect(initialTransform).not.toBe(newTransform);
  });

  test('login form should have correct fields', async ({ page }) => {
    await expect(page.locator('.login-form input[name="email"]')).toBeVisible();
    await expect(page.locator('.login-form input[name="password"]')).toBeVisible();
    await expect(page.locator('.login-form button[type="submit"]')).toHaveText('Login');
  });

  test('register form should have correct fields', async ({ page }) => {
    await page.locator('.auth-tab').filter({ hasText: 'Register' }).click();
    await expect(page.locator('.register-form input[name="firstName"]')).toBeVisible();
    await expect(page.locator('.register-form input[name="lastName"]')).toBeVisible();
    await expect(page.locator('.register-form input[name="email"]')).toBeVisible();
    await expect(page.locator('.register-form input[name="password"]')).toBeVisible();
    await expect(page.locator('.register-form input[name="confirmPassword"]')).toBeVisible();
    await expect(page.locator('.register-form input[name="university"]')).toBeVisible();
    await expect(page.locator('.register-form input[name="graduationYear"]')).toBeVisible();
    await expect(page.locator('.register-form input[name="major"]')).toBeVisible();
    await expect(page.locator('.register-form button[type="submit"]')).toHaveText('Register');
  });

  test('should show error on invalid login', async ({ page }) => {
    await page.locator('.login-form input[name="email"]').fill('invalid@email.com');
    await page.locator('.login-form input[name="password"]').fill('wrongpass');
    await page.locator('.login-form button[type="submit"]').click();

    await expect(page.locator('.alert-error')).toContainText('Email doesnt exist');
  });

  test('should show success on valid register', async ({ page }) => {
    await page.locator('.auth-tab').filter({ hasText: 'Register' }).click();
    await page.locator('.register-form input[name="firstName"]').fill('Test');
    await page.locator('.register-form input[name="lastName"]').fill('User');
    await page.locator('.register-form input[name="email"]').fill('test@example.com');
    await page.locator('.register-form input[name="password"]').fill('password123');
    await page.locator('.register-form input[name="confirmPassword"]').fill('password123');
    await page.locator('.register-form input[name="university"]').fill('Test University');
    await page.locator('.register-form input[name="graduationYear"]').fill('2025');
    await page.locator('.register-form input[name="major"]').fill('Computer Science');
    await page.locator('.register-form button[type="submit"]').click();

    // Assuming API succeeds, check for success message or navigation
    await expect(page.locator('.alert-success')).toBeVisible();
  });
});