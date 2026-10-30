'use server'

import { getLocale } from 'next-intl/server'
import { readSession, writeSession } from '@/lib/auth/session'
import type { ActionResult } from '@/lib/result'
import { createProfile as createProfileFor, saveDisplayName } from '../lib/profile-api'
import { profileSchema } from '../schemas/auth.schema'
import { invalidForm, profileFailure } from './auth-results'

/**
 * Chooses the username of a signed-in account without a profile (specs/auth AU-11): after Google
 * for the first time, or when signing up could not create it (AU-09). The user comes from the
 * session's Bearer, never from the form. It does not render the page again: the photo may still
 * follow (setAvatar), and /welcome, rendered again, would redirect before it. The form's caller
 * refreshes when everything is done (design.md § 14). The display name goes right after, on its
 * own (design.md § 16): if only that failed, Continue tries it again, over the profile already made.
 */
export async function createProfile(raw: unknown): Promise<ActionResult<{ username: string }>> {
  const parsed = profileSchema.safeParse(raw)
  if (!parsed.success) return invalidForm(parsed.error)
  const session = await readSession()
  if (!session) return { ok: false, error: 'auth.errors.noSession' }
  // Already made (a second tab, or the name failed before): only the name is left.
  let username = session.username
  if (!username) {
    const result = await createProfileFor(parsed.data.username, await getLocale())
    if (!result.ok) return profileFailure(result.reason)
    username = result.username
    await writeSession({
      ...session,
      username,
      suggestion: null,
      nameSuggestion: null,
      photoSuggestion: null,
    })
  }

  const { displayName } = parsed.data
  if (displayName) {
    const saved = await saveDisplayName(session.userId, displayName)
    if (saved === 'tooLong') return profileFailure('displayNameTooLong')
    if (saved === 'unavailable') return { ok: false, error: 'auth.errors.nameSave' }
  }
  return { ok: true, data: { username } }
}
