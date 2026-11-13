import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

// See docs/ai-guidelines/testing.md
export default defineConfig({
  plugins: [react()],
  resolve: {
    tsconfigPaths: true,
    alias: {
      'server-only': fileURLToPath(new URL('./src/test/stubs/server-only.ts', import.meta.url)),
    },
  },
  test: {
    environment: 'jsdom',
    // Components that load a part lazily (panels, dialogs) take 1 to 2 s alone and pass 5 s with
    // the whole suite in parallel on a loaded machine (the pre-push hook, a dev server running).
    // A longer limit, not slower checks: a test that hangs still fails.
    testTimeout: 15_000,
    // Hooks (beforeAll with a slow setup) get the same margin under load; a hook that needs more
    // (the lint-rules fixtures) declares its own.
    hookTimeout: 30_000,
    // Half the logical CPUs. By default Vitest starts about one worker per core, and each one boots
    // its own jsdom (412 files, ~1700 s of CPU in total): with typecheck, ESLint or a dev server
    // alongside, the machine saturates and timing-based checks drift. Isolation stays on.
    maxWorkers: '50%',
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
    // next-intl imports 'next/navigation' without extension; let Vite resolve it.
    server: { deps: { inline: ['next-intl'] } },
    coverage: {
      provider: 'v8',
      include: ['src/**/*.{ts,tsx}'],
      exclude: [
        'src/components/ui/**', // shadcn, unmodified
        'src/app/**', // pages and layouts: covered by e2e
        'src/test/**', // test helpers and lint fixtures
        'src/**/*.types.ts',
        'src/**/index.ts',
        'src/**/*.test.{ts,tsx}',
      ],
      // Thresholds only where the logic lives. They only go up, never down.
      thresholds: {
        'src/features/**/{actions,schemas,lib,hooks}/**': {
          lines: 80,
          functions: 80,
          statements: 80,
          branches: 75,
        },
        'src/{lib,hooks}/**': { lines: 80, functions: 80, statements: 80, branches: 75 },
      },
    },
  },
})
