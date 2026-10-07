'use server'

import { refresh } from 'next/cache'
import { getViewer } from '@/lib/session'
import type { ActionResult } from '@/lib/result'
import { createCommentAs } from '../lib/comments-api'
import { createCommentSchema } from '../schemas/comment.schema'

/**
 * Comments a post or replies to a comment (PC-15). A public endpoint: validates the input and
 * checks the session itself. On success it refreshes the page in the same response, so the
 * comment shown at once is replaced by the server's, with its Markdown.
 */
export async function createComment(raw: unknown): Promise<ActionResult<{ id: string }>> {
  const parsed = createCommentSchema.safeParse(raw)
  if (!parsed.success) return { ok: false, error: 'api.errors.INVALID' }

  const viewer = await getViewer()
  if (!viewer) return { ok: false, error: 'api.errors.UNAUTHENTICATED' }

  const result = await createCommentAs(viewer.id, parsed.data)
  if (!result.ok) return { ok: false, error: result.errorKey }
  refresh()
  return { ok: true, data: result.data }
}
