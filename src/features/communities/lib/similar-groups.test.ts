import { describe, expect, it, vi } from 'vitest'
import { searchSimilarGroups } from './similar-groups'

// The real client against the mock routes.
vi.mock('@/lib/api', async () => {
  const { createApiClient } = await import('@/lib/api/create-client')
  const { paginatedSchema } = await import('@/lib/api/schemas')
  const { MOCK_ROUTES } = await import('@/mocks/handlers')
  return {
    paginatedSchema,
    apiRequest: createApiClient({
      baseUrl: 'http://mock',
      fetch: () => Promise.reject(new Error('offline')),
      mocks: MOCK_ROUTES,
    }),
  }
})

describe('searchSimilarGroups (specs/community-create CG-22)', () => {
  it('finds up to three groups or assets, never a personal channel', async () => {
    const result = await searchSimilarGroups('de')
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.data.length).toBeGreaterThan(0)
    expect(result.data.length).toBeLessThanOrEqual(3)
    for (const group of result.data) {
      expect(group.handle).toMatch(/^[#$]/)
      expect(group.path).toMatch(/^\/(hub|asset)\//)
    }
  })
})
