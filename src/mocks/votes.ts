import type { RawPoll } from '@/lib/api/contract'
import { DEMO_USER } from './demo-user'
import { HIDDEN_RESULTS, pollById } from './fixtures/polls'
import { postById } from './fixtures/posts'
import type { MockResponse } from './types'

// Vote behavior of the contract (E03, E05) for the demo viewer. Stateless on purpose: every
// response is computed from the fixtures, so a reload shows the fixtures again (documented).

const error = (status: number, code: string): MockResponse => ({
  status,
  body: { error: { code, message: 'mock' } },
})

/** The contract compares the explicit userId with the session (403 USER_MISMATCH). */
function isViewer(userId: unknown) {
  return userId === DEMO_USER.id
}

export function votePost(postId: string, body: unknown): MockResponse {
  const post = postById(postId)
  if (!post || post.deleted) return error(404, 'NOT_FOUND')
  const { userId, value } = (body ?? {}) as { userId?: unknown; value?: unknown }
  if (!isViewer(userId)) return error(403, 'USER_MISMATCH')
  if (value !== 1 && value !== -1) return error(422, 'INVALID')

  // The fixture score already includes the viewer's previous vote.
  const score = post.score - (post.viewerVote ?? 0) + value
  return { status: 200, body: { score, viewerVote: value } }
}

export function removePostVote(postId: string, userId: string | undefined): MockResponse {
  const post = postById(postId)
  if (!post || post.deleted) return error(404, 'NOT_FOUND')
  if (!isViewer(userId)) return error(403, 'USER_MISMATCH')
  return { status: 204 }
}

export function votePoll(pollId: string, body: unknown): MockResponse {
  const poll = pollById(pollId)
  if (!poll) return error(404, 'NOT_FOUND')
  const { userId, optionId } = (body ?? {}) as { userId?: unknown; optionId?: unknown }
  if (!isViewer(userId)) return error(403, 'USER_MISMATCH')
  if (poll.isClosed) return error(409, 'POLL_CLOSED')
  if (!poll.allowVoteChange && poll.viewerOptionId) return error(409, 'VOTE_LOCKED')
  if (!poll.options.some((option) => option.id === optionId)) return error(422, 'INVALID')

  const hidden = HIDDEN_RESULTS[poll.id]
  const options = poll.options.map((option, index) => {
    const base = option.voteCount ?? hidden?.[index] ?? 0
    const removed = option.id === poll.viewerOptionId ? 1 : 0
    const added = option.id === optionId ? 1 : 0
    return { ...option, voteCount: base - removed + added }
  })
  const updated: RawPoll = {
    ...poll,
    options,
    totalVotes: options.reduce((sum, option) => sum + (option.voteCount ?? 0), 0),
    viewerOptionId: optionId as string,
  }
  return { status: 200, body: updated }
}
