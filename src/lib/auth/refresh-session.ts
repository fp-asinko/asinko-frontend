import { needsRefresh, parseSession, serializeSession, type Session } from './session-cookie'
import type { SupabaseAuth } from './supabase-auth'

/** What the proxy does with the session cookie before rendering (specs/auth design.md § 4). */
export type RefreshOutcome =
  /** Nothing: no session, a fresh token, or Supabase down (the token stays as it is). */
  | { kind: 'keep' }
  /** A new access token: the cookie's new value, for the response and for this render. */
  | { kind: 'renewed'; value: string }
  /** Supabase refused the refresh token (revoked, the account deleted): no session any more. */
  | { kind: 'ended' }

/**
 * Renews the access token in its last minute (AU-13), so pages and actions always send a valid
 * Bearer. Pure but for the Supabase call.
 */
export async function refreshSession(
  raw: string | undefined,
  auth: Pick<SupabaseAuth, 'refresh'> | null,
  now = Date.now(),
): Promise<RefreshOutcome> {
  const session = parseSession(raw)
  // A broken cookie is no session: the page reads it as a guest, and it is cleared.
  if (!session) return raw ? { kind: 'ended' } : { kind: 'keep' }
  if (!auth || !needsRefresh(session, now)) return { kind: 'keep' }

  const result = await auth.refresh(session.refreshToken)
  if (!result.ok) return result.reason === 'expired' ? { kind: 'ended' } : { kind: 'keep' }
  // Another account's tokens would be a bug on Supabase's side: end rather than mix them.
  if (result.tokens.userId !== session.userId) return { kind: 'ended' }

  const renewed: Session = {
    ...session,
    accessToken: result.tokens.accessToken,
    refreshToken: result.tokens.refreshToken,
    expiresAt: now + result.tokens.expiresIn * 1000,
  }
  return { kind: 'renewed', value: serializeSession(renewed) }
}
