import { beforeEach, describe, expect, it, vi } from 'vitest'
import { loadFollowList } from './load-follow-list.action'

const deps = vi.hoisted(() => ({ getFollowList: vi.fn(), setRequestLocale: vi.fn() }))
vi.mock('../lib/follow-api', () => ({ getFollowList: deps.getFollowList }))
vi.mock('next-intl/server', () => ({ setRequestLocale: deps.setRequestLocale }))
vi.mock('@/lib/session', () => ({ getViewer: async () => ({ id: 'v', username: 'demo' }) }))
vi.mock('../components/follow-row', () => ({ FollowRow: () => null }))

const USER = '00000000-0000-4000-8000-000000000101'

describe('loadFollowList (specs/follow-lists FL-03)', () => {
  beforeEach(() => vi.clearAllMocks())

  it('refuses a bad user, kind, cursor or locale before asking', async () => {
    for (const raw of [
      null,
      { userId: 'nope', kind: 'followers', locale: 'en' },
      { userId: USER, kind: 'friends', locale: 'en' },
      { userId: USER, kind: 'followers', cursor: '', locale: 'en' },
      { userId: USER, kind: 'followers', locale: 'fr' },
    ]) {
      expect(await loadFollowList(raw)).toEqual({ ok: false, error: 'api.errors.INVALID' })
    }
    expect(deps.getFollowList).not.toHaveBeenCalled()
  })

  it('renders a page in the asked locale, for the viewer', async () => {
    deps.getFollowList.mockResolvedValue({
      ok: true,
      data: { items: [{ username: 'ana' }, { username: 'bruno' }], nextCursor: 'c2' },
    })
    const result = await loadFollowList({ userId: USER, kind: 'following', locale: 'es' })
    expect(deps.setRequestLocale).toHaveBeenCalledWith('es')
    expect(deps.getFollowList).toHaveBeenCalledWith(USER, 'following', 'demo', undefined)
    expect(result).toMatchObject({ ok: true, data: { count: 2, nextCursor: 'c2' } })
  })

  it('passes the error key of a failure', async () => {
    deps.getFollowList.mockResolvedValue({ ok: false, errorKey: 'api.errors.NOT_FOUND' })
    expect(await loadFollowList({ userId: USER, kind: 'followers', locale: 'en' })).toEqual({
      ok: false,
      error: 'api.errors.NOT_FOUND',
    })
  })
})
