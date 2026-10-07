import { beforeEach, describe, expect, it, vi } from 'vitest'
import { DEMO_USER } from '@/mocks/demo-user'
import { createComment } from './create-comment.action'
import { voteComment } from './vote-comment.action'

const deps = vi.hoisted(() => ({
  getViewer: vi.fn(),
  createCommentAs: vi.fn(),
  voteCommentAs: vi.fn(),
  refresh: vi.fn(),
}))
vi.mock('next/cache', () => ({ refresh: deps.refresh }))
vi.mock('@/lib/session', () => ({ getViewer: deps.getViewer }))
vi.mock('../lib/comments-api', () => ({ createCommentAs: deps.createCommentAs }))
vi.mock('../lib/votes-api', () => ({ voteCommentAs: deps.voteCommentAs }))

const POST = '00000000-0000-4000-8000-000000000001'
const COMMENT = '00000000-0000-4000-8000-000000000002'
const failure = (code: string) => ({
  ok: false,
  kind: 'expected',
  code,
  errorKey: `api.errors.${code}`,
  endpoint: 'POST /api/v1/posts/:id/comments',
})

describe('createComment (PC-15)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    deps.getViewer.mockResolvedValue(DEMO_USER)
  })

  it('rejects invalid input before anything else (public endpoint)', async () => {
    for (const raw of [
      null,
      { postId: 'x', parentCommentId: null, body: 'Yes' },
      { postId: POST, parentCommentId: null, body: '   ' },
      { postId: POST, parentCommentId: 'x', body: 'Yes' },
    ]) {
      expect(await createComment(raw)).toEqual({ ok: false, error: 'api.errors.INVALID' })
    }
    expect(deps.createCommentAs).not.toHaveBeenCalled()
  })

  it('needs a session, checked inside the action', async () => {
    deps.getViewer.mockResolvedValue(null)
    expect(await createComment({ postId: POST, parentCommentId: null, body: 'Yes' })).toEqual({
      ok: false,
      error: 'api.errors.UNAUTHENTICATED',
    })
    expect(deps.createCommentAs).not.toHaveBeenCalled()
  })

  it('comments with the userId of the session and refreshes the page', async () => {
    deps.createCommentAs.mockResolvedValue({ ok: true, data: { id: COMMENT } })
    const result = await createComment({
      postId: POST,
      parentCommentId: COMMENT,
      body: ' Yes ',
      userId: 'someone-else',
    })
    expect(deps.createCommentAs).toHaveBeenCalledWith(DEMO_USER.id, {
      postId: POST,
      parentCommentId: COMMENT,
      body: 'Yes',
    })
    expect(result).toEqual({ ok: true, data: { id: COMMENT } })
    expect(deps.refresh).toHaveBeenCalledOnce()
  })

  it('returns the translation key of a failure, without refreshing', async () => {
    deps.createCommentAs.mockResolvedValue(failure('NOT_FOUND'))
    expect(await createComment({ postId: POST, parentCommentId: null, body: 'Yes' })).toEqual({
      ok: false,
      error: 'api.errors.NOT_FOUND',
    })
    expect(deps.refresh).not.toHaveBeenCalled()
  })
})

describe('voteComment (PC-16)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    deps.getViewer.mockResolvedValue(DEMO_USER)
  })

  it('rejects invalid input and missing sessions', async () => {
    expect(await voteComment({ commentId: 'x', value: 1 })).toEqual({
      ok: false,
      error: 'api.errors.INVALID',
    })
    deps.getViewer.mockResolvedValue(null)
    expect(await voteComment({ commentId: COMMENT, value: 1 })).toEqual({
      ok: false,
      error: 'api.errors.UNAUTHENTICATED',
    })
    expect(deps.voteCommentAs).not.toHaveBeenCalled()
  })

  it('votes with the userId of the session and returns failures as keys', async () => {
    deps.voteCommentAs.mockResolvedValue({ ok: true, data: { score: 3, viewerVote: -1 } })
    expect(await voteComment({ commentId: COMMENT, value: -1, userId: 'x' })).toEqual({
      ok: true,
      data: { score: 3, viewerVote: -1 },
    })
    expect(deps.voteCommentAs).toHaveBeenCalledWith(DEMO_USER.id, { commentId: COMMENT, value: -1 })
    deps.voteCommentAs.mockResolvedValue(failure('USER_MISMATCH'))
    expect(await voteComment({ commentId: COMMENT, value: null })).toEqual({
      ok: false,
      error: 'api.errors.USER_MISMATCH',
    })
  })
})
