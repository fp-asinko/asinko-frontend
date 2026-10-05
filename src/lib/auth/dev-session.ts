import 'server-only'
import { cookies } from 'next/headers'
import { z } from 'zod'
import { env } from '@/env'

/**
 * The development session (specs/dev-login): a test account of asinko-app signed in with
 * Supabase's password grant, its access token kept in an HttpOnly cookie and sent to the backend
 * as Bearer. Never in production: src/env.ts refuses DEV_LOGIN_* there, and every entry point
 * checks isDevLoginEnabled() again.
 */
export const SESSION_COOKIE = 'asinko-session'

const sessionSchema = z.object({
  accessToken: z.string().min(1),
  userId: z.uuid(),
  username: z.string().min(1),
  /** Epoch ms. */
  expiresAt: z.number().int(),
})
export type DevSession = z.infer<typeof sessionSchema>

/** Supabase's answer to the password grant: only what is used. */
const tokenSchema = z.object({
  access_token: z.string().min(1),
  expires_in: z.number().int().positive(),
  user: z.object({ id: z.uuid() }),
})

const profileSchema = z.object({ username: z.string().min(1) })

export function isDevLoginEnabled(): boolean {
  return (
    env.APP_ENV !== 'production' &&
    Boolean(
      env.SUPABASE_URL && env.SUPABASE_ANON_KEY && env.DEV_LOGIN_EMAIL && env.DEV_LOGIN_PASSWORD,
    )
  )
}

/** The current session, or null when there is none, it is malformed or it expired. */
export async function readDevSession(now = Date.now()): Promise<DevSession | null> {
  if (env.APP_ENV === 'production') return null
  const raw = (await cookies()).get(SESSION_COOKIE)?.value
  if (!raw) return null
  let json: unknown
  try {
    json = JSON.parse(raw)
  } catch {
    return null
  }
  const parsed = sessionSchema.safeParse(json)
  return parsed.success && parsed.data.expiresAt > now ? parsed.data : null
}

export type DevLoginFailure = 'disabled' | 'credentials' | 'unavailable'

/**
 * Signs in with the account from the environment and stores the session cookie. Only from a
 * Server Action or a Route Handler (cookies can be set there). The credentials never leave the
 * server, and Supabase's or the backend's messages never reach the UI.
 */
export async function startDevSession(
  fetchImpl: typeof fetch = fetch,
): Promise<{ ok: true; session: DevSession } | { ok: false; reason: DevLoginFailure }> {
  if (!isDevLoginEnabled()) return { ok: false, reason: 'disabled' }

  let token: z.infer<typeof tokenSchema>
  try {
    const response = await fetchImpl(`${env.SUPABASE_URL}/auth/v1/token?grant_type=password`, {
      method: 'POST',
      headers: { apikey: env.SUPABASE_ANON_KEY!, 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: env.DEV_LOGIN_EMAIL, password: env.DEV_LOGIN_PASSWORD }),
      cache: 'no-store',
      signal: AbortSignal.timeout(env.API_TIMEOUT_MS),
    })
    if (response.status === 400 || response.status === 401)
      return { ok: false, reason: 'credentials' }
    const parsed = tokenSchema.safeParse(await response.json())
    if (!response.ok || !parsed.success) return { ok: false, reason: 'unavailable' }
    token = parsed.data
  } catch {
    return { ok: false, reason: 'unavailable' }
  }

  // Profile.id is auth.users.id in the backend: the username comes from the profile.
  let username: string
  try {
    const response = await fetchImpl(
      new URL(`/api/v1/profiles/${encodeURIComponent(token.user.id)}`, env.API_BASE_URL),
      {
        headers: { Accept: 'application/json', Authorization: `Bearer ${token.access_token}` },
        cache: 'no-store',
        signal: AbortSignal.timeout(env.API_TIMEOUT_MS),
      },
    )
    const parsed = profileSchema.safeParse(await response.json())
    if (!response.ok || !parsed.success) return { ok: false, reason: 'unavailable' }
    username = parsed.data.username
  } catch {
    return { ok: false, reason: 'unavailable' }
  }

  const session: DevSession = {
    accessToken: token.access_token,
    userId: token.user.id,
    username,
    expiresAt: Date.now() + token.expires_in * 1000,
  }
  ;(await cookies()).set(SESSION_COOKIE, JSON.stringify(session), {
    httpOnly: true,
    sameSite: 'lax',
    secure: env.NEXT_PUBLIC_SITE_URL.startsWith('https:'),
    path: '/',
    maxAge: token.expires_in,
  })
  return { ok: true, session }
}

/** Ends the session. Only from a Server Action or a Route Handler. */
export async function endDevSession(): Promise<void> {
  ;(await cookies()).delete(SESSION_COOKIE)
}
