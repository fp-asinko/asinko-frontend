import { beforeEach, describe, expect, it, vi } from 'vitest'
import { DEMO_USER } from '@/mocks/demo-user'
import { leaveCommunity } from './leave-community.action'
import { setFavorite } from './set-favorite.action'

const deps = vi.hoisted(() => ({
  getViewer: vi.fn(),
  leaveCommunityAs: vi.fn(),
  setFavoriteAs: vi.fn(),
}))
vi.mock('@/lib/session', () => ({ getViewer: deps.getViewer }))
vi.mock('./membership', () => ({
  leaveCommunityAs: deps.leaveCommunityAs,
  setFavoriteAs: deps.setFavoriteAs,
}))

const failure = (code: string) => ({
  ok: false,
  kind: 'expected',
  code,
  errorKey: `api.errors.${code}`,
  endpoint: 'DELETE /api/v1/communities/:slug/members/:userId',
})

describe('leaveCommunity (specs/community-pages CP-05)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    deps.getViewer.mockResolvedValue(DEMO_USER)
  })

  it('rejects an invalid slug and needs a session, checked inside the action', async () => {
    expect(await leaveCommunity('../x')).toEqual({ ok: false, error: 'api.errors.INVALID' })
    deps.getViewer.mockResolvedValue(null)
    expect(await leaveCommunity('defi')).toEqual({
      ok: false,
      error: 'api.errors.UNAUTHENTICATED',
    })
    expect(deps.leaveCommunityAs).not.toHaveBeenCalled()
  })

  it('leaves with the userId of the session', async () => {
    deps.leaveCommunityAs.mockResolvedValue({ ok: true, data: null })
    expect(await leaveCommunity('BTC')).toEqual({ ok: true, data: null })
    expect(deps.leaveCommunityAs).toHaveBeenCalledWith(DEMO_USER.id, 'BTC')
  })

  it('says a principal moderator cannot leave', async () => {
    deps.leaveCommunityAs.mockResolvedValue(failure('CANNOT_LEAVE_AS_PRINCIPAL_MODERATOR'))
    expect(await leaveCommunity('defi')).toEqual({
      ok: false,
      error: 'api.errors.CANNOT_LEAVE_AS_PRINCIPAL_MODERATOR',
    })
  })
})

describe('setFavorite (specs/community-pages CP-06)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    deps.getViewer.mockResolvedValue(DEMO_USER)
  })

  it('rejects invalid input and needs a session', async () => {
    for (const raw of [null, { slug: 'defi' }, { slug: '../x', favorite: true }]) {
      expect(await setFavorite(raw)).toEqual({ ok: false, error: 'api.errors.INVALID' })
    }
    deps.getViewer.mockResolvedValue(null)
    expect(await setFavorite({ slug: 'defi', favorite: true })).toEqual({
      ok: false,
      error: 'api.errors.UNAUTHENTICATED',
    })
    expect(deps.setFavoriteAs).not.toHaveBeenCalled()
  })

  it('marks and unmarks with the userId of the session', async () => {
    deps.setFavoriteAs.mockResolvedValue({ ok: true, data: { favorite: false } })
    expect(await setFavorite({ slug: 'defi', favorite: false })).toEqual({
      ok: true,
      data: { favorite: false },
    })
    expect(deps.setFavoriteAs).toHaveBeenCalledWith(DEMO_USER.id, 'defi', false)
  })

  it('passes the backend error key through (not a member)', async () => {
    deps.setFavoriteAs.mockResolvedValue(failure('NOT_MEMBER'))
    expect(await setFavorite({ slug: 'macro', favorite: true })).toEqual({
      ok: false,
      error: 'api.errors.NOT_MEMBER',
    })
  })
})
