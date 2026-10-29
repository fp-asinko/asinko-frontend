// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { Session } from '@/lib/auth/session-cookie'

const USER_ID = '00000000-0000-4000-8000-0000000000aa'
const TOKENS = { accessToken: 'access', refreshToken: 'refresh', expiresIn: 3600, userId: USER_ID }

const deps = vi.hoisted(() => ({
  auth: {
    signInWithPassword: vi.fn(),
    signUp: vi.fn(),
    signOut: vi.fn(),
  } as Record<string, ReturnType<typeof vi.fn>> | null,
  session: null as Session | null,
  writeSession: vi.fn(),
  clearSession: vi.fn(),
  startSession: vi.fn(),
  createProfile: vi.fn(),
  isUsernameTaken: vi.fn(),
  revalidatePath: vi.fn(),
}))
vi.mock('@/lib/auth/supabase', () => ({
  get supabaseAuth() {
    return deps.auth
  },
}))
vi.mock('@/lib/auth/session', () => ({
  readSession: async () => deps.session,
  writeSession: deps.writeSession,
  clearSession: deps.clearSession,
}))
vi.mock('@/lib/auth/account', () => ({ startSession: deps.startSession }))
vi.mock('../lib/profile-api', () => ({
  createProfile: deps.createProfile,
  isUsernameTaken: deps.isUsernameTaken,
}))
vi.mock('next/cache', () => ({ revalidatePath: deps.revalidatePath }))
vi.mock('next-intl/server', () => ({ getLocale: async () => 'es' }))

const { logIn } = await import('./log-in.action')
const { signUp } = await import('./sign-up.action')
const { createProfile } = await import('./create-profile.action')
const { logOut } = await import('./log-out.action')

const SIGN_UP = {
  email: 'ana@example.com',
  password: 'long-enough',
  username: 'ana_92',
  accepted: true,
}

describe('auth actions (specs/auth design.md § 6)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    deps.auth = {
      signInWithPassword: vi.fn(async () => ({ ok: true, tokens: TOKENS })),
      signUp: vi.fn(async () => ({ ok: true, tokens: TOKENS })),
      signOut: vi.fn(async () => {}),
    }
    deps.session = null
    deps.startSession.mockResolvedValue({ ok: true, session: { username: 'ana_92' } })
    deps.isUsernameTaken.mockResolvedValue(false)
    deps.createProfile.mockResolvedValue({ ok: true, username: 'ana_92' })
  })

  describe('logIn (AU-02, AU-04)', () => {
    it('signs in, starts the session and renders the page again', async () => {
      expect(await logIn({ email: 'ana@example.com', password: 'x' })).toEqual({
        ok: true,
        data: { needsProfile: false },
      })
      expect(deps.auth?.signInWithPassword).toHaveBeenCalledWith('ana@example.com', 'x')
      expect(deps.startSession).toHaveBeenCalledWith(TOKENS)
      expect(deps.revalidatePath).toHaveBeenCalledWith('/', 'layout')
    })

    it('says an account has no username yet (AU-11)', async () => {
      deps.startSession.mockResolvedValue({ ok: true, session: { username: null } })
      expect(await logIn({ email: 'ana@example.com', password: 'x' })).toEqual({
        ok: true,
        data: { needsProfile: true },
      })
    })

    it('refuses wrong credentials without saying which one, and an invalid form', async () => {
      deps.auth!.signInWithPassword!.mockResolvedValue({ ok: false, reason: 'credentials' })
      expect(await logIn({ email: 'ana@example.com', password: 'x' })).toEqual({
        ok: false,
        error: 'auth.errors.credentials',
      })
      expect(await logIn({ email: 'nope', password: 'x' })).toMatchObject({
        ok: false,
        fieldErrors: { email: ['auth.fields.email.invalid'] },
      })
      expect(deps.startSession).not.toHaveBeenCalled()
    })

    it('says too many tries, and unavailable without Supabase', async () => {
      deps.auth!.signInWithPassword!.mockResolvedValue({ ok: false, reason: 'rateLimited' })
      expect(await logIn({ email: 'ana@example.com', password: 'x' })).toMatchObject({
        error: 'auth.errors.rateLimited',
      })
      deps.auth = null
      expect(await logIn({ email: 'ana@example.com', password: 'x' })).toMatchObject({
        error: 'auth.errors.unavailable',
      })
    })
  })

  describe('signUp (AU-05 to AU-09)', () => {
    it('creates the account, then its profile in the locale, and signs in with the username', async () => {
      expect(await signUp(SIGN_UP)).toEqual({ ok: true, data: { needsProfile: false } })
      expect(deps.auth?.signUp).toHaveBeenCalledWith('ana@example.com', 'long-enough')
      expect(deps.createProfile).toHaveBeenCalledWith('ana_92', 'es', 'access')
      expect(deps.writeSession).toHaveBeenLastCalledWith(
        expect.objectContaining({ userId: USER_ID, username: 'ana_92' }),
      )
    })

    it('refuses a taken username before creating anything (AU-08)', async () => {
      deps.isUsernameTaken.mockResolvedValue(true)
      expect(await signUp(SIGN_UP)).toEqual({
        ok: false,
        error: 'auth.errors.usernameTaken',
        fieldErrors: { username: ['auth.errors.usernameTaken'] },
      })
      expect(deps.auth?.signUp).not.toHaveBeenCalled()
    })

    it('puts a taken email next to its field (AU-08)', async () => {
      deps.auth!.signUp!.mockResolvedValue({ ok: false, reason: 'emailTaken' })
      expect(await signUp(SIGN_UP)).toMatchObject({
        fieldErrors: { email: ['auth.errors.emailTaken'] },
      })
      expect(deps.writeSession).not.toHaveBeenCalled()
    })

    it('stays signed in without a username when the profile fails (AU-09)', async () => {
      deps.createProfile.mockResolvedValue({ ok: false, reason: 'usernameTaken' })
      expect(await signUp(SIGN_UP)).toEqual({ ok: true, data: { needsProfile: true } })
      expect(deps.writeSession).toHaveBeenCalledTimes(1)
      expect(deps.writeSession).toHaveBeenCalledWith(expect.objectContaining({ username: null }))
    })

    it('refuses without age and terms (AU-05)', async () => {
      expect(await signUp({ ...SIGN_UP, accepted: false })).toMatchObject({
        fieldErrors: { accepted: ['auth.fields.accepted.required'] },
      })
    })
  })

  describe('createProfile (AU-11)', () => {
    const NO_PROFILE: Session = {
      ...TOKENS,
      username: null,
      expiresAt: Date.now() + 60_000,
    } as unknown as Session

    it('needs a session', async () => {
      expect(await createProfile({ username: 'ana_92', accepted: true })).toEqual({
        ok: false,
        error: 'auth.errors.noSession',
      })
    })

    it('keeps the chosen username in the session', async () => {
      deps.session = NO_PROFILE
      expect(await createProfile({ username: 'ana_92', accepted: true })).toEqual({
        ok: true,
        data: { username: 'ana_92' },
      })
      // The user is the session's Bearer: no token or id goes from the form.
      expect(deps.createProfile).toHaveBeenCalledWith('ana_92', 'es')
      expect(deps.writeSession).toHaveBeenCalledWith({ ...NO_PROFILE, username: 'ana_92' })
    })

    it('says a taken username next to its field', async () => {
      deps.session = NO_PROFILE
      deps.createProfile.mockResolvedValue({ ok: false, reason: 'usernameTaken' })
      expect(await createProfile({ username: 'ana_92', accepted: true })).toMatchObject({
        fieldErrors: { username: ['auth.errors.usernameTaken'] },
      })
      expect(deps.writeSession).not.toHaveBeenCalled()
    })

    it('does nothing when the username was already chosen', async () => {
      deps.session = { ...NO_PROFILE, username: 'ana' }
      expect(await createProfile({ username: 'ana_92', accepted: true })).toEqual({
        ok: true,
        data: { username: 'ana' },
      })
      expect(deps.createProfile).not.toHaveBeenCalled()
    })
  })

  describe('logOut (AU-14)', () => {
    it('revokes the refresh token and clears the cookie', async () => {
      deps.session = { ...TOKENS, username: 'ana', expiresAt: 0 } as unknown as Session
      expect(await logOut()).toEqual({ ok: true, data: null })
      expect(deps.auth?.signOut).toHaveBeenCalledWith('access')
      expect(deps.clearSession).toHaveBeenCalled()
      expect(deps.revalidatePath).toHaveBeenCalledWith('/', 'layout')
    })
  })
})
