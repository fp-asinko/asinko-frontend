import 'server-only'
import * as Sentry from '@sentry/nextjs'
import type { z } from 'zod'
import { env } from '@/env'
import type { MocksMode } from '@/lib/env-schema'
import { getAccessToken } from '@/lib/session'
import { MOCK_EXTENSIONS, MOCK_ROUTES } from '@/mocks/handlers'
import { createApiClient } from './create-client'
import { keepValidItems as keepValid } from './helpers'

/** Routes answered by the mocks for each API_MOCKS mode (api-integration.md § Mocks). */
function mockedRoutes(mode: MocksMode) {
  if (mode === 'all') return MOCK_ROUTES
  if (mode === 'missing') return MOCK_ROUTES.filter((route) => !route.implemented)
  return undefined
}

/** The app's API client. Features use it from their lib/ (api-integration.md). */
export const apiRequest = createApiClient({
  baseUrl: env.API_BASE_URL,
  // Never in production: src/env.ts rejects any API_MOCKS but false there (F-30).
  mocks: mockedRoutes(env.API_MOCKS),
  // The ads and the glossary on top of the real feeds (specs/glossary GL-07).
  extensions: env.API_MOCKS === 'missing' ? MOCK_EXTENSIONS : undefined,
  timeoutMs: env.API_TIMEOUT_MS,
  // The session's token as Bearer on every backend call (P-002, specs/dev-login DL-04).
  getHeaders: async (): Promise<Record<string, string>> => {
    const token = await getAccessToken()
    return token ? { Authorization: `Bearer ${token}` } : {}
  },
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
export { mockDelay } from './mock-delay'
