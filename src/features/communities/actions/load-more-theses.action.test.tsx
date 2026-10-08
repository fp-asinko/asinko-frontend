import { beforeEach, describe, expect, it, vi } from 'vitest'
import { loadMoreTheses } from './load-more-theses.action'

const deps = vi.hoisted(() => ({ getUserTheses: vi.fn(), setRequestLocale: vi.fn() }))
vi.mock('../lib/theses-api', () => ({ getUserTheses: deps.getUserTheses }))
vi.mock('next-intl/server', () => ({ setRequestLocale: deps.setRequestLocale }))
// The cards have their own tests; here only validation and paging matter.
vi.mock('../components/thesis-list-items', () => ({ ThesisListItems: () => null }))

const USER = '00000000-0000-4000-8000-000000000101'

describe('loadMoreTheses (specs/profile-track-record PT-05)', () => {
  beforeEach(() => vi.clearAllMocks())

  it('rejects a bad user, cursor or locale before asking', async () => {
    for (const raw of [
      null,
      { userId: 'nope', cursor: 'c2', locale: 'en' },
      { userId: USER, cursor: '', locale: 'en' },
      { userId: USER, cursor: 'c2', locale: 'fr' },
    ]) {
      expect(await loadMoreTheses(raw)).toEqual({ ok: false, error: 'api.errors.INVALID' })
    }
    expect(deps.getUserTheses).not.toHaveBeenCalled()
  })

  it('renders the next page in the asked locale', async () => {
    deps.getUserTheses.mockResolvedValue({ ok: true, data: { items: [{}, {}], nextCursor: null } })
    const result = await loadMoreTheses({ userId: USER, cursor: 'c2', locale: 'es' })
    expect(deps.setRequestLocale).toHaveBeenCalledWith('es')
    expect(deps.getUserTheses).toHaveBeenCalledWith(USER, 'c2')
    expect(result).toMatchObject({ ok: true, data: { count: 2, nextCursor: null } })
  })

  it('passes the error key of a failure', async () => {
    deps.getUserTheses.mockResolvedValue({ ok: false, errorKey: 'api.errors.UNAVAILABLE' })
    expect(await loadMoreTheses({ userId: USER, cursor: 'c2', locale: 'en' })).toEqual({
      ok: false,
      error: 'api.errors.UNAVAILABLE',
    })
  })
})
