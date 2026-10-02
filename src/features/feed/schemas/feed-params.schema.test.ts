// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { parseFeedParams } from './feed-params.schema'

describe('parseFeedParams', () => {
  it('defaults to the For you feed, New filter and no community', () => {
    expect(parseFeedParams({})).toEqual({ feed: 'para-ti', filtro: 'new', comunidad: undefined })
    expect(parseFeedParams(undefined)).toEqual({
      feed: 'para-ti',
      filtro: 'new',
      comunidad: undefined,
    })
  })

  it('accepts valid values', () => {
    expect(
      parseFeedParams({ feed: 'siguiendo', filtro: 'polls', comunidad: 'trading-on-chain' }),
    ).toEqual({ feed: 'siguiendo', filtro: 'polls', comunidad: 'trading-on-chain' })
  })

  it('falls back to the default for invalid values instead of failing', () => {
    expect(parseFeedParams({ feed: 'hot', filtro: 'top', comunidad: '../admin' })).toEqual({
      feed: 'para-ti',
      filtro: 'new',
      comunidad: undefined,
    })
    expect(parseFeedParams({ comunidad: 'BTC' }).comunidad).toBeUndefined()
    expect(parseFeedParams({ comunidad: '-btc' }).comunidad).toBeUndefined()
  })

  it('takes the first value of a repeated parameter', () => {
    expect(
      parseFeedParams({ feed: ['siguiendo', 'para-ti'], comunidad: ['btc', 'eth'] }),
    ).toMatchObject({ feed: 'siguiendo', comunidad: 'btc' })
  })
})
