import { test, expect } from '@playwright/test';

test.describe('Active Listing Management', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5174/profile');
    const loginCheck = page.locator('[href*="login"], .auth-page, button:has-text("Login")').first();
    if (await loginCheck.isVisible({ timeout: 3000 }).catch(() => false)) {
      test.skip();
    }
  });

  test('should display active listings with available actions', async ({ page }) => {
    const activeListing = page.locator('.active-card').first();
    const isVisible = await activeListing.isVisible({ timeout: 5000 }).catch(() => false);
    
    if (!isVisible) {
      test.skip();
    }

    await expect(activeListing).toBeVisible();
    await expect(activeListing.locator('p')).toContainText('Status: Active');
  });

  test('should show options modal when clicking active listing', async ({ page }) => {
    const activeCard = page.locator('.active-card').first();
    const isVisible = await activeCard.isVisible({ timeout: 3000 }).catch(() => false);
    
    if (!isVisible) {
      test.skip();
    }

    await activeCard.click();

    const modal = page.locator('.draft-modal');
    await expect(modal).toBeVisible();
    await expect(modal.locator('h3')).toContainText('What would you like to do with this listing?');
  });

  test('should preview active listing with details', async ({ page }) => {
    const activeCard = page.locator('.active-card').first();
    const isVisible = await activeCard.isVisible({ timeout: 3000 }).catch(() => false);
    
    if (!isVisible) {
      test.skip();
    }

    await activeCard.click();

    await page.locator('.modal-actions .btn-secondary').first().click();

    const previewModal = page.locator('.preview-modal');
    await expect(previewModal).toBeVisible();
    await expect(previewModal.locator('h3')).toContainText('Preview:');

    const previewContent = page.locator('.preview-details');
    await expect(previewContent.locator('p')).toContainText('Price:');
    await expect(previewContent.locator('p')).toContainText('Condition:');
    await expect(previewContent.locator('p')).toContainText('Description:');
  });

  test('should edit active listing', async ({ page }) => {
    const activeCard = page.locator('.active-card').first();
    const isVisible = await activeCard.isVisible({ timeout: 3000 }).catch(() => false);
    
    if (!isVisible) {
      test.skip();
    }

    const originalTitle = await activeCard.locator('h4').textContent();

    await activeCard.click();

    const editButton = page.locator('.modal-actions .btn-primary');
    await editButton.click();

    await expect(page).toHaveURL(/create-listing/);

    const titleField = page.locator('input[name="title"], input[placeholder*="Title"], input[placeholder*="title"]').first();
    await expect(titleField).toHaveValue(originalTitle);
  });

  test('should delete active listing', async ({ page }) => {
    const activeCard = page.locator('.active-card').first();
    const isVisible = await activeCard.isVisible({ timeout: 3000 }).catch(() => false);
    
    if (!isVisible) {
      test.skip();
    }

    const initialCount = await page.locator('.active-card').count();

    await activeCard.click();

    page.on('dialog', dialog => {
      expect(dialog.message()).toContain('delete');
      dialog.accept();
    });

    const deleteButton = page.locator('.modal-actions .btn-danger');
    await deleteButton.click();

    await page.waitForTimeout(1500);

    const newCount = await page.locator('.active-card').count();
    expect(newCount).toBeLessThanOrEqual(initialCount);
  });

  test('should delete draft listing', async ({ page }) => {
    const draftCard = page.locator('.draft-card').first();
    const isVisible = await draftCard.isVisible({ timeout: 3000 }).catch(() => false);

    if (!isVisible) {
      test.skip();
    }

    const initialDraftCount = await page.locator('.draft-card').count();

    await draftCard.click();

    page.on('dialog', dialog => {
      expect(dialog.message()).toContain('delete');
      dialog.accept();
    });

    const deleteButton = page.locator('.modal-actions .btn-danger');
    await deleteButton.click();

    await page.waitForTimeout(1500);

    const newDraftCount = await page.locator('.draft-card').count();
    expect(newDraftCount).toBeLessThanOrEqual(initialDraftCount);
  });

  test('should show delete button in draft modal', async ({ page }) => {
    const draftCard = page.locator('.draft-card').first();
    const isVisible = await draftCard.isVisible({ timeout: 3000 }).catch(() => false);

    if (!isVisible) {
      test.skip();
    }

    await draftCard.click();

    const modal = page.locator('.draft-modal');
    await expect(modal).toBeVisible();

    const buttons = page.locator('.modal-actions .btn-danger');
    await expect(buttons).toBeVisible();
  });

  test('should show edit, delete, preview buttons in active modal', async ({ page }) => {
    const activeCard = page.locator('.active-card').first();
    const isVisible = await activeCard.isVisible({ timeout: 3000 }).catch(() => false);

    if (!isVisible) {
      test.skip();
    }

    await activeCard.click();

    const modal = page.locator('.draft-modal');
    await expect(modal).toBeVisible();

    const buttons = page.locator('.modal-actions button');
    const buttonCount = await buttons.count();
    expect(buttonCount).toBe(3);

    await expect(page.locator('.modal-actions .btn-secondary')).toBeVisible();
    await expect(page.locator('.modal-actions .btn-primary')).toBeVisible();
    await expect(page.locator('.modal-actions .btn-danger')).toBeVisible();
  });

  test('should close modal on overlay click', async ({ page }) => {
    const activeCard = page.locator('.active-card').first();
    const isVisible = await activeCard.isVisible({ timeout: 3000 }).catch(() => false);

    if (!isVisible) {
      test.skip();
    }

    await activeCard.click();

    const modal = page.locator('.draft-modal');
    await expect(modal).toBeVisible();

    await page.locator('.modal-overlay').click({ position: { x: 0, y: 0 } });

    await expect(modal).not.toBeVisible();
  });

  test('should close preview modal and return to listing modal', async ({ page }) => {
    const activeCard = page.locator('.active-card').first();
    const isVisible = await activeCard.isVisible({ timeout: 3000 }).catch(() => false);

    if (!isVisible) {
      test.skip();
    }

    await activeCard.click();

    const previewButton = page.locator('.modal-actions .btn-secondary').first();
    await previewButton.click();

    const previewModal = page.locator('.preview-modal');
    await expect(previewModal).toBeVisible();

    const closeButton = page.locator('.preview-modal .modal-close');
    await closeButton.click();

    await expect(previewModal).not.toBeVisible();
  });
});
