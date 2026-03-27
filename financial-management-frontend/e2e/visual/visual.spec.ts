import { test, expect } from '@playwright/test';

/**
 * Visual Regression Tests – React Frontend
 *
 * These tests capture full-page screenshots and compare them against stored
 * baseline snapshots.  On first run (no baseline exists) Playwright creates the
 * snapshots. On subsequent runs any pixel difference exceeding the threshold
 * causes the test to fail, alerting the team to unintended UI changes.
 *
 * Update baselines intentionally with:
 *   npx playwright test --update-snapshots --project=visual
 */

test.use({ colorScheme: 'light' });

test.describe('Visual Regression – Login page', () => {
  test('login page matches snapshot (light)', async ({ page }) => {
    await page.goto('/login');
    // Wait for fonts / gradients to settle
    await page.waitForTimeout(500);
    await expect(page).toHaveScreenshot('login-light.png', {
      fullPage:    true,
      animations:  'disabled',
      maxDiffPixelRatio: 0.02,
    });
  });

  test('login page matches snapshot (dark)', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'dark' });
    await page.goto('/login');
    await page.waitForTimeout(500);
    await expect(page).toHaveScreenshot('login-dark.png', {
      fullPage:          true,
      animations:        'disabled',
      maxDiffPixelRatio: 0.02,
    });
  });
});

test.describe('Visual Regression – Register page', () => {
  test('register page matches snapshot', async ({ page }) => {
    await page.goto('/register');
    await page.waitForTimeout(500);
    await expect(page).toHaveScreenshot('register-light.png', {
      fullPage:          true,
      animations:        'disabled',
      maxDiffPixelRatio: 0.02,
    });
  });
});

test.describe('Visual Regression – Login validation state', () => {
  test('shows validation errors snapshot', async ({ page }) => {
    await page.goto('/login');
    await page.click('button[type="submit"]');
    // Wait for error messages to appear
    await page.waitForSelector('p.text-xs.text-red-500');
    await expect(page).toHaveScreenshot('login-validation-errors.png', {
      fullPage:          true,
      animations:        'disabled',
      maxDiffPixelRatio: 0.02,
    });
  });
});
