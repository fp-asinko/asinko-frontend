// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { Session } from '@/lib/auth/session-cookie'

const USER_ID = '00000000-0000-4000-8000-0000000000aa'
const TOKENS = {
  accessToken: 'access',
  refreshToken: 'refresh',
  expiresIn: 3600,
  userId: USER_ID,
  email: 'ana.perez@example.com',
}

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
vi.mock('../lib/profile-api', () => ({ createProfile: deps.createProfile }))
vi.mock('next/cache', () => ({ revalidatePath: deps.revalidatePath }))
vi.mock('next-intl/server', () => ({ getLocale: async () => 'es' }))

const { logIn } = await import('./log-in.action')
const { signUp } = await import('./sign-up.action')
const { createProfile } = await import('./create-profile.action')
const { logOut } = await import('./log-out.action')

const SIGN_UP = { email: 'ana.perez@example.com', password: 'long-enough' }

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
    deps.createProfile.mockResolvedValue({ ok: true, username: 'ana_92' })
  })

  describe('logIn (AU-02, AU-04)', () => {
    it('signs in, starts the session and renders the page again', async () => {
      expect(await logIn({ email: 'ana@example.com', password: 'x' })).toEqual({
        ok: true,
        data: { needsProfile: false, suggestion: null },
      })
      expect(deps.auth?.signInWithPassword).toHaveBeenCalledWith('ana@example.com', 'x')
      expect(deps.startSession).toHaveBeenCalledWith(TOKENS)
      expect(deps.revalidatePath).toHaveBeenCalledWith('/', 'layout')
    })

    it('says an account has no username yet (AU-11)', async () => {
      deps.startSession.mockResolvedValue({
        ok: true,
        session: { username: null, suggestion: 'ana' },
      })
      expect(await logIn({ email: 'ana@example.com', password: 'x' })).toEqual({
        ok: true,
        data: { needsProfile: true, suggestion: 'ana' },
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

  describe('signUp (AU-05, AU-07, design.md § 11)', () => {
    it('creates the account with email and password, signed in without a username yet', async () => {
      expect(await signUp(SIGN_UP)).toEqual({
        ok: true,
        data: { needsProfile: true, suggestion: 'ana_perez' },
      })
      expect(deps.auth?.signUp).toHaveBeenCalledWith('ana.perez@example.com', 'long-enough')
      // The welcome screen asks for the username, suggested from the email.
      expect(deps.writeSession).toHaveBeenCalledWith(
        expect.objectContaining({ userId: USER_ID, username: null, suggestion: 'ana_perez' }),
      )
      expect(deps.createProfile).not.toHaveBeenCalled()
      expect(deps.revalidatePath).toHaveBeenCalledWith('/', 'layout')
    })

    it('puts a taken email next to its field (AU-08)', async () => {
      deps.auth!.signUp!.mockResolvedValue({ ok: false, reason: 'emailTaken' })
      expect(await signUp(SIGN_UP)).toMatchObject({
        fieldErrors: { email: ['auth.errors.emailTaken'] },
      })
      expect(deps.writeSession).not.toHaveBeenCalled()
    })

    it('refuses a short password before calling Supabase (AU-06)', async () => {
      expect(await signUp({ ...SIGN_UP, password: 'short' })).toMatchObject({
        fieldErrors: { password: ['auth.fields.password.short'] },
      })
      expect(deps.auth?.signUp).not.toHaveBeenCalled()
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
      expect(deps.createProfile).toHaveBeenCalledWith('ana_92', 'es', undefined)
      expect(deps.writeSession).toHaveBeenCalledWith({
        ...NO_PROFILE,
        username: 'ana_92',
        suggestion: null,
        nameSuggestion: null,
        photoSuggestion: null,
      })
      // The photo may follow: the caller renders the page again when everything is done.
      expect(deps.revalidatePath).not.toHaveBeenCalled()
    })

    it('says a taken username next to its field', async () => {
      deps.session = NO_PROFILE
      deps.createProfile.mockResolvedValue({ ok: false, reason: 'usernameTaken' })
      expect(await createProfile({ username: 'ana_92', accepted: true })).toMatchObject({
        fieldErrors: { username: ['auth.errors.usernameTaken'] },
      })
      expect(deps.writeSession).not.toHaveBeenCalled()
    })

    it('sends the display name, and says a too long one next to its field (AU-23)', async () => {
      deps.session = NO_PROFILE
      await createProfile({ username: 'ana_92', displayName: ' Ana Pérez ', accepted: true })
      expect(deps.createProfile).toHaveBeenCalledWith('ana_92', 'es', 'Ana Pérez')
      expect(
        await createProfile({ username: 'ana_92', displayName: 'x'.repeat(51), accepted: true }),
      ).toMatchObject({ fieldErrors: { displayName: ['auth.fields.displayName.long'] } })
      deps.createProfile.mockResolvedValue({ ok: false, reason: 'displayNameTooLong' })
      expect(
        await createProfile({ username: 'ana_92', displayName: 'Ana', accepted: true }),
      ).toMatchObject({ fieldErrors: { displayName: ['auth.fields.displayName.long'] } })
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
