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
export async function loadCommentsPreview(
  raw: unknown,
): Promise<ActionResult<{ preview: ReactNode; empty: boolean }>> {
  const parsed = commentsTargetSchema.safeParse(raw)
  if (!parsed.success) return { ok: false, error: 'api.errors.INVALID' }

  // next/root-params does not run in Server Actions: the locale comes with the input.
  setRequestLocale(parsed.data.locale)
  const result = await getCommentsPreview(parsed.data)
  if (!result.ok) return { ok: false, error: result.errorKey }
  // `empty`: the card's panel drops its empty state once something is sent (specs/card-comment).
  return {
    ok: true,
    data: {
      preview: <CommentsPreview comments={result.data} />,
      empty: result.data.length === 0,
    },
  }
}
