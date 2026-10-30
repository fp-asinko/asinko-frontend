import 'server-only'
import { apiRequest } from '@/lib/api'
import { profileSchema } from '@/lib/api/contract'
import { writeSession } from './session'
import { sessionFromTokens, type Session, type SessionProfile } from './session-cookie'
import type { AuthTokens } from './supabase-auth'

/**
 * The username and photo of the account that just signed in, with its own token (the cookie does
 * not have it yet): null when it has no profile (a 404, AU-09, AU-11), or 'unavailable'.
 * Profile.id is auth.users.id in the backend.
 */
export async function findProfile(
  tokens: AuthTokens,
): Promise<SessionProfile | null | 'unavailable'> {
  const result = await apiRequest({
    method: 'GET',
    path: '/api/v1/profiles/:identifier',
    params: { identifier: tokens.userId },
    schema: profileSchema.pick({ username: true, avatarUrl: true }),
    accessToken: tokens.accessToken,
  })
  if (result.ok) return { username: result.data.username, avatarUrl: result.data.avatarUrl }
  return result.status === 404 ? null : 'unavailable'
}

/**
 * Starts the session for tokens Supabase just gave: finds the profile and writes the cookie. Only
 * from a Server Action or a Route Handler.
 */
export async function startSession(
  tokens: AuthTokens,
): Promise<{ ok: true; session: Session } | { ok: false; reason: 'unavailable' }> {
  const profile = await findProfile(tokens)
  if (profile === 'unavailable') return { ok: false, reason: 'unavailable' }
  const session = sessionFromTokens(tokens, profile)
  await writeSession(session)
  return { ok: true, session }
}
