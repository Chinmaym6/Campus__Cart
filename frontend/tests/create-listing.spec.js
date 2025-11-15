import { test, expect } from '@playwright/test';

test.describe('Create Listing', () => {
  test('should save listing as draft and display in profile', async ({ page }) => {
    // Login first
    await page.goto('http://localhost:5174/auth');
    await page.getByRole('button', { name: 'Login' }).first().click();
    await page.getByPlaceholder('Email').fill('test@example.com');
    await page.getByPlaceholder('Password').fill('password');
    await page.getByRole('button', { name: 'Login' }).nth(1).click();
    await page.waitForURL('http://localhost:5174/dashboard');

    // Navigate to create listing
    await page.getByRole('button', { name: 'Create Listing' }).click();
    await page.waitForURL('http://localhost:5174/create-listing');

    // Fill out the form - go through steps
    // Step 1: Photos - skip for now or upload dummy

    // Step 2: Basic details
    await page.getByPlaceholder('Item Title').fill('Test Draft Item');
    await page.getByPlaceholder('Item Description').fill('Test description');
    await page.getByRole('combobox', { name: 'Category' }).selectOption('Books & Study Materials');
    await page.getByRole('radio', { name: 'Brand New' }).check();

    // Step 3: Pricing
    await page.getByPlaceholder('Price').fill('10.00');

    // Step 4: Transaction options - skip

    // Step 5: Location - skip

    // Step 6: Preview and save as draft
    await page.getByRole('button', { name: 'Save as Draft' }).click();

    // Should navigate to profile
    await page.waitForURL('http://localhost:5174/profile');

    // Check if draft is displayed
    await expect(page.getByText('Test Draft Item')).toBeVisible();
    await expect(page.getByText('Status: Draft')).toBeVisible();
  });

  test('should publish listing and display as active', async ({ page }) => {
    // Similar to above, but click Publish
    await page.goto('http://localhost:5174/auth');
    await page.getByRole('button', { name: 'Login' }).first().click();
    await page.getByPlaceholder('Email').fill('test@example.com');
    await page.getByPlaceholder('Password').fill('password');
    await page.getByRole('button', { name: 'Login' }).nth(1).click();
    await page.waitForURL('http://localhost:5174/dashboard');

    await page.getByRole('button', { name: 'Create Listing' }).click();
    await page.waitForURL('http://localhost:5174/create-listing');

    // Fill form
    await page.getByPlaceholder('Item Title').fill('Test Active Item');
    await page.getByPlaceholder('Item Description').fill('Test description');
    await page.getByRole('combobox', { name: 'Category' }).selectOption('Books & Study Materials');
    await page.getByRole('radio', { name: 'Brand New' }).check();
    await page.getByPlaceholder('Price').fill('15.00');

    // Publish
    await page.getByRole('button', { name: 'Publish Listing' }).click();

    // Should navigate to dashboard
    await page.waitForURL('http://localhost:5174/dashboard');

    // Go to profile to check
    await page.goto('http://localhost:5174/profile');
    await expect(page.getByText('Test Active Item')).toBeVisible();
    await expect(page.getByText('Status: Active')).toBeVisible();
  });
});