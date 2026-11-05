// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { parseFeedParams } from './feed-params.schema'

describe('parseFeedParams', () => {
  it('defaults to the For you feed, New filter and no community', () => {
    expect(parseFeedParams({})).toEqual({
      feed: 'for-you',
      filter: 'new',
      type: 'all',
      community: undefined,
    })
    expect(parseFeedParams(undefined)).toEqual({
      feed: 'for-you',
      filter: 'new',
      type: 'all',
      community: undefined,
    })
  })

  it('accepts valid values', () => {
    expect(
      parseFeedParams({ feed: 'following', type: 'theses', community: 'trading-on-chain' }),
    ).toEqual({ feed: 'following', filter: 'new', type: 'theses', community: 'trading-on-chain' })
  })

  it('falls back to the default for invalid values instead of failing', () => {
    expect(
      parseFeedParams({ feed: 'hot', filter: 'top', type: 'ads', community: '../admin' }),
    ).toEqual({
      feed: 'for-you',
      filter: 'new',
      type: 'all',
      community: undefined,
    })
    expect(parseFeedParams({ community: 'B T C' }).community).toBeUndefined()
    expect(parseFeedParams({ community: '-btc' }).community).toBeUndefined()
  })

  it('reads an old ?filter=polls as the Polls type (specs/feed-type-filter FT-10)', () => {
    expect(parseFeedParams({ filter: 'polls' })).toMatchObject({ filter: 'new', type: 'polls' })
    // A type of its own wins.
    expect(parseFeedParams({ filter: 'polls', type: 'theses' }).type).toBe('theses')
  })

  it('takes the first value of a repeated parameter', () => {
    expect(
      parseFeedParams({ feed: ['following', 'for-you'], community: ['BTC', 'ETH'] }),
    ).toMatchObject({ feed: 'following', community: 'BTC' })
  })
})
