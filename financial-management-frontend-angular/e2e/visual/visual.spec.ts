import { test, expect } from '@playwright/test';

/**
 * Visual Regression Tests – Angular Frontend
 *
 * Uses Playwright's built-in snapshot comparison (toHaveScreenshot).
 * First run creates the baseline snapshots under e2e/visual/snapshots/.
 * Subsequent runs compare current screenshots against the baseline.
 *
 * Update baselines:
 *   npx playwright test --update-snapshots --project=visual
 */

test.use({ colorScheme: 'light' });

test.describe('Regressão visual – Login (Angular)', () => {
  test('login page snapshot (light)', async ({ page }) => {
    await page.goto('/login');
    // Wait for PrimeNG animations to complete
    await page.waitForTimeout(800);
    await expect(page).toHaveScreenshot('login-angular-light.png', {
      fullPage:          true,
      animations:        'disabled',
      maxDiffPixelRatio: 0.02,
    });
  });

  test('login page snapshot (dark)', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'dark' });
    await page.goto('/login');
    await page.waitForTimeout(800);
    await expect(page).toHaveScreenshot('login-angular-dark.png', {
      fullPage:          true,
      animations:        'disabled',
      maxDiffPixelRatio: 0.02,
    });
  });
});

test.describe('Regressão visual – Register (Angular)', () => {
  test('register page snapshot (light)', async ({ page }) => {
    await page.goto('/register');
    await page.waitForTimeout(800);
    await expect(page).toHaveScreenshot('register-angular-light.png', {
      fullPage:          true,
      animations:        'disabled',
      maxDiffPixelRatio: 0.02,
    });
  });
});

test.describe('Regressão visual – Estado de validação', () => {
  test('login com campos tocados mostra erros de validação', async ({ page }) => {
    await page.goto('/login');
    // Touch email field and blur
    await page.locator('input[type="email"]').fill('invalid');
    await page.locator('input[type="email"]').blur();
    await page.waitForTimeout(300);
    await expect(page).toHaveScreenshot('login-validation-angular.png', {
      fullPage:          true,
      animations:        'disabled',
      maxDiffPixelRatio: 0.03,
    });
  });
});
