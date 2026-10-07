import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'

// `pnpm api:smoke`: checks the real backend against our contract schemas. Development only, never
// in CI or against production. Backend URL: API_SMOKE_BASE_URL (default: the development deploy
// of asinko-app on Vercel; http://localhost:3001 for a local backend).
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
    // Generous for a local backend against a database in another region (~15 s per feed page).
    testTimeout: 90_000,
    env: {
      API_SMOKE_BASE_URL: process.env.API_SMOKE_BASE_URL ?? 'https://asinko-app-web.vercel.app',
    },
  },
})
