import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright configuration for the React frontend.
 * Docs: https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: './e2e',
  // Run all tests in parallel
  fullyParallel: true,
  // Fail CI if you accidentally left test.only in source code
  forbidOnly: !!process.env['CI'],
  // Retry on CI only
  retries: process.env['CI'] ? 2 : 0,
  // Use 4 workers locally / 2 on CI
  workers: process.env['CI'] ? 2 : 4,

  reporter: [
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
    ['junit', { outputFile: 'playwright-report/results.xml' }],
    process.env['CI'] ? ['github'] : ['list'],
  ],

  use: {
    baseURL:  process.env['PLAYWRIGHT_BASE_URL'] ?? 'http://localhost:5173',
    // Collect trace on retry
    trace:    'on-first-retry',
    // Screenshot on failure
    screenshot: 'only-on-failure',
    video:    'retain-on-failure',
    locale:   'pt-BR',
    timezoneId: 'America/Sao_Paulo',
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
    /* ── Mobile viewports ────────────────────────────────────────────────── */
    {
      name: 'mobile-chrome',
      use:  { ...devices['Pixel 5'] },
    },
    /* ── Visual Regression (Chromium only for deterministic screenshots) ── */
    {
      name: 'visual',
      use:  { ...devices['Desktop Chrome'], screenshot: 'on' },
      testMatch: '**/visual/**/*.spec.ts',
    },
  ],

  /* Launch the Vite dev server before running tests */
  webServer: {
    command: 'npm run dev',
    url:     'http://localhost:5173',
    reuseExistingServer: !process.env['CI'],
    timeout: 120_000,
  },

  /* Store visual snapshots in e2e/visual/snapshots */
  snapshotPathTemplate: '{testDir}/visual/snapshots/{testFilePath}/{arg}{ext}',
});
