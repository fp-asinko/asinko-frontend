import 'server-only'
import { env } from '@/env'
import { startSession } from './account'
import { clearSession } from './session'
import type { Session } from './session-cookie'
import { createSupabaseAuth } from './supabase-auth'

/**
 * The development login (specs/dev-login): a test account of asinko-app signed in with one tap,
 * into the same session as the real login (specs/auth AU-17). Never in production: src/env.ts
 * refuses DEV_LOGIN_* there, and every entry point checks isDevLoginEnabled() again. Off with
 * every route mocked: there, the simulated Supabase has its own demo account.
 */
export function isDevLoginEnabled(): boolean {
  return (
    env.APP_ENV !== 'production' &&
    env.API_MOCKS !== 'all' &&
    Boolean(
      env.SUPABASE_URL && env.SUPABASE_ANON_KEY && env.DEV_LOGIN_EMAIL && env.DEV_LOGIN_PASSWORD,
    )
  )
}

export type DevLoginFailure = 'disabled' | 'credentials' | 'unavailable'

/**
 * Signs in with the account from the environment and stores the session cookie. Only from a
 * Server Action or a Route Handler. The credentials never leave the server, and Supabase's or the
 * backend's messages never reach the UI.
 */
export async function startDevSession(
  fetchImpl: typeof fetch = fetch,
): Promise<{ ok: true; session: Session } | { ok: false; reason: DevLoginFailure }> {
  if (!isDevLoginEnabled()) return { ok: false, reason: 'disabled' }
  const auth = createSupabaseAuth({
    url: env.SUPABASE_URL!,
    anonKey: env.SUPABASE_ANON_KEY!,
    fetch: fetchImpl,
    timeoutMs: env.API_TIMEOUT_MS,
  })
  const signedIn = await auth.signInWithPassword(env.DEV_LOGIN_EMAIL!, env.DEV_LOGIN_PASSWORD!)
  if (!signedIn.ok) {
    return { ok: false, reason: signedIn.reason === 'credentials' ? 'credentials' : 'unavailable' }
  }
  return startSession(signedIn.tokens)
}

/** Ends the session. Only from a Server Action or a Route Handler. */
export async function endDevSession(): Promise<void> {
  await clearSession()
}
