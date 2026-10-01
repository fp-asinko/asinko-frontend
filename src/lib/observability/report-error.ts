import { clientEnv } from '@/env.client'

/**
 * Reports an unexpected error from the browser (error boundaries). Sentry is loaded on demand and
 * only when a DSN exists: without it this is a no-op and adds no JavaScript (F-35, seo.md budget).
 */
export function reportError(error: unknown): void {
  if (!clientEnv.NEXT_PUBLIC_SENTRY_DSN) return
  void import('@sentry/nextjs').then((Sentry) => Sentry.captureException(error))
}
