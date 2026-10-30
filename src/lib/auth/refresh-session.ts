import {
  needsRefresh,
  parseSession,
  serializeSession,
  type Session,
  type SessionProfile,
} from './session-cookie'
import type { AuthTokens, SupabaseAuth } from './supabase-auth'

/** The account's profile with the new token: `findProfile` (lib/auth/account.ts). */
export type ProfileLookup = (tokens: AuthTokens) => Promise<SessionProfile | null | 'unavailable'>

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
 * Bearer. With it, the username and photo of the session are read again (design.md § 14): a photo
 * changed in another device, or a session from before the photo was kept, shows within the hour.
 * Pure but for the Supabase and API calls.
 */
export async function refreshSession(
  raw: string | undefined,
  auth: Pick<SupabaseAuth, 'refresh'> | null,
  now = Date.now(),
  profileOf?: ProfileLookup,
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
  // Only an account with a profile: without one, the welcome screen still owns it (AU-11). A
  // missing or unavailable profile leaves what the cookie had.
  const profile = session.username && profileOf ? await profileOf(result.tokens) : null
  if (profile && profile !== 'unavailable') {
    renewed.username = profile.username
    renewed.avatarUrl = profile.avatarUrl
  }
  return { kind: 'renewed', value: serializeSession(renewed) }
}
