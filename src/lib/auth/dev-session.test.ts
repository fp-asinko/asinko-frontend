// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

// Fake values only: the real ones live in .env.local and never in the repo.
const env = vi.hoisted(() => ({
  APP_ENV: 'development' as string,
  API_MOCKS: 'missing' as string,
  API_TIMEOUT_MS: 10_000,
  NEXT_PUBLIC_SITE_URL: 'http://localhost:3000',
  SUPABASE_URL: 'https://project.supabase.test' as string | undefined,
  SUPABASE_ANON_KEY: 'public-anon-key' as string | undefined,
  DEV_LOGIN_EMAIL: 'dev@example.com' as string | undefined,
  DEV_LOGIN_PASSWORD: 'not-a-real-password' as string | undefined,
}))
const account = vi.hoisted(() => ({ startSession: vi.fn() }))
const session = vi.hoisted(() => ({ clearSession: vi.fn() }))
vi.mock('@/env', () => ({ env }))
vi.mock('./account', () => account)
vi.mock('./session', () => session)

const USER_ID = '00000000-0000-4000-8000-0000000000aa'

function fakeFetch(status = 200) {
  return vi.fn(
    async () =>
      new Response(
        JSON.stringify(
          status === 200
            ? { access_token: 'a', refresh_token: 'r', expires_in: 3600, user: { id: USER_ID } }
            : { error_code: 'invalid_credentials', msg: 'Invalid login credentials' },
        ),
        { status },
      ),
  ) as unknown as typeof fetch
}

describe('dev session (specs/dev-login, specs/auth AU-17)', () => {
  beforeEach(() => {
    env.APP_ENV = 'development'
    env.API_MOCKS = 'missing'
    account.startSession.mockReset()
    account.startSession.mockResolvedValue({ ok: true, session: { username: 'devuser' } })
  })
  afterEach(() => vi.resetModules())

  it('signs in on the server with the environment account, into the real session (DL-02)', async () => {
    const { startDevSession } = await import('./dev-session')
    const fetchImpl = fakeFetch()
    const result = await startDevSession(fetchImpl)

    expect(result).toEqual({ ok: true, session: { username: 'devuser' } })
    expect(JSON.parse(String(vi.mocked(fetchImpl).mock.calls[0]![1]?.body))).toEqual({
      email: 'dev@example.com',
      password: 'not-a-real-password',
    })
    expect(account.startSession).toHaveBeenCalledWith({
      accessToken: 'a',
      refreshToken: 'r',
      expiresIn: 3600,
      userId: USER_ID,
      email: null,
      photoUrl: null,
      name: null,
    })
  })

  it('says the credentials are wrong without passing on Supabase’s message', async () => {
    const { startDevSession } = await import('./dev-session')
    expect(await startDevSession(fakeFetch(400))).toEqual({ ok: false, reason: 'credentials' })
    expect(account.startSession).not.toHaveBeenCalled()
  })

  it('reports unavailable when the profile cannot be read', async () => {
    account.startSession.mockResolvedValue({ ok: false, reason: 'unavailable' })
    const { startDevSession } = await import('./dev-session')
    expect(await startDevSession(fakeFetch())).toEqual({ ok: false, reason: 'unavailable' })
  })

  it('does nothing in production, even with the variables (DL-07)', async () => {
    env.APP_ENV = 'production'
    const { startDevSession, isDevLoginEnabled } = await import('./dev-session')
    expect(isDevLoginEnabled()).toBe(false)
    expect(await startDevSession(fakeFetch())).toEqual({ ok: false, reason: 'disabled' })
  })

  it('is off without the variables (DL-01) and with every route mocked', async () => {
    const { isDevLoginEnabled } = await import('./dev-session')
    env.API_MOCKS = 'all'
    expect(isDevLoginEnabled()).toBe(false)
    env.API_MOCKS = 'missing'
    const saved = env.DEV_LOGIN_PASSWORD
    env.DEV_LOGIN_PASSWORD = undefined
    expect(isDevLoginEnabled()).toBe(false)
    env.DEV_LOGIN_PASSWORD = saved
  })

  it('ends the session by clearing the cookie (DL-06)', async () => {
    const { endDevSession } = await import('./dev-session')
    await endDevSession()
    expect(session.clearSession).toHaveBeenCalled()
  })
})
