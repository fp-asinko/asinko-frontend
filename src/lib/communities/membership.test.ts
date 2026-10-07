import { beforeEach, describe, expect, it, vi } from 'vitest'
import { DEMO_USER } from '@/mocks/demo-user'
import { MOCK_ROUTES } from '@/mocks/handlers'
import type { MockRoute } from '@/mocks/types'
import { joinCommunityAs, leaveCommunityAs, setFavoriteAs } from './membership'

// The real client against the mock routes, as the feed lib tests do.
const state = vi.hoisted(() => ({ routes: [] as readonly MockRoute[] }))
vi.mock('@/lib/api', async () => {
  const { createApiClient } = await import('@/lib/api/create-client')
  const { noContentSchema } = await import('@/lib/api/schemas')
  return {
    noContentSchema,
    apiRequest: (request: Parameters<ReturnType<typeof createApiClient>>[0]) =>
      createApiClient({
        baseUrl: 'http://mock',
        fetch: () => Promise.reject(new Error('offline')),
        mocks: state.routes,
      })(request),
  }
})

describe('membership against the mocks (E02)', () => {
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

  it('leaves a community (204)', async () => {
    expect(await leaveCommunityAs(DEMO_USER.id, 'defi')).toEqual({ ok: true, data: null })
  })

  it('marks a favorite as a member and unmarks it; not a member fails', async () => {
    expect(await setFavoriteAs(DEMO_USER.id, 'defi', true)).toEqual({
      ok: true,
      data: { favorite: true },
    })
    expect(await setFavoriteAs(DEMO_USER.id, 'memecoins', false)).toEqual({
      ok: true,
      data: { favorite: false },
    })
    expect(await setFavoriteAs(DEMO_USER.id, 'memecoins', true)).toMatchObject({
      ok: false,
      code: 'NOT_MEMBER',
    })
  })
})
