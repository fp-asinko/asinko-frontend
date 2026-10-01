import { clientEnv } from './env.client'
import { buildSentryOptions } from './lib/observability/sentry-options'

// Browser-side Sentry (F-35). Loaded on demand and only with NEXT_PUBLIC_SENTRY_DSN, so without a
// DSN the SDK never reaches the client bundle (seo.md § Performance).
const dsn = clientEnv.NEXT_PUBLIC_SENTRY_DSN
if (dsn) {
  void import('@sentry/nextjs').then((Sentry) =>
    Sentry.init(buildSentryOptions(dsn, clientEnv.NODE_ENV ?? 'production')),
  )
}
