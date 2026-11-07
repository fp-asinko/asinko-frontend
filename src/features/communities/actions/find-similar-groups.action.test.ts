import { beforeEach, describe, expect, it, vi } from 'vitest'
import { findSimilarGroups } from './find-similar-groups.action'

const deps = vi.hoisted(() => ({
  search: vi.fn(),
  viewer: { id: 'me', username: 'demo' } as { id: string; username: string } | null,
}))
vi.mock('@/lib/session', () => ({ getViewer: async () => deps.viewer }))
vi.mock('../lib/similar-groups', () => ({ searchSimilarGroups: deps.search }))

describe('findSimilarGroups (specs/community-create CG-22)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    deps.viewer = { id: 'me', username: 'demo' }
  })

  it('answers the groups found, and nothing when the search fails', async () => {
    const groups = [{ handle: '#defi', name: 'DeFi', memberCount: 1, path: '/hub/defi' }]
    deps.search.mockResolvedValue({ ok: true, data: groups })
    expect(await findSimilarGroups('  DeFi ')).toEqual(groups)
    expect(deps.search).toHaveBeenCalledWith('DeFi')
    deps.search.mockResolvedValue({ ok: false, errorKey: 'api.errors.UNAVAILABLE' })
    expect(await findSimilarGroups('DeFi')).toEqual([])
  })

  it('does not search a short or long name, nor without a session', async () => {
    expect(await findSimilarGroups('ab')).toEqual([])
    expect(await findSimilarGroups('a'.repeat(51))).toEqual([])
    expect(await findSimilarGroups(null)).toEqual([])
    deps.viewer = null
    expect(await findSimilarGroups('DeFi')).toEqual([])
    expect(deps.search).not.toHaveBeenCalled()
  })
})
