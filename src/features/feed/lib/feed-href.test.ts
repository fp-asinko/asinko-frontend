// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { feedHref } from './feed-href'

describe('feedHref', () => {
  it('leaves the defaults out so the plain Home stays "/"', () => {
    expect(feedHref({ feed: 'for-you', filter: 'new', type: 'all', community: undefined })).toEqual(
      {
        pathname: '/',
        query: {},
      },
    )
  })

  it('keeps every non-default value', () => {
    expect(
      feedHref({ feed: 'for-you', filter: 'new', type: 'theses', community: 'BTC' }).query,
    ).toEqual({
      type: 'theses',
      community: 'BTC',
    })
  })

  it('drops the community on Following', () => {
    expect(
      feedHref({ feed: 'following', filter: 'new', type: 'all', community: 'BTC' }).query,
    ).toEqual({
      feed: 'following',
    })
  })
})

describe('feedHref on a community page (specs/community-pages CP-07)', () => {
  it('stays on the page, with only the type in the query (specs/feed-type-filter FT-11)', () => {
    expect(
      feedHref({ feed: 'for-you', filter: 'new', type: 'polls', community: 'macro' }, '/hub/macro'),
    ).toEqual({ pathname: '/hub/macro', query: { type: 'polls' } })
    expect(
      feedHref({ feed: 'for-you', filter: 'new', type: 'all', community: 'BTC' }, '/asset/BTC'),
    ).toEqual({
      pathname: '/asset/BTC',
      query: {},
    })
  })
})
