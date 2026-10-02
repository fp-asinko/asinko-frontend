import { beforeEach, describe, expect, it, vi } from 'vitest'
import { DEMO_USER } from '@/mocks/demo-user'
import { votePoll } from './vote-poll.action'
import { votePost } from './vote-post.action'

const deps = vi.hoisted(() => ({
  getViewer: vi.fn(),
  votePostAs: vi.fn(),
  votePollAs: vi.fn(),
}))
vi.mock('@/lib/session', () => ({ getViewer: deps.getViewer }))
vi.mock('../lib/votes-api', () => ({ votePostAs: deps.votePostAs, votePollAs: deps.votePollAs }))

const ID = '00000000-0000-4000-8000-000000000001'
const OPTION = '00000000-0000-4000-8000-000000000002'
const failure = {
  ok: false,
  kind: 'expected',
  code: 'USER_MISMATCH',
  errorKey: 'api.errors.USER_MISMATCH',
  endpoint: 'PUT /api/v1/posts/:id/vote',
}

describe('votePost (H-15)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    deps.getViewer.mockResolvedValue(DEMO_USER)
  })

  it('rejects invalid input before anything else (public endpoint)', async () => {
    for (const raw of [null, { postId: 'x', value: 1 }, { postId: ID, value: 2 }, { postId: ID }]) {
      expect(await votePost(raw)).toEqual({ ok: false, error: 'api.errors.INVALID' })
    }
    expect(deps.votePostAs).not.toHaveBeenCalled()
  })

  it('needs a session, checked inside the action', async () => {
    deps.getViewer.mockResolvedValue(null)
    expect(await votePost({ postId: ID, value: 1 })).toEqual({
      ok: false,
      error: 'api.errors.UNAUTHENTICATED',
    })
    expect(deps.votePostAs).not.toHaveBeenCalled()
  })

  it('votes with the userId of the session, never one from the client', async () => {
    deps.votePostAs.mockResolvedValue({ ok: true, data: { score: 5, viewerVote: 1 } })
    const result = await votePost({ postId: ID, value: 1, userId: 'someone-else' })
    expect(deps.votePostAs).toHaveBeenCalledWith(DEMO_USER.id, { postId: ID, value: 1 })
    expect(result).toEqual({ ok: true, data: { score: 5, viewerVote: 1 } })
  })

  it('returns the translation key of a failure', async () => {
    deps.votePostAs.mockResolvedValue(failure)
    expect(await votePost({ postId: ID, value: null })).toEqual({
      ok: false,
      error: 'api.errors.USER_MISMATCH',
    })
  })
})

describe('votePoll (H-15)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    deps.getViewer.mockResolvedValue(DEMO_USER)
  })

  it('rejects invalid input and missing sessions', async () => {
    expect(await votePoll({ pollId: ID, optionId: 'x' })).toEqual({
      ok: false,
      error: 'api.errors.INVALID',
    })
    deps.getViewer.mockResolvedValue(null)
    expect(await votePoll({ pollId: ID, optionId: OPTION })).toEqual({
      ok: false,
      error: 'api.errors.UNAUTHENTICATED',
    })
    expect(deps.votePollAs).not.toHaveBeenCalled()
  })

  it('votes with the session user and returns the results', async () => {
    const results = { options: [], totalVotes: 1, viewerOptionId: OPTION, resultsVisible: true }
    deps.votePollAs.mockResolvedValue({ ok: true, data: results })
    expect(await votePoll({ pollId: ID, optionId: OPTION })).toEqual({ ok: true, data: results })
    expect(deps.votePollAs).toHaveBeenCalledWith(DEMO_USER.id, { pollId: ID, optionId: OPTION })
  })

  it('returns the translation key of a failure', async () => {
    deps.votePollAs.mockResolvedValue({ ...failure, errorKey: 'api.errors.UNKNOWN' })
    expect(await votePoll({ pollId: ID, optionId: OPTION })).toEqual({
      ok: false,
      error: 'api.errors.UNKNOWN',
    })
  })
})
