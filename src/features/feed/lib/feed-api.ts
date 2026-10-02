import 'server-only'
import { z } from 'zod'
import {
  apiRequest,
  invalidInput,
  keepValidItems,
  paginatedSchema,
  type ApiResult,
} from '@/lib/api'
import { communitySchema, feedItemSchema, type RawCommunity } from '@/lib/api/contract'
import type { FeedPage } from '../feed.types'
import type { FeedParams } from '../schemas/feed-params.schema'
import { indexCommunities, toCommunityRef, toFeedItem } from './mappers'

/** Items are validated one by one (keepValidItems), so the envelope accepts anything (H-20). */
const looseListSchema = z.object({ items: z.array(z.unknown()), nextCursor: z.string().nullable() })

/** Opaque cursor from a previous page: checked before the request, never sent as-is if odd. */
const cursorSchema = z.string().regex(/^[A-Za-z0-9_\-=.:]{1,512}$/)

const EXPLORE = '/api/v1/feed/explore'
const FOLLOWING = '/api/v1/feed/following'

/** Theses arrive in phase 2: the feed asks only for what it shows, so a page keeps its 20 items. */
const KINDS = { new: 'POST,POLL', polls: 'POLL' } as const

function requestFeed(params: FeedParams, cursor: string | undefined) {
  const query: Record<string, string> = { kind: KINDS[params.filter] }
  if (cursor) query.cursor = cursor
  if (params.feed === 'following') {
    return apiRequest({ method: 'GET', path: FOLLOWING, query, schema: looseListSchema })
  }
  if (params.community) query.community = params.community
  return apiRequest({ method: 'GET', path: EXPLORE, query, schema: looseListSchema })
}

/** The filtered community, when there is one: tells a missing community from an empty one. */
function requestCommunity(params: FeedParams) {
  if (!params.community || params.feed === 'following') return Promise.resolve(null)
  return apiRequest({
    method: 'GET',
    path: '/api/v1/communities/:slug',
    params: { slug: params.community },
    schema: communitySchema,
  })
}

/**
 * One page of the Home feed (specs/home/design.md § 5). Never throws: the page decides what a
 * failure means (getOrThrow, notFound or an empty state).
 *
 * - Explore answers an empty page for an unknown community, so the community is fetched in
 *   parallel: NOT_FOUND there makes the page a 404 (backend dev).
 * - Posts only carry `communityId`, so names come from GET /communities (proposal P-004).
 */
export async function getFeed(params: FeedParams, cursor?: string): Promise<ApiResult<FeedPage>> {
  const endpoint = params.feed === 'following' ? FOLLOWING : EXPLORE
  if (cursor !== undefined && !cursorSchema.safeParse(cursor).success) return invalidInput(endpoint)

  const [feed, communities, filtered] = await Promise.all([
    requestFeed(params, cursor),
    apiRequest({
      method: 'GET',
      path: '/api/v1/communities',
      schema: paginatedSchema(communitySchema),
    }),
    requestCommunity(params),
  ])
  if (filtered && !filtered.ok && filtered.code === 'NOT_FOUND') return filtered
  if (!feed.ok) return feed

  // Without communities the feed still renders, only without community names (degraded).
  const known: RawCommunity[] = communities.ok ? [...communities.data.items] : []
  if (filtered?.ok) known.push(filtered.data)
  const index = indexCommunities(known)
  const items = keepValidItems(feed.data.items, feedItemSchema, `GET ${endpoint}`).map((item) =>
    toFeedItem(item, index),
  )

  return {
    ok: true,
    data: {
      items,
      nextCursor: feed.data.nextCursor,
      community: filtered?.ok ? toCommunityRef(filtered.data) : null,
    },
  }
}
