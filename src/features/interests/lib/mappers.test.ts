import { describe, expect, it } from 'vitest'
import type { RawCommunity } from '@/lib/api/contract'
import { COMMUNITIES } from '@/mocks/fixtures/communities'
import {
  memberAssetCommunities,
  SUGGESTION_COUNT,
  toGroups,
  toPerson,
  toSuggestions,
} from './mappers'

function community(overrides: Partial<RawCommunity>): RawCommunity {
  return { ...COMMUNITIES[0]!, ...overrides }
}

describe('interests mappers', () => {
  it('keeps only the asset communities the viewer belongs to', () => {
    const list = [
      community({ slug: 'btc', type: 'SYSTEM_ASSET', viewerMembership: 'MEMBER' }),
      community({ slug: 'eth', type: 'SYSTEM_ASSET', viewerMembership: null }),
      community({ slug: 'defi', type: 'USER_PUBLIC', viewerMembership: 'MEMBER' }),
    ]
    expect(memberAssetCommunities(list).map((c) => c.slug)).toEqual(['btc'])
  })

  it('lists member groups with the moderated ones first', () => {
    const list = [
      community({ slug: 'a', type: 'USER_PUBLIC', viewerMembership: 'MEMBER' }),
      community({ slug: 'b', type: 'USER_PUBLIC', viewerMembership: 'MODERATOR' }),
      community({ slug: 'c', type: 'USER_PUBLIC', viewerMembership: null }),
      community({ slug: 'd', type: 'SYSTEM_ASSET', viewerMembership: 'MEMBER' }),
    ]
    expect(toGroups(list).map((g) => [g.handle, g.isModerator])).toEqual([
      ['#b', true],
      ['#a', false],
    ])
  })

  it('suggests the three biggest communities the viewer is not in', () => {
    const list = [10, 50, 30, 40, 20].map((memberCount, index) =>
      community({ slug: `c${index}`, type: 'USER_PUBLIC', viewerMembership: null, memberCount }),
    )
    list.push(community({ slug: 'mine', viewerMembership: 'MEMBER', memberCount: 999 }))
    expect(toSuggestions(list).map((s) => s.slug)).toEqual(['c1', 'c3', 'c2'])
  })

  it('marks suggested asset communities with $ and groups with #', () => {
    const list = [
      community({ slug: 'eth', type: 'SYSTEM_ASSET', viewerMembership: null, memberCount: 2 }),
      community({ slug: 'macro', type: 'USER_PUBLIC', viewerMembership: null, memberCount: 1 }),
    ]
    expect(toSuggestions(list).map((s) => s.handle)).toEqual(['$ETH', '#macro'])
  })

  it('suggests up to 8 communities without a session', () => {
    const list = Array.from({ length: 12 }, (_, index) =>
      community({
        slug: `c${index}`,
        type: 'USER_PUBLIC',
        viewerMembership: null,
        memberCount: index,
      }),
    )
    expect(toSuggestions(list, SUGGESTION_COUNT.guest)).toHaveLength(8)
    expect(toSuggestions(list)).toHaveLength(3)
  })

  it('defaults a missing accuracy to null', () => {
    expect(
      toPerson({ id: 'x', username: 'ana', avatarUrl: null } as Parameters<typeof toPerson>[0]),
    ).toMatchObject({ handle: '@ana', accuracyRate: null })
  })
})
