import { beforeEach, describe, expect, it, vi } from 'vitest'
import { loadPeople } from './load-people.action'

const deps = vi.hoisted(() => ({
  getFollowList: vi.fn(),
  getMembers: vi.fn(),
  setRequestLocale: vi.fn(),
}))
vi.mock('../lib/follow-api', () => ({ getFollowList: deps.getFollowList }))
vi.mock('../lib/members-api', () => ({ getMembers: deps.getMembers }))
vi.mock('next-intl/server', () => ({ setRequestLocale: deps.setRequestLocale }))
vi.mock('@/lib/session', () => ({ getViewer: async () => ({ id: 'v', username: 'demo' }) }))
vi.mock('../components/follow-row', () => ({ FollowRow: () => null }))

const USER = '00000000-0000-4000-8000-000000000101'
const page = {
  ok: true,
  data: { items: [{ username: 'ana' }, { username: 'bruno' }], nextCursor: 'c2' },
}

describe('loadPeople (specs/follow-lists FL-03, specs/community-members CM-03)', () => {
  beforeEach(() => vi.clearAllMocks())

  it('refuses a bad source, cursor or locale before asking', async () => {
    for (const raw of [
      null,
      { source: { list: 'followers', userId: 'nope' }, locale: 'en' },
      { source: { list: 'friends', userId: USER }, locale: 'en' },
      { source: { list: 'members', slug: '../x' }, locale: 'en' },
      { source: { list: 'members', userId: USER }, locale: 'en' },
      { source: { list: 'followers', userId: USER }, cursor: '', locale: 'en' },
      { source: { list: 'followers', userId: USER }, locale: 'fr' },
    ]) {
      expect(await loadPeople(raw)).toEqual({ ok: false, error: 'api.errors.INVALID' })
    }
    expect(deps.getFollowList).not.toHaveBeenCalled()
    expect(deps.getMembers).not.toHaveBeenCalled()
  })

  it("renders a page of someone's following in the asked locale, for the viewer", async () => {
    deps.getFollowList.mockResolvedValue(page)
    const result = await loadPeople({ source: { list: 'following', userId: USER }, locale: 'es' })
    expect(deps.setRequestLocale).toHaveBeenCalledWith('es')
    expect(deps.getFollowList).toHaveBeenCalledWith(USER, 'following', 'demo', undefined)
    expect(result).toMatchObject({ ok: true, data: { count: 2, nextCursor: 'c2' } })
  })

  it("renders a page of a community's members", async () => {
    deps.getMembers.mockResolvedValue(page)
    const result = await loadPeople({
      source: { list: 'members', slug: 'defi' },
      cursor: 'c1',
      locale: 'en',
    })
    expect(deps.getMembers).toHaveBeenCalledWith('defi', 'demo', 'c1')
    expect(result).toMatchObject({ ok: true, data: { count: 2 } })
  })

  it('passes the error key of a failure', async () => {
    deps.getFollowList.mockResolvedValue({ ok: false, errorKey: 'api.errors.NOT_FOUND' })
    expect(await loadPeople({ source: { list: 'followers', userId: USER }, locale: 'en' })).toEqual(
      { ok: false, error: 'api.errors.NOT_FOUND' },
    )
  })
})
