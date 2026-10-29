'use server'

import { getLocale } from 'next-intl/server'
import { revalidatePath } from 'next/cache'
import { writeSession } from '@/lib/auth/session'
import { sessionFromTokens } from '@/lib/auth/session-cookie'
import { supabaseAuth } from '@/lib/auth/supabase'
import type { ActionResult } from '@/lib/result'
import { createProfile, isUsernameTaken } from '../lib/profile-api'
import { signUpSchema } from '../schemas/auth.schema'
import { authFailure, invalidForm, profileFailure, UNAVAILABLE } from './auth-results'

/**
 * Creates the account in one step (specs/auth AU-05 to AU-09): the Supabase account, then its
 * profile with the backend. A taken username is caught before creating anything when possible. If
 * the account exists and its profile could not be created, it is still signed in, without a
 * username (`needsProfile`): the UI takes it to choose one, never stuck (AU-09).
 */
export async function signUp(raw: unknown): Promise<ActionResult<{ needsProfile: boolean }>> {
  const parsed = signUpSchema.safeParse(raw)
  if (!parsed.success) return invalidForm(parsed.error)
  if (!supabaseAuth) return UNAVAILABLE
  const { email, password, username } = parsed.data

  // No orphan accounts for the common case (asinko-app does the same check).
  if (await isUsernameTaken(username)) return profileFailure('usernameTaken')

  const created = await supabaseAuth.signUp(email, password)
  if (!created.ok) return authFailure(created.reason)
  // Signed in from here on, with or without a profile.
  await writeSession(sessionFromTokens(created.tokens, null))

  const profile = await createProfile(username, await getLocale(), created.tokens.accessToken)
  if (profile.ok) await writeSession(sessionFromTokens(created.tokens, profile.username))
  revalidatePath('/', 'layout')
  return { ok: true, data: { needsProfile: !profile.ok } }
}
