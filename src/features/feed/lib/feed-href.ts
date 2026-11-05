import type { FeedParams } from '../schemas/feed-params.schema'

/**
 * URL for a feed state, leaving defaults out so the canonical Home stays "/". Following has no
 * community filter (the contract filters Explore only), so switching to it drops `community`.
 * On a community page (specs/community-pages CP-07) the page itself is the community: only the
 * type goes in the query. The order is New, the only one for now: never written
 * (specs/feed-type-filter § 1).
 */
export function feedHref(params: FeedParams, pagePath?: string) {
  const type: Record<string, string> = params.type !== 'all' ? { type: params.type } : {}
  if (pagePath) return { pathname: pagePath, query: type }
  const query: Record<string, string> = {}
  if (params.feed !== 'for-you') query.feed = params.feed
  Object.assign(query, type)
  if (params.community && params.feed === 'for-you') query.community = params.community
  return { pathname: '/', query }
}
