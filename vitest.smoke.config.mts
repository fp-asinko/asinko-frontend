import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'

// `pnpm api:smoke`: checks the real backend against our contract schemas. Development only, never
// in CI or against production. Backend URL: API_SMOKE_BASE_URL (default: local asinko-app on 3001).
export default defineConfig({
  resolve: {
    tsconfigPaths: true,
    alias: {
      'server-only': fileURLToPath(new URL('./src/test/stubs/server-only.ts', import.meta.url)),
    },
  },
  test: {
    environment: 'node',
    include: ['src/**/*.smoke.ts'],
    // The dev backend reads a database in another region: a feed page can take ~15 s.
    testTimeout: 90_000,
    env: { API_SMOKE_BASE_URL: process.env.API_SMOKE_BASE_URL ?? 'http://localhost:3001' },
  },
})
