import { beforeEach, describe, expect, it, vi } from 'vitest'
import { POSTS } from '@/mocks/fixtures/posts'
import { PROFILES } from '@/mocks/fixtures/users'
import { MOCK_ROUTES } from '@/mocks/handlers'
import type { MockRoute } from '@/mocks/types'
import { parseFeedParams } from '../schemas/feed-params.schema'
import type { FeedItem, PollItem, PostItem } from '../feed.types'
import { getFeed, getFilteredCommunity } from './feed-api'

/** The users' content of a page, without its ads (specs/ads). */
const content = (items: FeedItem[]) =>
  items.filter((item): item is PostItem | PollItem => item.kind !== 'ad')

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
    expect(content(result.data.items)).toHaveLength(20)
    expect(result.data.nextCursor).toEqual(expect.any(String))
    // The ads where the backend put them, as cards of their own (specs/ads AD-01).
    expect(result.data.items[10]).toMatchObject({ kind: 'ad', domain: expect.any(String) })
    expect(content(result.data.items).every((item) => item.community !== null)).toBe(true)
  })

  it('filters For you by community and returns that community for the chip', async () => {
    const result = await getFeed(parseFeedParams({ community: 'BTC' }))
    if (!result.ok) throw new Error('expected ok')
    expect(result.data.items.length).toBeGreaterThan(0)
    expect(content(result.data.items).every((item) => item.community?.slug === 'BTC')).toBe(true)
    expect(result.data.community).toEqual({ slug: 'BTC', name: 'Bitcoin', handle: '$BTC' })
  })

  it('names the filtered community even when the communities list fails', async () => {
    state.routes = MOCK_ROUTES.filter((route) => route.path !== '/api/v1/communities')
    const result = await getFeed(parseFeedParams({ community: 'BTC' }))
    if (!result.ok) throw new Error('expected ok')
    expect(content(result.data.items).every((item) => item.community?.slug === 'BTC')).toBe(true)
  })

  it('returns NOT_FOUND for an unknown community, although Explore answers an empty page', async () => {
    const result = await getFeed(parseFeedParams({ community: 'nope' }))
    expect(result).toMatchObject({ ok: false, code: 'NOT_FOUND' })
  })

  it("reads a person's posts, in any community, newest first (specs/backend-adoption BK-02)", async () => {
    const maria = PROFILES.find((each) => each.username === 'maria')!
    const result = await getFeed({ ...parseFeedParams({}), community: 'maria', author: maria.id })
    if (!result.ok) throw new Error('expected ok')
    expect(result.data.items.length).toBeGreaterThan(0)
    expect(
      result.data.items.every((item) => item.kind === 'post' && item.author?.username === 'maria'),
    ).toBe(true)
    // Not only their channel: groups too.
    const communities = new Set(
      content(result.data.items).map((item) =>
        item.kind === 'post' ? item.community?.slug : null,
      ),
    )
    expect(communities.size).toBeGreaterThan(1)
  })

  it('reads the Following feed', async () => {
    const result = await getFeed(parseFeedParams({ feed: 'following' }))
    expect(result.ok).toBe(true)
  })

  it("says why only on the Home's Explore, and passes every page's requestId (specs/explore-v1)", async () => {
    const explore = await getFeed(parseFeedParams({}))
    if (!explore.ok) throw new Error('expected ok')
    const types = new Set(content(explore.data.items).map((item) => item.reason?.type ?? null))
    expect(types).toEqual(new Set(['similar', 'country', null]))
    expect(explore.data.requestId).toMatch(/^[0-9a-f-]{36}$/)

    const elsewhere = [
      parseFeedParams({ community: 'BTC' }),
      parseFeedParams({ feed: 'following' }),
    ]
    for (const params of elsewhere) {
      const result = await getFeed(params)
      if (!result.ok) throw new Error('expected ok')
      expect(content(result.data.items).every((item) => item.reason === null)).toBe(true)
      expect(result.data.requestId).toMatch(/^[0-9a-f-]{36}$/)
    }
  })

  it('never shows a reason the backend sends outside Explore (EX-03)', async () => {
    const reason = { type: 'COUNTRY', via: null, countryCode: 'AR' }
    state.routes = withRoute('/api/v1/feed/following', {
      items: [{ kind: 'POST', content: POSTS[0], reason }],
      nextCursor: null,
      requestId: null,
    })
    const result = await getFeed(parseFeedParams({ feed: 'following' }))
    if (!result.ok) throw new Error('expected ok')
    expect(content(result.data.items)[0]?.reason).toBeNull()
    expect(result.data.requestId).toBeNull()
  })

  it('has no requestId on a profile, and turns an odd one off instead of failing', async () => {
    const maria = PROFILES.find((each) => each.username === 'maria')!
    const profile = await getFeed({ ...parseFeedParams({}), community: 'maria', author: maria.id })
    if (!profile.ok) throw new Error('expected ok')
    expect(profile.data.requestId).toBeNull()

    state.routes = withRoute('/api/v1/feed/explore', {
      items: [{ kind: 'POST', content: POSTS[0] }],
      nextCursor: null,
      requestId: 'not-a-uuid',
    })
    const odd = await getFeed(parseFeedParams({}))
    if (!odd.ok) throw new Error('expected ok')
    expect(odd.data.items).toHaveLength(1)
    expect(odd.data.requestId).toBeNull()
  })

  it('asks only for posts, thoughts and polls: theses arrive in phase 2', async () => {
    const queries: Record<string, string>[] = []
    state.routes = MOCK_ROUTES.map((route) =>
      route.path === '/api/v1/feed/explore'
        ? { ...route, handler: (context) => (queries.push(context.query), route.handler(context)) }
        : route,
    )
    await getFeed(parseFeedParams({}))
    // Thoughts too: ?kind=POST does not bring them (backend 2026-10-23, specs/thoughts TH-09).
    expect(queries[0]).toMatchObject({ kind: 'POST,POLL,THOUGHT' })
  })

  it('asks the backend for polls only with the Polls filter (P-005)', async () => {
    const result = await getFeed(parseFeedParams({ filter: 'polls' }))
    if (!result.ok) throw new Error('expected ok')
    expect(result.data.items.length).toBeGreaterThan(0)
    expect(result.data.items.every((item) => item.kind === 'poll')).toBe(true)
  })

  it('drops invalid items and reports them, keeping the rest (H-20)', async () => {
    state.routes = withRoute('/api/v1/feed/explore', {
      items: [{ kind: 'POST', content: { id: 'broken' } }, { content: {} }],
      nextCursor: null,
    })
    const result = await getFeed(parseFeedParams({}))
    expect(result).toEqual({
      ok: true,
      data: { items: [], nextCursor: null, community: null, requestId: null },
    })
    expect(state.dropped).toEqual([2])
  })

  it('leaves out, without reporting, the kinds it does not draw: theses, new ones (BA-07)', async () => {
    state.routes = withRoute('/api/v1/feed/explore', {
      items: [
        { kind: 'POST', content: POSTS[0] },
        { kind: 'THESIS', content: {} },
        { kind: 'LIVE', content: {} },
      ],
      nextCursor: null,
    })
    const result = await getFeed(parseFeedParams({}))
    if (!result.ok) throw new Error('expected ok')
    expect(result.data.items).toHaveLength(1)
    expect(state.dropped).toEqual([])
  })

  it('keeps an ad where it comes; drops and reports a malformed one, and one that is not http(s) (specs/ads)', async () => {
    const ad = (id: string, url: string) => ({
      kind: 'AD',
      content: {
        id,
        advertiser: { name: 'eToro', logoUrl: null },
        body: null,
        url,
        image: null,
      },
    })
    state.routes = withRoute('/api/v1/feed/explore', {
      items: [
        { kind: 'POST', content: POSTS[0] },
        ad('00000000-0000-4000-8000-000000031001', 'https://www.etoro.com/'),
        ad('00000000-0000-4000-8000-000000031002', 'javascript:alert(1)'),
        { kind: 'AD', content: { id: 'broken' } },
      ],
      nextCursor: null,
    })
    const result = await getFeed(parseFeedParams({}))
    if (!result.ok) throw new Error('expected ok')
    expect(result.data.items.map((item) => item.kind)).toEqual(['post', 'ad'])
    expect(result.data.items[1]).toMatchObject({
      domain: 'etoro.com',
      url: 'https://www.etoro.com/',
    })
    expect(state.dropped).toEqual([1])
  })

  it('keeps every card named when communities fail: the content carries it (BC-01)', async () => {
    state.routes = MOCK_ROUTES.filter((route) => route.path !== '/api/v1/communities')
    const result = await getFeed(parseFeedParams({}))
    if (!result.ok) throw new Error('expected ok')
    expect(content(result.data.items).every((item) => item.community !== null)).toBe(true)
  })

  describe('community data from each summary (P-010)', () => {
    function communityQueries() {
      const queries: Array<Record<string, string | undefined>> = []
      state.routes = MOCK_ROUTES.map((route) =>
        route.path === '/api/v1/communities'
          ? {
              ...route,
              handler: (context) => (queries.push(context.query), route.handler(context)),
            }
          : route,
      )
      return queries
    }

    it('never asks for the viewer communities: membership comes with each card', async () => {
      const queries = communityQueries()
      await getFeed(parseFeedParams({}), undefined, { signedIn: true })
      expect(queries.some((query) => query.mine === 'true')).toBe(false)
    })

    it('links $ and # mentions with GET /communities (BC-02)', async () => {
      const queries = communityQueries()
      const result = await getFeed(parseFeedParams({}))
      if (!result.ok) throw new Error('expected ok')
      expect(queries).toEqual([{}])
      expect(
        result.data.items.some(
          (item) => item.kind === 'post' && item.body.includes('asinko:community/'),
        ),
      ).toBe(true)
    })

    it('gives each card its membership only with a session', async () => {
      const guest = await getFeed(parseFeedParams({}))
      const signedIn = await getFeed(parseFeedParams({}), undefined, { signedIn: true })
      if (!guest.ok || !signedIn.ok) throw new Error('expected ok')
      expect(
        content(guest.data.items).every((item) => item.community?.viewerIsMember === null),
      ).toBe(true)
      const members = content(signedIn.data.items).map((item) => item.community?.viewerIsMember)
      expect(members).toContain(true)
      expect(members).toContain(false)
    })

    it('keeps the feed when the community list fails', async () => {
      state.routes = MOCK_ROUTES.filter((route) => route.path !== '/api/v1/communities')
      const result = await getFeed(parseFeedParams({}), undefined, { signedIn: true })
      expect(result.ok).toBe(true)
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
    expect(await getFilteredCommunity(parseFeedParams({ community: 'BTC' }))).toEqual({
      ok: true,
      data: { slug: 'BTC', name: 'Bitcoin', handle: '$BTC' },
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
    await getFeed(parseFeedParams({ community: 'BTC' }), undefined, { communityResolved: true })
    expect(lookups).toBe(0)
  })
})
