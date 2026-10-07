import { beforeEach, describe, expect, it, vi } from 'vitest'
import { DEMO_USER } from '@/mocks/demo-user'
import { POLLS } from '@/mocks/fixtures/polls'
import { POSTS } from '@/mocks/fixtures/posts'
import { MOCK_ROUTES } from '@/mocks/handlers'
import type { MockRoute } from '@/mocks/types'
import { COMMENTS_BY_CONTENT } from '@/mocks/fixtures/comments'
import { voteCommentAs, votePollAs, votePostAs } from './votes-api'

// The real client against the mock routes, which follow the contract (E03, E05).
const state = vi.hoisted(() => ({ routes: [] as readonly MockRoute[] }))

vi.mock('@/lib/api', async () => {
  const { createApiClient } = await import('@/lib/api/create-client')
  const { noContentSchema } = await import('@/lib/api/schemas')
  const failingFetch = () => Promise.reject(new Error('offline'))
  return {
    noContentSchema,
    apiRequest: (request: Parameters<ReturnType<typeof createApiClient>>[0]) =>
      createApiClient({ baseUrl: 'http://mock', fetch: failingFetch, mocks: state.routes })(
        request,
      ),
  }
})

const post = POSTS[1]! // score 642, no viewer vote

describe('votePostAs', () => {
  beforeEach(() => {
    state.routes = MOCK_ROUTES
  })

  it('upvotes and returns the new score', async () => {
    expect(await votePostAs(DEMO_USER.id, { postId: post.id, value: 1 })).toEqual({
      ok: true,
      data: { score: post.score + 1, viewerVote: 1 },
    })
  })

  it('removes the vote with DELETE (204, no score)', async () => {
    expect(await votePostAs(DEMO_USER.id, { postId: post.id, value: null })).toEqual({
      ok: true,
      data: { score: null, viewerVote: null },
    })
  })

  it('passes USER_MISMATCH through when the user is not the session', async () => {
    const result = await votePostAs('00000000-0000-4000-8000-0000000000ff', {
      postId: post.id,
      value: 1,
    })
    expect(result).toMatchObject({ ok: false, code: 'USER_MISMATCH' })
  })
})

describe('votePollAs', () => {
  beforeEach(() => {
    state.routes = MOCK_ROUTES
  })

  it('votes and reveals results that were hidden until voting (ON_VOTE)', async () => {
    const poll = POLLS[1]!
    const optionId = poll.options[0]!.id
    const result = await votePollAs(DEMO_USER.id, { pollId: poll.id, optionId })
    if (!result.ok) throw new Error('expected ok')
    expect(result.data.viewerOptionId).toBe(optionId)
    expect(result.data.resultsVisible).toBe(true)
    expect(result.data.options.every((option) => option.share !== null)).toBe(true)
  })

  it('fails on a closed poll', async () => {
    const closed = POLLS.find((poll) => poll.isClosed)!
    const result = await votePollAs(DEMO_USER.id, {
      pollId: closed.id,
      optionId: closed.options[0]!.id,
    })
    expect(result).toMatchObject({ ok: false, kind: 'expected' })
  })
})

describe('voteCommentAs (specs/post-create-detail PC-16)', () => {
  const comment = COMMENTS_BY_CONTENT[POSTS[0]!.id]![0]! // score 88, no viewer vote

  beforeEach(() => {
    state.routes = MOCK_ROUTES
  })

  it('votes and returns the new score', async () => {
    expect(await voteCommentAs(DEMO_USER.id, { commentId: comment.id, value: -1 })).toEqual({
      ok: true,
      data: { score: 87, viewerVote: -1 },
    })
  })

  it('removes the vote with DELETE (204, no score)', async () => {
    expect(await voteCommentAs(DEMO_USER.id, { commentId: comment.id, value: null })).toEqual({
      ok: true,
      data: { score: null, viewerVote: null },
    })
  })
})
