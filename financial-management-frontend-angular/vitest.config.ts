import { defineConfig } from 'vitest/config';

/**
 * Vitest configuration for the Angular frontend.
 *
 * Angular 19+ uses @angular/build:unit-test which internally invokes Vitest.
 * This file is picked up by the builder and merged with Angular's own
 * compilation pipeline (esbuild + Angular compiler plugin).
 *
 * Usage via Angular CLI (recommended):
 *   ng test                            – watch mode
 *   ng test --no-watch                 – single run
 *   ng test --coverage                 – with coverage report
 *
 * Usage via Vitest CLI (requires @analogjs/vite-plugin-angular or manual setup):
 *   npx vitest run --config vitest.config.ts
 */
export default defineConfig({
  test: {
    globals: true,

    /* Coverage is injected by the Angular builder; reporter/dir are set here
       so both `ng test --coverage` and `npx vitest run --coverage` agree. */
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov', 'html', 'clover'],
      reportsDirectory: './coverage/vitest',
      include: ['src/app/**/*.ts'],
      exclude: [
        'src/app/**/*.spec.ts',
        'src/app/**/*.d.ts',
        'src/main.ts',
        'src/environments/**',
        // Large component tested mainly via E2E – excluded from unit coverage
        'src/app/features/dashboard/dashboard.ts',
        // Error interceptor has complex retry/error-handling flows covered by E2E
        'src/app/core/interceptors/error.interceptor.ts',
      ],
      all: false,
      /**
       * Minimum thresholds – CI fails if any metric falls below these values.
       * dashboard.ts and error.interceptor.ts are excluded (covered via E2E).
       */
      thresholds: {
        statements: 75,
        branches:   70,
        functions:  60,
        lines:      75,
      },
    },

    /* Extend the default include pattern to pick up all spec files */
    include: ['src/**/*.spec.ts'],
    exclude: ['e2e/**', '**/node_modules/**', '**/dist/**'],
  },
});
