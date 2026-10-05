// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest'

const session = vi.hoisted(() => ({
  startDevSession: vi.fn(),
  endDevSession: vi.fn(),
  isDevLoginEnabled: vi.fn(() => true),
}))
const cache = vi.hoisted(() => ({ revalidatePath: vi.fn() }))
vi.mock('@/lib/auth/dev-session', () => session)
vi.mock('next/cache', () => cache)

import { devLogin, devLogout } from './dev-login.action'

describe('devLogin / devLogout (specs/dev-login)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    session.isDevLoginEnabled.mockReturnValue(true)
  })

  it('signs in and renders the whole app again (DL-02, DL-05)', async () => {
    session.startDevSession.mockResolvedValue({ ok: true, session: { username: 'devuser' } })
    expect(await devLogin()).toEqual({ ok: true, data: { username: 'devuser' } })
    expect(cache.revalidatePath).toHaveBeenCalledWith('/', 'layout')
  })

  it('returns a translation key, never the provider message, when it fails', async () => {
    session.startDevSession.mockResolvedValue({ ok: false, reason: 'credentials' })
    expect(await devLogin()).toEqual({ ok: false, error: 'devLogin.errors.credentials' })
    expect(cache.revalidatePath).not.toHaveBeenCalled()
  })

  it('signs out (DL-06)', async () => {
    expect(await devLogout()).toEqual({ ok: true, data: null })
    expect(session.endDevSession).toHaveBeenCalled()
  })

  it('refuses to sign out when the login is off (DL-07)', async () => {
    session.isDevLoginEnabled.mockReturnValue(false)
    expect(await devLogout()).toEqual({ ok: false, error: 'devLogin.errors.disabled' })
    expect(session.endDevSession).not.toHaveBeenCalled()
  })
})
