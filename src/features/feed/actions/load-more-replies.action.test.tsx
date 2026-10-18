import { beforeEach, describe, expect, it, vi } from 'vitest'
import { loadMoreReplies } from './load-more-replies.action'

const deps = vi.hoisted(() => ({ getUserComments: vi.fn(), setRequestLocale: vi.fn() }))
vi.mock('../lib/user-comments-api', () => ({ getUserComments: deps.getUserComments }))
vi.mock('next-intl/server', () => ({ setRequestLocale: deps.setRequestLocale }))
// The cards have their own tests; here only validation and paging matter.
vi.mock('../components/reply-list-items', () => ({ ReplyListItems: () => null }))

const USER = '00000000-0000-4000-8000-000000000101'

describe('loadMoreReplies (specs/backend-adoption BK-03)', () => {
  beforeEach(() => vi.clearAllMocks())

  it('rejects a bad user, cursor or locale before asking', async () => {
    for (const raw of [
      null,
      { userId: 'nope', cursor: 'c2', locale: 'en' },
      { userId: USER, cursor: '', locale: 'en' },
      { userId: USER, cursor: 'c2', locale: 'fr' },
    ]) {
      expect(await loadMoreReplies(raw)).toEqual({ ok: false, error: 'api.errors.INVALID' })
    }
    expect(deps.getUserComments).not.toHaveBeenCalled()
  })

  it('renders the next page in the asked locale', async () => {
    deps.getUserComments.mockResolvedValue({
      ok: true,
      data: { items: [{}, {}], nextCursor: null },
    })
    const result = await loadMoreReplies({ userId: USER, cursor: 'c2', locale: 'es' })
    expect(deps.setRequestLocale).toHaveBeenCalledWith('es')
    expect(deps.getUserComments).toHaveBeenCalledWith(USER, 'c2')
    expect(result).toMatchObject({ ok: true, data: { count: 2, nextCursor: null } })
  })

  it('passes the error key of a failure', async () => {
    deps.getUserComments.mockResolvedValue({ ok: false, errorKey: 'api.errors.UNAVAILABLE' })
    expect(await loadMoreReplies({ userId: USER, cursor: 'c2', locale: 'en' })).toEqual({
      ok: false,
      error: 'api.errors.UNAVAILABLE',
    })
  })
})
