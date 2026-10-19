'use server'

import { z } from 'zod'
import type { ActionResult } from '@/lib/result'
import { getViewer } from '@/lib/session'
import type { SavedDraft } from '../composer.types'
import { deleteDraftAs, listDraftsOf, saveDraftAs } from '../lib/drafts-api'
import { saveDraftSchema } from '../schemas/save-draft.schema'

// The drafts of the account (specs/drafts-tags DT-01 to DT-05). Public endpoints: each one checks
// its input and the session itself, and takes the userId from it, never from the browser.

/** Backend codes with a message of their own; the rest say what the API client says. */
const ERRORS: Record<string, string> = {
  DRAFT_LIMIT: 'composer.drafts.errors.limit',
  NOT_FOUND: 'composer.drafts.errors.gone',
}

/** Saves what is written, or updates the draft it came from (DT-01, DT-03). Answers its id. */
export async function saveDraft(raw: unknown): Promise<ActionResult<{ id: string }>> {
  const parsed = saveDraftSchema.safeParse(raw)
  if (!parsed.success) return { ok: false, error: 'composer.drafts.errors.invalid' }
  const viewer = await getViewer()
  if (!viewer) return { ok: false, error: 'api.errors.UNAUTHENTICATED' }

  const result = await saveDraftAs(viewer.id, parsed.data.draftId, parsed.data.fields)
  if (result.ok) return result
  return { ok: false, error: ERRORS[result.code] ?? result.errorKey }
}

/** The viewer's drafts, newest first (DT-02). */
export async function listDrafts(): Promise<ActionResult<SavedDraft[]>> {
  const viewer = await getViewer()
  if (!viewer) return { ok: false, error: 'api.errors.UNAUTHENTICATED' }
  const result = await listDraftsOf(viewer.id, viewer.username)
  return result.ok ? result : { ok: false, error: result.errorKey }
}

/** Deletes one of the viewer's drafts (DT-04). */
export async function deleteDraft(raw: unknown): Promise<ActionResult<null>> {
  const parsed = z.uuid().safeParse(raw)
  if (!parsed.success) return { ok: false, error: 'composer.drafts.errors.invalid' }
  const viewer = await getViewer()
  if (!viewer) return { ok: false, error: 'api.errors.UNAUTHENTICATED' }
  const result = await deleteDraftAs(viewer.id, parsed.data)
  // Already gone is what was asked.
  if (result.ok || result.code === 'NOT_FOUND') return { ok: true, data: null }
  return { ok: false, error: result.errorKey }
}
