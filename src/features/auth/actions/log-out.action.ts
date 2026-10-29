'use server'

import { revalidatePath } from 'next/cache'
import { clearSession, readSession } from '@/lib/auth/session'
import { supabaseAuth } from '@/lib/auth/supabase'
import type { ActionResult } from '@/lib/result'

/**
 * Logs out (specs/auth AU-14): revokes the refresh token in Supabase, without waiting on it to
 * fail, and clears the cookie. The same page renders again without a session.
 */
export async function logOut(): Promise<ActionResult<null>> {
  const session = await readSession()
  if (session && supabaseAuth) await supabaseAuth.signOut(session.accessToken)
  await clearSession()
  revalidatePath('/', 'layout')
  return { ok: true, data: null }
}
