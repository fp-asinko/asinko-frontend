import { z } from 'zod'
import { safeNext } from './next'
import type { AuthTokens, SupabaseAuth } from './supabase-auth'

/**
 * "Continue with Google" (specs/auth AU-10, design.md § 5), with PKCE: the verifier waits in an
 * HttpOnly cookie while the person is at Google, and only our server can exchange the code.
 */
export const OAUTH_COOKIE = 'asinko-oauth'
/** Ten minutes to come back from Google. */
export const OAUTH_MAX_AGE = 600
/** The callback path, outside the locale (the proxy leaves /auth/ alone). */
export const CALLBACK_PATH = '/auth/callback'

const pendingSchema = z.object({ verifier: z.string().min(43), next: z.string() })

function base64url(bytes: Uint8Array): string {
  return Buffer.from(bytes).toString('base64url')
}

/** Where to send the person, and the cookie that waits for them. */
export async function startGoogle(
  auth: Pick<SupabaseAuth, 'googleUrl'>,
  origin: string,
  next: unknown,
): Promise<{ url: string; cookie: string }> {
  const verifier = base64url(crypto.getRandomValues(new Uint8Array(32)))
  const challenge = base64url(
    new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier))),
  )
  return {
    url: auth.googleUrl(`${origin}${CALLBACK_PATH}`, challenge),
    cookie: JSON.stringify({ verifier, next: safeNext(next) }),
  }
}

/** The way back: the tokens and where the person was, or only where they were. */
export async function finishGoogle(
  auth: Pick<SupabaseAuth, 'exchangeCode'>,
  code: string | null,
  cookie: string | undefined,
): Promise<{ ok: true; tokens: AuthTokens; next: string } | { ok: false; next: string }> {
  let pending: z.infer<typeof pendingSchema> | null = null
  try {
    pending = pendingSchema.safeParse(JSON.parse(cookie ?? '')).data ?? null
  } catch {
    pending = null
  }
  const next = safeNext(pending?.next)
  if (!pending || !code) return { ok: false, next }
  const result = await auth.exchangeCode(code, pending.verifier)
  return result.ok ? { ok: true, tokens: result.tokens, next } : { ok: false, next }
}
