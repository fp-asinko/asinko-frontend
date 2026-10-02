import 'server-only'
import { z } from 'zod'
import {
  apiRequest,
  invalidInput,
  keepValidItems,
  paginatedSchema,
  type ApiResult,
} from '@/lib/api'
import { communitySchema, feedItemSchema } from '@/lib/api/contract'
import type { FeedPage } from '../feed.types'
import type { FeedParams } from '../schemas/feed-params.schema'
import { indexCommunities, toFeedItem } from './mappers'

/** Items are validated one by one (keepValidItems), so the envelope accepts anything (H-20). */
const looseListSchema = z.object({ items: z.array(z.unknown()), nextCursor: z.string().nullable() })

/** Opaque cursor from a previous page: checked before the request, never sent as-is if odd. */
const cursorSchema = z.string().regex(/^[A-Za-z0-9_\-=.:]{1,512}$/)

const EXPLORE = '/api/v1/feed/explore'
const FOLLOWING = '/api/v1/feed/following'

function requestFeed(params: FeedParams, cursor: string | undefined) {
  const query: Record<string, string> = cursor ? { cursor } : {}
  if (params.feed === 'siguiendo') {
    return apiRequest({ method: 'GET', path: FOLLOWING, query, schema: looseListSchema })
  }
  if (params.comunidad) query.community = params.comunidad
  return apiRequest({ method: 'GET', path: EXPLORE, query, schema: looseListSchema })
}

/**
 * One page of the Home feed (specs/home/design.md § 5). Never throws: the page decides what a
 * failure means (getOrThrow, notFound or an empty state).
 *
 * Contract limitations, proposed to the backend:
 * - Posts only carry `communityId`, so communities are resolved with GET /communities (P-004).
 * - There is no filter by kind, so Polls filters the received page (P-005).
 */
export async function getFeed(params: FeedParams, cursor?: string): Promise<ApiResult<FeedPage>> {
  const endpoint = params.feed === 'siguiendo' ? FOLLOWING : EXPLORE
  if (cursor !== undefined && !cursorSchema.safeParse(cursor).success) return invalidInput(endpoint)

  const [feed, communities] = await Promise.all([
    requestFeed(params, cursor),
    apiRequest({
      method: 'GET',
      path: '/api/v1/communities',
      schema: paginatedSchema(communitySchema),
    }),
  ])
  if (!feed.ok) return feed

  // Without communities the feed still renders, only without community names (degraded).
  const index = indexCommunities(communities.ok ? communities.data.items : [])
  const valid = keepValidItems(feed.data.items, feedItemSchema, `GET ${endpoint}`)
  const items = valid
    .filter((item) => params.filtro !== 'polls' || item.kind === 'POLL')
    .map((item) => toFeedItem(item, index))

  return { ok: true, data: { items, nextCursor: feed.data.nextCursor } }
}
