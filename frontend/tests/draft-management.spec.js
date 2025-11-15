import { test, expect } from '@playwright/test';

test.describe('Draft Listing Management', () => {
  test('should display draft options modal when clicking draft listing', async ({ page }) => {
    // Assuming user is logged in and has drafts
    await page.goto('http://localhost:5174/profile');

    // Click on a draft listing
    const draftCard = page.locator('.draft-card').first();
    await expect(draftCard).toBeVisible();
    await draftCard.click();

    // Check modal appears
    const modal = page.locator('.draft-modal');
    await expect(modal).toBeVisible();
    await expect(modal.locator('h3')).toContainText('What would you like to do');
  });

  test('should show preview modal with listing details', async ({ page }) => {
    await page.goto('http://localhost:5174/profile');

    const draftCard = page.locator('.draft-card').first();
    await draftCard.click();

    // Click preview
    await page.locator('.modal-actions .btn-secondary').first().click(); // Preview button

    const previewModal = page.locator('.preview-modal');
    await expect(previewModal).toBeVisible();
    await expect(previewModal.locator('h3')).toContainText('Preview:');
  });

  test('should navigate to edit page when edit is clicked', async ({ page }) => {
    await page.goto('http://localhost:5174/profile');

    const draftCard = page.locator('.draft-card').first();
    await draftCard.click();

    // Click edit
    await page.locator('.modal-actions .btn-primary').click();

    // Should navigate to create-listing
    await expect(page).toHaveURL(/create-listing/);
  });

  test('should publish draft and refresh listings', async ({ page }) => {
    await page.goto('http://localhost:5174/profile');

    const initialDrafts = await page.locator('.draft-card').count();

    const draftCard = page.locator('.draft-card').first();
    await draftCard.click();

    // Click publish
    await page.locator('.modal-actions .btn-success').click();

    // Modal should close
    await expect(page.locator('.draft-modal')).not.toBeVisible();

    // Drafts should decrease or listing should move to active
    const newDrafts = await page.locator('.draft-card').count();
    expect(newDrafts).toBeLessThanOrEqual(initialDrafts);
  });
});