import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright configuration for the Angular frontend.
 * Docs: https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env['CI'],
  retries:  process.env['CI'] ? 2 : 0,
  workers:  process.env['CI'] ? 2 : 4,

  reporter: [
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
    ['junit', { outputFile: 'playwright-report/results.xml' }],
    process.env['CI'] ? ['github'] : ['list'],
  ],

  use: {
    baseURL: process.env['PLAYWRIGHT_BASE_URL'] ?? 'http://localhost:4200',
    trace:          'on-first-retry',
    screenshot:     'only-on-failure',
    video:          'retain-on-failure',
    locale:         'pt-BR',
    timezoneId:     'America/Sao_Paulo',
  },

  projects: [
    /* ── Functional E2E ──────────────────────────────────────────────────── */
    {
      name: 'chromium',
      use:  { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use:  { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use:  { ...devices['Desktop Safari'] },
    },
    /* ── Mobile ──────────────────────────────────────────────────────────── */
    {
      name: 'mobile-chrome',
      use:  { ...devices['Pixel 5'] },
    },
    /* ── Visual Regression ───────────────────────────────────────────────── */
    {
      name: 'visual',
      use:  { ...devices['Desktop Chrome'], screenshot: 'on' },
      testMatch: '**/visual/**/*.spec.ts',
    },
  ],

  /* Launch Angular dev server before tests */
  webServer: {
    command: 'npm start',
    url:     'http://localhost:4200',
    reuseExistingServer: !process.env['CI'],
    timeout: 180_000,
  },

  snapshotPathTemplate: '{testDir}/visual/snapshots/{testFilePath}/{arg}{ext}',
});
