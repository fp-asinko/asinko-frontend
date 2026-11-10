'use server'

import * as Sentry from '@sentry/nextjs'
import { revalidatePath } from 'next/cache'
import { startSession } from '@/lib/auth/account'
import { clearRecovery, markRecoveryVerified, readRecovery } from '@/lib/auth/recovery-cookie'
import { readSession, type Session } from '@/lib/auth/session'
import { supabaseAuth } from '@/lib/auth/supabase'
import type { SupabaseAuth } from '@/lib/auth/supabase-auth'
import type { ActionResult } from '@/lib/result'
import { newPasswordSchema } from '../schemas/auth.schema'
import { authFailure, invalidForm, UNAVAILABLE } from './auth-results'

/** The link is spent, too old or missing: the page offers a new one (PR-08). */
const EXPIRED: ActionResult<never> = { ok: false, error: 'auth.reset.expired' }

/**
 * The session to change the password with (design.md § 5): the email's token, spent here, or the
 * session it already gave when a first password was refused. Only with the cookie's mark: any
 * other session cannot change its password this way without the current one.
 */
async function recoverySession(auth: SupabaseAuth): Promise<Session | ActionResult<never>> {
  const kept = await readRecovery()
  if (!kept) return EXPIRED
  if ('verified' in kept) return (await readSession()) ?? EXPIRED

  const verified = await auth.verifyRecovery(kept.token)
  if (!verified.ok) {
    if (verified.reason !== 'expired') return authFailure(verified.reason)
    await clearRecovery()
    return EXPIRED
  }
  // The token is spent: from here on, the session it gave is the way to try again.
  const started = await startSession(verified.tokens)
  if (!started.ok) return UNAVAILABLE
  await markRecoveryVerified()
  return started.session
}

/**
 * Saves the new password (specs/password-recovery PR-06 to PR-11, PR-18). A public endpoint: the
 * only proof is the email's link, kept in an HttpOnly cookie by /auth/reset. Done, closes the
 * account's other sessions and says whether it still needs a username (PR-10).
 */
export async function resetPassword(
  raw: unknown,
): Promise<ActionResult<{ needsProfile: boolean; suggestion: string | null }>> {
  const parsed = newPasswordSchema.safeParse(raw)
  if (!parsed.success) return invalidForm(parsed.error)
  const auth = supabaseAuth
  if (!auth) return UNAVAILABLE

  const session = await recoverySession(auth)
  if ('ok' in session) return session

  const updated = await auth.updatePassword(session.accessToken, parsed.data.password)
  if (!updated.ok) {
    if (updated.reason !== 'expired') return authFailure(updated.reason)
    await clearRecovery()
    return EXPIRED
  }

  const others = await auth.signOutOthers(session.accessToken)
  if (!others.ok) {
    // The password changed: that is what the person asked for. Without the email or the token.
    Sentry.captureMessage('Auth: other sessions not closed after a password reset', {
      level: 'warning',
      tags: { reason: others.reason },
    })
  }
  await clearRecovery()
  revalidatePath('/', 'layout')
  return {
    ok: true,
    data: { needsProfile: session.username === null, suggestion: session.suggestion ?? null },
  }
}
