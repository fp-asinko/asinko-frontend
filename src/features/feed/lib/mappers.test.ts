// @vitest-environment node
import { describe, expect, it } from 'vitest'
import type { RawPost } from '@/lib/api/contract'
import { COMMUNITIES } from '@/mocks/fixtures/communities'
import { POLLS } from '@/mocks/fixtures/polls'
import { POSTS } from '@/mocks/fixtures/posts'
import type { PostItem } from '../feed.types'
import {
  indexCommunities,
  mentionEntities,
  toCardCommunity,
  toAdItem,
  toFeedItem,
  toFeedReason,
  toPollItem,
  toPostItem,
} from './mappers'

const communities = indexCommunities(COMMUNITIES)
const post = (n: number) => POSTS[n - 1]!

describe('toPostItem', () => {
  it('resolves the community handle and marks the mentions', () => {
    const item = toPostItem(post(1), communities)
    expect(item.community).toMatchObject({ slug: 'BTC', name: 'Bitcoin', handle: '$BTC' })
    expect(item.author).toMatchObject({ username: 'maria', handle: '@maria', accuracyRate: 0.74 })
    expect(item.body).toContain('[$BTC](asinko:asset/BTC)')
    expect(item.body).toContain('[#trading-on-chain](asinko:community/trading-on-chain)')
    expect(item.media).toEqual({ type: 'image', url: '/mocks/chart-btc.svg', alt: null })
    // Its page, with the slug of its title (specs/post-create-detail § 1).
    expect(item.path).toMatch(new RegExp(`^/post/${item.id}/[a-z0-9-]+$`))
  })

  it('maps its related ones as mentions with their page, the symbol from the name (BA-07, BA-10)', () => {
    const item = toPostItem(
      {
        ...post(1),
        related: [
          {
            id: COMMUNITIES[0]!.id,
            slug: 'brk-b',
            name: '$BRK.B',
            type: 'SYSTEM_ASSET',
            avatarUrl: null,
          },
          {
            id: COMMUNITIES[1]!.id,
            slug: 'macro',
            name: '#macro',
            type: 'SYSTEM_CATEGORY',
            avatarUrl: null,
          },
        ],
      },
      communities,
    )
    expect(item.related).toEqual([
      { handle: '$BRK.B', path: '/asset/BRK.B' },
      { handle: '#macro', path: '/hub/macro' },
    ])
    expect(toPostItem({ ...post(1), related: undefined }, communities).related).toEqual([])
  })

  it('shows the real domain of links', () => {
    expect(toPostItem(post(6), communities).media).toEqual({
      type: 'link',
      url: 'https://www.argentina.gob.ar/cnv',
      domain: 'argentina.gob.ar',
    })
  })

  it('drops unsafe links and images', () => {
    const base = post(6)
    const js: RawPost = { ...base, url: 'javascript:alert(1)' }
    const image: RawPost = { ...post(1), imageUrl: 'http://evil.example/x.png' }
    // A host outside the allowlist (the seed's placeholders) would make next/image throw.
    const unknownHost: RawPost = { ...post(1), imageUrl: 'https://placehold.co/800x450' }
    const protocolRelative: RawPost = { ...post(1), imageUrl: '//evil.example/x.png' }
    expect(toPostItem(js, communities).media).toBeNull()
    expect(toPostItem(image, communities).media).toBeNull()
    expect(toPostItem(protocolRelative, communities).media).toBeNull()
    expect(toPostItem(unknownHost, communities).media).toBeNull()
  })

  it('handles system, edited and deleted posts', () => {
    expect(toPostItem(post(8), communities).author).toBeNull()
    expect(toPostItem(post(10), communities).edited).toBe(true)
    const deleted = toPostItem(post(12), communities)
    expect(deleted).toMatchObject({ deleted: true, body: '', media: null })
  })

  it('takes the community from the content, whatever page of communities it is on (BC-01)', () => {
    const elsewhere: RawPost = {
      ...post(1),
      community: {
        id: '00000000-0000-4000-8000-00000000ffff',
        slug: 'options-flow',
        name: 'Options flow',
        type: 'USER_PUBLIC',
        avatarUrl: null,
        viewerMembership: null,
      },
    }
    // No communities list at all: the card is still named.
    expect(toPostItem(elsewhere, indexCommunities([])).community).toMatchObject({
      slug: 'options-flow',
      name: 'Options flow',
      handle: '#options-flow',
    })
  })

  it('leaves $ and # mentions as plain text without the communities to resolve them', () => {
    const item = toPostItem(post(1), indexCommunities([]))
    expect(item.body).not.toContain('asinko:community/')
  })
})

describe('toPollItem', () => {
  it('computes each option share when results are visible', () => {
    const poll = toPollItem(POLLS[0]!)
    expect(poll.resultsVisible).toBe(true)
    const total = poll.options.reduce((sum, option) => sum + (option.votes ?? 0), 0)
    expect(poll.totalVotes).toBe(total)
    expect(poll.options[1]!.share).toBeCloseTo(892 / total)
  })

  it('hides the results until voting (ON_VOTE)', () => {
    const poll = toPollItem(POLLS[1]!)
    expect(poll.resultsVisible).toBe(false)
    expect(poll.options.every((option) => option.share === null)).toBe(true)
  })

  it('takes its community from the content (P-004)', () => {
    expect(toPollItem(POLLS[0]!).community).toMatchObject({
      slug: 'BTC',
      name: 'Bitcoin',
      handle: '$BTC',
    })
  })

  it('maps through the feed item kind', () => {
    expect(toFeedItem({ kind: 'POLL', content: POLLS[2]! }, communities)?.kind).toBe('poll')
    expect(toFeedItem({ kind: 'POST', content: post(2) }, communities)?.kind).toBe('post')
  })

  it('treats a poll with no votes as 0% each', () => {
    const empty = {
      ...POLLS[0]!,
      totalVotes: 0,
      options: POLLS[0]!.options.map((option) => ({ ...option, voteCount: 0 })),
    }
    expect(toPollItem(empty).options.every((option) => option.share === 0)).toBe(true)
  })
})

describe('toCardCommunity (specs/community-first CF-04, P-010)', () => {
  const storage = 'https://hqarefesoovfmibncivu.supabase.co/storage/v1/object/public/c/acciones.png'
  const defi = COMMUNITIES.find((each) => each.slug === 'defi')!
  const base = {
    id: defi.id,
    slug: defi.slug,
    name: defi.name,
    type: defi.type,
    avatarUrl: null,
    viewerMembership: null,
  }

  it('takes avatar and membership from the summary (P-010)', () => {
    expect(
      toCardCommunity({ ...base, avatarUrl: storage, viewerMembership: 'MEMBER' }, true),
    ).toMatchObject({ handle: '#defi', avatarUrl: storage, personal: false, viewerIsMember: true })
    expect(toCardCommunity(base, true)).toMatchObject({ avatarUrl: null, viewerIsMember: false })
  })

  it('has no membership without a session, even if the summary says so', () => {
    expect(toCardCommunity({ ...base, viewerMembership: 'MEMBER' }, false).viewerIsMember).toBe(
      null,
    )
  })

  it('drops an avatar from a host next/image does not allow', () => {
    expect(
      toCardCommunity({ ...base, avatarUrl: 'https://evil.example/a.png' }, false).avatarUrl,
    ).toBeNull()
  })

  it('marks the personal channel of a user', () => {
    expect(toCardCommunity({ ...base, type: 'PERSONAL_CHANNEL' }, true).personal).toBe(true)
  })
})

describe('mentionEntities (BC-02)', () => {
  it('takes only the $ and # mentions of the posts, the ones that need a community to link', () => {
    const entities = mentionEntities([{ kind: 'POST', content: post(1) }])
    expect(entities.length).toBeGreaterThan(0)
    expect(entities.every((entity) => entity.type !== 'MENTION')).toBe(true)
    expect(mentionEntities([{ kind: 'POST', content: { ...post(1), entities: [] } }])).toEqual([])
  })
})

describe('toFeedReason (specs/explore-v1 Q1, EX-02)', () => {
  const macro = COMMUNITIES.find((each) => each.slug === 'macro')!
  const btc = COMMUNITIES.find((each) => each.slug === 'BTC')!
  const via = (community: typeof macro) => {
    const { id, slug, name, type, avatarUrl } = community
    return { id, slug, name, type, avatarUrl }
  }

  it('names the followed community that brought it, a group or an asset', () => {
    expect(toFeedReason({ type: 'SIMILAR', via: via(macro), countryCode: null })).toEqual({
      type: 'similar',
      community: { handle: '#macro', path: '/hub/macro' },
    })
    expect(toFeedReason({ type: 'SIMILAR', via: via(btc), countryCode: null })).toEqual({
      type: 'similar',
      community: { handle: '$BTC', path: '/asset/BTC' },
    })
  })

  it('keeps the country code of a popular item in the country', () => {
    expect(toFeedReason({ type: 'COUNTRY', via: null, countryCode: 'AR' })).toEqual({
      type: 'country',
      countryCode: 'AR',
    })
  })

  it('has no line for what the card already says, nor for an incomplete or unknown reason', () => {
    for (const reason of [
      { type: 'FOLLOWING', via: null, countryCode: null },
      { type: 'TRENDING', via: null, countryCode: null },
      { type: 'SIMILAR', via: null, countryCode: null },
      { type: 'COUNTRY', via: null, countryCode: null },
      { type: 'NEW_POOL', via: via(macro), countryCode: 'AR' },
      null,
      undefined,
    ]) {
      expect(toFeedReason(reason)).toBeNull()
    }
  })

  it('reaches the card only when the feed explains itself', () => {
    const reason = { type: 'COUNTRY', via: null, countryCode: 'AR' }
    const item = { kind: 'POST' as const, content: post(1), reason }
    expect((toFeedItem(item, communities, false, true) as PostItem).reason).toEqual({
      type: 'country',
      countryCode: 'AR',
    })
    expect((toFeedItem(item, communities) as PostItem).reason).toBeNull()
  })
})

describe('toAdItem (specs/ads AD-06)', () => {
  const raw = {
    id: '00000000-0000-4000-8000-000000031001',
    advertiser: { name: 'eToro', logoUrl: null },
    body: null,
    url: 'https://www.etoro.com/crypto/',
    image: { url: '/mocks/ads/etoro-crypto.jpg', width: 480, height: 320, alt: 'Buy crypto' },
  }

  it('takes an http(s) ad, with its real domain and its image size', () => {
    expect(toAdItem(raw)).toEqual({
      kind: 'ad',
      id: raw.id,
      advertiser: 'eToro',
      logoUrl: null,
      body: null,
      url: 'https://www.etoro.com/crypto/',
      domain: 'etoro.com',
      image: { src: '/mocks/ads/etoro-crypto.jpg', width: 480, height: 320, alt: 'Buy crypto' },
    })
  })

  it('leaves out any other link', () => {
    for (const url of ['javascript:alert(1)', 'data:text/html,hi', 'ftp://x.com', 'not a url']) {
      expect(toAdItem({ ...raw, url })).toBeNull()
    }
  })
})
