import 'server-only'
import { env } from '@/env'
import { createApiClient } from './create-client'

/** The app's API client. Features use it from their lib/ (api-integration.md). */
export const apiRequest = createApiClient({ baseUrl: env.API_BASE_URL })

export type { ApiClient, ApiRequest, ApiResult } from './create-client'
export { ApiUnexpectedError, type ApiFailure } from './errors'
export { noContentSchema, paginatedSchema } from './schemas'
