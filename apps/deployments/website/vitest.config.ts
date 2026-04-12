import { defineConfig, mergeConfig } from 'vitest/config'
import baseConfig from '../../../vitest.config'
import react from '@vitejs/plugin-react'

export default mergeConfig(
  baseConfig,
  defineConfig({
    plugins: [react],
    test: {
      environment: 'jsdom',
      globals: true,
      setupFiles: ['./setup.ts'],
      coverage: {
        enabled: false,
      },
    },
  })
)
