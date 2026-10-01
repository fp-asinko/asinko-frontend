import 'server-only'
import { env } from '@/env'
import { MOCK_ROUTES } from '@/mocks/handlers'
import { createApiClient } from './create-client'

/** The app's API client. Features use it from their lib/ (api-integration.md). */
export const apiRequest = createApiClient({
  baseUrl: env.API_BASE_URL,
  // Never in production: src/env.ts rejects API_MOCKS=true there (F-30).
  mocks: env.API_MOCKS ? MOCK_ROUTES : undefined,
})

export type { ApiClient, ApiRequest, ApiResult } from './create-client'
export { ApiUnexpectedError, type ApiFailure } from './errors'
export { noContentSchema, paginatedSchema } from './schemas'
