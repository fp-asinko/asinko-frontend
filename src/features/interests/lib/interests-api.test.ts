import { beforeEach, describe, expect, it, vi } from 'vitest'
import { DEMO_USER } from '@/mocks/demo-user'
import { MOCK_ROUTES } from '@/mocks/handlers'
import type { MockRoute } from '@/mocks/types'
import { getInterests } from './interests-api'

// The real client against the mock routes; a route left out reaches a fetch that always fails.
const state = vi.hoisted(() => ({ routes: [] as readonly MockRoute[] }))

vi.mock('@/lib/api', async () => {
  const { createApiClient } = await import('@/lib/api/create-client')
  const { paginatedSchema } = await import('@/lib/api/schemas')
  const failingFetch = () => Promise.reject(new Error('offline'))
  return {
    paginatedSchema,
    apiRequest: (request: Parameters<ReturnType<typeof createApiClient>>[0]) =>
      createApiClient({ baseUrl: 'http://mock', fetch: failingFetch, mocks: state.routes })(
        request,
      ),
  }
})

const viewer = { id: DEMO_USER.id, username: DEMO_USER.username }

function without(...paths: string[]) {
  return MOCK_ROUTES.filter((route) => !paths.includes(route.path))
}

describe('getInterests', () => {
  beforeEach(() => {
    state.routes = MOCK_ROUTES
  })

  it('builds every section from the mocked API', async () => {
    const interests = await getInterests(viewer)

    expect(interests.assets).toMatchObject({ ok: true })
    expect(interests.assets.ok && interests.assets.data.map((tile) => tile.symbol)).toEqual(
      expect.arrayContaining(['BTC', 'ETH', 'SOL']),
    )
    expect(interests.people.ok && interests.people.data.map((p) => p.username)).toEqual(
      expect.arrayContaining(['maria', 'federico', 'jeppe']),
    )
    expect(interests.groups.ok && interests.groups.data[0]).toMatchObject({
      slug: 'trading-on-chain',
      isModerator: true,
    })
    expect(interests.suggested.ok && interests.suggested.data.length).toBeLessThanOrEqual(3)
  })

  it('fails only the people section when following is down (H-19)', async () => {
    state.routes = without('/api/v1/users/:userId/following')
    const interests = await getInterests(viewer)

    expect(interests.people).toEqual({ ok: false })
    expect(interests.groups.ok).toBe(true)
    expect(interests.assets.ok).toBe(true)
  })

  it('fails the community-based sections when communities are down', async () => {
    state.routes = without('/api/v1/communities')
    const interests = await getInterests(viewer)

    expect(interests.assets).toEqual({ ok: false })
    expect(interests.groups).toEqual({ ok: false })
    expect(interests.suggested).toEqual({ ok: false })
    expect(interests.people.ok).toBe(true)
  })

  it('fails the assets section only when every asset request fails', async () => {
    state.routes = without('/api/v1/assets/:symbol')
    const interests = await getInterests(viewer)

    expect(interests.assets).toEqual({ ok: false })
    expect(interests.groups.ok).toBe(true)
  })

  it('has no people without a viewer', async () => {
    const interests = await getInterests(null)
    expect(interests.people).toEqual({ ok: true, data: [] })
  })
})
