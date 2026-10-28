import { describe, expect, it } from 'vitest'
import type { RawCommunity } from '@/lib/api/contract'
import { COMMUNITIES } from '@/mocks/fixtures/communities'
import {
  favoritesFirst,
  followedChannels,
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
      community({ slug: 'BTC', type: 'SYSTEM_ASSET', viewerMembership: 'MEMBER' }),
      community({ slug: 'ETH', type: 'SYSTEM_ASSET', viewerMembership: null }),
      community({ slug: 'defi', type: 'USER_PUBLIC', viewerMembership: 'MEMBER' }),
    ]
    expect(memberAssetCommunities(list).map((c) => c.slug)).toEqual(['BTC'])
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

  it('suggests the biggest communities the viewer is not in, the biggest first', () => {
    const list = [10, 50, 30, 40, 20].map((memberCount, index) =>
      community({ slug: `c${index}`, type: 'USER_PUBLIC', viewerMembership: null, memberCount }),
    )
    list.push(community({ slug: 'mine', viewerMembership: 'MEMBER', memberCount: 999 }))
    expect(toSuggestions(list).map((s) => s.slug)).toEqual(['c1', 'c3', 'c2', 'c4', 'c0'])
  })

  it('marks suggested asset communities with $ and groups with #', () => {
    const list = [
      community({ slug: 'ETH', type: 'SYSTEM_ASSET', viewerMembership: null, memberCount: 2 }),
      community({ slug: 'macro', type: 'USER_PUBLIC', viewerMembership: null, memberCount: 1 }),
    ]
    expect(toSuggestions(list).map((s) => s.handle)).toEqual(['$ETH', '#macro'])
  })

  it('suggests up to 8, with or without a session (specs/sidebar-fill SF-02)', () => {
    const list = Array.from({ length: 12 }, (_, index) =>
      community({
        slug: `c${index}`,
        type: 'USER_PUBLIC',
        viewerMembership: null,
        memberCount: index,
      }),
    )
    expect(toSuggestions(list, SUGGESTION_COUNT.guest)).toHaveLength(8)
    expect(toSuggestions(list)).toHaveLength(8)
  })

  it('defaults a missing accuracy to null', () => {
    expect(
      toPerson({ id: 'x', username: 'ana', avatarUrl: null } as Parameters<typeof toPerson>[0]),
    ).toMatchObject({ handle: '@ana', accuracyRate: null })
  })

  it('drops an avatar from a host next/image does not allow, so the column never breaks', () => {
    const person = (avatarUrl: string) =>
      toPerson({ id: 'x', username: 'ana', avatarUrl } as Parameters<typeof toPerson>[0])
    expect(person('https://evil.example/a.png').avatarUrl).toBeNull()
    const storage =
      'https://hqarefesoovfmibncivu.supabase.co/storage/v1/object/public/avatars/seed/ana.png'
    expect(person(storage).avatarUrl).toBe(storage)
  })
})

describe('what each community is about (specs/interests-refresh IR-01, IR-02)', () => {
  const group = COMMUNITIES.find(
    (each) => each.viewerMembership && each.type === 'USER_PUBLIC',
  ) as RawCommunity
  const other = COMMUNITIES.find(
    (each) => !each.viewerMembership && each.type !== 'PERSONAL_CHANNEL',
  ) as RawCommunity

  it('maps the main post title (P-016), and blanks as nothing', () => {
    const topPost = { id: 'p1', title: '  0DTE SPY calls into FOMC  ' }
    expect(toGroups([{ ...group, topPost }])[0]).toMatchObject({
      topPostTitle: '0DTE SPY calls into FOMC',
    })
    expect(
      toGroups([{ ...group, topPost: { id: 'p1', title: '  ' }, description: '' }])[0],
    ).toMatchObject({ topPostTitle: null, description: null })
    expect(toSuggestions([{ ...other, topPost: null, description: 'About it' }])[0]).toMatchObject({
      topPostTitle: null,
      description: 'About it',
    })
  })

  it('works without the field, as the backend today', () => {
    const { topPost: _absent, ...today } = { ...group, topPost: undefined }
    expect(toGroups([today as RawCommunity])[0]).toMatchObject({ topPostTitle: null })
  })
})

describe('favorites (specs/favorites FV-01)', () => {
  it('finds whom the viewer follows by their channel, with its favorite', () => {
    const channels = followedChannels([
      {
        ...COMMUNITIES[0]!,
        slug: 'maria',
        type: 'PERSONAL_CHANNEL',
        createdByProfileId: '00000000-0000-4000-8000-000000000001',
        viewerMembership: 'MEMBER',
        viewerIsFavorite: true,
      },
    ])
    expect(channels.get('00000000-0000-4000-8000-000000000001')).toEqual({
      slug: 'maria',
      favorite: true,
    })
  })

  it('puts favorites first and keeps the rest in their order', () => {
    const items = [
      { id: 'a', favorite: false },
      { id: 'b', favorite: true },
      { id: 'c', favorite: false },
    ]
    expect(favoritesFirst(items).map((each) => each.id)).toEqual(['b', 'a', 'c'])
  })
})
