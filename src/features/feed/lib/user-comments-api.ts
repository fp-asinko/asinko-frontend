import 'server-only'
import { z } from 'zod'
import { apiRequest, invalidInput, keepValidItems, type ApiResult } from '@/lib/api'
import { userCommentSchema, type RawUserComment } from '@/lib/api/contract'
import { postPath } from '@/lib/posts/paths'
import type { UserReply } from '../feed.types'
import { toCardCommunity } from './mappers'

const PATH = '/api/v1/users/:userId/comments'
const ENDPOINT = `GET ${PATH}`

/** Items are validated one by one (keepValidItems): one broken comment does not empty the tab. */
const looseListSchema = z.object({ items: z.array(z.unknown()), nextCursor: z.string().nullable() })
const cursorSchema = z.string().regex(/^[A-Za-z0-9_\-=.:]{1,512}$/)

/**
 * A comment as a profile shows it, out of its thread (specs/backend-adoption BK-03): what it says
 * and where. Only a post has a page, so only a post's comment links to itself (#comment-{id}); a
 * poll's or a thesis's says where without a link.
 */
export function toUserReply(comment: RawUserComment): UserReply {
  const { content } = comment
  return {
    id: comment.id,
    body: comment.body,
    score: comment.score,
    createdAt: comment.createdAt,
    edited: comment.editedAt !== null,
    where: {
      title: content.title,
      path:
        content.kind === 'POST'
          ? `${postPath(content.id, content.title)}#comment-${comment.id}`
          : null,
      community: content.community ? toCardCommunity(content.community, false) : null,
    },
  }
}

/**
 * A person's comments, newest first (P-012, backend 2026-10-13), a page at a time. The id and the
 * cursor are checked before the request. Never throws: a private profile's 404 passes through.
 */
export async function getUserComments(
  userId: string,
  cursor?: string,
): Promise<ApiResult<{ items: UserReply[]; nextCursor: string | null }>> {
  if (!z.uuid().safeParse(userId).success) return invalidInput(ENDPOINT)
  if (cursor !== undefined && !cursorSchema.safeParse(cursor).success) return invalidInput(ENDPOINT)
  const result = await apiRequest({
    method: 'GET',
    path: PATH,
    params: { userId },
    query: cursor ? { cursor } : undefined,
    schema: looseListSchema,
  })
  if (!result.ok) return result
  const valid = keepValidItems(result.data.items, userCommentSchema, ENDPOINT)
  return {
    ok: true,
    data: { items: valid.map(toUserReply), nextCursor: result.data.nextCursor },
  }
}
