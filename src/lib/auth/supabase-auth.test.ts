// @vitest-environment node
import { describe, expect, it, vi } from 'vitest'
import {
  MOCK_DEMO_EMAIL,
  MOCK_DEMO_PASSWORD,
  MOCK_LIMITED_EMAIL,
  MOCK_RECOVERY_TOKEN,
  MOCK_SUPABASE_URL,
  MOCK_TAKEN_EMAIL,
  mockSupabaseFetch,
  mockTokenUser,
} from '@/mocks/auth'
import { DEMO_USER } from '@/mocks/demo-user'
import { createSupabaseAuth } from './supabase-auth'

const USER_ID = '11111111-1111-4111-8111-111111111111'

function withFetch(fetchImpl: typeof fetch) {
  return createSupabaseAuth({
    url: 'https://project.supabase.co',
    anonKey: 'anon',
    fetch: fetchImpl,
    timeoutMs: 1000,
  })
}

const answer = (status: number, body: unknown) =>
  vi.fn(async () => new Response(JSON.stringify(body), { status })) as unknown as typeof fetch

const TOKENS = {
  access_token: 'access',
  refresh_token: 'refresh',
  expires_in: 3600,
  user: { id: USER_ID },
}

describe('createSupabaseAuth (specs/auth design.md § 2)', () => {
  it('keeps the name Google gave, trimmed (design.md § 16)', async () => {
    for (const [metadata, name] of [
      [{ full_name: ' Ana Pérez ' }, 'Ana Pérez'],
      [{ name: 'Ana' }, 'Ana'],
      [{ full_name: '  ' }, null],
      [{ full_name: 7 }, null],
    ] as const) {
      const auth = createSupabaseAuth({
        url: 'https://project.supabase.co',
        anonKey: 'anon',
        fetch: answer(200, {
          ...TOKENS,
          user: { id: USER_ID, email: null, user_metadata: metadata },
        }),
        timeoutMs: 1000,
      })
      expect(await auth.exchangeCode('code', 'verifier')).toMatchObject({ tokens: { name } })
    }
  })

  it('keeps the photo Google gave, and ignores one that is not text (design.md § 15)', async () => {
    const photo = 'https://lh3.googleusercontent.com/a/x=s96-c'
    for (const [metadata, photoUrl] of [
      [{ avatar_url: photo }, photo],
      [{ picture: photo }, photo],
      [{ avatar_url: 42 }, null],
      ['broken', null],
    ] as const) {
      const auth = createSupabaseAuth({
        url: 'https://project.supabase.co',
        anonKey: 'anon',
        fetch: answer(200, {
          ...TOKENS,
          user: { id: USER_ID, email: null, user_metadata: metadata },
        }),
        timeoutMs: 1000,
      })
      expect(await auth.exchangeCode('code', 'verifier')).toMatchObject({ tokens: { photoUrl } })
    }
  })

  it('signs in with the password grant and the public key, and keeps only the tokens', async () => {
    const fetchImpl = answer(200, { ...TOKENS, user: { id: USER_ID, email: 'a@b.co' } })
    const result = await withFetch(fetchImpl).signInWithPassword('a@b.co', 'secret-123')
    expect(result).toEqual({
      ok: true,
      tokens: {
        accessToken: 'access',
        refreshToken: 'refresh',
        expiresIn: 3600,
        userId: USER_ID,
        email: 'a@b.co',
        photoUrl: null,
        name: null,
      },
    })
    const [url, init] = vi.mocked(fetchImpl).mock.calls[0]!
    expect(String(url)).toBe('https://project.supabase.co/auth/v1/token?grant_type=password')
    expect(init?.headers).toMatchObject({ apikey: 'anon' })
    expect(JSON.parse(String(init?.body))).toEqual({ email: 'a@b.co', password: 'secret-123' })
  })

  it.each([
    [400, { error_code: 'invalid_credentials', msg: 'Invalid login credentials' }, 'credentials'],
    [422, { error_code: 'user_already_exists' }, 'emailTaken'],
    [422, { error_code: 'email_exists' }, 'emailTaken'],
    [422, { error_code: 'weak_password' }, 'weakPassword'],
    [400, { error_code: 'email_address_invalid' }, 'invalidEmail'],
    [429, { error_code: 'over_request_rate_limit' }, 'rateLimited'],
    [503, {}, 'unavailable'],
    [200, { access_token: 'only this' }, 'unavailable'],
  ])(
    'turns a %i %j into a reason, never Supabase message (AU-04, AU-08)',
    async (status, body, reason) => {
      const result = await withFetch(answer(status, body)).signUp('a@b.co', 'secret-123')
      expect(result).toEqual({ ok: false, reason })
    },
  )

  it('says unavailable when the network fails', async () => {
    const fetchImpl = vi.fn(async () => {
      throw new TypeError('fetch failed')
    }) as unknown as typeof fetch
    expect(await withFetch(fetchImpl).signInWithPassword('a@b.co', 'x')).toEqual({
      ok: false,
      reason: 'unavailable',
    })
  })

  it('says expired when a refresh token or a code is refused (AU-13)', async () => {
    const auth = withFetch(answer(400, { error_code: 'refresh_token_not_found' }))
    expect(await auth.refresh('old')).toEqual({ ok: false, reason: 'expired' })
    expect(await auth.exchangeCode('code', 'verifier')).toEqual({ ok: false, reason: 'expired' })
  })

  it('exchanges Google code with its verifier (PKCE)', async () => {
    const fetchImpl = answer(200, TOKENS)
    await withFetch(fetchImpl).exchangeCode('the-code', 'the-verifier')
    const [url, init] = vi.mocked(fetchImpl).mock.calls[0]!
    expect(String(url)).toBe('https://project.supabase.co/auth/v1/token?grant_type=pkce')
    expect(JSON.parse(String(init?.body))).toEqual({
      auth_code: 'the-code',
      code_verifier: 'the-verifier',
    })
  })

  it('logs out with the Bearer, and does not throw when Supabase is down', async () => {
    const fetchImpl = vi.fn(async () => {
      throw new TypeError('down')
    }) as unknown as typeof fetch
    await expect(withFetch(fetchImpl).signOut('access')).resolves.toBeUndefined()
    expect(vi.mocked(fetchImpl).mock.calls[0]![1]?.headers).toMatchObject({
      Authorization: 'Bearer access',
    })
  })

  describe('password recovery (specs/password-recovery design.md § 2)', () => {
    it('asks for the email with where its link goes back to', async () => {
      const fetchImpl = answer(200, {})
      const result = await withFetch(fetchImpl).recover(
        'ana@asinko.dev',
        'https://asinko.app/auth/reset?next=/es',
      )
      expect(result).toEqual({ ok: true })
      const [target, init] = vi.mocked(fetchImpl).mock.calls[0]!
      const url = new URL(target as URL)
      expect(url.pathname).toBe('/auth/v1/recover')
      expect(url.searchParams.get('redirect_to')).toBe('https://asinko.app/auth/reset?next=/es')
      expect(JSON.parse(init!.body as string)).toEqual({ email: 'ana@asinko.dev' })
    })

    it('never tells an email apart: only too many requests or an outage fail (PR-04, PR-12)', async () => {
      const recover = (status: number, body: unknown) =>
        withFetch(answer(status, body)).recover('x@asinko.dev', 'https://asinko.app/auth/reset')
      expect(await recover(400, { error_code: 'email_address_invalid' })).toEqual({ ok: true })
      expect(await recover(422, { error_code: 'user_not_found' })).toEqual({ ok: true })
      expect(await recover(429, { error_code: 'over_email_send_rate_limit' })).toEqual({
        ok: false,
        reason: 'rateLimited',
      })
      expect(await recover(503, {})).toEqual({ ok: false, reason: 'unavailable' })
    })

    it('exchanges the token hash, and says expired when it is spent or too old (PR-08)', async () => {
      const fetchImpl = answer(200, TOKENS)
      const result = await withFetch(fetchImpl).verifyRecovery('hash')
      expect(result.ok && result.tokens.accessToken).toBe('access')
      expect(JSON.parse(vi.mocked(fetchImpl).mock.calls[0]![1]!.body as string)).toEqual({
        type: 'recovery',
        token_hash: 'hash',
      })
      expect(
        await withFetch(answer(403, { error_code: 'otp_expired' })).verifyRecovery('hash'),
      ).toEqual({ ok: false, reason: 'expired' })
    })

    it('saves the new password with PUT and the Bearer, and names each refusal (PR-09)', async () => {
      const fetchImpl = answer(200, { id: USER_ID })
      expect(await withFetch(fetchImpl).updatePassword('access', 'new-password')).toEqual({
        ok: true,
      })
      const [target, init] = vi.mocked(fetchImpl).mock.calls[0]!
      expect(new URL(target as URL).pathname).toBe('/auth/v1/user')
      expect(init?.method).toBe('PUT')
      expect(init?.headers).toMatchObject({ Authorization: 'Bearer access' })

      const update = (status: number, body: unknown) =>
        withFetch(answer(status, body)).updatePassword('access', 'x')
      expect(await update(422, { error_code: 'weak_password' })).toEqual({
        ok: false,
        reason: 'weakPassword',
      })
      expect(await update(422, { error_code: 'same_password' })).toEqual({
        ok: false,
        reason: 'samePassword',
      })
      expect(await update(401, { error_code: 'bad_jwt' })).toEqual({ ok: false, reason: 'expired' })
    })

    it('closes the other sessions with the Bearer (PR-18)', async () => {
      const fetchImpl = vi.fn(
        async () => new Response(null, { status: 204 }),
      ) as unknown as typeof fetch
      expect(await withFetch(fetchImpl).signOutOthers('access')).toEqual({ ok: true })
      const [target, init] = vi.mocked(fetchImpl).mock.calls[0]!
      expect(new URL(target as URL).search).toBe('?scope=others')
      expect(init?.headers).toMatchObject({ Authorization: 'Bearer access' })
    })
  })

  it("builds Google's authorize URL with the challenge (S256)", () => {
    const url = new URL(
      withFetch(answer(200, {})).googleUrl('https://asinko.app/auth/callback', 'challenge'),
    )
    expect(url.origin + url.pathname).toBe('https://project.supabase.co/auth/v1/authorize')
    expect(Object.fromEntries(url.searchParams)).toEqual({
      provider: 'google',
      redirect_to: 'https://asinko.app/auth/callback',
      code_challenge: 'challenge',
      code_challenge_method: 's256',
    })
  })
})

describe('the simulated Supabase (API_MOCKS=true, design.md § 9)', () => {
  const auth = createSupabaseAuth({
    url: MOCK_SUPABASE_URL,
    anonKey: 'mock',
    fetch: mockSupabaseFetch,
    timeoutMs: 1000,
  })

  it('signs the demo user in, and refuses a wrong password', async () => {
    const result = await auth.signInWithPassword(MOCK_DEMO_EMAIL, MOCK_DEMO_PASSWORD)
    expect(result.ok && result.tokens.userId).toBe(DEMO_USER.id)
    expect(result.ok && mockTokenUser(result.tokens.accessToken)).toBe(DEMO_USER.id)
    expect(await auth.signInWithPassword(MOCK_DEMO_EMAIL, 'nope')).toEqual({
      ok: false,
      reason: 'credentials',
    })
  })

  it('creates an account once, and says a taken email is taken', async () => {
    const email = `new-${crypto.randomUUID()}@asinko.dev`
    const created = await auth.signUp(email, 'long-enough')
    expect(created.ok).toBe(true)
    expect((await auth.signInWithPassword(email, 'long-enough')).ok).toBe(true)
    expect(await auth.signUp(email, 'long-enough')).toEqual({ ok: false, reason: 'emailTaken' })
    expect(await auth.signUp(MOCK_TAKEN_EMAIL, 'long-enough')).toEqual({
      ok: false,
      reason: 'emailTaken',
    })
  })

  it('recovers a password: the same answer for any email, and the old one still logs in', async () => {
    expect(await auth.recover('nobody@asinko.dev', 'https://site/auth/reset')).toEqual({ ok: true })
    expect(await auth.recover(MOCK_LIMITED_EMAIL, 'https://site/auth/reset')).toEqual({
      ok: false,
      reason: 'rateLimited',
    })
    expect(await auth.verifyRecovery('forged')).toEqual({ ok: false, reason: 'expired' })

    const verified = await auth.verifyRecovery(MOCK_RECOVERY_TOKEN.demo)
    if (!verified.ok) throw new Error('no session')
    expect(verified.tokens.userId).toBe(DEMO_USER.id)
    const token = verified.tokens.accessToken
    expect(await auth.updatePassword(token, MOCK_DEMO_PASSWORD)).toEqual({
      ok: false,
      reason: 'samePassword',
    })
    const fresh = `fresh-${crypto.randomUUID()}`
    expect(await auth.updatePassword(token, fresh)).toEqual({ ok: true })
    expect((await auth.signInWithPassword(MOCK_DEMO_EMAIL, fresh)).ok).toBe(true)
    expect((await auth.signInWithPassword(MOCK_DEMO_EMAIL, MOCK_DEMO_PASSWORD)).ok).toBe(true)
    expect(await auth.signOutOthers(token)).toEqual({ ok: true })
  })

  it('gives an account without a profile for the other recovery link (PR-10)', async () => {
    const verified = await auth.verifyRecovery(MOCK_RECOVERY_TOKEN.new)
    expect(verified.ok && verified.tokens.userId).not.toBe(DEMO_USER.id)
    expect(verified.ok && verified.tokens.email).toBe('forgetful@asinko.dev')
  })

  it('refreshes a session it gave, and refuses anything else', async () => {
    const result = await auth.signInWithPassword(MOCK_DEMO_EMAIL, MOCK_DEMO_PASSWORD)
    if (!result.ok) throw new Error('no session')
    const refreshed = await auth.refresh(result.tokens.refreshToken)
    expect(refreshed.ok && refreshed.tokens.userId).toBe(DEMO_USER.id)
    expect(await auth.refresh('forged')).toEqual({ ok: false, reason: 'expired' })
  })
})
