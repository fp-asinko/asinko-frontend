import { createEnv } from '@t3-oss/env-nextjs'
import { z } from 'zod'
import { clientEnvSchema, refineEnv, serverEnvSchema, sharedEnvSchema } from './lib/env-schema'

// The only place that reads process.env (docs/ai-guidelines/libraries.md).
// Imported by next.config.ts, so an invalid environment fails the build (F-29, F-30).
export const env = createEnv({
  server: serverEnvSchema,
  client: clientEnvSchema,
  shared: sharedEnvSchema,
  runtimeEnv: {
    NODE_ENV: process.env.NODE_ENV,
    NEXT_RUNTIME: process.env.NEXT_RUNTIME,
    APP_ENV: process.env.APP_ENV,
    API_BASE_URL: process.env.API_BASE_URL,
    API_MOCKS: process.env.API_MOCKS,
    API_TIMEOUT_MS: process.env.API_TIMEOUT_MS,
    SENTRY_DSN: process.env.SENTRY_DSN,
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
    NEXT_PUBLIC_SENTRY_DSN: process.env.NEXT_PUBLIC_SENTRY_DSN,
  },
  emptyStringAsUndefined: true,
  createFinalSchema: (shape) => z.object(shape).superRefine(refineEnv),
})
