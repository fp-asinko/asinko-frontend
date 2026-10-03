// @vitest-environment node
import { describe, expect, it } from 'vitest'
import type { RawPost } from '@/lib/api/contract'
import { COMMUNITIES } from '@/mocks/fixtures/communities'
import { POLLS } from '@/mocks/fixtures/polls'
import { POSTS } from '@/mocks/fixtures/posts'
import { indexCommunities, toFeedItem, toPollItem, toPostItem } from './mappers'

const communities = indexCommunities(COMMUNITIES)
const post = (n: number) => POSTS[n - 1]!

describe('toPostItem', () => {
  it('resolves the community handle and marks the mentions', () => {
    const item = toPostItem(post(1), communities)
    expect(item.community).toEqual({ slug: 'btc', name: 'Bitcoin', handle: '$BTC' })
    expect(item.author).toMatchObject({ username: 'maria', handle: '@maria', accuracyRate: 0.74 })
    expect(item.body).toContain('[$BTC](asinko:community/btc)')
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

  it('leaves the community null when it is unknown', () => {
    const orphan: RawPost = { ...post(1), communityId: '00000000-0000-4000-8000-00000000ffff' }
    expect(toPostItem(orphan, communities).community).toBeNull()
  })
})

describe('toPollItem', () => {
  it('computes each option share when results are visible', () => {
    const poll = toPollItem(POLLS[0]!, communities)
    expect(poll.resultsVisible).toBe(true)
    const total = poll.options.reduce((sum, option) => sum + (option.votes ?? 0), 0)
    expect(poll.totalVotes).toBe(total)
    expect(poll.options[1]!.share).toBeCloseTo(892 / total)
  })

  it('hides the results until voting (ON_VOTE)', () => {
    const poll = toPollItem(POLLS[1]!, communities)
    expect(poll.resultsVisible).toBe(false)
    expect(poll.options.every((option) => option.share === null)).toBe(true)
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
    expect(toPollItem(empty, communities).options.every((option) => option.share === 0)).toBe(true)
  })
})
