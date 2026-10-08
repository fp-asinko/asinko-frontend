// @vitest-environment node
import { describe, expect, it } from 'vitest'
import type { RawCommunity } from '@/lib/api/contract'
import { COMMUNITIES } from '@/mocks/fixtures/communities'
import { kindOf, toCommunityPage } from './mappers'

const defi = COMMUNITIES.find((each) => each.slug === 'defi')!
const btc = COMMUNITIES.find((each) => each.slug === 'BTC')!

describe('community page mappers (specs/community-pages)', () => {
  it.each([
    ['USER_PUBLIC', 'group'],
    ['SYSTEM_CATEGORY', 'group'],
    ['SYSTEM_GEO', 'group'],
    ['SYSTEM_ASSET', 'asset'],
    ['PERSONAL_CHANNEL', 'user'],
  ] as const)('sends %s to the %s page (CP-02)', (type, kind) => {
    expect(kindOf(type)).toBe(kind)
  })

  it('titles a group with # and an asset with $, the name below only when it says more', () => {
    expect(toCommunityPage(defi)).toMatchObject({ handle: '#defi', kind: 'group' })
    expect(toCommunityPage(btc)).toMatchObject({ handle: '$BTC', subtitle: 'Bitcoin' })
    // The backend names system communities with their symbol: no repeated subtitle.
    expect(toCommunityPage({ ...defi, slug: 'macro', name: '#Macro' }).subtitle).toBeNull()
  })

  it('keeps only http(s) external links, with their domain (security.md § 1)', () => {
    const page = (mainUrl: string | null) => toCommunityPage({ ...defi, mainUrl }).mainUrl
    expect(page('https://www.defillama.com/')).toEqual({
      url: 'https://www.defillama.com/',
      domain: 'defillama.com',
    })
    expect(page('javascript:alert(1)')).toBeNull()
    expect(page('not a url')).toBeNull()
    expect(page(null)).toBeNull()
  })

  it('drops images from hosts next/image does not allow, and empty texts', () => {
    const raw: RawCommunity = {
      ...defi,
      avatarUrl: 'https://evil.example/a.png',
      bannerUrl: 'https://evil.example/b.png',
      description: '  ',
      rules: '',
    }
    expect(toCommunityPage(raw)).toMatchObject({
      avatarUrl: null,
      bannerUrl: null,
      description: null,
      rules: null,
    })
  })

  it('reads a missing favorite (no session) as not favorite', () => {
    expect(toCommunityPage({ ...defi, viewerIsFavorite: null }).viewerIsFavorite).toBe(false)
    expect(toCommunityPage({ ...defi, viewerIsFavorite: true }).viewerIsFavorite).toBe(true)
  })

  it('dates only the groups a person created (specs/mention-preview MP-03)', () => {
    const at = '2025-11-20T10:00:00.000Z'
    const system = { ...defi, createdByProfileId: null, createdAt: at }
    const people = {
      ...defi,
      createdByProfileId: '00000000-0000-4000-8000-000000000001',
      createdAt: at,
    }
    expect(toCommunityPage(system).createdAt).toBeNull()
    expect(toCommunityPage(people).createdAt).toBe(at)
  })
})
