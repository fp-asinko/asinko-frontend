import 'server-only'
import { apiRequest, type ApiResult } from '@/lib/api'
import { commentListSchema, createdCommentSchema, type RawComment } from '@/lib/api/contract'
import type { CommentNode, CommentPreview } from '../feed.types'
import type { CreateCommentInput } from '../schemas/comment.schema'
import type { CommentSort } from '../schemas/comments-query.schema'
import type { CommentsTarget } from '../schemas/comments-preview.schema'
import { toAuthor } from './mappers'
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

/**
 * A comment of the detail with its replies. A deleted comment stays only while it holds replies
 * (as Reddit: "[deleted]" over the thread); without them, it goes.
 */
function toCommentNode(comment: RawComment): CommentNode | null {
  const replies = comment.replies.flatMap((reply) => toCommentNode(reply) ?? [])
  if (comment.deleted && replies.length === 0) return null
  return {
    id: comment.id,
    author: comment.deleted ? null : toAuthor(comment.author),
    body: comment.deleted ? '' : comment.body,
    createdAt: comment.createdAt,
    edited: comment.editedAt !== null,
    deleted: comment.deleted,
    score: comment.score,
    viewerVote: comment.viewerVote,
    replies,
  }
}

/**
 * Every comment of a post, nested (PC-14), in the order asked (P-014, specs/post-detail-refresh
 * PD-03): the backend sorts every level. Without an order, the backend's (oldest first).
 */
export async function getCommentTree(
  postId: string,
  sort?: CommentSort,
): Promise<ApiResult<CommentNode[]>> {
  const result = await apiRequest({
    method: 'GET',
    path: '/api/v1/posts/:id/comments',
    params: { id: postId },
    query: sort ? { sort } : undefined,
    schema: commentListSchema,
  })
  if (!result.ok) return result
  return { ok: true, data: result.data.items.flatMap((comment) => toCommentNode(comment) ?? []) }
}

/**
 * The comments of a post that contain a text (P-014, PD-05): any level, in a flat list, the best
 * match first, without replies. The text comes validated (commentsQuerySchema).
 */
export async function searchComments(postId: string, q: string): Promise<ApiResult<CommentNode[]>> {
  const result = await apiRequest({
    method: 'GET',
    path: '/api/v1/posts/:id/comments',
    params: { id: postId },
    query: { q },
    schema: commentListSchema,
  })
  if (!result.ok) return result
  const found = result.data.items
    .filter((comment) => !comment.deleted)
    .map((comment) => toCommentNode({ ...comment, replies: [] }))
  return { ok: true, data: found.filter((node) => node !== null) }
}

/**
 * Comments a post or replies to a comment (PC-15). The userId always comes from the server
 * session, never from the client (api-integration.md § userId explícito).
 */
export async function createCommentAs(
  userId: string,
  { postId, parentCommentId, body }: CreateCommentInput,
  // A poll's too, from its card (specs/card-comment): the backend takes both (E05).
  kind: 'post' | 'poll' = 'post',
): Promise<ApiResult<{ id: string }>> {
  const result = await apiRequest({
    method: 'POST',
    path: kind === 'poll' ? '/api/v1/polls/:id/comments' : '/api/v1/posts/:id/comments',
    params: { id: postId },
    body: { userId, body, parentCommentId },
    schema: createdCommentSchema,
  })
  return result.ok ? { ok: true, data: { id: result.data.id } } : result
}
