import 'server-only'
import { cookies, headers } from 'next/headers'
import { env } from '@/env'
import { keptRecovery, RECOVERY_COOKIE, RECOVERY_MAX_AGE, RECOVERY_VERIFIED } from './recovery'
import { secureCookies } from './session'

// The recovery link's cookie from the server (specs/password-recovery design.md § 3, § 5). Writing
// and deleting only from a Server Action or a Route Handler.

/** The token the email's link left, or the mark that it was already spent here. */
export async function readRecovery() {
  return keptRecovery((await cookies()).get(RECOVERY_COOKIE)?.value)
}

/** The token is spent: the session it gave may try another password (design.md § 5). */
export async function markRecoveryVerified(): Promise<void> {
  ;(await cookies()).set(RECOVERY_COOKIE, RECOVERY_VERIFIED, {
    httpOnly: true,
    sameSite: 'lax',
    secure: secureCookies(),
    path: '/',
    maxAge: RECOVERY_MAX_AGE,
  })
}

export async function clearRecovery(): Promise<void> {
  ;(await cookies()).delete({ name: RECOVERY_COOKIE, path: '/' })
}

/**
 * The origin the person is on, for the email's link (design.md § 4): previews have their own. A
 * Server Action carries Origin, which Next already checks against Host. Supabase only accepts a
 * redirect in its Redirect URLs, so a forged one cannot send the link elsewhere.
 */
export async function requestOrigin(): Promise<string> {
  const origin = (await headers()).get('origin')
  try {
    if (origin && /^https?:$/.test(new URL(origin).protocol)) return new URL(origin).origin
  } catch {
    // Not a URL: the site's own.
  }
  return new URL(env.NEXT_PUBLIC_SITE_URL).origin
}
