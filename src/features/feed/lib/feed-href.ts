import type { FeedParams } from '../schemas/feed-params.schema'

/**
 * URL for a feed state, leaving defaults out so the canonical Home stays "/". Following has no
 * community filter (the contract filters Explore only), so switching to it drops `community`.
 * On a community page (specs/community-pages CP-07) the page itself is the community: only the
 * filter goes in the query.
 */
export function feedHref(params: FeedParams, pagePath?: string) {
  const filter: Record<string, string> = params.filter !== 'new' ? { filter: params.filter } : {}
  if (pagePath) return { pathname: pagePath, query: filter }
  const query: Record<string, string> = {}
  if (params.feed !== 'for-you') query.feed = params.feed
  Object.assign(query, filter)
  if (params.community && params.feed === 'for-you') query.community = params.community
  return { pathname: '/', query }
}
