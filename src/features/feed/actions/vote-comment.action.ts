'use server'

import { getViewer } from '@/lib/session'
import type { ActionResult } from '@/lib/result'
import { voteCommentAs } from '../lib/votes-api'
import { voteCommentSchema } from '../schemas/vote.schema'

/**
 * Upvote, downvote or remove the vote of a comment (PC-16), as votePost. Answers the new score, or
 * null after removing (204, the client keeps its own count).
 */
export async function voteComment(
  raw: unknown,
): Promise<ActionResult<{ score: number | null; viewerVote: 1 | -1 | null }>> {
  const parsed = voteCommentSchema.safeParse(raw)
  if (!parsed.success) return { ok: false, error: 'api.errors.INVALID' }

  const viewer = await getViewer()
  if (!viewer) return { ok: false, error: 'api.errors.UNAUTHENTICATED' }

  const result = await voteCommentAs(viewer.id, parsed.data)
  return result.ok ? { ok: true, data: result.data } : { ok: false, error: result.errorKey }
}
