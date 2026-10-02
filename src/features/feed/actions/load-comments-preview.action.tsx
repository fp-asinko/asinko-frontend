'use server'

import type { ReactNode } from 'react'
import { setRequestLocale } from 'next-intl/server'
import type { ActionResult } from '@/lib/result'
import { CommentsPreview } from '../components/comments-preview'
import { getCommentsPreview } from '../lib/comments-api'
import { commentsTargetSchema } from '../schemas/comments-preview.schema'

/**
 * Loads the comments preview of a card when it is opened (H-28, D-H2 option A). Returns them
 * already rendered on the server: the feed makes no extra requests and react-markdown stays off
 * the browser. Public read: no session needed.
 */
export async function loadCommentsPreview(raw: unknown): Promise<ActionResult<ReactNode>> {
  const parsed = commentsTargetSchema.safeParse(raw)
  if (!parsed.success) return { ok: false, error: 'api.errors.INVALID' }

  // next/root-params does not run in Server Actions: the locale comes with the input.
  setRequestLocale(parsed.data.locale)
  const result = await getCommentsPreview(parsed.data)
  if (!result.ok) return { ok: false, error: result.errorKey }
  return { ok: true, data: <CommentsPreview comments={result.data} /> }
}
