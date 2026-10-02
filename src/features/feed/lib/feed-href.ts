import type { FeedParams } from '../schemas/feed-params.schema'

/**
 * Home URL for a feed state, leaving defaults out so the canonical Home stays "/". Following has
 * no community filter (the contract filters Explore only), so switching to it drops `comunidad`.
 */
export function feedHref(params: FeedParams) {
  const query: Record<string, string> = {}
  if (params.feed !== 'para-ti') query.feed = params.feed
  if (params.filtro !== 'new') query.filtro = params.filtro
  if (params.comunidad && params.feed === 'para-ti') query.comunidad = params.comunidad
  return { pathname: '/' as const, query }
}
