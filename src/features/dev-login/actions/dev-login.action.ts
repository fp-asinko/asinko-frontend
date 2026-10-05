'use server'

import { revalidatePath } from 'next/cache'
import { endDevSession, isDevLoginEnabled, startDevSession } from '@/lib/auth/dev-session'
import type { ActionResult } from '@/lib/result'

/**
 * Signs in with the development account (specs/dev-login DL-02). No input: the credentials come
 * from the server's environment, never from the browser. Errors are translation keys; Supabase's
 * and the backend's messages never reach the UI.
 */
export async function devLogin(): Promise<ActionResult<{ username: string }>> {
  const result = await startDevSession()
  if (!result.ok) return { ok: false, error: `devLogin.errors.${result.reason}` }
  // The whole app renders again as a signed-in user (DL-05).
  revalidatePath('/', 'layout')
  return { ok: true, data: { username: result.session.username } }
}

/** Ends the development session (DL-06). */
export async function devLogout(): Promise<ActionResult<null>> {
  if (!isDevLoginEnabled()) return { ok: false, error: 'devLogin.errors.disabled' }
  await endDevSession()
  revalidatePath('/', 'layout')
  return { ok: true, data: null }
}
