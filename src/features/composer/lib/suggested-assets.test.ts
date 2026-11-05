import { beforeEach, describe, expect, it, vi } from 'vitest'
import { MOCK_ROUTES } from '@/mocks/handlers'
import type { MockRoute } from '@/mocks/types'
import { getSuggestedAssets } from './suggested-assets'

// The real client against the mock routes (the demo user); a route left out fails.
const state = vi.hoisted(() => ({ routes: [] as readonly MockRoute[] }))
vi.mock('@/lib/api', async () => {
  const { createApiClient } = await import('@/lib/api/create-client')
  const { paginatedSchema } = await import('@/lib/api/schemas')
  return {
    paginatedSchema,
    apiRequest: (request: Parameters<ReturnType<typeof createApiClient>>[0]) =>
      createApiClient({
        baseUrl: 'http://mock',
        fetch: () => Promise.reject(new Error('offline')),
        mocks: state.routes,
      })(request),
  }
})

const without = (path: string) => MOCK_ROUTES.filter((route) => route.path !== path)

describe('getSuggestedAssets (specs/thesis-form-steps FS-04, PO 2026-11-05)', () => {
  beforeEach(() => {
    state.routes = MOCK_ROUTES
  })

  it('puts the viewer’s asset communities first, the favorite at the head, without repeats', async () => {
    const { basis, assets } = await getSuggestedAssets()
    expect(basis).toBe('interests')
    // The demo user's favorite asset (specs/favorites).
    expect(assets[0]).toMatchObject({ slug: 'BTC', handle: '$BTC' })
    expect(assets.every((each) => each.handle.startsWith('$'))).toBe(true)
    const slugs = assets.map((each) => each.slug)
    expect(new Set(slugs).size).toBe(slugs.length)
    // Three, whole, beside the search (PO, 2026-11-05).
    expect(assets).toHaveLength(3)
  })

  it('falls back to the popular ones when the viewer’s cannot be read', async () => {
    state.routes = without('/api/v1/communities')
    const { basis, assets } = await getSuggestedAssets()
    expect(basis).toBe('popular')
    expect(assets.length).toBeGreaterThan(0)
  })

  it('has none when both fail, and never throws (FS-07)', async () => {
    state.routes = []
    expect(await getSuggestedAssets()).toEqual({ basis: 'popular', assets: [] })
  })
})
