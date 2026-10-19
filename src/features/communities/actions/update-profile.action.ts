'use server'

import { z } from 'zod'
import type { ActionResult } from '@/lib/result'
import { getViewer } from '@/lib/session'
import { updateProfileAs } from '../lib/profile-api'
import { editProfileChangesSchema } from '../schemas/edit-profile.schema'

/** Backend codes that point at a field (specs/profile-presentation PP-09), with their message. */
const FIELD_ERRORS: Record<string, [field: string, key: string]> = {
  BIO_TOO_LONG: ['bio', 'communities.edit.errors.bioTooLong'],
  DISPLAY_NAME_TOO_LONG: ['displayName', 'communities.edit.errors.displayNameTooLong'],
  HEADLINE_TOO_LONG: ['headline', 'communities.edit.errors.headlineTooLong'],
  CITY_TOO_LONG: ['city', 'communities.edit.errors.cityTooLong'],
  INVALID_LINK: ['links', 'communities.edit.errors.link'],
  TOO_MANY_LINKS: ['links', 'communities.edit.errors.tooManyLinks'],
  INVALID_OPEN_TO: ['openTo', 'communities.edit.errors.openTo'],
}

/**
 * Saves what changed in your own profile (specs/profile-edit PE-03 to PE-06, specs/profile-presentation
 * PP-08, PP-09). A public endpoint: validates with the form's schema, checks the session itself and
 * takes the userId from it, never from the form. A refusal of the backend about a field says which.
 * The page shows the changes after the client refreshes it.
 */
export async function updateProfile(raw: unknown): Promise<ActionResult<null>> {
  const parsed = editProfileChangesSchema.safeParse(raw)
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
  const field = FIELD_ERRORS[result.code]
  return field
    ? { ok: false, error: field[1], fieldErrors: { [field[0]]: [field[1]] } }
    : { ok: false, error: result.errorKey }
}
