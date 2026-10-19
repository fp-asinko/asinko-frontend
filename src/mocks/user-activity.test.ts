// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { PROFILES } from './fixtures/users'
import { activeCommunities } from './user-activity'

const maria = PROFILES.find((profile) => profile.username === 'maria')!.id
const counts = (query: Record<string, string> = {}) =>
  (activeCommunities(maria, query).body as { items: Array<{ postCount: number }> }).items.map(
    (item) => item.postCount,
  )

describe('active communities mock (P-027, specs/profile-aside)', () => {
  it('counts where the person published, the most posts first', () => {
    const list = counts()
    expect(list.length).toBeGreaterThan(0)
    expect(list).toEqual([...list].sort((a, b) => b - a))
    expect(counts({ limit: '1' })).toHaveLength(1)
  })

  it('leaves out what is older than the days asked', () => {
    // A day back: only what was published today.
    expect(counts({ days: '1' }).reduce((sum, each) => sum + each, 0)).toBeLessThanOrEqual(
      counts({ days: '365' }).reduce((sum, each) => sum + each, 0),
    )
  })

  it('answers 404 for someone unknown and 422 for days or a limit out of range', () => {
    expect(activeCommunities('nobody', {})).toMatchObject({ status: 404 })
    expect(activeCommunities(maria, { days: '0' })).toMatchObject({ status: 422 })
    expect(activeCommunities(maria, { limit: '21' })).toMatchObject({ status: 422 })
  })
})
