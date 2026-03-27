import { test, expect, Page } from '@playwright/test';

/**
 * Helpers
 */
async function fillLoginForm(page: Page, email: string, password: string) {
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', password);
}

async function submitForm(page: Page) {
  await page.click('button[type="submit"]');
}

// ── Tests ─────────────────────────────────────────────────────────────────────

test.describe('Authentication – Login', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
  });

  test('renders login page with title and form', async ({ page }) => {
    await expect(page).toHaveTitle(/FinanceApp|Gestão Financeira/i);
    await expect(page.locator('h1')).toContainText('FinanceApp');
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('shows validation errors when submitting empty form', async ({ page }) => {
    await submitForm(page);
    await expect(page.getByText(/e-mail obrigatório/i)).toBeVisible();
    await expect(page.getByText(/senha obrigatória/i)).toBeVisible();
  });

  test('shows only password error when email is filled', async ({ page }) => {
    await page.fill('input[type="email"]', 'valid@email.com');
    await submitForm(page);
    await expect(page.getByText(/senha obrigatória/i)).toBeVisible();
    await expect(page.getByText(/e-mail obrigatório/i)).not.toBeVisible();
  });

  test('link to register page navigates correctly', async ({ page }) => {
    await page.click('text=Criar conta');
    await expect(page).toHaveURL(/\/register/);
  });
});

test.describe('Authentication – Register', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/register');
  });

  test('renders register page with all fields', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('Criar conta');
    // firstName + lastName inputs (no placeholder; use positional selector)
    const textInputs = page.locator('input:not([type="email"]):not([type="password"]):not([type="checkbox"])');
    await expect(textInputs.first()).toBeVisible();
    await expect(page.locator('input[type="email"]')).toBeVisible();
    // at least 2 password inputs (senha + confirmar)
    const pwInputs = page.locator('input[type="password"]');
    await expect(pwInputs).toHaveCount(2);
  });

  test('shows validation errors on empty submit', async ({ page }) => {
    await page.click('button[type="submit"]');
    const errors = page.locator('p.text-xs.text-red-500');
    await expect(errors.first()).toBeVisible();
  });

  test('link to login page works', async ({ page }) => {
    await page.click('text=Entrar');
    await expect(page).toHaveURL(/\/login/);
  });
});

test.describe('Navigation guard', () => {
  test('unauthenticated user is redirected to /login from /', async ({ page }) => {
    // Navigate to login first so localStorage is accessible, then clear tokens
    await page.goto('/login');
    await page.evaluate(() => localStorage.clear());
    await page.goto('/');
    await expect(page).toHaveURL(/\/login/);
  });

  test('unauthenticated access to /transactions redirects to /login', async ({ page }) => {
    await page.goto('/login');
    await page.evaluate(() => localStorage.clear());
    await page.goto('/transactions');
    await expect(page).toHaveURL(/\/login/);
  });
});
