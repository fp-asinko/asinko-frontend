import { z } from 'zod'

/**
 * Supabase Auth over REST, from the server only (specs/auth design.md § 1, § 2): the browser never
 * talks to Supabase and never sees a token. Every answer is validated, and Supabase's messages
 * never reach the UI: they become a reason the UI translates.
 */

/** What a successful sign in, sign up, refresh or code exchange gives. */
export type AuthTokens = {
  accessToken: string
  refreshToken: string
  /** Seconds. */
  expiresIn: number
  userId: string
}

export type AuthFailure =
  | 'credentials'
  | 'emailTaken'
  | 'weakPassword'
  | 'invalidEmail'
  | 'rateLimited'
  | 'unavailable'
  /** A refresh token or a code Supabase refused: the session is over. */
  | 'expired'

export type AuthResult = { ok: true; tokens: AuthTokens } | { ok: false; reason: AuthFailure }

const tokensSchema = z.object({
  access_token: z.string().min(1),
  refresh_token: z.string().min(1),
  expires_in: z.number().int().positive(),
  user: z.object({ id: z.uuid() }),
})

/** Supabase's error body: only the code is read, never the message. */
const errorSchema = z.object({ error_code: z.string().optional(), code: z.unknown().optional() })

const EMAIL_TAKEN = new Set(['user_already_exists', 'email_exists'])

export type SupabaseAuthOptions = {
  url: string
  anonKey: string
  fetch?: typeof fetch
  timeoutMs: number
  /**
   * Where Google sends back to: in a test without Supabase (API_MOCKS=true), straight to our own
   * callback with a test code (specs/auth design.md § 9).
   */
  authorizeUrl?: (input: { redirectTo: string; codeChallenge: string }) => string
}

export function createSupabaseAuth({
  url,
  anonKey,
  fetch: fetchImpl = fetch,
  timeoutMs,
  authorizeUrl,
}: SupabaseAuthOptions) {
  async function call(
    path: string,
    body: unknown,
    accessToken?: string,
  ): Promise<{ status: number; json: unknown } | null> {
    try {
      const response = await fetchImpl(new URL(`/auth/v1/${path}`, url), {
        method: 'POST',
        headers: {
          apikey: anonKey,
          'Content-Type': 'application/json',
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        },
        body: JSON.stringify(body),
        cache: 'no-store',
        signal: AbortSignal.timeout(timeoutMs),
      })
      const json: unknown = await response.json().catch(() => null)
      return { status: response.status, json }
    } catch {
      return null
    }
  }

  async function tokens(path: string, body: unknown, refused: AuthFailure): Promise<AuthResult> {
    const answer = await call(path, body)
    if (!answer) return { ok: false, reason: 'unavailable' }
    const { status, json } = answer
    if (status >= 200 && status < 300) {
      const parsed = tokensSchema.safeParse(json)
      if (!parsed.success) return { ok: false, reason: 'unavailable' }
      const { access_token, refresh_token, expires_in, user } = parsed.data
      return {
        ok: true,
        tokens: {
          accessToken: access_token,
          refreshToken: refresh_token,
          expiresIn: expires_in,
          userId: user.id,
        },
      }
    }
    if (status === 429) return { ok: false, reason: 'rateLimited' }
    if (status >= 500) return { ok: false, reason: 'unavailable' }
    const code = errorSchema.safeParse(json).data?.error_code
    if (code && EMAIL_TAKEN.has(code)) return { ok: false, reason: 'emailTaken' }
    if (code === 'weak_password') return { ok: false, reason: 'weakPassword' }
    if (code === 'email_address_invalid') return { ok: false, reason: 'invalidEmail' }
    if (status === 400 || status === 401 || status === 403 || status === 422) {
      return { ok: false, reason: refused }
    }
    return { ok: false, reason: 'unavailable' }
  }

  return {
    signInWithPassword: (email: string, password: string) =>
      tokens('token?grant_type=password', { email, password }, 'credentials'),

    /** Email confirmation is off in the project: the account comes back signed in. */
    signUp: (email: string, password: string) =>
      tokens('signup', { email, password }, 'credentials'),

    refresh: (refreshToken: string) =>
      tokens('token?grant_type=refresh_token', { refresh_token: refreshToken }, 'expired'),

    /** Google's way back (PKCE): the code and the verifier kept while the person was away. */
    exchangeCode: (code: string, codeVerifier: string) =>
      tokens('token?grant_type=pkce', { auth_code: code, code_verifier: codeVerifier }, 'expired'),

    /** Revokes the refresh token. Best effort: logging out never waits on it to fail. */
    signOut: async (accessToken: string): Promise<void> => {
      await call('logout', {}, accessToken)
    },

    /** Where to send the person to sign in with Google. */
    googleUrl: (redirectTo: string, codeChallenge: string): string => {
      if (authorizeUrl) return authorizeUrl({ redirectTo, codeChallenge })
      const target = new URL('/auth/v1/authorize', url)
      target.searchParams.set('provider', 'google')
      target.searchParams.set('redirect_to', redirectTo)
      target.searchParams.set('code_challenge', codeChallenge)
      target.searchParams.set('code_challenge_method', 's256')
      return target.toString()
    },
  }
}

export type SupabaseAuth = ReturnType<typeof createSupabaseAuth>
