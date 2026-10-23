'use server'

import type { ActionResult } from '@/lib/result'
import { getViewer } from '@/lib/session'
import { createCommentAs } from '../lib/comments-api'
import { cardCommentSchema } from '../schemas/comment.schema'

/**
 * Comments a post or a poll from its card (specs/card-comment CC-02, CC-05). A public endpoint:
 * validates the input and checks the session itself. Unlike the post page's createComment, it does
 * not refresh: on the Home that would ask Explore again, and the cards would change order under the
 * reader. The card shows the comment itself.
 */
export async function commentFromCard(raw: unknown): Promise<ActionResult<{ id: string }>> {
  const parsed = cardCommentSchema.safeParse(raw)
  if (!parsed.success) return { ok: false, error: 'api.errors.INVALID' }

  const viewer = await getViewer()
  if (!viewer) return { ok: false, error: 'api.errors.UNAUTHENTICATED' }

  const { kind, id, body } = parsed.data
  const result = await createCommentAs(viewer.id, { postId: id, parentCommentId: null, body }, kind)
  return result.ok ? { ok: true, data: result.data } : { ok: false, error: result.errorKey }
}
