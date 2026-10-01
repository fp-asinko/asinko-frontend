import type { ErrorEvent } from '@sentry/nextjs'

// Error reporting only (F-35): no tracing, no session replay (privacy and the 150 KB JS budget).
// Never send personal data or secrets (engineering-principles.md § Observabilidad).

/** Removes cookies, headers, query strings, request bodies and user data from an event. */
export function scrubEvent(event: ErrorEvent): ErrorEvent {
  if (event.request) {
    delete event.request.cookies
    delete event.request.headers
    delete event.request.query_string
    delete event.request.data
    if (event.request.url) event.request.url = event.request.url.split('?')[0]
  }
  delete event.user
  return event
}

export function buildSentryOptions(dsn: string, environment: string) {
  return {
    dsn,
    environment,
    sendDefaultPii: false,
    tracesSampleRate: 0,
    beforeSend: scrubEvent,
  }
}
