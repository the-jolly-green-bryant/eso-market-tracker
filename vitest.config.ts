import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    exclude: ['**/dist/**', '**/node_modules/**', 'data/**/**'],
    setupFiles: ['@eso-market-tracker/logging'],
    coverage: {
      enabled: true,
      provider: 'v8',
      reporter: ['text', 'html', 'json-summary'],
      reportsDirectory: './coverage',
      include: ['packages/*/src/**/*.ts', 'apps/**/src/**/*.ts'],
      exclude: [
        '**/*.test.ts',
        '**/dist/**',
        '**/node_modules/**',
        'data/**/**',
      ],
      thresholds: {
        lines: 90,
        functions: 90,
        statements: 90,
        branches: 80,
      },
    },
  },
})
