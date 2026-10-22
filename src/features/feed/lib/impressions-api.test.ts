// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { MockRoute } from '@/mocks/types'
import { reportImpressionsAs } from './impressions-api'

// The real client against the mock route; a route left out reaches a fetch that always fails.
const state = vi.hoisted(() => ({ routes: [] as readonly MockRoute[], unexpected: [] as string[] }))

vi.mock('@/lib/api', async () => {
  const { createApiClient } = await import('@/lib/api/create-client')
  const { noContentSchema } = await import('@/lib/api/schemas')
  const failingFetch = () => Promise.reject(new Error('offline'))
  return {
    noContentSchema,
    apiRequest: (request: Parameters<ReturnType<typeof createApiClient>>[0]) =>
      createApiClient({
        baseUrl: 'http://mock',
        fetch: failingFetch,
        mocks: state.routes,
        onUnexpected: (failure) => state.unexpected.push(JSON.stringify(failure)),
      })(request),
  }
})

const input = {
  requestId: '00000000-0000-4000-8000-000000000001',
  events: [{ contentId: '11111111-1111-4111-8111-111111111111', type: 'OPEN' as const }],
}

describe('reportImpressionsAs (specs/explore-v1 EX-08, EX-10)', () => {
  beforeEach(async () => {
    state.routes = (await import('@/mocks/handlers')).MOCK_ROUTES
    state.unexpected = []
  })

  it('posts the events with the userId it is given, and the backend answers 204', async () => {
    expect(await reportImpressionsAs('22222222-2222-4222-8222-222222222222', input)).toEqual({
      ok: true,
      data: undefined,
    })
    expect(await reportImpressionsAs(null, input)).toMatchObject({ ok: true })
  })

  it('reports an unexpected failure by its endpoint only, never the ids it carried', async () => {
    state.routes = []
    const result = await reportImpressionsAs(null, input)
    expect(result).toMatchObject({ ok: false, code: 'NETWORK' })
    expect(state.unexpected.join()).toContain('/api/v1/feed/impressions')
    expect(state.unexpected.join()).not.toContain(input.events[0]!.contentId)
    expect(state.unexpected.join()).not.toContain(input.requestId)
  })
})
