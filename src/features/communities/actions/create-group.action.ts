'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import type { ActionResult } from '@/lib/result'
import { getViewer } from '@/lib/session'
import { createGroupAs, type CreatedGroup } from '../lib/create-group'
import { createGroupSchema } from '../schemas/create-group.schema'

/** Backend codes about the handle (specs/community-create design § 6), with their message. */
const SLUG_ERRORS: Record<string, string> = {
  SLUG_TAKEN: 'createGroup.errors.slugTaken',
  INVALID_SLUG: 'createGroup.errors.slugFormat',
}

/**
 * Creates a group (specs/community-create CG-09, CG-10). A public endpoint: validates with the
 * form's schema, checks the session itself and takes the userId from it. A taken or refused handle
 * comes back as the handle's error. Refreshes the layout so the left column lists the new group.
 */
export async function createGroup(raw: unknown): Promise<ActionResult<CreatedGroup>> {
  const viewer = await getViewer()
  if (!viewer) return { ok: false, error: 'api.errors.UNAUTHENTICATED' }

  const parsed = createGroupSchema.safeParse(raw)
  if (!parsed.success) {
    return {
      ok: false,
      error: 'createGroup.errors.invalid',
      fieldErrors: z.flattenError(parsed.error).fieldErrors,
    }
  }

  const result = await createGroupAs(viewer.id, parsed.data)
  if (result.ok) {
    revalidatePath('/', 'layout')
    return result
  }
  const slugError = SLUG_ERRORS[result.code]
  return slugError
    ? { ok: false, error: slugError, fieldErrors: { slug: [slugError] } }
    : { ok: false, error: result.errorKey }
}
