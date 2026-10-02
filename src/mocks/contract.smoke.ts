import { describe, expect, it } from 'vitest'
import { createApiClient } from '@/lib/api/create-client'
import type { EndpointPattern } from '@/lib/api/path'
import { MOCK_ROUTES } from './handlers'

// Contract drift detector (api-integration.md § Smoke tests): every implemented endpoint with a
// liveExample is called on the real dev backend and its response validated with the mock's schema.
// Set by vitest.smoke.config.mts (test infrastructure, not app code).
const baseUrl = process.env.API_SMOKE_BASE_URL ?? 'http://localhost:3001'
const failures: unknown[] = []
const api = createApiClient({ baseUrl, onUnexpected: (failure) => failures.push(failure) })

const live = MOCK_ROUTES.filter((route) => route.kind === 'contract' && route.liveExample)

describe(`contract smoke against ${baseUrl}`, () => {
  it.each(live.map((route) => [`${route.method} ${route.path}`, route] as const))(
    '%s matches its contract schema',
    async (_name, route) => {
      const result = await api({
        method: route.method,
        path: route.path as EndpointPattern,
        params: route.liveExample?.params ?? {},
        query: route.liveExample?.query,
        body: route.liveExample?.body,
        schema: route.schema,
        // Routes come from a heterogeneous registry: their params are checked by buildPath at runtime.
      } as unknown as Parameters<typeof api>[0])

      expect(result, JSON.stringify(failures.at(-1) ?? result)).toMatchObject({ ok: true })
    },
  )
})
