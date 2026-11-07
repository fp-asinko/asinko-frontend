import { beforeEach, describe, expect, it, vi } from 'vitest'
import { checkGroupSlug } from './check-group-slug.action'

const deps = vi.hoisted(() => ({
  availability: vi.fn(),
  viewer: { id: 'me', username: 'demo' } as { id: string; username: string } | null,
}))
vi.mock('@/lib/session', () => ({ getViewer: async () => deps.viewer }))
vi.mock('../lib/group-slug', () => ({ groupSlugAvailability: deps.availability }))

describe('checkGroupSlug (specs/community-create CG-06)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    deps.viewer = { id: 'me', username: 'demo' }
  })

  it('answers what the backend says for a valid handle', async () => {
    deps.availability.mockResolvedValue('taken')
    expect(await checkGroupSlug('defi')).toBe('taken')
    expect(deps.availability).toHaveBeenCalledWith('defi')
  })

  it('does not ask for an invalid handle nor without a session', async () => {
    for (const raw of [null, 'ab', 'Upper', '../admin', 'a'.repeat(31)]) {
      expect(await checkGroupSlug(raw)).toBe('unknown')
    }
    deps.viewer = null
    expect(await checkGroupSlug('options-flow')).toBe('unknown')
    expect(deps.availability).not.toHaveBeenCalled()
  })
})
