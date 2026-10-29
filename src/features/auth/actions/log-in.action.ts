'use server'

import { revalidatePath } from 'next/cache'
import { startSession } from '@/lib/auth/account'
import { supabaseAuth } from '@/lib/auth/supabase'
import type { ActionResult } from '@/lib/result'
import { logInSchema } from '../schemas/auth.schema'
import { authFailure, invalidForm, UNAVAILABLE } from './auth-results'

/**
 * Logs in with email and password (specs/auth AU-02, AU-04). A public endpoint: validates its
 * input, and Supabase's message never reaches the UI. `needsProfile`: the account has no username
 * yet, and the UI takes it to choose one (AU-09, AU-11).
 */
export async function logIn(
  raw: unknown,
): Promise<ActionResult<{ needsProfile: boolean; suggestion: string | null }>> {
  const parsed = logInSchema.safeParse(raw)
  if (!parsed.success) return invalidForm(parsed.error)
  if (!supabaseAuth) return UNAVAILABLE

  const signedIn = await supabaseAuth.signInWithPassword(parsed.data.email, parsed.data.password)
  if (!signedIn.ok) return authFailure(signedIn.reason)
  const started = await startSession(signedIn.tokens)
  if (!started.ok) return UNAVAILABLE

  // The whole page renders again with the session (AU-02).
  revalidatePath('/', 'layout')
  const { username, suggestion } = started.session
  return { ok: true, data: { needsProfile: username === null, suggestion: suggestion ?? null } }
}
