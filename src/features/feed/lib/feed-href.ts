import type { FeedParams } from '../schemas/feed-params.schema'

/**
 * Home URL for a feed state, leaving defaults out so the canonical Home stays "/". Following has
 * no community filter (the contract filters Explore only), so switching to it drops `community`.
 */
export function feedHref(params: FeedParams) {
  const query: Record<string, string> = {}
  if (params.feed !== 'for-you') query.feed = params.feed
  if (params.filter !== 'new') query.filter = params.filter
  if (params.community && params.feed === 'for-you') query.community = params.community
  return { pathname: '/' as const, query }
}
