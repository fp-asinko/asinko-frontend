import { z } from 'zod'

// Environment variable schema (specs/foundation/design.md §6). Pure: no access to process.env,
// so it can be tested in isolation. src/env.ts applies it.

export const serverEnvSchema = {
  // APP_ENV (not NODE_ENV): preview deploys also run with NODE_ENV=production.
  APP_ENV: z.enum(['development', 'preview', 'production']),
  API_BASE_URL: z.url(),
  // false: no mocks · missing: only routes the backend lacks · true: every route (CI, no backend).
  API_MOCKS: z
    .enum(['true', 'false', 'missing'])
    .default('false')
    .transform((value) => (({ true: 'all', false: 'off', missing: 'missing' }) as const)[value]),
  /**
   * How long the API client waits for a request, in ms. 10 s by default (api-integration.md);
   * raise it only in development against a slow backend (a far database), never to hide a slow
   * production API.
   */
  API_TIMEOUT_MS: z.coerce.number().int().min(1000).max(60_000).default(10_000),
  SENTRY_DSN: z.url().optional(),
  /**
   * Development login (specs/dev-login): signs in with a test account of asinko-app and sends its
   * token as Bearer. Server-only, never in production (refineEnv). All four or none.
   */
  SUPABASE_URL: z.url().optional(),
  SUPABASE_ANON_KEY: z.string().min(1).optional(),
  DEV_LOGIN_EMAIL: z.email().optional(),
  DEV_LOGIN_PASSWORD: z.string().min(1).optional(),
}

// Set by Next.js; shared by server and client.
export const sharedEnvSchema = {
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  // Set by Next.js in instrumentation (nodejs | edge); absent elsewhere.
  NEXT_RUNTIME: z.enum(['nodejs', 'edge']).optional(),
}

export const clientEnvSchema = {
  NEXT_PUBLIC_SITE_URL: z.url(),
  NEXT_PUBLIC_SENTRY_DSN: z.url().optional(),
}

export const MOCKS_IN_PRODUCTION_ERROR = 'API_MOCKS must be false when APP_ENV is production'
export const DEV_LOGIN_IN_PRODUCTION_ERROR =
  'DEV_LOGIN_* must not be set when APP_ENV is production'

export type MocksMode = 'off' | 'missing' | 'all'

/** Cross-variable rules. On the client only client variables exist, so they are skipped. */
export function refineEnv(
  env: {
    APP_ENV?: string
    API_MOCKS?: MocksMode
    DEV_LOGIN_EMAIL?: string
    DEV_LOGIN_PASSWORD?: string
  },
  ctx: z.RefinementCtx,
): void {
  if (env.APP_ENV === 'production' && env.API_MOCKS !== undefined && env.API_MOCKS !== 'off') {
    ctx.addIssue({ code: 'custom', path: ['API_MOCKS'], message: MOCKS_IN_PRODUCTION_ERROR })
  }
  // The development login can never reach production (specs/dev-login DL-07).
  if (env.APP_ENV === 'production' && (env.DEV_LOGIN_EMAIL || env.DEV_LOGIN_PASSWORD)) {
    ctx.addIssue({
      code: 'custom',
      path: ['DEV_LOGIN_EMAIL'],
      message: DEV_LOGIN_IN_PRODUCTION_ERROR,
    })
  }
}

/** Full schema used by tests and by src/env.ts on the server. */
export const envSchema = z
  .object({ ...serverEnvSchema, ...sharedEnvSchema, ...clientEnvSchema })
  .superRefine(refineEnv)
