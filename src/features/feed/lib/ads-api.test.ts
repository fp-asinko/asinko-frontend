import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { MockRoute } from '@/mocks/types'
import { ADS } from '@/mocks/fixtures/ads'
import { MOCK_ROUTES } from '@/mocks/handlers'
import { getAds } from './ads-api'

const state = vi.hoisted(() => ({ routes: [] as readonly MockRoute[], dropped: vi.fn() }))

vi.mock('@/lib/api', async () => {
  const { createApiClient } = await import('@/lib/api/create-client')
  const { keepValidItems } = await import('@/lib/api/helpers')
  const failingFetch = () => Promise.reject(new Error('offline'))
  return {
    apiRequest: (request: Parameters<ReturnType<typeof createApiClient>>[0]) =>
      createApiClient({ baseUrl: 'http://mock', fetch: failingFetch, mocks: state.routes })(
        request,
      ),
    keepValidItems: (items: unknown[], schema: never) =>
      keepValidItems(items, schema, state.dropped),
  }
})

/** The ads route of the mocks, answering these items instead. */
function serving(items: unknown[]) {
  state.routes = MOCK_ROUTES.map((route) =>
    route.path === '/api/v1/ads'
      ? { ...route, handler: () => ({ status: 200, body: { items } }) }
      : route,
  )
}

describe('getAds (specs/post-detail-refresh PD-08, PD-09)', () => {
  beforeEach(() => {
    state.routes = MOCK_ROUTES
    state.dropped.mockReset()
  })

  it('maps the house ads, with the real domain and the allowed images', async () => {
    const result = await getAds('comments')
    if (!result.ok) throw new Error('expected ok')
    expect(result.data).toHaveLength(ADS.length)
    expect(result.data[0]).toMatchObject({
      advertiser: 'Asinko',
      url: 'https://example.com/asinko/theses',
      domain: 'example.com',
      imageUrl: '/mocks/ad-thesis.svg',
    })
  })

  it('drops an ad that is not http(s) or breaks the contract, and keeps the rest', async () => {
    serving([
      { ...ADS[0], url: 'javascript:alert(1)' },
      { ...ADS[1], body: '' },
      { ...ADS[2], url: 'https://www.example.org/x', imageUrl: 'https://evil.example/x.png' },
    ])
    const result = await getAds('comments')
    if (!result.ok) throw new Error('expected ok')
    expect(result.data).toEqual([
      expect.objectContaining({ domain: 'example.org', imageUrl: null }),
    ])
    expect(state.dropped).toHaveBeenCalledWith(1, ['body'])
  })

  it('fails as a result, never throws', async () => {
    state.routes = MOCK_ROUTES.map((route) =>
      route.path === '/api/v1/ads' ? { ...route, handler: () => ({ status: 503 }) } : route,
    )
    expect(await getAds('comments')).toMatchObject({ ok: false })
  })
})
