import 'server-only'
import { cache } from 'react'
import { z } from 'zod'
import { apiRequest, invalidInput, paginatedSchema, type ApiResult } from '@/lib/api'
import { communitySchema, postSchema } from '@/lib/api/contract'
import { getViewer } from '@/lib/session'
import type { PostItem } from '../feed.types'
import { indexCommunities, needsMentionLookup, toPostItem } from './mappers'

const ENDPOINT = 'GET /api/v1/posts/:id'

/** Post ids are uuids: anything else is not found without asking the backend. */
const postIdSchema = z.uuid()

/**
 * The post of a detail page (specs/post-create-detail § 4). The id is checked before the request.
 * Never throws: the page turns NOT_FOUND into notFound() and anything else into error.tsx. Cached
 * per request: the metadata and the page ask for the same post.
 */
export const getPost = cache(async function getPost(id: string): Promise<ApiResult<PostItem>> {
  if (!postIdSchema.safeParse(id).success) return invalidInput(ENDPOINT)
  const [result, viewer] = await Promise.all([
    apiRequest({ method: 'GET', path: '/api/v1/posts/:id', params: { id }, schema: postSchema }),
    getViewer(),
  ])
  if (!result.ok) return result

  // $ and # mentions need the community slugs (P-001); if they fail, mentions stay plain text.
  const communities = needsMentionLookup([{ kind: 'POST', content: result.data }])
    ? await apiRequest({
        method: 'GET',
        path: '/api/v1/communities',
        schema: paginatedSchema(communitySchema),
      })
    : null
  const mentions = indexCommunities(communities?.ok ? communities.data.items : [])
  return { ok: true, data: toPostItem(result.data, mentions, viewer !== null) }
})
