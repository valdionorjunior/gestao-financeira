import { test, expect, Page } from '@playwright/test';

async function fillLoginForm(page: Page, email: string, password: string) {
  await page.locator('input[type="email"]').fill(email);
  // PrimeNG password field uses a nested input
  await page.locator('p-password input').fill(password);
}

// ── Login ─────────────────────────────────────────────────────────────────────

test.describe('Autenticação – Login (Angular)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
  });

  test('renderiza a página de login com campos obrigatórios', async ({ page }) => {
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('p-password input').first()).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('mostra o título FinanceApp', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('FinanceApp');
  });

  test('exibe erro de validação quando email está inválido', async ({ page }) => {
    await page.locator('input[type="email"]').fill('not-an-email');
    await page.locator('input[type="email"]').blur();
    await expect(page.locator('small.text-\\[var\\(--color-expense\\)\\]').first()).toBeVisible();
  });

  test('link para cadastro navega para /register', async ({ page }) => {
    await page.locator('a[routerLink="/register"]').click();
    await expect(page).toHaveURL(/\/register/);
  });
});

// ── Register ──────────────────────────────────────────────────────────────────

test.describe('Autenticação – Registro (Angular)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/register');
  });

  test('renderiza a página de registro com campos obrigatórios', async ({ page }) => {
    await expect(page.locator('input[formControlName="firstName"]')).toBeVisible();
    await expect(page.locator('input[formControlName="email"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('mostra o título "Criar conta"', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('Criar conta');
  });

  test('link para login navega para /login', async ({ page }) => {
    await page.locator('a[routerLink="/login"]').click();
    await expect(page).toHaveURL(/\/login/);
  });
});

// ── Navigation guard ──────────────────────────────────────────────────────────

test.describe('Guard de navegação (Angular)', () => {
  test('usuário não autenticado é redirecionado para /login ao acessar /', async ({ page }) => {
    // Navigate to login first so localStorage is accessible, then clear tokens
    await page.goto('/login');
    await page.evaluate(() => localStorage.clear());
    await page.goto('/');
    await expect(page).toHaveURL(/\/login/);
  });

  test('acesso direto ao dashboard sem autenticação redireciona para /login', async ({ page }) => {
    await page.goto('/login');
    await page.evaluate(() => localStorage.clear());
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/\/login/);
  });
});
