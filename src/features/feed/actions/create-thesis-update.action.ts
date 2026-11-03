'use server'

import { refresh } from 'next/cache'
import { getViewer } from '@/lib/session'
import type { ActionResult } from '@/lib/result'
import { createThesisUpdateAs } from '../lib/thesis-updates-api'
import { thesisUpdateSchema } from '../schemas/thesis-update.schema'

/**
 * Publishes an update of a thesis by its author (specs/thesis-arguments TA-10, TA-11): a public
 * endpoint that validates the input and checks the session itself; the userId is the session's.
 * On success the page comes again, with the update first.
 */
export async function createThesisUpdate(raw: unknown): Promise<ActionResult<{ id: string }>> {
  const parsed = thesisUpdateSchema.safeParse(raw)
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'api.errors.INVALID' }
  }

  const viewer = await getViewer()
  if (!viewer) return { ok: false, error: 'api.errors.UNAUTHENTICATED' }

  const result = await createThesisUpdateAs(viewer.id, parsed.data)
  if (!result.ok) {
    return {
      ok: false,
      error:
        result.code === 'THESIS_NOT_OPEN' ? 'feed.thesis.updates.errors.notOpen' : result.errorKey,
    }
  }
  refresh()
  return { ok: true, data: result.data }
}
