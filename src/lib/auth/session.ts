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

/** Only from a Server Action or a Route Handler (cookies can be set there). */
export async function writeSession(session: Session): Promise<void> {
  ;(await cookies()).set(
    SESSION_COOKIE,
    serializeSession(session),
    sessionCookieOptions(secureCookies()),
  )
}

/** Only from a Server Action or a Route Handler. */
export async function clearSession(): Promise<void> {
  ;(await cookies()).delete(SESSION_COOKIE)
}
