// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { commentNode } from '../feed-items.fixture'
import type { CommentAd, CommentNode } from '../feed.types'
import { withAds } from './with-ads'

const ad = (id: string): CommentAd => ({
  id,
  advertiser: id,
  logoUrl: null,
  body: 'Ad',
  url: 'https://example.com',
  domain: 'example.com',
  imageUrl: null,
})
const ADS = [ad('a'), ad('b')]

/** The reading order, with ads: "c3 [a]". */
function read(comments: CommentNode[]): string[] {
  return comments.flatMap((each) => [
    each.body,
    ...(each.ad ? [`[${each.ad.id}]`] : []),
    ...read(each.replies),
  ])
}

const flat = (count: number) =>
  Array.from({ length: count }, (_, i) => commentNode({ body: `c${i + 1}` }))

describe('withAds (specs/post-detail-refresh PD-07)', () => {
  it('puts an ad after every 10th comment, rotating them', () => {
    const order = read(withAds(flat(31), ADS))
    expect(order[10]).toBe('[a]')
    expect(order[21]).toBe('[b]')
    expect(order[32]).toBe('[a]')
    expect(order.filter((each) => each.startsWith('['))).toHaveLength(3)
  })

  it('counts replies, and the ad goes before the replies of the 10th comment', () => {
    const tenth = commentNode({ body: 'c10' }, [commentNode({ body: 'r1' })])
    const comments = [...flat(9), tenth]
    expect(read(withAds(comments, ADS)).slice(9)).toEqual(['c10', '[a]', 'r1'])

    const deep = [
      commentNode({ body: 'p1' }, [commentNode({ body: 'p2' }, flat(8))]),
      commentNode({ body: 'next' }),
    ]
    // p1, p2 and c1…c8 are 10: the ad after c8, the 10th read.
    expect(read(withAds(deep, ADS))).toEqual([
      'p1',
      'p2',
      'c1',
      'c2',
      'c3',
      'c4',
      'c5',
      'c6',
      'c7',
      'c8',
      '[a]',
      'next',
    ])
  })

  it('does not count folded replies (from level 4)', () => {
    const folded = flat(20)
    const level3 = commentNode({ body: 'l3' }, folded)
    const tree = [commentNode({ body: 'l1' }, [commentNode({ body: 'l2' }, [level3])])]
    expect(read(withAds([...tree, ...flat(7)], ADS)).filter((each) => each === '[a]')).toEqual([
      '[a]',
    ])
    expect(withAds(tree, ADS)[0]!.replies[0]!.replies[0]!.replies.some((each) => each.ad)).toBe(
      false,
    )
  })

  it('leaves the comments as they were without ads', () => {
    const comments = flat(12)
    expect(withAds(comments, [])).toEqual(comments)
  })
})
