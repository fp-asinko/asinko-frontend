import { z } from 'zod'

// Environment variable schema (specs/foundation/design.md §6). Pure: no access to process.env,
// so it can be tested in isolation. src/env.ts applies it.

const booleanString = z
  .enum(['true', 'false'])
  .default('false')
  .transform((value) => value === 'true')

export const serverEnvSchema = {
  // APP_ENV (not NODE_ENV): preview deploys also run with NODE_ENV=production.
  APP_ENV: z.enum(['development', 'preview', 'production']),
  API_BASE_URL: z.url(),
  API_MOCKS: booleanString,
  SENTRY_DSN: z.url().optional(),
}

// Set by Next.js; shared by server and client.
export const sharedEnvSchema = {
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
}

export const clientEnvSchema = {
  NEXT_PUBLIC_SITE_URL: z.url(),
  NEXT_PUBLIC_SENTRY_DSN: z.url().optional(),
}

export const MOCKS_IN_PRODUCTION_ERROR = 'API_MOCKS must be false when APP_ENV is production'

/** Cross-variable rules. On the client only client variables exist, so they are skipped. */
export function refineEnv(
  env: { APP_ENV?: string; API_MOCKS?: boolean },
  ctx: z.RefinementCtx,
): void {
  if (env.APP_ENV === 'production' && env.API_MOCKS === true) {
    ctx.addIssue({ code: 'custom', path: ['API_MOCKS'], message: MOCKS_IN_PRODUCTION_ERROR })
  }
}

/** Full schema used by tests and by src/env.ts on the server. */
export const envSchema = z
  .object({ ...serverEnvSchema, ...sharedEnvSchema, ...clientEnvSchema })
  .superRefine(refineEnv)
