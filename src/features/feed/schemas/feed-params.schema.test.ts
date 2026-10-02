// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { parseFeedParams } from './feed-params.schema'

describe('parseFeedParams', () => {
  it('defaults to the For you feed, New filter and no community', () => {
    expect(parseFeedParams({})).toEqual({ feed: 'for-you', filter: 'new', community: undefined })
    expect(parseFeedParams(undefined)).toEqual({
      feed: 'for-you',
      filter: 'new',
      community: undefined,
    })
  })

  it('accepts valid values', () => {
    expect(
      parseFeedParams({ feed: 'following', filter: 'polls', community: 'trading-on-chain' }),
    ).toEqual({ feed: 'following', filter: 'polls', community: 'trading-on-chain' })
  })

  it('falls back to the default for invalid values instead of failing', () => {
    expect(parseFeedParams({ feed: 'hot', filter: 'top', community: '../admin' })).toEqual({
      feed: 'for-you',
      filter: 'new',
      community: undefined,
    })
    expect(parseFeedParams({ community: 'BTC' }).community).toBeUndefined()
    expect(parseFeedParams({ community: '-btc' }).community).toBeUndefined()
  })

  it('takes the first value of a repeated parameter', () => {
    expect(
      parseFeedParams({ feed: ['following', 'for-you'], community: ['btc', 'eth'] }),
    ).toMatchObject({ feed: 'following', community: 'btc' })
  })
})
