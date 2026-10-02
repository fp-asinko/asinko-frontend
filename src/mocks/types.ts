import type { z } from 'zod'
import type { HttpMethod } from '@/lib/api/create-client'
import type { EndpointPattern } from '@/lib/api/path'

export type MockContext = {
  params: Record<string, string>
  query: Record<string, string>
  body: unknown
}

export type MockResponse = { status: number; body?: unknown }

/**
 * A mocked endpoint (api-integration.md § Mocks). `schema` is the success response shape: the
 * fixtures test validates every handler's 2xx output against it (F-37).
 */
export type MockRoute = {
  method: HttpMethod
  /** Same contract pattern the client uses, e.g. /api/v1/profiles/:identifier */
  path: EndpointPattern
  /** `contract`: in docs/references/api but not implemented. `proposal`: in proposals.md. */
  kind: 'contract' | 'proposal'
  schema: z.ZodType
  /** Sample request the fixtures test runs against the handler. */
  example: MockContext
  /**
   * Request that exists in the dev backend's data. `pnpm api:smoke` sends it to the real API and
   * validates the response with `schema`, to catch contract drift. Only for implemented endpoints.
   */
  liveExample?: MockContext
  handler: (context: MockContext) => MockResponse | Promise<MockResponse>
}
