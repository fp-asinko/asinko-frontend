import { describe, expect, it, vi } from 'vitest'
import { MOCK_ROUTES } from '@/mocks/handlers'
import { searchWidgetCommunities } from './community-search'

// The real client against the mock routes.
vi.mock('@/lib/api', async () => {
  const { createApiClient } = await import('@/lib/api/create-client')
  const { paginatedSchema } = await import('@/lib/api/schemas')
  return {
    paginatedSchema,
    apiRequest: (request: Parameters<ReturnType<typeof createApiClient>>[0]) =>
      createApiClient({
        baseUrl: 'http://mock',
        fetch: () => Promise.reject(new Error('offline')),
        mocks: MOCK_ROUTES,
      })(request),
  }
})

describe('searchWidgetCommunities (specs/community-widgets CW-10)', () => {
  it('finds groups and assets by name, never a personal channel', async () => {
    const found = await searchWidgetCommunities('de')
    if (!found.ok) throw new Error('expected ok')
    expect(found.data.map((community) => community.handle)).toContain('#defi')
    expect(found.data.some((community) => community.handle.startsWith('@'))).toBe(false)
    const assets = await searchWidgetCommunities('btc')
    expect(assets.ok && assets.data.map((community) => community.handle)).toContain('$BTC')
  })
})
