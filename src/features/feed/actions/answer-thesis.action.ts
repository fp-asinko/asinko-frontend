'use server'

import { getViewer } from '@/lib/session'
import type { ActionResult } from '@/lib/result'
import type { ThesisAgreement } from '../feed.types'
import { answerThesisAs } from '../lib/votes-api'
import { answerThesisSchema } from '../schemas/vote.schema'

/**
 * Answers "Will it happen?" on a thesis (specs/thesis-agree AG-04, AG-05): yes, no, or null to take
 * it back. A public endpoint: it validates the input and checks the session itself; the userId is
 * the session's.
 */
export async function answerThesis(raw: unknown): Promise<ActionResult<ThesisAgreement>> {
  const parsed = answerThesisSchema.safeParse(raw)
  if (!parsed.success) return { ok: false, error: 'api.errors.INVALID' }

  const viewer = await getViewer()
  if (!viewer) return { ok: false, error: 'api.errors.UNAUTHENTICATED' }

  const result = await answerThesisAs(viewer.id, parsed.data)
  return result.ok ? { ok: true, data: result.data } : { ok: false, error: result.errorKey }
}
