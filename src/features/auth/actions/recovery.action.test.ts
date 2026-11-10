// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { Session } from '@/lib/auth/session-cookie'

const USER_ID = '00000000-0000-4000-8000-0000000000aa'
const TOKENS = {
  accessToken: 'recovery-access',
  refreshToken: 'refresh',
  expiresIn: 3600,
  userId: USER_ID,
  email: 'ana@example.com',
}
const SESSION = {
  accessToken: 'recovery-access',
  refreshToken: 'refresh',
  userId: USER_ID,
  username: 'ana_92',
  expiresAt: 0,
} satisfies Session

type Fn = ReturnType<typeof vi.fn>
type Auth = { recover: Fn; verifyRecovery: Fn; updatePassword: Fn; signOutOthers: Fn }

const deps = vi.hoisted(() => ({
  auth: null as Auth | null,
  kept: null as { token: string } | { verified: true } | null,
  session: null as Session | null,
  startSession: vi.fn(),
  markRecoveryVerified: vi.fn(),
  clearRecovery: vi.fn(),
  revalidatePath: vi.fn(),
  captureMessage: vi.fn(),
}))
vi.mock('@/lib/auth/supabase', () => ({
  get supabaseAuth() {
    return deps.auth
  },
}))
vi.mock('@/lib/auth/recovery-cookie', () => ({
  readRecovery: async () => deps.kept,
  markRecoveryVerified: deps.markRecoveryVerified,
  clearRecovery: deps.clearRecovery,
  requestOrigin: async () => 'https://asinko.app',
}))
vi.mock('@/lib/auth/session', () => ({ readSession: async () => deps.session }))
vi.mock('@/lib/auth/account', () => ({ startSession: deps.startSession }))
vi.mock('next/cache', () => ({ revalidatePath: deps.revalidatePath }))
vi.mock('@sentry/nextjs', () => ({ captureMessage: deps.captureMessage }))

const { requestRecovery } = await import('./request-recovery.action')
const { resetPassword } = await import('./reset-password.action')

const NEW = { password: 'brand-new-password' }

function auth(): Auth {
  if (!deps.auth) throw new Error('no auth')
  return deps.auth
}

describe('password recovery actions (specs/password-recovery design.md § 5)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    deps.auth = {
      recover: vi.fn(async () => ({ ok: true })),
      verifyRecovery: vi.fn(async () => ({ ok: true, tokens: TOKENS })),
      updatePassword: vi.fn(async () => ({ ok: true })),
      signOutOthers: vi.fn(async () => ({ ok: true })),
    }
    deps.kept = { token: 'abc123def456' }
    deps.session = null
    deps.startSession.mockResolvedValue({ ok: true, session: SESSION })
  })

  describe('requestRecovery (PR-02 to PR-04, PR-12)', () => {
    it('asks for the email, coming back through /auth/reset to where it was asked', async () => {
      expect(await requestRecovery({ email: ' ana@example.com ', next: '/es/hub/macro' })).toEqual({
        ok: true,
        data: null,
      })
      expect(auth().recover).toHaveBeenCalledWith(
        'ana@example.com',
        'https://asinko.app/auth/reset?next=%2Fes%2Fhub%2Fmacro',
      )
    })

    it('sends a next that leaves the site back to the Home (PR-14)', async () => {
      await requestRecovery({ email: 'ana@example.com', next: '//evil.example' })
      expect(auth().recover).toHaveBeenCalledWith(
        'ana@example.com',
        'https://asinko.app/auth/reset?next=%2F',
      )
    })

    it('refuses an invalid email before asking Supabase', async () => {
      expect(await requestRecovery({ email: 'not-an-email' })).toMatchObject({
        ok: false,
        fieldErrors: { email: ['auth.fields.email.invalid'] },
      })
      expect(auth().recover).not.toHaveBeenCalled()
    })

    it('says too many requests and an outage, never whether the account exists', async () => {
      auth().recover.mockResolvedValueOnce({ ok: false, reason: 'rateLimited' })
      expect(await requestRecovery({ email: 'ana@example.com' })).toEqual({
        ok: false,
        error: 'auth.errors.rateLimited',
      })
      deps.auth = null
      expect(await requestRecovery({ email: 'ana@example.com' })).toEqual({
        ok: false,
        error: 'auth.errors.unavailable',
      })
    })
  })

  describe('resetPassword (PR-06 to PR-10, PR-18)', () => {
    it('spends the token, saves the password, closes the other sessions and the link', async () => {
      expect(await resetPassword(NEW)).toEqual({
        ok: true,
        data: { needsProfile: false, suggestion: null },
      })
      expect(auth().verifyRecovery).toHaveBeenCalledWith('abc123def456')
      expect(deps.startSession).toHaveBeenCalledWith(TOKENS)
      expect(auth().updatePassword).toHaveBeenCalledWith('recovery-access', NEW.password)
      expect(auth().signOutOthers).toHaveBeenCalledWith('recovery-access')
      expect(deps.clearRecovery).toHaveBeenCalled()
      expect(deps.revalidatePath).toHaveBeenCalledWith('/', 'layout')
    })

    it('takes an account without a username to the welcome step (PR-10)', async () => {
      deps.startSession.mockResolvedValue({
        ok: true,
        session: { ...SESSION, username: null, suggestion: 'ana' },
      })
      expect(await resetPassword(NEW)).toEqual({
        ok: true,
        data: { needsProfile: true, suggestion: 'ana' },
      })
    })

    it('refuses a short password before spending the link (PR-06)', async () => {
      expect(await resetPassword({ password: 'short' })).toMatchObject({
        ok: false,
        fieldErrors: { password: ['auth.fields.password.short'] },
      })
      expect(auth().verifyRecovery).not.toHaveBeenCalled()
    })

    it('says the link expired without a cookie, or when Supabase refuses it (PR-08)', async () => {
      deps.kept = null
      expect(await resetPassword(NEW)).toEqual({ ok: false, error: 'auth.reset.expired' })

      deps.kept = { token: 'abc123def456' }
      auth().verifyRecovery.mockResolvedValueOnce({ ok: false, reason: 'expired' })
      expect(await resetPassword(NEW)).toEqual({ ok: false, error: 'auth.reset.expired' })
      expect(deps.clearRecovery).toHaveBeenCalled()
      expect(auth().updatePassword).not.toHaveBeenCalled()
    })

    it('keeps the spent link usable with its session when the password is refused (PR-09)', async () => {
      auth().updatePassword.mockResolvedValueOnce({ ok: false, reason: 'samePassword' })
      expect(await resetPassword(NEW)).toEqual({
        ok: false,
        error: 'auth.errors.samePassword',
        fieldErrors: { password: ['auth.errors.samePassword'] },
      })
      expect(deps.markRecoveryVerified).toHaveBeenCalled()
      expect(deps.clearRecovery).not.toHaveBeenCalled()

      // The second try: the token is spent, and the session it gave changes the password.
      deps.kept = { verified: true }
      deps.session = SESSION
      expect((await resetPassword(NEW)).ok).toBe(true)
      expect(auth().verifyRecovery).toHaveBeenCalledTimes(1)
      expect(auth().updatePassword).toHaveBeenLastCalledWith('recovery-access', NEW.password)
    })

    it('says a weak password next to its field (PR-09)', async () => {
      auth().updatePassword.mockResolvedValueOnce({ ok: false, reason: 'weakPassword' })
      expect(await resetPassword(NEW)).toMatchObject({
        fieldErrors: { password: ['auth.errors.weakPassword'] },
      })
    })

    it('never changes a password with a session alone, without the mark of the link', async () => {
      deps.kept = null
      deps.session = SESSION
      expect(await resetPassword(NEW)).toEqual({ ok: false, error: 'auth.reset.expired' })
      expect(auth().updatePassword).not.toHaveBeenCalled()
    })

    it('says the link expired when its session ended before saving (PR-09)', async () => {
      deps.kept = { verified: true }
      expect(await resetPassword(NEW)).toEqual({ ok: false, error: 'auth.reset.expired' })
      deps.session = SESSION
      auth().updatePassword.mockResolvedValueOnce({ ok: false, reason: 'expired' })
      expect(await resetPassword(NEW)).toEqual({ ok: false, error: 'auth.reset.expired' })
      expect(deps.clearRecovery).toHaveBeenCalled()
    })

    it('still succeeds when the other sessions could not be closed, and reports it (PR-18)', async () => {
      auth().signOutOthers.mockResolvedValueOnce({ ok: false, reason: 'unavailable' })
      expect((await resetPassword(NEW)).ok).toBe(true)
      expect(deps.captureMessage).toHaveBeenCalledWith(expect.any(String), {
        level: 'warning',
        tags: { reason: 'unavailable' },
      })
      expect(JSON.stringify(deps.captureMessage.mock.calls)).not.toContain('ana@example.com')
    })

    it('says unavailable without Supabase or when the profile cannot be read', async () => {
      deps.startSession.mockResolvedValueOnce({ ok: false, reason: 'unavailable' })
      expect(await resetPassword(NEW)).toEqual({ ok: false, error: 'auth.errors.unavailable' })
      deps.auth = null
      expect(await resetPassword(NEW)).toEqual({ ok: false, error: 'auth.errors.unavailable' })
    })
  })
})
