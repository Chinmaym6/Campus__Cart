import { test, expect } from '@playwright/test';

test.describe('Photo Upload Page', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the create listing page
    await page.goto('http://localhost:5173/create-listing'); // Adjust port if needed
  });

  test('should display upload area with correct text', async ({ page }) => {
    await expect(page.locator('.upload-content h3')).toHaveText('Click to upload or drag and drop');
    await expect(page.locator('.upload-requirements')).toContainText('Supports JPG, JPEG, PNG, WebP');
  });

  test('should upload photos via file input', async ({ page }) => {
    // Mock file input
    const fileInput = page.locator('#photo-input');
    await fileInput.setInputFiles([
      'path/to/test-image1.jpg',
      'path/to/test-image2.jpg',
      'path/to/test-image3.jpg'
    ]);

    // Check if photos appear in grid
    await expect(page.locator('.photo-grid .photo-item')).toHaveCount(3);
  });

  test('should show photo count indicator', async ({ page }) => {
    await expect(page.locator('.photo-count')).toHaveText('0 of 10 photos uploaded');

    // Upload 3 photos
    const fileInput = page.locator('#photo-input');
    await fileInput.setInputFiles([
      'path/to/test-image1.jpg',
      'path/to/test-image2.jpg',
      'path/to/test-image3.jpg'
    ]);

    await expect(page.locator('.photo-count')).toHaveText('3 of 10 photos uploaded');
  });

  test('should enable continue button after 3 photos', async ({ page }) => {
    const continueBtn = page.locator('.btn-primary').filter({ hasText: 'Continue' });
    await expect(continueBtn).toBeDisabled();

    // Upload 3 photos
    const fileInput = page.locator('#photo-input');
    await fileInput.setInputFiles([
      'path/to/test-image1.jpg',
      'path/to/test-image2.jpg',
      'path/to/test-image3.jpg'
    ]);

    await expect(continueBtn).toBeEnabled();
  });

  test('should allow deleting photos', async ({ page }) => {
    // Upload 2 photos
    const fileInput = page.locator('#photo-input');
    await fileInput.setInputFiles([
      'path/to/test-image1.jpg',
      'path/to/test-image2.jpg'
    ]);

    await expect(page.locator('.photo-grid .photo-item')).toHaveCount(2);

    // Delete first photo
    await page.locator('.photo-item').first().locator('.remove-btn').click();
    await expect(page.locator('.photo-grid .photo-item')).toHaveCount(1);
  });

  test('should support drag and drop reordering', async ({ page }) => {
    // Upload 3 photos
    const fileInput = page.locator('#photo-input');
    await fileInput.setInputFiles([
      'path/to/test-image1.jpg',
      'path/to/test-image2.jpg',
      'path/to/test-image3.jpg'
    ]);

    const firstPhoto = page.locator('.photo-item').first();
    const thirdPhoto = page.locator('.photo-item').nth(2);

    // Drag first to third position
    await firstPhoto.dragTo(thirdPhoto);

    // Check order (assuming some way to verify, e.g., by src or alt)
    // This might need adjustment based on actual implementation
    await expect(page.locator('.photo-item').first()).toHaveAttribute('alt', 'Photo 3');
  });

  test('should navigate to next step on continue', async ({ page }) => {
    // Upload 3 photos
    const fileInput = page.locator('#photo-input');
    await fileInput.setInputFiles([
      'path/to/test-image1.jpg',
      'path/to/test-image2.jpg',
      'path/to/test-image3.jpg'
    ]);

    await page.locator('.btn-primary').filter({ hasText: 'Continue' }).click();

    // Check if moved to next step
    await expect(page.locator('.step-content h2')).toHaveText('Basic Item Details');
  });

  test('should cancel and go back to dashboard', async ({ page }) => {
    await page.locator('.btn-secondary').filter({ hasText: 'Cancel' }).click();

    // Check navigation to dashboard
    await expect(page).toHaveURL('http://localhost:5173/dashboard');
  });
});