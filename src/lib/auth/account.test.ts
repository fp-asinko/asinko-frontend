// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest'

const api = vi.hoisted(() => ({ apiRequest: vi.fn() }))
const session = vi.hoisted(() => ({ writeSession: vi.fn() }))
vi.mock('@/lib/api', () => api)
vi.mock('./session', () => session)

const USER_ID = '00000000-0000-4000-8000-0000000000aa'
const TOKENS = {
  accessToken: 'access',
  refreshToken: 'refresh',
  expiresIn: 3600,
  userId: USER_ID,
  email: 'maria@example.com',
}

describe('startSession (specs/auth design.md § 6)', () => {
  beforeEach(() => {
    api.apiRequest.mockReset()
    session.writeSession.mockReset()
  })

  it('asks the profile with the new token and keeps the username', async () => {
    api.apiRequest.mockResolvedValue({ ok: true, data: { username: 'maria' } })
    const { startSession } = await import('./account')
    const result = await startSession(TOKENS)

    expect(api.apiRequest).toHaveBeenCalledWith(
      expect.objectContaining({ params: { identifier: USER_ID }, accessToken: 'access' }),
    )
    expect(result).toMatchObject({ ok: true, session: { userId: USER_ID, username: 'maria' } })
    expect(session.writeSession).toHaveBeenCalledWith(
      expect.objectContaining({ refreshToken: 'refresh', username: 'maria' }),
    )
  })

  it('starts a session without a username when there is no profile yet (AU-09, AU-11)', async () => {
    api.apiRequest.mockResolvedValue({ ok: false, status: 404, code: 'NOT_FOUND' })
    const { startSession } = await import('./account')
    expect(await startSession(TOKENS)).toMatchObject({ ok: true, session: { username: null } })
  })

  it('writes nothing when the backend fails', async () => {
    api.apiRequest.mockResolvedValue({ ok: false, status: 503, code: 'HTTP' })
    const { startSession } = await import('./account')
    expect(await startSession(TOKENS)).toEqual({ ok: false, reason: 'unavailable' })
    expect(session.writeSession).not.toHaveBeenCalled()
  })
})
