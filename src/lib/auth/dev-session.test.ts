// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

// Fake values only: the real ones live in .env.local and never in the repo.
const env = vi.hoisted(() => ({
  APP_ENV: 'development' as string,
  API_BASE_URL: 'http://backend.test',
  API_TIMEOUT_MS: 10_000,
  NEXT_PUBLIC_SITE_URL: 'http://localhost:3000',
  SUPABASE_URL: 'https://project.supabase.test' as string | undefined,
  SUPABASE_ANON_KEY: 'public-anon-key' as string | undefined,
  DEV_LOGIN_EMAIL: 'dev@example.com' as string | undefined,
  DEV_LOGIN_PASSWORD: 'not-a-real-password' as string | undefined,
}))
const jar = vi.hoisted(() => ({
  values: new Map<string, string>(),
  options: new Map<string, unknown>(),
}))
vi.mock('@/env', () => ({ env }))
vi.mock('next/headers', () => ({
  cookies: async () => ({
    get: (name: string) => (jar.values.has(name) ? { value: jar.values.get(name) } : undefined),
    set: (name: string, value: string, options: unknown) => {
      jar.values.set(name, value)
      jar.options.set(name, options)
    },
    delete: (name: string) => jar.values.delete(name),
  }),
}))

const USER_ID = '00000000-0000-4000-8000-0000000000aa'

function fakeFetch({ tokenStatus = 200, profileStatus = 200 } = {}) {
  return vi.fn(async (input: string | URL) => {
    const url = String(input)
    if (url.includes('/auth/v1/token')) {
      return new Response(
        JSON.stringify(
          tokenStatus === 200
            ? { access_token: 'token-123', expires_in: 3600, user: { id: USER_ID } }
            : { error: 'invalid_grant', error_description: 'Invalid login credentials' },
        ),
        { status: tokenStatus },
      )
    }
    return new Response(JSON.stringify({ username: 'devuser' }), { status: profileStatus })
  }) as unknown as typeof fetch
}

describe('dev session (specs/dev-login)', () => {
  beforeEach(() => {
    jar.values.clear()
    jar.options.clear()
    env.APP_ENV = 'development'
  })
  afterEach(() => vi.resetModules())

  it('signs in on the server and keeps the token in an HttpOnly cookie (DL-02, DL-03)', async () => {
    const { startDevSession, readDevSession, SESSION_COOKIE } = await import('./dev-session')
    const fetchImpl = fakeFetch()
    const result = await startDevSession(fetchImpl)

    expect(result).toMatchObject({ ok: true, session: { userId: USER_ID, username: 'devuser' } })
    expect(jar.options.get(SESSION_COOKIE)).toMatchObject({
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
    })
    // The profile is asked with the new token as Bearer.
    const [, profileCall] = (fetchImpl as unknown as ReturnType<typeof vi.fn>).mock.calls
    expect(profileCall?.[1]).toMatchObject({ headers: { Authorization: 'Bearer token-123' } })
    expect(await readDevSession()).toMatchObject({ accessToken: 'token-123', username: 'devuser' })
  })

  it('says the credentials are wrong without passing on Supabase’s message', async () => {
    const { startDevSession } = await import('./dev-session')
    expect(await startDevSession(fakeFetch({ tokenStatus: 400 }))).toEqual({
      ok: false,
      reason: 'credentials',
    })
    expect(jar.values.size).toBe(0)
  })

  it('reports the backend as unavailable when the profile fails', async () => {
    const { startDevSession } = await import('./dev-session')
    expect(await startDevSession(fakeFetch({ profileStatus: 500 }))).toEqual({
      ok: false,
      reason: 'unavailable',
    })
  })

  it('does nothing in production, even with the variables (DL-07)', async () => {
    env.APP_ENV = 'production'
    const { startDevSession, isDevLoginEnabled } = await import('./dev-session')
    expect(isDevLoginEnabled()).toBe(false)
    expect(await startDevSession(fakeFetch())).toEqual({ ok: false, reason: 'disabled' })
  })

  it('is disabled without the variables (DL-01)', async () => {
    const saved = env.DEV_LOGIN_PASSWORD
    env.DEV_LOGIN_PASSWORD = undefined
    const { isDevLoginEnabled } = await import('./dev-session')
    expect(isDevLoginEnabled()).toBe(false)
    env.DEV_LOGIN_PASSWORD = saved
  })

  it('treats an expired or malformed cookie as no session (DL-06)', async () => {
    const { readDevSession, SESSION_COOKIE } = await import('./dev-session')
    const session = { accessToken: 't', userId: USER_ID, username: 'devuser', expiresAt: 1_000 }
    jar.values.set(SESSION_COOKIE, JSON.stringify(session))
    expect(await readDevSession(999)).not.toBeNull()
    expect(await readDevSession(1_000)).toBeNull()
    jar.values.set(SESSION_COOKIE, '{not json')
    expect(await readDevSession()).toBeNull()
  })

  it('ends the session by deleting the cookie', async () => {
    const { startDevSession, endDevSession, readDevSession } = await import('./dev-session')
    await startDevSession(fakeFetch())
    await endDevSession()
    expect(await readDevSession()).toBeNull()
  })
})
