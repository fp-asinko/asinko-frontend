'use server'

import { getLocale } from 'next-intl/server'
import { revalidatePath } from 'next/cache'
import { readSession, writeSession } from '@/lib/auth/session'
import type { ActionResult } from '@/lib/result'
import { createProfile as createProfileFor } from '../lib/profile-api'
import { profileSchema } from '../schemas/auth.schema'
import { invalidForm, profileFailure } from './auth-results'

/**
 * Chooses the username of a signed-in account without a profile (specs/auth AU-11): after Google
 * for the first time, or when signing up could not create it (AU-09). The user comes from the
 * session's Bearer, never from the form.
 */
export async function createProfile(raw: unknown): Promise<ActionResult<{ username: string }>> {
  const parsed = profileSchema.safeParse(raw)
  if (!parsed.success) return invalidForm(parsed.error)
  const session = await readSession()
  if (!session) return { ok: false, error: 'auth.errors.noSession' }
  // Already chosen (a second tab): nothing to do.
  if (session.username) return { ok: true, data: { username: session.username } }

  const result = await createProfileFor(parsed.data.username, await getLocale())
  if (!result.ok) return profileFailure(result.reason)
  await writeSession({ ...session, username: result.username })
  revalidatePath('/', 'layout')
  return { ok: true, data: { username: result.username } }
}
