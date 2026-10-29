'use server'

import { revalidatePath } from 'next/cache'
import { writeSession } from '@/lib/auth/session'
import { sessionFromTokens } from '@/lib/auth/session-cookie'
import { supabaseAuth } from '@/lib/auth/supabase'
import type { ActionResult } from '@/lib/result'
import { signUpSchema } from '../schemas/auth.schema'
import { authFailure, invalidForm, UNAVAILABLE } from './auth-results'

/**
 * Creates the account with email and password (specs/auth AU-05, AU-07, design.md § 11): signed in
 * from here on, without a username yet. The welcome screen asks for it, with the photo and the
 * terms, so `needsProfile` is always true.
 */
export async function signUp(raw: unknown): Promise<ActionResult<{ needsProfile: true }>> {
  const parsed = signUpSchema.safeParse(raw)
  if (!parsed.success) return invalidForm(parsed.error)
  if (!supabaseAuth) return UNAVAILABLE

  const created = await supabaseAuth.signUp(parsed.data.email, parsed.data.password)
  if (!created.ok) return authFailure(created.reason)
  await writeSession(sessionFromTokens(created.tokens, null))
  revalidatePath('/', 'layout')
  return { ok: true, data: { needsProfile: true } }
}
