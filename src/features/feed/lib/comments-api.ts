import 'server-only'
import { apiRequest, type ApiResult } from '@/lib/api'
import { commentListSchema, type RawComment } from '@/lib/api/contract'
import type { CommentPreview } from '../feed.types'
import type { CommentsTarget } from '../schemas/comments-preview.schema'
import { communityPath } from '@/lib/communities/paths'
import { allowedImageUrl } from '@/lib/images'

/** How many comments the card shows (H-28, as the prototype). */
export const PREVIEW_SIZE = 3

/**
 * How many top-level comments to ask for (P-007): the backend's limit counts deleted ones, which
 * the card skips, so twice the preview leaves room for them (Q2 of specs/backend-contract).
 */
export const PREVIEW_FETCH = 6

const PREVIEW_QUERY = { limit: String(PREVIEW_FETCH), replies: 'false' }

function toCommentPreview(comment: RawComment): CommentPreview {
  return {
    id: comment.id,
    author: {
      username: comment.author.username,
      path: communityPath('user', comment.author.username),
      handle: `@${comment.author.username}`,
      avatarUrl: allowedImageUrl(comment.author.avatarUrl),
      accuracyRate: comment.author.accuracyRate ?? null,
    },
    body: comment.body,
    createdAt: comment.createdAt,
  }
}

/**
 * The first top-level comments of a post or poll, without replies or deleted ones (H-28). Asks
 * only for the top level (P-007); the filter and the slice stay, so an older backend that ignores
 * the parameters gives the same result.
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
          query: PREVIEW_QUERY,
          schema: commentListSchema,
        }
      : {
          method: 'GET',
          path: '/api/v1/polls/:id/comments',
          params: { id: target.id },
          query: PREVIEW_QUERY,
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
