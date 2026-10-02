import { describe, expect, it } from 'vitest'
import type { RawCommunity } from '@/lib/api/contract'
import { COMMUNITIES } from '@/mocks/fixtures/communities'
import { memberAssetCommunities, toGroups, toPerson, toSuggestions } from './mappers'

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
    expect(toGroups(list).map((g) => [g.slug, g.isModerator])).toEqual([
      ['b', true],
      ['a', false],
    ])
  })

  it('suggests the three biggest communities the viewer is not in', () => {
    const list = [10, 50, 30, 40, 20].map((memberCount, index) =>
      community({ slug: `c${index}`, type: 'USER_PUBLIC', viewerMembership: null, memberCount }),
    )
    list.push(community({ slug: 'mine', viewerMembership: 'MEMBER', memberCount: 999 }))
    expect(toSuggestions(list).map((s) => s.slug)).toEqual(['c1', 'c3', 'c2'])
  })

  it('defaults a missing accuracy to null', () => {
    expect(
      toPerson({ id: 'x', username: 'ana', avatarUrl: null } as Parameters<typeof toPerson>[0]),
    ).toMatchObject({ accuracyRate: null })
  })
})
