import { beforeEach, describe, expect, it, vi } from 'vitest'
import { DEMO_USER } from '@/mocks/demo-user'
import { MOCK_ROUTES } from '@/mocks/handlers'
import type { MockRoute } from '@/mocks/types'
import { joinCommunityAs } from './membership'

// The real client against the mock routes, as the feed lib tests do.
const state = vi.hoisted(() => ({ routes: [] as readonly MockRoute[] }))
vi.mock('@/lib/api', async () => {
  const { createApiClient } = await import('@/lib/api/create-client')
  return {
    apiRequest: (request: Parameters<ReturnType<typeof createApiClient>>[0]) =>
      createApiClient({
        baseUrl: 'http://mock',
        fetch: () => Promise.reject(new Error('offline')),
        mocks: state.routes,
      })(request),
  }
})

describe('joinCommunityAs (E02)', () => {
  beforeEach(() => {
    state.routes = MOCK_ROUTES
  })

  it('joins and answers the member count', async () => {
    expect(await joinCommunityAs(DEMO_USER.id, 'defi')).toMatchObject({
      ok: true,
      data: { memberCount: expect.any(Number) },
    })
  })

  it('passes the backend failures through', async () => {
    expect(await joinCommunityAs(DEMO_USER.id, 'nope')).toMatchObject({
      ok: false,
      code: 'NOT_FOUND',
    })
    expect(await joinCommunityAs('someone-else', 'defi')).toMatchObject({
      ok: false,
      code: 'USER_MISMATCH',
    })
  })
})
