'use server'

import { z } from 'zod'
import type { ActionResult } from '@/lib/result'
import { getViewer } from '@/lib/session'
import { updateProfileAs } from '../lib/profile-api'
import { editProfileSchema } from '../schemas/edit-profile.schema'

/** Backend codes with a message of their own; the rest say what the API client says. */
const ERRORS: Record<string, string> = {
  BIO_TOO_LONG: 'communities.edit.errors.bioTooLong',
}

/**
 * Saves your own profile's bio (specs/profile-edit PE-03 to PE-06). A public endpoint: validates
 * with the form's schema, checks the session itself and takes the userId from it, never from the
 * form. The page shows the new bio after the client refreshes it.
 */
export async function updateProfile(raw: unknown): Promise<ActionResult<{ bio: string | null }>> {
  const parsed = editProfileSchema.safeParse(raw)
  if (!parsed.success) {
    return {
      ok: false,
      error: 'communities.edit.errors.invalid',
      fieldErrors: z.flattenError(parsed.error).fieldErrors,
    }
  }
  const viewer = await getViewer()
  if (!viewer) return { ok: false, error: 'api.errors.UNAUTHENTICATED' }

  const result = await updateProfileAs(viewer.id, parsed.data)
  if (result.ok) return result
  return { ok: false, error: ERRORS[result.code] ?? result.errorKey }
}
