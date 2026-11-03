import { beforeEach, describe, expect, it, vi } from 'vitest'
import { THESES } from '@/mocks/fixtures/theses'
import { MOCK_ROUTES } from '@/mocks/handlers'
import type { MockRoute } from '@/mocks/types'
import { getThesis } from './thesis-api'

// The real client against the mock routes; a route left out reaches a fetch that always fails.
const state = vi.hoisted(() => ({
  routes: [] as readonly MockRoute[],
  calls: 0,
  viewer: { id: 'viewer', username: 'demo' } as { id: string; username: string } | null,
}))
vi.mock('@/lib/session', () => ({ getViewer: async () => state.viewer }))
vi.mock('@/lib/api', async () => {
  const { createApiClient } = await import('@/lib/api/create-client')
  const { invalidInput } = await import('@/lib/api/errors')
  return {
    invalidInput,
    apiRequest: (request: Parameters<ReturnType<typeof createApiClient>>[0]) => {
      state.calls++
      return createApiClient({
        baseUrl: 'http://mock',
        fetch: () => Promise.reject(new Error('offline')),
        mocks: state.routes,
      })(request)
    },
  }
})

describe('getThesis (specs/thesis-detail § 4)', () => {
  beforeEach(() => {
    state.routes = MOCK_ROUTES
    state.calls = 0
  })

  it('maps the thesis of its page', async () => {
    const thesis = THESES[0]!
    expect(await getThesis(thesis.id)).toMatchObject({
      ok: true,
      data: { kind: 'thesis', id: thesis.id, path: `/thesis/${thesis.id}`, claim: thesis.claim },
    })
  })

  it('checks the id before the network, and passes a missing one as NOT_FOUND (TD-10)', async () => {
    expect(await getThesis('not-a-uuid')).toMatchObject({ ok: false, code: 'INVALID' })
    expect(state.calls).toBe(0)
    expect(await getThesis('00000000-0000-4000-8000-0000000000ff')).toMatchObject({
      ok: false,
      code: 'NOT_FOUND',
    })
  })
})

describe('cancelThesisAs (specs/thesis-detail TD-14)', () => {
  beforeEach(() => {
    state.routes = MOCK_ROUTES
  })

  it('cancels the demo user’s open thesis with its reason; a second time is 409', async () => {
    const { cancelThesisAs } = await import('./thesis-api')
    const { DEMO_USER } = await import('@/mocks/demo-user')
    // Written first: the fixtures keep none of @demo's.
    const { createMockThesis } = await import('@/mocks/theses')
    const { communityBySlug } = await import('@/mocks/fixtures/communities')
    const thesis = createMockThesis({
      params: {},
      query: {},
      body: {
        userId: DEMO_USER.id,
        communityId: communityBySlug('BTC')!.id,
        assetSymbol: 'BTC',
        claim: 'To cancel',
        reasoning: 'A test.',
        conviction: 'LOW',
        deadline: new Date(Date.now() + 30 * 24 * 3600_000).toISOString(),
        targetPrice: 150000,
        targetDirection: 'ABOVE',
        disclaimerAccepted: true,
      },
    }).body as { id: string }
    const first = await cancelThesisAs(DEMO_USER.id, {
      thesisId: thesis.id,
      reason: 'Wrong asset.',
    })
    expect(first).toMatchObject({
      ok: true,
      data: { state: 'cancelled', cancellation: { reason: 'Wrong asset.' }, canCancel: false },
    })
    expect(
      await cancelThesisAs(DEMO_USER.id, { thesisId: thesis.id, reason: 'Again.' }),
    ).toMatchObject({ ok: false, code: 'THESIS_NOT_CANCELLABLE' })
  })
})
