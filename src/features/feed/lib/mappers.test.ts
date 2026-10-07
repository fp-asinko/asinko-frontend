// @vitest-environment node
import { describe, expect, it } from 'vitest'
import type { RawPost } from '@/lib/api/contract'
import { COMMUNITIES } from '@/mocks/fixtures/communities'
import { POLLS } from '@/mocks/fixtures/polls'
import { POSTS } from '@/mocks/fixtures/posts'
import {
  indexCardCommunities,
  indexCommunities,
  toCardCommunity,
  toFeedItem,
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
    expect(item.body).toContain('[$BTC](asinko:community/BTC)')
    expect(item.body).toContain('[#trading-on-chain](asinko:community/trading-on-chain)')
    expect(item.media).toEqual({ type: 'image', url: '/mocks/chart-btc.svg' })
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
    expect(toFeedItem({ kind: 'POLL', content: POLLS[2]! }, communities).kind).toBe('poll')
    expect(toFeedItem({ kind: 'POST', content: post(2) }, communities).kind).toBe('post')
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

describe('toCardCommunity (specs/community-first CF-04, CF-12)', () => {
  const storage = 'https://hqarefesoovfmibncivu.supabase.co/storage/v1/object/public/c/acciones.png'
  const defi = COMMUNITIES.find((each) => each.slug === 'defi')!
  const base = { id: defi.id, slug: defi.slug, name: defi.name, type: defi.type }

  it('takes avatar and membership from the summary when the backend sends them (P-010)', () => {
    const lookup = indexCardCommunities([], [], true)
    expect(
      toCardCommunity({ ...base, avatarUrl: storage, viewerMembership: 'MEMBER' }, lookup),
    ).toMatchObject({ handle: '#defi', avatarUrl: storage, personal: false, viewerIsMember: true })
    expect(
      toCardCommunity({ ...base, avatarUrl: null, viewerMembership: null }, lookup),
    ).toMatchObject({ avatarUrl: null, viewerIsMember: false })
  })

  it('falls back to the community lists while P-010 is missing', () => {
    const listed = { ...defi, avatarUrl: storage, viewerMembership: 'MEMBER' as const }
    expect(toCardCommunity(base, indexCardCommunities([listed], [listed], true))).toMatchObject({
      avatarUrl: storage,
      viewerIsMember: true,
    })
    expect(toCardCommunity(base, indexCardCommunities([], [], true))).toMatchObject({
      avatarUrl: null,
      viewerIsMember: false,
    })
  })

  it('has no membership without a session, even if the summary says so', () => {
    const lookup = indexCardCommunities([], [], false)
    expect(toCardCommunity({ ...base, viewerMembership: 'MEMBER' }, lookup).viewerIsMember).toBe(
      null,
    )
  })

  it('drops an avatar from a host next/image does not allow', () => {
    const lookup = indexCardCommunities([], [], false)
    expect(
      toCardCommunity({ ...base, avatarUrl: 'https://evil.example/a.png' }, lookup).avatarUrl,
    ).toBeNull()
  })

  it('marks the personal channel of a user', () => {
    const lookup = indexCardCommunities([], [], true)
    expect(toCardCommunity({ ...base, type: 'PERSONAL_CHANNEL' }, lookup).personal).toBe(true)
  })
})
