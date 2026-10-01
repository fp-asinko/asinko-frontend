import * as Sentry from '@sentry/nextjs'
import { env } from './env'
import { buildSentryOptions } from './lib/observability/sentry-options'

// Server-side Sentry (F-35). Without SENTRY_DSN nothing is initialized and nothing is reported.
export async function register() {
  if (env.NEXT_RUNTIME !== 'nodejs' || !env.SENTRY_DSN) return
  Sentry.init(buildSentryOptions(env.SENTRY_DSN, env.APP_ENV))
}

// Reports errors from Server Components, route handlers and proxy. A no-op when Sentry is off.
export const onRequestError = Sentry.captureRequestError
