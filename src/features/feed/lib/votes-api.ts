import 'server-only'
import { apiRequest, noContentSchema, type ApiResult } from '@/lib/api'
import { pollSchema, voteResultSchema } from '@/lib/api/contract'
import type { PollResults } from '../feed.types'
import type { VoteCommentInput, VotePollInput, VotePostInput } from '../schemas/vote.schema'
import { toPollResults } from './mappers'

type PostVote = { score: number | null; viewerVote: 1 | -1 | null }

/**
 * Votes on a post (E05). The userId always comes from the server session, never from the client
 * (api-integration.md § userId explícito). Removing a vote answers 204 without a score.
 */
export async function votePostAs(
  userId: string,
  { postId, value }: VotePostInput,
): Promise<ApiResult<PostVote>> {
  if (value === null) {
    const removed = await apiRequest({
      method: 'DELETE',
      path: '/api/v1/posts/:id/vote',
      params: { id: postId },
      query: { userId },
      schema: noContentSchema,
    })
    return removed.ok ? { ok: true, data: { score: null, viewerVote: null } } : removed
  }
  return apiRequest({
    method: 'PUT',
    path: '/api/v1/posts/:id/vote',
    params: { id: postId },
    body: { userId, value },
    schema: voteResultSchema,
  })
}

/** Votes on a poll (E03). The backend answers the whole poll, results included when visible. */
export async function votePollAs(
  userId: string,
  { pollId, optionId }: VotePollInput,
): Promise<ApiResult<PollResults>> {
  const result = await apiRequest({
    method: 'PUT',
    path: '/api/v1/polls/:id/vote',
    params: { id: pollId },
    body: { userId, optionId },
    schema: pollSchema,
  })
  return result.ok ? { ok: true, data: toPollResults(result.data) } : result
}

/** Votes on a comment (PC-16, E05): the same as a post, on /comments. */
export async function voteCommentAs(
  userId: string,
  { commentId, value }: VoteCommentInput,
): Promise<ApiResult<PostVote>> {
  if (value === null) {
    const removed = await apiRequest({
      method: 'DELETE',
      path: '/api/v1/comments/:id/vote',
      params: { id: commentId },
      query: { userId },
      schema: noContentSchema,
    })
    return removed.ok ? { ok: true, data: { score: null, viewerVote: null } } : removed
  }
  return apiRequest({
    method: 'PUT',
    path: '/api/v1/comments/:id/vote',
    params: { id: commentId },
    body: { userId, value },
    schema: voteResultSchema,
  })
}
