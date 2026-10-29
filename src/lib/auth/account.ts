import 'server-only'
import { apiRequest } from '@/lib/api'
import { profileSchema } from '@/lib/api/contract'
import { writeSession } from './session'
import { sessionFromTokens, type Session } from './session-cookie'
import type { AuthTokens } from './supabase-auth'

/**
 * The username of the account that just signed in, with its own token (the cookie does not have
 * it yet): null when it has no profile (a 404, AU-09, AU-11), or 'unavailable'. Profile.id is
 * auth.users.id in the backend.
 */
export async function findUsername(tokens: AuthTokens): Promise<string | null | 'unavailable'> {
  const result = await apiRequest({
    method: 'GET',
    path: '/api/v1/profiles/:identifier',
    params: { identifier: tokens.userId },
    schema: profileSchema.pick({ username: true }),
    accessToken: tokens.accessToken,
  })
  if (result.ok) return result.data.username
  return result.status === 404 ? null : 'unavailable'
}

/**
 * Starts the session for tokens Supabase just gave: finds the username and writes the cookie. Only
 * from a Server Action or a Route Handler.
 */
export async function startSession(
  tokens: AuthTokens,
): Promise<{ ok: true; session: Session } | { ok: false; reason: 'unavailable' }> {
  const username = await findUsername(tokens)
  if (username === 'unavailable') return { ok: false, reason: 'unavailable' }
  const session = sessionFromTokens(tokens, username)
  await writeSession(session)
  return { ok: true, session }
}
