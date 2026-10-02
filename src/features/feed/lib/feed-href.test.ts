// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { feedHref } from './feed-href'

describe('feedHref', () => {
  it('leaves the defaults out so the plain Home stays "/"', () => {
    expect(feedHref({ feed: 'para-ti', filtro: 'new', comunidad: undefined })).toEqual({
      pathname: '/',
      query: {},
    })
  })

  it('keeps every non-default value', () => {
    expect(feedHref({ feed: 'para-ti', filtro: 'polls', comunidad: 'btc' }).query).toEqual({
      filtro: 'polls',
      comunidad: 'btc',
    })
  })

  it('drops the community on Following', () => {
    expect(feedHref({ feed: 'siguiendo', filtro: 'new', comunidad: 'btc' }).query).toEqual({
      feed: 'siguiendo',
    })
  })
})
