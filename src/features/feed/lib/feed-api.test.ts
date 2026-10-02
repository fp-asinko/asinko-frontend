import { beforeEach, describe, expect, it, vi } from 'vitest'
import { MOCK_ROUTES } from '@/mocks/handlers'
import type { MockRoute } from '@/mocks/types'
import { parseFeedParams } from '../schemas/feed-params.schema'
import { getFeed } from './feed-api'

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

  it('filters For you by community', async () => {
    const result = await getFeed(parseFeedParams({ comunidad: 'btc' }))
    if (!result.ok) throw new Error('expected ok')
    expect(result.data.items.length).toBeGreaterThan(0)
    expect(result.data.items.every((item) => item.community?.slug === 'btc')).toBe(true)
  })

  it('returns NOT_FOUND for an unknown community', async () => {
    const result = await getFeed(parseFeedParams({ comunidad: 'nope' }))
    expect(result).toMatchObject({ ok: false, code: 'NOT_FOUND' })
  })

  it('reads the Following feed', async () => {
    const result = await getFeed(parseFeedParams({ feed: 'siguiendo' }))
    expect(result.ok).toBe(true)
  })

  it('keeps only polls with the Polls filter (P-005)', async () => {
    const result = await getFeed(parseFeedParams({ filtro: 'polls' }))
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
    expect(result).toEqual({ ok: true, data: { items: [], nextCursor: null } })
    expect(state.dropped).toEqual([2])
  })

  it('still renders the feed when communities fail, without community names', async () => {
    state.routes = MOCK_ROUTES.filter((route) => route.path !== '/api/v1/communities')
    const result = await getFeed(parseFeedParams({}))
    if (!result.ok) throw new Error('expected ok')
    expect(result.data.items.every((item) => item.community === null)).toBe(true)
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
