'use server'

import { getViewer } from '@/lib/session'
import type { ActionResult } from '@/lib/result'
import { voteThesisAs } from '../lib/votes-api'
import { voteThesisSchema } from '../schemas/vote.schema'

/**
 * Upvote, downvote or remove the vote of a thesis (specs/thesis-detail TD-16), as votePost: a
 * public endpoint that validates the input and checks the session itself.
 */
export async function voteThesis(
  raw: unknown,
): Promise<ActionResult<{ score: number | null; viewerVote: 1 | -1 | null }>> {
  const parsed = voteThesisSchema.safeParse(raw)
  if (!parsed.success) return { ok: false, error: 'api.errors.INVALID' }

  const viewer = await getViewer()
  if (!viewer) return { ok: false, error: 'api.errors.UNAUTHENTICATED' }

  const result = await voteThesisAs(viewer.id, parsed.data)
  return result.ok ? { ok: true, data: result.data } : { ok: false, error: result.errorKey }
}
