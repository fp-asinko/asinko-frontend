import { DEMO_USER } from './demo-user'

/**
 * Supabase Auth without Supabase (API_MOCKS=true, CI): answers the REST calls of
 * src/lib/auth/supabase-auth.ts in the same shape, so the e2e runs the whole login and sign up
 * (specs/auth design.md § 9). Accounts live in this process's memory.
 *
 * - demo@asinko.dev / demo-password: the demo user.
 * - taken@asinko.dev: already registered.
 * - Google comes back with `mock-google-demo` (the demo user) or `mock-google-new` (a new account
 *   without a profile, new.trader@gmail.com).
 * - The recovery email (specs/password-recovery design.md § 9) is never sent: its links are
 *   `mock-recovery-demo` (the demo user) and `mock-recovery-new` (an account without a profile);
 *   any other token is expired. limited@asinko.dev asked too often (429).
 */
export const MOCK_SUPABASE_URL = 'https://supabase.mock'
export const MOCK_DEMO_EMAIL = 'demo@asinko.dev'
export const MOCK_DEMO_PASSWORD = 'demo-password'
export const MOCK_TAKEN_EMAIL = 'taken@asinko.dev'
/** Codes Google "returns" with the mocks. */
export const MOCK_GOOGLE_CODE = { demo: 'mock-google-demo', new: 'mock-google-new' } as const
/** Tokens of the recovery link with the mocks (specs/password-recovery PR-15). */
export const MOCK_RECOVERY_TOKEN = { demo: 'mock-recovery-demo', new: 'mock-recovery-new' } as const
/** The account behind MOCK_RECOVERY_TOKEN.new: it has no profile (PR-10). */
export const MOCK_RECOVERY_NEW_EMAIL = 'forgetful@asinko.dev'
/** An email that asked for the recovery email too often. */
export const MOCK_LIMITED_EMAIL = 'limited@asinko.dev'
/** The email of a new Google account: the welcome screen suggests `new_trader`. */
export const MOCK_GOOGLE_NEW_EMAIL = 'new.trader@gmail.com'
/** The new Google account's photo (specs/auth design.md § 15): mockGooglePhotoFetch answers it. */
export const MOCK_GOOGLE_NAME = 'New Trader'
export const MOCK_GOOGLE_PHOTO = 'https://lh3.googleusercontent.com/a/mock-new-trader=s96-c'

type Account = {
  id: string
  password: string
  /**
   * Passwords it had before a recovery: they still log in, so an e2e that changes the demo user's
   * password does not lock out the tests running beside it (specs/password-recovery § 9).
   */
  previous?: string[]
}

const accounts = new Map<string, Account>([
  [MOCK_DEMO_EMAIL, { id: DEMO_USER.id, password: MOCK_DEMO_PASSWORD }],
  [MOCK_TAKEN_EMAIL, { id: '00000000-0000-4000-8000-0000000000ee', password: 'taken-password' }],
])

const ACCESS_PREFIX = 'mock-access.'
const REFRESH_PREFIX = 'mock-refresh.'

/** The user a mocked access token belongs to, or null (the mocked POST /users reads it). */
export function mockTokenUser(accessToken: string | null | undefined): string | null {
  if (!accessToken?.startsWith(ACCESS_PREFIX)) return null
  return accessToken.slice(ACCESS_PREFIX.length).split('.')[0] ?? null
}

/**
 * Who writes, for the routes that compare the userId with the session: the simulated account of
 * the Bearer, else the demo user (no session with every route mocked). An account created in the
 * e2e can then upload its photo and edit its profile (specs/auth design.md § 14).
 */
export function mockCaller(accessToken: string | null | undefined): string {
  return mockTokenUser(accessToken) ?? DEMO_USER.id
}

function session(
  userId: string,
  email: string | null = emailOf(userId),
  avatarUrl: string | null = null,
) {
  const nonce = crypto.randomUUID()
  return {
    access_token: `${ACCESS_PREFIX}${userId}.${nonce}`,
    refresh_token: `${REFRESH_PREFIX}${userId}.${nonce}`,
    expires_in: 3600,
    token_type: 'bearer',
    // A Google account brings its photo and its name (design.md § 15, § 16).
    user: {
      id: userId,
      email,
      user_metadata: avatarUrl ? { avatar_url: avatarUrl, full_name: MOCK_GOOGLE_NAME } : {},
    },
  }
}

function accountOf(userId: string): Account | null {
  for (const account of accounts.values()) if (account.id === userId) return account
  return null
}

function emailOf(userId: string): string | null {
  for (const [email, account] of accounts) if (account.id === userId) return email
  return null
}

function json(status: number, body: unknown): Response {
  return status === 204
    ? new Response(null, { status })
    : new Response(JSON.stringify(body), {
        status,
        headers: { 'Content-Type': 'application/json' },
      })
}

const refused = (status: number, code: string) => json(status, { error_code: code, msg: code })

/** A `fetch` for MOCK_SUPABASE_URL: what Supabase Auth answers to each call. */
export async function mockSupabaseFetch(
  input: string | URL | Request,
  init?: RequestInit,
): Promise<Response> {
  const url = new URL(input instanceof Request ? input.url : input)
  const body = JSON.parse(typeof init?.body === 'string' ? init.body : '{}') as Record<
    string,
    string
  >
  const route = `${url.pathname}${url.search}`

  if (route === '/auth/v1/token?grant_type=password') {
    const account = accounts.get(body.email?.toLowerCase() ?? '')
    const known = account && [account.password, ...(account.previous ?? [])]
    return account && known?.includes(body.password ?? '')
      ? json(200, session(account.id))
      : refused(400, 'invalid_credentials')
  }
  if (route === '/auth/v1/signup') {
    const email = body.email?.toLowerCase() ?? ''
    if (accounts.has(email)) return refused(422, 'user_already_exists')
    if ((body.password ?? '').length < 6) return refused(422, 'weak_password')
    const account = { id: crypto.randomUUID(), password: body.password ?? '' }
    accounts.set(email, account)
    return json(200, session(account.id))
  }
  if (route === '/auth/v1/token?grant_type=refresh_token') {
    const token = body.refresh_token ?? ''
    if (!token.startsWith(REFRESH_PREFIX)) return refused(400, 'refresh_token_not_found')
    return json(200, session(token.slice(REFRESH_PREFIX.length).split('.')[0] ?? ''))
  }
  if (route === '/auth/v1/token?grant_type=pkce') {
    if (body.auth_code === MOCK_GOOGLE_CODE.demo) return json(200, session(DEMO_USER.id))
    if (body.auth_code === MOCK_GOOGLE_CODE.new) {
      return json(200, session(crypto.randomUUID(), MOCK_GOOGLE_NEW_EMAIL, MOCK_GOOGLE_PHOTO))
    }
    return refused(400, 'flow_state_not_found')
  }
  if (route.startsWith('/auth/v1/recover?')) {
    // Supabase does not say whether the account exists: the same answer for any email.
    return body.email?.toLowerCase() === MOCK_LIMITED_EMAIL
      ? refused(429, 'over_email_send_rate_limit')
      : json(200, {})
  }
  if (route === '/auth/v1/verify' && body.type === 'recovery') {
    if (body.token_hash === MOCK_RECOVERY_TOKEN.demo) return json(200, session(DEMO_USER.id))
    if (body.token_hash === MOCK_RECOVERY_TOKEN.new) {
      const account = accounts.get(MOCK_RECOVERY_NEW_EMAIL) ?? {
        id: crypto.randomUUID(),
        password: 'forgotten-password',
      }
      accounts.set(MOCK_RECOVERY_NEW_EMAIL, account)
      return json(200, session(account.id))
    }
    return refused(403, 'otp_expired')
  }
  if (route === '/auth/v1/user' && init?.method === 'PUT') {
    const bearer = new Headers(init.headers).get('Authorization')?.replace(/^Bearer /, '')
    const account = accountOf(mockTokenUser(bearer) ?? '')
    if (!account) return refused(401, 'bad_jwt')
    const password = body.password ?? ''
    if (password.length < 6) return refused(422, 'weak_password')
    if (password === account.password) return refused(422, 'same_password')
    account.previous = [...(account.previous ?? []), account.password]
    account.password = password
    return json(200, { id: account.id })
  }
  if (route === '/auth/v1/logout' || route === '/auth/v1/logout?scope=others') {
    return json(204, null)
  }
  return json(404, { error_code: 'not_found' })
}

/**
 * Google without Google: straight back to our callback, as the demo user. A test that wants a new
 * account swaps the code for MOCK_GOOGLE_CODE.new on the way back.
 */
export function mockGoogleUrl({ redirectTo }: { redirectTo: string; codeChallenge: string }) {
  const target = new URL(redirectTo)
  target.searchParams.set('code', MOCK_GOOGLE_CODE.demo)
  return target.toString()
}

/** A 1x1 PNG, the size it was: Google's photo without Google. */
const MOCK_PHOTO_PNG =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=='

/** A `fetch` for the Google photo of the simulated account (design.md § 15). */
export async function mockGooglePhotoFetch(input: string | URL | Request): Promise<Response> {
  const url = input instanceof Request ? input.url : input.toString()
  return url.startsWith(MOCK_GOOGLE_PHOTO.replace(/=s96-c$/, ''))
    ? new Response(Buffer.from(MOCK_PHOTO_PNG, 'base64'), {
        headers: { 'Content-Type': 'image/png' },
      })
    : new Response(null, { status: 404 })
}
