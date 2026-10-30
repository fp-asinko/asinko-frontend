import 'server-only'
import { cookies } from 'next/headers'
import { env } from '@/env'
import {
  parseSession,
  serializeSession,
  SESSION_COOKIE,
  sessionCookieOptions,
  type Session,
} from './session-cookie'

export type { Session } from './session-cookie'

/** Secure cookies when the site is served over https (security.md § 3). */
export function secureCookies(): boolean {
  return env.NEXT_PUBLIC_SITE_URL.startsWith('https:')
}

/**
 * The current session (specs/auth design.md § 3), or null. An expired access token still counts:
 * the proxy renews it before rendering, and if it could not, the API answers 401 and the action
 * opens the account modal.
 */
export async function readSession(): Promise<Session | null> {
  return parseSession((await cookies()).get(SESSION_COOKIE)?.value)
}

/**
 * With every route mocked and no session, the demo user is the viewer (lib/session.ts): logging out
 * leaves the browser as a guest instead, and logging in forgets that (specs/auth design.md § 9).
 */
const MOCK_GUEST_COOKIE = 'asinko-mock-guest'

/** Only from a Server Action or a Route Handler (cookies can be set there). */
export async function writeSession(session: Session): Promise<void> {
  const jar = await cookies()
  if (env.API_MOCKS === 'all') jar.delete(MOCK_GUEST_COOKIE)
  jar.set(SESSION_COOKIE, serializeSession(session), sessionCookieOptions(secureCookies()))
}

/**
 * The account's new photo in its session (design.md § 14), after saving it in the profile: its own
 * avatar shows it at once. Only from a Server Action.
 */
export async function setSessionAvatar(avatarUrl: string | null): Promise<void> {
  const session = await readSession()
  if (!session) return
  await writeSession({ ...session, avatarUrl })
}

/** Only from a Server Action or a Route Handler. */
export async function clearSession(): Promise<void> {
  const jar = await cookies()
  jar.delete(SESSION_COOKIE)
  if (env.API_MOCKS === 'all') jar.set(MOCK_GUEST_COOKIE, '1', { path: '/', sameSite: 'lax' })
}
