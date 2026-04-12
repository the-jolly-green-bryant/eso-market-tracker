import { defineConfig } from 'vitest/config'

export const baseConfig = {
  test: {
    exclude: ['**/dist/**', '**/node_modules/**', 'data/**/**'],
    setupFiles: ['@eso-market-tracker/logging'],
    coverage: {
      enabled: true,
      provider: 'v8' as const,
      reporter: ['text', 'html', 'json-summary'],
      reportsDirectory: './coverage',
      include: ['packages/*/src/**/*.ts', 'apps/**/src/**/*.ts', 'data/*.ts'],
      exclude: [
        '**/*.test.ts',
        '**/dist/**',
        '**/node_modules/**',
        'data/**/**',
        '**/src/cli.ts',
      ],
      thresholds: process.env.CI
        ? {}
        : {
            lines: 90,
            functions: 90,
            statements: 90,
            branches: 70,
          },
    },
  },
}

export default defineConfig(baseConfig)
