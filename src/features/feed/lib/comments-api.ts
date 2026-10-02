import 'server-only'
import { apiRequest, type ApiResult } from '@/lib/api'
import { commentListSchema, type RawComment } from '@/lib/api/contract'
import type { CommentPreview } from '../feed.types'
import type { CommentsTarget } from '../schemas/comments-preview.schema'

/** How many comments the card shows (H-28, as the prototype). */
export const PREVIEW_SIZE = 3

function toCommentPreview(comment: RawComment): CommentPreview {
  return {
    id: comment.id,
    author: {
      username: comment.author.username,
      handle: `@${comment.author.username}`,
      avatarUrl: comment.author.avatarUrl,
      accuracyRate: comment.author.accuracyRate ?? null,
    },
    body: comment.body,
    createdAt: comment.createdAt,
  }
}

/**
 * The first top-level comments of a post or poll, without replies or deleted ones (H-28).
 * The contract returns the whole tree; proposal P-007 asks for ?limit=3&replies=false.
 */
export async function getCommentsPreview(
  target: CommentsTarget,
): Promise<ApiResult<CommentPreview[]>> {
  const result = await apiRequest(
    target.kind === 'post'
      ? {
          method: 'GET',
          path: '/api/v1/posts/:id/comments',
          params: { id: target.id },
          schema: commentListSchema,
        }
      : {
          method: 'GET',
          path: '/api/v1/polls/:id/comments',
          params: { id: target.id },
          schema: commentListSchema,
        },
  )
  if (!result.ok) return result
  const comments = result.data.items
    .filter((comment) => comment.parentCommentId === null && !comment.deleted)
    .slice(0, PREVIEW_SIZE)
    .map(toCommentPreview)
  return { ok: true, data: comments }
}
