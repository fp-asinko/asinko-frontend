// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { DEMO_USER } from '@/mocks/demo-user'
import {
  needsRefresh,
  parseSession,
  SESSION_COOKIE,
  sessionFromTokens,
  type Session,
} from './session-cookie'

const env = vi.hoisted(() => ({
  API_MOCKS: 'missing' as string,
  NEXT_PUBLIC_SITE_URL: 'https://asinko.app',
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
const TOKENS = { accessToken: 'access', refreshToken: 'refresh', expiresIn: 3600, userId: USER_ID }
const SESSION: Session = sessionFromTokens(TOKENS, 'maria', 1_000)

describe('session cookie (specs/auth design.md § 3)', () => {
  it('keeps both tokens, the user and when the access token expires', () => {
    expect(SESSION).toEqual({
      accessToken: 'access',
      refreshToken: 'refresh',
      userId: USER_ID,
      username: 'maria',
      expiresAt: 1_000 + 3_600_000,
    })
  })

  it('reads a valid cookie, also one without a profile, and nothing from a broken one', () => {
    expect(parseSession(JSON.stringify(SESSION))).toEqual(SESSION)
    const noProfile = { ...SESSION, username: null }
    expect(parseSession(JSON.stringify(noProfile))).toEqual(noProfile)
    expect(parseSession('{not json')).toBeNull()
    expect(parseSession(JSON.stringify({ ...SESSION, refreshToken: '' }))).toBeNull()
    expect(parseSession(undefined)).toBeNull()
  })

  it('asks for a new token in its last minute (AU-13)', () => {
    expect(needsRefresh(SESSION, SESSION.expiresAt - 61_000)).toBe(false)
    expect(needsRefresh(SESSION, SESSION.expiresAt - 59_000)).toBe(true)
    expect(needsRefresh(SESSION, SESSION.expiresAt + 1)).toBe(true)
  })
})

describe('the session on the server (AU-15 to AU-17)', () => {
  beforeEach(() => {
    jar.values.clear()
    jar.options.clear()
    env.API_MOCKS = 'missing'
  })

  it('writes an HttpOnly, Lax, Secure cookie for 30 days (AU-16)', async () => {
    const { writeSession, readSession } = await import('./session')
    await writeSession(SESSION)
    expect(jar.options.get(SESSION_COOKIE)).toEqual({
      httpOnly: true,
      sameSite: 'lax',
      secure: true,
      path: '/',
      maxAge: 60 * 60 * 24 * 30,
    })
    expect(await readSession()).toEqual(SESSION)
  })

  it('gives the viewer and the Bearer from the session', async () => {
    const { getViewer, getAccessToken, getAccountState } = await import('@/lib/session')
    expect(await getViewer()).toBeNull()
    expect(await getAccountState()).toBe('guest')
    expect(await getAccessToken()).toBeNull()

    jar.values.set(SESSION_COOKIE, JSON.stringify(SESSION))
    expect(await getViewer()).toEqual({ id: USER_ID, username: 'maria' })
    expect(await getAccountState()).toBe('ready')
    expect(await getAccessToken()).toBe('access')
  })

  it('has no viewer while the account chooses its username, but keeps its Bearer (AU-11)', async () => {
    const { getViewer, getAccessToken, getAccountState } = await import('@/lib/session')
    jar.values.set(SESSION_COOKIE, JSON.stringify({ ...SESSION, username: null }))
    expect(await getViewer()).toBeNull()
    expect(await getAccountState()).toBe('needs-profile')
    expect(await getAccessToken()).toBe('access')
  })

  it('with every route mocked: the session, else the demo user, else a guest (AU-17)', async () => {
    env.API_MOCKS = 'all'
    const { getViewer, MOCK_GUEST_COOKIE } = await import('@/lib/session')
    expect(await getViewer()).toEqual(DEMO_USER)
    jar.values.set(MOCK_GUEST_COOKIE, '1')
    expect(await getViewer()).toBeNull()
    jar.values.set(SESSION_COOKIE, JSON.stringify(SESSION))
    expect(await getViewer()).toEqual({ id: USER_ID, username: 'maria' })
  })

  it('clears the session', async () => {
    const { writeSession, clearSession, readSession } = await import('./session')
    await writeSession(SESSION)
    await clearSession()
    expect(await readSession()).toBeNull()
  })
})
