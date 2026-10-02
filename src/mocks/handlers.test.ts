import { describe, expect, it } from 'vitest'
import { COMMUNITIES } from './fixtures/communities'
import { POSTS } from './fixtures/posts'
import { MOCK_ROUTES } from './handlers'
import type { MockContext } from './types'

type Page = {
  items: Array<{ kind?: string; content?: { communityId: string } }>
  nextCursor: string | null
}

function call(method: string, path: string, context: Partial<MockContext> = {}) {
  const route = MOCK_ROUTES.find((each) => each.method === method && each.path === path)
  if (!route) throw new Error(`No mock for ${method} ${path}`)
  return route.handler({ params: {}, query: {}, body: undefined, ...context })
}

describe('mock handlers behave like the contract', () => {
  it('paginates the explore feed with an opaque cursor, 20 per page', async () => {
    const first = (await call('GET', '/api/v1/feed/explore')).body as Page
    expect(first.items).toHaveLength(20)
    expect(first.nextCursor).toEqual(expect.any(String))

    const second = (
      await call('GET', '/api/v1/feed/explore', { query: { cursor: first.nextCursor! } })
    ).body as Page
    expect(second.items.length).toBeGreaterThan(0)
    expect(second.nextCursor).toBeNull()
  })

  it('filters the explore feed by community', async () => {
    const btc = COMMUNITIES.find((each) => each.slug === 'btc')!
    const page = (await call('GET', '/api/v1/feed/explore', { query: { community: 'btc' } }))
      .body as Page
    expect(page.items.length).toBeGreaterThan(0)
    for (const item of page.items) expect(item.content?.communityId).toBe(btc.id)
  })

  it('returns 404 for an unknown community filter', async () => {
    expect(
      (await call('GET', '/api/v1/feed/explore', { query: { community: 'nope' } })).status,
    ).toBe(404)
  })

  it('builds the following feed from the communities the viewer belongs to', async () => {
    const memberOf = new Set(COMMUNITIES.filter((c) => c.viewerMembership).map((c) => c.id))
    const page = (await call('GET', '/api/v1/feed/following')).body as Page
    expect(page.items.length).toBeGreaterThan(0)
    for (const item of page.items) expect(memberOf.has(item.content!.communityId)).toBe(true)
  })

  it('searches communities by name or slug, never listing personal channels', async () => {
    const page = (await call('GET', '/api/v1/communities', { query: { search: 'defi' } })).body as {
      items: Array<{ slug: string }>
    }
    expect(page.items.map((each) => each.slug)).toEqual(['defi'])
  })

  it('returns a post and its comments, or 404', async () => {
    const id = POSTS[0]!.id
    expect((await call('GET', '/api/v1/posts/:id', { params: { id } })).status).toBe(200)
    expect((await call('GET', '/api/v1/posts/:id/comments', { params: { id } })).status).toBe(200)
    expect((await call('GET', '/api/v1/posts/:id', { params: { id: 'missing' } })).status).toBe(404)
  })

  it('hides private profiles (404) and finds public ones', async () => {
    const get = (identifier: string) =>
      call('GET', '/api/v1/profiles/:identifier', { params: { identifier } })
    expect((await get('maria')).status).toBe(200)
    expect((await get('capitalprudente')).status).toBe(404)
  })

  it('searches assets by symbol or name and links the asset community', async () => {
    const list = (await call('GET', '/api/v1/assets', { query: { q: 'sol' } })).body as {
      items: Array<{ symbol: string }>
    }
    expect(list.items.map((each) => each.symbol)).toEqual(['SOL'])

    const page = (await call('GET', '/api/v1/assets/:symbol', { params: { symbol: 'btc' } }))
      .body as {
      linkedCommunity: { slug: string } | null
    }
    expect(page.linkedCommunity?.slug).toBe('btc')
  })
})
