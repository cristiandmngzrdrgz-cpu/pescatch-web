import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
    setupFiles: ['src/__tests__/setup.ts'],
    env: {
      TURSO_DATABASE_URL: 'file::memory:',
      ADMIN_SECRET: 'test-admin-secret',
    },
    testTimeout: 30000,
  },
})
