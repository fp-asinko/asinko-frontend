'use server'

import { recoveryRedirect } from '@/lib/auth/recovery'
import { requestOrigin } from '@/lib/auth/recovery-cookie'
import { supabaseAuth } from '@/lib/auth/supabase'
import type { ActionResult } from '@/lib/result'
import { recoverSchema } from '../schemas/auth.schema'
import { authFailure, invalidForm, UNAVAILABLE } from './auth-results'

/**
 * Asks for the email to choose a new password (specs/password-recovery PR-03, PR-04, PR-12). A
 * public endpoint: validates its input, and answers the same whether the email has an account or
 * not. Its link comes back to /auth/reset, then to `next` (design.md § 4).
 */
export async function requestRecovery(raw: unknown): Promise<ActionResult<null>> {
  const parsed = recoverSchema.safeParse(raw)
  if (!parsed.success) return invalidForm(parsed.error)
  if (!supabaseAuth) return UNAVAILABLE

  const redirectTo = recoveryRedirect(await requestOrigin(), parsed.data.next ?? '/')
  const sent = await supabaseAuth.recover(parsed.data.email, redirectTo)
  return sent.ok ? { ok: true, data: null } : authFailure(sent.reason)
}
