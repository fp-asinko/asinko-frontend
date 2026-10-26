import 'server-only'
import { cache } from 'react'
import { z } from 'zod'
import { apiRequest, invalidInput, type ApiResult } from '@/lib/api'
import { postSchema } from '@/lib/api/contract'
import { getViewer } from '@/lib/session'
import type { PostItem } from '../feed.types'
import { mentionEntities, toPostItem } from './mappers'
import { lookupMentions } from './mention-lookup'

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

  // $ and # mentions, each one resolved on its own (P-001); if one fails, it stays plain text.
  const mentions = await lookupMentions(mentionEntities([{ kind: 'POST', content: result.data }]))
  return { ok: true, data: toPostItem(result.data, mentions, viewer !== null) }
})
