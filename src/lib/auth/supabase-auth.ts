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
  /** To suggest a username to a new account (specs/auth design.md § 11). */
  email: string | null
  /** The provider's photo (Google), to offer it to a new account (design.md § 15). */
  photoUrl?: string | null
  /** The provider's name (Google), the new account's display name (design.md § 16). */
  name?: string | null
}

export type AuthFailure =
  | 'credentials'
  | 'emailTaken'
  | 'weakPassword'
  | 'invalidEmail'
  | 'rateLimited'
  | 'unavailable'
  /** A refresh token, a code or a recovery link Supabase refused: the session is over. */
  | 'expired'
  /** The new password is the one the account already had (specs/password-recovery PR-09). */
  | 'samePassword'

export type AuthResult = { ok: true; tokens: AuthTokens } | { ok: false; reason: AuthFailure }

/** An answer without tokens: asking for the recovery email, or saving a new password. */
export type AuthDone = { ok: true } | { ok: false; reason: AuthFailure }

const tokensSchema = z.object({
  access_token: z.string().min(1),
  refresh_token: z.string().min(1),
  expires_in: z.number().int().positive(),
  user: z.object({
    id: z.uuid(),
    email: z.string().nullish(),
    // Google's photo: `avatar_url`, or `picture` as Google names it.
    user_metadata: z
      .object({
        avatar_url: z.unknown(),
        picture: z.unknown(),
        full_name: z.unknown(),
        name: z.unknown(),
      })
      .partial()
      .nullish()
      .catch(null),
  }),
})

/** Supabase's error body: only the code is read, never the message. */
const errorSchema = z.object({ error_code: z.string().optional(), code: z.unknown().optional() })

/** The provider's photo when it is text; googlePhotoUrl checks where it points before using it. */
function photoOf(metadata: { avatar_url?: unknown; picture?: unknown } | null | undefined) {
  const url = metadata?.avatar_url ?? metadata?.picture
  return typeof url === 'string' && url ? url : null
}

/** The provider's name, trimmed, when it is text (Google's `full_name`, or `name`). */
function nameOf(metadata: { full_name?: unknown; name?: unknown } | null | undefined) {
  const name = metadata?.full_name ?? metadata?.name
  return typeof name === 'string' && name.trim() ? name.trim() : null
}

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
    method: 'POST' | 'PUT' = 'POST',
  ): Promise<{ status: number; json: unknown } | null> {
    try {
      const response = await fetchImpl(new URL(`/auth/v1/${path}`, url), {
        method,
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

  /** Supabase's refusal as a reason; `refused` for a 4xx without a code we know. */
  function failure(status: number, json: unknown, refused: AuthFailure): AuthFailure {
    if (status === 429) return 'rateLimited'
    if (status >= 500) return 'unavailable'
    const code = errorSchema.safeParse(json).data?.error_code
    if (code && EMAIL_TAKEN.has(code)) return 'emailTaken'
    if (code === 'weak_password') return 'weakPassword'
    if (code === 'same_password') return 'samePassword'
    if (code === 'email_address_invalid') return 'invalidEmail'
    if (status === 400 || status === 401 || status === 403 || status === 422) return refused
    return 'unavailable'
  }

  async function done(
    path: string,
    body: unknown,
    refused: AuthFailure,
    accessToken?: string,
    method?: 'POST' | 'PUT',
  ): Promise<AuthDone> {
    const answer = await call(path, body, accessToken, method)
    if (!answer) return { ok: false, reason: 'unavailable' }
    if (answer.status >= 200 && answer.status < 300) return { ok: true }
    return { ok: false, reason: failure(answer.status, answer.json, refused) }
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
          email: user.email ?? null,
          photoUrl: photoOf(user.user_metadata),
          name: nameOf(user.user_metadata),
        },
      }
    }
    return { ok: false, reason: failure(status, json, refused) }
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

    /**
     * Sends the email to choose a new password (specs/password-recovery design.md § 2). Supabase
     * answers the same with or without an account (PR-12): only a 429 or an outage fail.
     */
    recover: async (email: string, redirectTo: string): Promise<AuthDone> => {
      const result = await done(
        `recover?redirect_to=${encodeURIComponent(redirectTo)}`,
        { email },
        'credentials',
      )
      // A refusal for the email itself would tell whether it has an account: never said.
      return result.ok || result.reason === 'rateLimited' || result.reason === 'unavailable'
        ? result
        : { ok: true }
    },

    /** The recovery link's token for a session (design.md § 1): spent once used. */
    verifyRecovery: (tokenHash: string) =>
      tokens('verify', { type: 'recovery', token_hash: tokenHash }, 'expired'),

    /** The new password of the account the access token belongs to (PR-09). */
    updatePassword: (accessToken: string, password: string) =>
      done('user', { password }, 'expired', accessToken, 'PUT'),

    /** Closes every other session of the account (PR-18). Best effort, as signOut. */
    signOutOthers: (accessToken: string) => done('logout?scope=others', {}, 'expired', accessToken),

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
