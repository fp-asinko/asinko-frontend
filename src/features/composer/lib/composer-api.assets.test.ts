import { beforeEach, describe, expect, it, vi } from 'vitest'
import { listCommunityOptions } from './composer-api'

// What is asked of the backend, apart from what the mocks answer: the demo user belongs to every
// mocked asset, so the answer alone would not tell.
const api = vi.hoisted(() => ({ apiRequest: vi.fn() }))
vi.mock('@/lib/api', async () => ({
  paginatedSchema: (await import('@/lib/api/schemas')).paginatedSchema,
  apiRequest: api.apiRequest,
}))

describe('listCommunityOptions for assets (specs/thesis-create TC-02)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    api.apiRequest.mockResolvedValue({ ok: true, data: { items: [], nextCursor: null } })
  })

  it('asks for the whole catalog with nothing typed: a new account belongs to no asset', async () => {
    await listCommunityOptions('demo', '', 'assets')
    expect(api.apiRequest).toHaveBeenCalledWith(
      expect.objectContaining({ path: '/api/v1/communities', query: { type: 'SYSTEM_ASSET' } }),
    )
  })

  it('still asks for the viewer’s own communities with nothing typed, for all of them', async () => {
    await listCommunityOptions('demo', '', 'all')
    expect(api.apiRequest).toHaveBeenCalledWith(
      expect.objectContaining({ path: '/api/v1/communities', query: { mine: 'true' } }),
    )
  })
})
