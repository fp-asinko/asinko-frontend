import { beforeEach, describe, expect, it, vi } from 'vitest'
import { DEMO_USER } from '@/mocks/demo-user'
import { commentFromCard } from './comment-from-card.action'

const deps = vi.hoisted(() => ({
  getViewer: vi.fn(),
  createCommentAs: vi.fn(),
  refresh: vi.fn(),
}))
vi.mock('next/cache', () => ({ refresh: deps.refresh }))
vi.mock('@/lib/session', () => ({ getViewer: deps.getViewer }))
vi.mock('../lib/comments-api', () => ({ createCommentAs: deps.createCommentAs }))

const ID = '00000000-0000-4000-8000-000000000001'

describe('commentFromCard (specs/card-comment)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    deps.getViewer.mockResolvedValue(DEMO_USER)
    deps.createCommentAs.mockResolvedValue({ ok: true, data: { id: 'c-1' } })
  })

  it('refuses invalid input before anything else (CC-05)', async () => {
    for (const raw of [
      null,
      { kind: 'thesis', id: ID, body: 'Yes' },
      { kind: 'post', id: 'x', body: 'Yes' },
      { kind: 'post', id: ID, body: '   ' },
    ]) {
      expect(await commentFromCard(raw)).toEqual({ ok: false, error: 'api.errors.INVALID' })
    }
    expect(deps.createCommentAs).not.toHaveBeenCalled()
  })

  it('asks for an account without a session (CC-04)', async () => {
    deps.getViewer.mockResolvedValue(null)
    expect(await commentFromCard({ kind: 'post', id: ID, body: 'Yes' })).toEqual({
      ok: false,
      error: 'api.errors.UNAUTHENTICATED',
    })
  })

  it("comments a post or a poll as the session's user, and never refreshes the feed (CC-02, CC-05)", async () => {
    expect(await commentFromCard({ kind: 'poll', id: ID, body: ' Middle one. ' })).toEqual({
      ok: true,
      data: { id: 'c-1' },
    })
    expect(deps.createCommentAs).toHaveBeenCalledWith(
      DEMO_USER.id,
      { postId: ID, parentCommentId: null, body: 'Middle one.' },
      'poll',
    )
    expect(deps.refresh).not.toHaveBeenCalled()
  })

  it("says the backend's reason, never its message (CC-04)", async () => {
    deps.createCommentAs.mockResolvedValue({ ok: false, errorKey: 'api.errors.NOT_FOUND' })
    expect(await commentFromCard({ kind: 'post', id: ID, body: 'Yes' })).toEqual({
      ok: false,
      error: 'api.errors.NOT_FOUND',
    })
  })
})
