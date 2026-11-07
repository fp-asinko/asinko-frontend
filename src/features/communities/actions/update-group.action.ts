'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import type { ActionResult } from '@/lib/result'
import { getViewer } from '@/lib/session'
import { updateGroupAs } from '../lib/update-group'
import { editGroupChangesSchema, groupSlugSchema } from '../schemas/create-group.schema'

/** A field the backend refused (422 with `field`), with its message (specs/community-edit CE-06). */
const FIELD_ERRORS: Record<string, string> = {
  name: 'createGroup.errors.nameLength',
  description: 'createGroup.errors.descriptionMax',
  rules: 'createGroup.errors.rulesMax',
  mainUrl: 'createGroup.errors.url',
}

/**
 * Saves what changed in a group (specs/community-edit CE-03, CE-06). A public endpoint: checks the
 * session, the group's slug and the changes with the form's schema, and takes the userId from the
 * session. Whether the viewer moderates it is the backend's to say. Refreshes the layout: the name
 * may be in the left column.
 */
export async function updateGroup(slug: unknown, raw: unknown): Promise<ActionResult<null>> {
  const viewer = await getViewer()
  if (!viewer) return { ok: false, error: 'api.errors.UNAUTHENTICATED' }

  const group = groupSlugSchema.safeParse(slug)
  const parsed = editGroupChangesSchema.safeParse(raw)
  if (!group.success || !parsed.success) {
    return {
      ok: false,
      error: 'createGroup.errors.invalid',
      fieldErrors: parsed.success ? undefined : z.flattenError(parsed.error).fieldErrors,
    }
  }

  const result = await updateGroupAs(viewer.id, group.data, parsed.data)
  if (result.ok) {
    revalidatePath('/', 'layout')
    return result
  }
  if (result.code === 'NOT_MODERATOR') {
    return { ok: false, error: 'communities.editGroup.errors.notModerator' }
  }
  const field = result.kind === 'expected' ? result.field : undefined
  const key = field ? FIELD_ERRORS[field] : undefined
  return field && key
    ? { ok: false, error: key, fieldErrors: { [field]: [key] } }
    : { ok: false, error: result.errorKey }
}
