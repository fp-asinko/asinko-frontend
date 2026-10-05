import { beforeEach, describe, expect, it, vi } from 'vitest'
import { DEMO_USER } from '@/mocks/demo-user'
import { joinCommunity } from './join-community.action'

const deps = vi.hoisted(() => ({ getViewer: vi.fn(), joinCommunityAs: vi.fn() }))
vi.mock('@/lib/session', () => ({ getViewer: deps.getViewer }))
vi.mock('./membership', () => ({ joinCommunityAs: deps.joinCommunityAs }))

describe('joinCommunity (specs/community-first CF-07, CF-08)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    deps.getViewer.mockResolvedValue(DEMO_USER)
  })

  it('rejects an invalid slug before anything else (public endpoint)', async () => {
    for (const raw of [null, '', '../admin', 'a b', 'x'.repeat(65), { slug: 'defi' }]) {
      expect(await joinCommunity(raw)).toEqual({ ok: false, error: 'api.errors.INVALID' })
    }
    expect(deps.joinCommunityAs).not.toHaveBeenCalled()
  })

  it('needs a session, checked inside the action', async () => {
    deps.getViewer.mockResolvedValue(null)
    expect(await joinCommunity('defi')).toEqual({
      ok: false,
      error: 'api.errors.UNAUTHENTICATED',
    })
    expect(deps.joinCommunityAs).not.toHaveBeenCalled()
  })

  it('joins with the userId of the session, never one from the client', async () => {
    deps.joinCommunityAs.mockResolvedValue({ ok: true, data: { memberCount: 9 } })
    expect(await joinCommunity('BTC')).toEqual({ ok: true, data: { memberCount: 9 } })
    expect(deps.joinCommunityAs).toHaveBeenCalledWith(DEMO_USER.id, 'BTC')
  })

  it('returns the translation key of a backend failure', async () => {
    deps.joinCommunityAs.mockResolvedValue({
      ok: false,
      kind: 'expected',
      code: 'NOT_FOUND',
      errorKey: 'api.errors.NOT_FOUND',
      endpoint: 'PUT /api/v1/communities/:slug/members/:userId',
    })
    expect(await joinCommunity('nope')).toEqual({ ok: false, error: 'api.errors.NOT_FOUND' })
  })
})
