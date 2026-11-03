'use server'

import { getViewer } from '@/lib/session'
import type { ActionResult } from '@/lib/result'
import { cancelThesisAs } from '../lib/thesis-api'
import { cancelThesisSchema } from '../schemas/cancel-thesis.schema'

/**
 * Cancels a thesis of its author (specs/thesis-detail TD-14, TD-15): a public endpoint that
 * validates the input and checks the session itself; the userId is the session's. Answers only
 * that it went through: the page asks for the thesis again, with its new state.
 */
export async function cancelThesis(raw: unknown): Promise<ActionResult<null>> {
  const parsed = cancelThesisSchema.safeParse(raw)
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'api.errors.INVALID' }
  }

  const viewer = await getViewer()
  if (!viewer) return { ok: false, error: 'api.errors.UNAUTHENTICATED' }

  const result = await cancelThesisAs(viewer.id, parsed.data)
  if (result.ok) return { ok: true, data: null }
  return {
    ok: false,
    error:
      result.code === 'THESIS_NOT_CANCELLABLE'
        ? 'feed.thesis.cancel.errors.notCancellable'
        : result.errorKey,
  }
}
