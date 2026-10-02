import 'server-only'
import * as Sentry from '@sentry/nextjs'
import type { z } from 'zod'
import { env } from '@/env'
import { MOCK_ROUTES } from '@/mocks/handlers'
import { createApiClient } from './create-client'
import { keepValidItems as keepValid } from './helpers'

/** The app's API client. Features use it from their lib/ (api-integration.md). */
export const apiRequest = createApiClient({
  baseUrl: env.API_BASE_URL,
  // Never in production: src/env.ts rejects API_MOCKS=true there (F-30).
  mocks: env.API_MOCKS ? MOCK_ROUTES : undefined,
  // A no-op when Sentry has no DSN. Tags carry the endpoint pattern, never URLs or values.
  onUnexpected: (failure, cause) => {
    Sentry.captureException(new Error(`API ${failure.code} on ${failure.endpoint}`), {
      tags: { endpoint: failure.endpoint, code: failure.code, status: failure.status },
      extra:
        cause && typeof cause === 'object' && 'fields' in cause ? { fields: cause.fields } : {},
    })
  },
})

/** keepValidItems with reporting wired to Sentry. `endpoint` is the contract pattern. */
export function keepValidItems<T>(
  items: readonly unknown[],
  schema: z.ZodType<T>,
  endpoint: string,
) {
  return keepValid(items, schema, (count, fields) => {
    Sentry.captureMessage(`API dropped ${count} invalid item(s) on ${endpoint}`, {
      level: 'warning',
      tags: { endpoint },
      extra: { fields },
    })
  })
}

export type { ApiClient, ApiRequest, ApiResult, HttpMethod } from './create-client'
export {
  ApiRequestError,
  invalidInput,
  type ApiFailure,
  type ExpectedFailure,
  type UnexpectedFailure,
} from './errors'
export { getOrThrow } from './helpers'
export type { EndpointPattern } from './path'
export { noContentSchema, paginatedSchema } from './schemas'
