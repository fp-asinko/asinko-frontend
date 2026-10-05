import { beforeEach, describe, expect, it, vi } from 'vitest'
import { MOCK_ROUTES } from '@/mocks/handlers'
import type { MockRoute } from '@/mocks/types'
import { parseFeedParams } from '../schemas/feed-params.schema'
import { getFeed, getFilteredCommunity } from './feed-api'

// The real client against the mock routes; a route left out reaches a fetch that always fails.
const state = vi.hoisted(() => ({ routes: [] as readonly MockRoute[], dropped: [] as number[] }))

vi.mock('@/lib/api', async () => {
  const { createApiClient } = await import('@/lib/api/create-client')
  const { paginatedSchema } = await import('@/lib/api/schemas')
  const { invalidInput } = await import('@/lib/api/errors')
  const { keepValidItems } = await import('@/lib/api/helpers')
  const failingFetch = () => Promise.reject(new Error('offline'))
  return {
    paginatedSchema,
    invalidInput,
    keepValidItems: (items: unknown[], schema: Parameters<typeof keepValidItems>[1]) =>
      keepValidItems(items, schema, (count) => state.dropped.push(count)),
    apiRequest: (request: Parameters<ReturnType<typeof createApiClient>>[0]) =>
      createApiClient({ baseUrl: 'http://mock', fetch: failingFetch, mocks: state.routes })(
        request,
      ),
  }
})

function withRoute(path: string, body: unknown): readonly MockRoute[] {
  return MOCK_ROUTES.map((route) =>
    route.path === path && route.method === 'GET'
      ? { ...route, handler: () => ({ status: 200, body }) }
      : route,
  )
}

describe('getFeed', () => {
  beforeEach(() => {
    state.routes = MOCK_ROUTES
    state.dropped = []
  })

  it('returns the first page of For you with resolved communities', async () => {
    const result = await getFeed(parseFeedParams({}))
    if (!result.ok) throw new Error('expected ok')
    expect(result.data.items).toHaveLength(20)
    expect(result.data.nextCursor).toEqual(expect.any(String))
    expect(result.data.items.every((item) => item.community !== null)).toBe(true)
  })

  it('filters For you by community and returns that community for the chip', async () => {
    const result = await getFeed(parseFeedParams({ community: 'btc' }))
    if (!result.ok) throw new Error('expected ok')
    expect(result.data.items.length).toBeGreaterThan(0)
    expect(result.data.items.every((item) => item.community?.slug === 'btc')).toBe(true)
    expect(result.data.community).toEqual({ slug: 'btc', name: 'Bitcoin', handle: '$BTC' })
  })

  it('names the filtered community even when the communities list fails', async () => {
    state.routes = MOCK_ROUTES.filter((route) => route.path !== '/api/v1/communities')
    const result = await getFeed(parseFeedParams({ community: 'btc' }))
    if (!result.ok) throw new Error('expected ok')
    expect(result.data.items.every((item) => item.community?.slug === 'btc')).toBe(true)
  })

  it('returns NOT_FOUND for an unknown community, although Explore answers an empty page', async () => {
    const result = await getFeed(parseFeedParams({ community: 'nope' }))
    expect(result).toMatchObject({ ok: false, code: 'NOT_FOUND' })
  })

  it('reads the Following feed', async () => {
    const result = await getFeed(parseFeedParams({ feed: 'following' }))
    expect(result.ok).toBe(true)
  })

  it('asks only for posts and polls: theses arrive in phase 2', async () => {
    const queries: Record<string, string>[] = []
    state.routes = MOCK_ROUTES.map((route) =>
      route.path === '/api/v1/feed/explore'
        ? { ...route, handler: (context) => (queries.push(context.query), route.handler(context)) }
        : route,
    )
    await getFeed(parseFeedParams({}))
    expect(queries[0]).toMatchObject({ kind: 'POST,POLL' })
  })

  it('asks the backend for polls only with the Polls filter (P-005)', async () => {
    const result = await getFeed(parseFeedParams({ filter: 'polls' }))
    if (!result.ok) throw new Error('expected ok')
    expect(result.data.items.length).toBeGreaterThan(0)
    expect(result.data.items.every((item) => item.kind === 'poll')).toBe(true)
  })

  it('drops invalid items and reports them, keeping the rest (H-20)', async () => {
    state.routes = withRoute('/api/v1/feed/explore', {
      items: [
        { kind: 'POST', content: { id: 'broken' } },
        { kind: 'THESIS', content: {} },
      ],
      nextCursor: null,
    })
    const result = await getFeed(parseFeedParams({}))
    expect(result).toEqual({ ok: true, data: { items: [], nextCursor: null, community: null } })
    expect(state.dropped).toEqual([2])
  })

  it('keeps every card named when communities fail: the content carries it (BC-01)', async () => {
    state.routes = MOCK_ROUTES.filter((route) => route.path !== '/api/v1/communities')
    const result = await getFeed(parseFeedParams({}))
    if (!result.ok) throw new Error('expected ok')
    expect(result.data.items.every((item) => item.community !== null)).toBe(true)
  })

  describe('GET /communities only for mentions (BC-02)', () => {
    function countCommunityRequests(explore?: unknown) {
      let count = 0
      state.routes = MOCK_ROUTES.map((route) => {
        if (route.path === '/api/v1/communities') {
          return { ...route, handler: (context) => (count++, route.handler(context)) }
        }
        if (explore && route.path === '/api/v1/feed/explore') {
          return { ...route, handler: () => ({ status: 200, body: explore }) }
        }
        return route
      })
      return () => count
    }

    it('skips it when the page has no $ or # mentions, as with the real backend today', async () => {
      const page = (await MOCK_ROUTES.find(
        (route) => route.path === '/api/v1/feed/explore',
      )!.handler({ params: {}, query: {}, body: undefined })) as {
        body: { items: Array<{ kind: string; content: object }> }
      }
      const withoutEntities = {
        items: page.body.items.map((item) => ({
          ...item,
          content: { ...item.content, entities: [] },
        })),
        nextCursor: null,
      }
      const requests = countCommunityRequests(withoutEntities)
      const result = await getFeed(parseFeedParams({}))
      expect(result.ok).toBe(true)
      expect(requests()).toBe(0)
    })

    it('asks for it when mentions need community slugs to link', async () => {
      const requests = countCommunityRequests()
      const result = await getFeed(parseFeedParams({}))
      if (!result.ok) throw new Error('expected ok')
      expect(requests()).toBe(1)
      expect(
        result.data.items.some(
          (item) => item.kind === 'post' && item.body.includes('asinko:community/'),
        ),
      ).toBe(true)
    })
  })

  it('fails when the feed itself fails', async () => {
    state.routes = MOCK_ROUTES.filter((route) => route.path !== '/api/v1/feed/explore')
    expect(await getFeed(parseFeedParams({}))).toMatchObject({ ok: false, code: 'NETWORK' })
  })

  it('rejects a malformed cursor before the request', async () => {
    expect(await getFeed(parseFeedParams({}), '../../etc')).toMatchObject({
      ok: false,
      code: 'INVALID',
    })
  })
})

describe('getFilteredCommunity (specs/feed-navigation § 2)', () => {
  beforeEach(() => {
    state.routes = MOCK_ROUTES
  })

  it('resolves the filtered community before the list streams', async () => {
    expect(await getFilteredCommunity(parseFeedParams({ community: 'btc' }))).toEqual({
      ok: true,
      data: { slug: 'btc', name: 'Bitcoin', handle: '$BTC' },
    })
  })

  it('passes NOT_FOUND through, for a real 404', async () => {
    expect(await getFilteredCommunity(parseFeedParams({ community: 'nope' }))).toMatchObject({
      ok: false,
      code: 'NOT_FOUND',
    })
  })

  it('is null without a community filter', async () => {
    expect(await getFilteredCommunity(parseFeedParams({}))).toBeNull()
  })

  it('is not asked twice: getFeed skips it once resolved', async () => {
    let lookups = 0
    state.routes = MOCK_ROUTES.map((route) =>
      route.path === '/api/v1/communities/:slug'
        ? { ...route, handler: (context) => (lookups++, route.handler(context)) }
        : route,
    )
    await getFeed(parseFeedParams({ community: 'btc' }), undefined, { communityResolved: true })
    expect(lookups).toBe(0)
  })
})
