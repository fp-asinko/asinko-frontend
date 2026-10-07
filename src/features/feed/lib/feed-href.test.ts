// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { feedHref } from './feed-href'

describe('feedHref', () => {
  it('leaves the defaults out so the plain Home stays "/"', () => {
    expect(feedHref({ feed: 'for-you', filter: 'new', community: undefined })).toEqual({
      pathname: '/',
      query: {},
    })
  })

  it('keeps every non-default value', () => {
    expect(feedHref({ feed: 'for-you', filter: 'polls', community: 'BTC' }).query).toEqual({
      filter: 'polls',
      community: 'BTC',
    })
  })

  it('drops the community on Following', () => {
    expect(feedHref({ feed: 'following', filter: 'new', community: 'BTC' }).query).toEqual({
      feed: 'following',
    })
  })
})

describe('feedHref on a community page (specs/community-pages CP-07)', () => {
  it('stays on the page, with only the filter in the query', () => {
    expect(
      feedHref({ feed: 'for-you', filter: 'polls', community: 'macro' }, '/hub/macro'),
    ).toEqual({ pathname: '/hub/macro', query: { filter: 'polls' } })
    expect(feedHref({ feed: 'for-you', filter: 'new', community: 'BTC' }, '/asset/BTC')).toEqual({
      pathname: '/asset/BTC',
      query: {},
    })
  })
})
