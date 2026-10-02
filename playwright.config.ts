import { defineConfig, devices } from '@playwright/test'

// docs/ai-guidelines/testing.md: every test runs on mobile and desktop, against the production build.
const PORT = 3100
const BASE_URL = `http://localhost:${PORT}`

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : 'list',
  use: { baseURL: BASE_URL, trace: 'on-first-retry' },
  projects: [
    { name: 'mobile', use: { ...devices['Pixel 7'] } },
    { name: 'desktop', use: { ...devices['Desktop Chrome'] } },
  ],
  webServer: {
    // CI builds in its own step (same env), so it only starts the server here.
    command: process.env.CI ? `pnpm start -p ${PORT}` : `pnpm build && pnpm start -p ${PORT}`,
    url: `${BASE_URL}/en`,
    reuseExistingServer: !process.env.CI,
    timeout: 300_000,
    // Preview-like environment with mocks: no secrets and no backend needed (design.md §13).
    env: {
      APP_ENV: 'preview',
      API_MOCKS: 'true',
      API_BASE_URL: 'http://localhost:9',
      NEXT_PUBLIC_SITE_URL: BASE_URL,
    },
  },
})
