import { z } from 'zod'
import { suggestUsername } from './suggest-username'
import type { AuthTokens } from './supabase-auth'

/**
 * The session cookie (specs/auth design.md § 3), pure: the proxy (before rendering) and the server
 * code (lib/auth/session.ts) read and write it the same way. HttpOnly: the browser's JavaScript
 * never sees a token (AU-16).
 */
export const SESSION_COOKIE = 'asinko-session'

/** Thirty days, renewed with every refresh (AU-13). */
export const SESSION_MAX_AGE = 60 * 60 * 24 * 30

/** How long before the access token expires the proxy renews it. */
export const REFRESH_MARGIN_MS = 60_000

const sessionSchema = z.object({
  accessToken: z.string().min(1),
  refreshToken: z.string().min(1),
  userId: z.uuid(),
  /** null: an account without a profile yet (AU-09, AU-11). */
  username: z.string().min(1).nullable(),
  /** When the access token expires, in epoch ms. */
  expiresAt: z.number().int(),
  /** Without a username: the one the welcome screen suggests (design.md § 11). */
  suggestion: z.string().nullish(),
  /** The account's photo, for its own avatar in the bar and the composer (design.md § 14). */
  avatarUrl: z.string().nullish(),
})

export type Session = z.infer<typeof sessionSchema>

/** The session in a cookie's value, or null when there is none or it is malformed. */
export function parseSession(raw: string | undefined): Session | null {
  if (!raw) return null
  try {
    const parsed = sessionSchema.safeParse(JSON.parse(raw))
    return parsed.success ? parsed.data : null
  } catch {
    return null
  }
}

export function serializeSession(session: Session): string {
  return JSON.stringify(session)
}

/** What the session keeps of the account's profile: null while it has none (AU-09, AU-11). */
export type SessionProfile = { username: string; avatarUrl: string | null }

export function sessionFromTokens(
  tokens: AuthTokens,
  profile: SessionProfile | null,
  now = Date.now(),
): Session {
  return {
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken,
    userId: tokens.userId,
    username: profile?.username ?? null,
    expiresAt: now + tokens.expiresIn * 1000,
    ...(profile ? {} : { suggestion: suggestUsername(tokens.email) }),
    ...(profile?.avatarUrl ? { avatarUrl: profile.avatarUrl } : {}),
  }
}

/** True when the access token expires within the margin: time to renew it. */
export function needsRefresh(session: Session, now = Date.now()): boolean {
  return session.expiresAt - now < REFRESH_MARGIN_MS
}

export function sessionCookieOptions(secure: boolean) {
  return {
    httpOnly: true,
    sameSite: 'lax' as const,
    secure,
    path: '/',
    maxAge: SESSION_MAX_AGE,
  }
}
