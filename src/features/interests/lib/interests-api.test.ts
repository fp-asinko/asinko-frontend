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

    expect(interests.signedIn).toBe(true)
    expect(interests.assets).toMatchObject({ ok: true })
    expect(interests.assets.ok && interests.assets.data.map((row) => row.symbol)).toEqual(
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

  it('carries the logo and class of each asset, and keeps one without a price (SA-03, SA-07)', async () => {
    const interests = await getInterests(viewer)
    const rows = interests.assets.ok ? interests.assets.data : []

    expect(rows.find((row) => row.symbol === 'BTC')).toMatchObject({
      logoUrl: null,
      assetClass: 'CRYPTO',
    })
    expect(rows.length).toBeGreaterThan(0)
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

  it('without a viewer, shows only suggestions: mine=true needs a session', async () => {
    const interests = await getInterests(null)
    expect(interests.people).toEqual({ ok: true, data: [] })
    expect(interests.assets).toEqual({ ok: true, data: [] })
    expect(interests.groups).toEqual({ ok: true, data: [] })
    expect(interests.signedIn).toBe(false)
    // The mocks mark the demo user's memberships, so only the two others remain here; the
    // guest limit of 8 is tested in mappers.test.ts.
    expect(interests.suggested.ok && interests.suggested.data.length).toBe(2)
  })

  it('keeps the suggestions when only the viewer communities fail', async () => {
    state.routes = MOCK_ROUTES.map((route) =>
      route.path === '/api/v1/communities'
        ? {
            ...route,
            handler: (context) =>
              context.query.mine === 'true'
                ? { status: 401, body: { error: { code: 'UNAUTHENTICATED' } } }
                : route.handler(context),
          }
        : route,
    )
    const interests = await getInterests(viewer)
    expect(interests.groups).toEqual({ ok: false })
    expect(interests.suggested.ok).toBe(true)
  })

  describe("the viewer's communities in more than one page", () => {
    // mine=true mixes groups, assets and the channels of whom the viewer follows in pages of 20:
    // past the first page there can still be groups (bug, 2026-11-11, P-051).
    const extraGroup = {
      id: '00000000-0000-4000-8000-00000000f001',
      slug: 'late-group',
      slugChangedAt: null,
      name: 'Late group',
      description: null,
      avatarUrl: null,
      bannerUrl: null,
      type: 'USER_PUBLIC',
      assetId: null,
      mainUrl: null,
      rules: null,
      memberCount: 3,
      createdByProfileId: null,
      createdAt: '2026-11-01T00:00:00.000Z',
      viewerMembership: 'MEMBER',
      viewerIsFavorite: false,
    }
    const requests: (string | undefined)[] = []

    /** mine=true answers its usual page, then `pages` more: the extra group in the last one. */
    function mineIn(pages: number, { failAt }: { failAt?: number } = {}) {
      requests.length = 0
      state.routes = MOCK_ROUTES.map((route) =>
        route.path === '/api/v1/communities'
          ? {
              ...route,
              handler: async (context) => {
                if (context.query.mine !== 'true') return route.handler(context)
                const cursor = context.query.cursor
                requests.push(cursor)
                const page = cursor ? Number(cursor) : 0
                if (page === failAt) return { status: 500, body: { error: { code: 'HTTP' } } }
                const nextCursor = page < pages ? String(page + 1) : null
                if (page === 0) {
                  const first = await route.handler({ ...context, query: { mine: 'true' } })
                  return { ...first, body: { ...(first.body as object), nextCursor } }
                }
                return {
                  status: 200,
                  body: { items: page === pages ? [extraGroup] : [], nextCursor },
                }
              },
            }
          : route,
      )
    }

    it('follows nextCursor, so a group past the first page still shows', async () => {
      mineIn(1)
      const interests = await getInterests(viewer)
      expect(requests).toEqual([undefined, '1'])
      expect(interests.groups.ok && interests.groups.data.map((group) => group.slug)).toContain(
        'late-group',
      )
    })

    it('stops at 5 pages, however many there are', async () => {
      mineIn(50)
      await getInterests(viewer)
      expect(requests).toHaveLength(5)
    })

    it('keeps what arrived when a later page fails', async () => {
      mineIn(3, { failAt: 2 })
      const interests = await getInterests(viewer)
      expect(interests.groups.ok && interests.groups.data[0]?.slug).toBe('trading-on-chain')
      expect(interests.assets.ok).toBe(true)
    })
  })

  describe('sample assets (development only)', () => {
    // A fresh test account: member of no asset community.
    function withoutAssetMemberships() {
      state.routes = MOCK_ROUTES.map((route) =>
        route.path === '/api/v1/communities'
          ? {
              ...route,
              handler: async (context) => {
                const response = await route.handler(context)
                if (context.query.mine !== 'true') return response
                const body = response.body as { items: { type: string }[]; nextCursor: null }
                return {
                  ...response,
                  body: { ...body, items: body.items.filter((c) => c.type !== 'SYSTEM_ASSET') },
                }
              },
            }
          : route,
      )
    }

    it('shows the sample assets when the account follows none', async () => {
      withoutAssetMemberships()
      const interests = await getInterests(viewer, { sampleAssets: ['BTC', 'ETH'] })
      expect(interests.assets.ok && interests.assets.data.map((row) => row.symbol)).toEqual([
        'BTC',
        'ETH',
      ])
    })

    it('without sample assets, the section stays empty', async () => {
      withoutAssetMemberships()
      expect((await getInterests(viewer)).assets).toEqual({ ok: true, data: [] })
    })

    it('never replaces the assets the account does follow', async () => {
      const interests = await getInterests(viewer, { sampleAssets: ['XRP'] })
      expect(interests.assets.ok && interests.assets.data.map((row) => row.symbol)).toEqual(
        expect.arrayContaining(['BTC', 'ETH', 'SOL']),
      )
    })

    it('never shows them without a session', async () => {
      expect((await getInterests(null, { sampleAssets: ['BTC'] })).assets).toEqual({
        ok: true,
        data: [],
      })
    })
  })
})
