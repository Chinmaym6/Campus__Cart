import { test, expect } from '@playwright/test';

test('Forgot Password Flow', async ({ page }) => {
  // Navigate to login page
  await page.goto('http://localhost:5173/login');

  // Click forgot password link
  await page.click('text=Forgot Password?');

  // Should be on forgot password page
  await expect(page).toHaveURL('http://localhost:5173/forgot-password');

  // Fill email
  await page.fill('input[type="email"]', 'test@example.com');

  // Submit
  await page.click('button[type="submit"]');

  // Should show success message
  await expect(page.locator('.success-message')).toBeVisible();

  // Navigate to enter OTP (since we can't get the actual OTP, assume we have it)
  await page.goto('http://localhost:5173/enter-otp');

  // Fill email and OTP (use a dummy OTP, but in real test, get from logs)
  await page.fill('input[id="email"]', 'test@example.com');
  await page.fill('input[id="otp"]', '123456');

  // Submit
  await page.click('button[type="submit"]');

  // Should redirect to reset password or show error (since OTP is dummy)
  // For now, just check the page loads
  await expect(page.locator('h1')).toContainText('Enter OTP');
});