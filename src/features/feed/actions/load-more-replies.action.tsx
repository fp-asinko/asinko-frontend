'use server'

import type { ReactNode } from 'react'
import { setRequestLocale } from 'next-intl/server'
import { z } from 'zod'
import { routing } from '@/i18n/routing'
import type { ActionResult } from '@/lib/result'
import { ReplyListItems } from '../components/reply-list-items'
import { getUserComments } from '../lib/user-comments-api'

type NextPage = { items: ReactNode; count: number; nextCursor: string | null }

const loadMoreRepliesSchema = z.object({
  userId: z.uuid(),
  cursor: z.string().min(1).max(512),
  locale: z.enum(routing.locales),
})

/**
 * The next page of a person's replies (specs/backend-adoption BK-03), already rendered on the
 * server, as the theses' "Load more". Public read: the profile is public (a private one is a 404).
 */
export async function loadMoreReplies(raw: unknown): Promise<ActionResult<NextPage>> {
  const parsed = loadMoreRepliesSchema.safeParse(raw)
  if (!parsed.success) return { ok: false, error: 'api.errors.INVALID' }

  const { userId, cursor, locale } = parsed.data
  setRequestLocale(locale)
  const result = await getUserComments(userId, cursor)
  if (!result.ok) return { ok: false, error: result.errorKey }

  const { items, nextCursor } = result.data
  return {
    ok: true,
    data: { items: <ReplyListItems replies={items} />, count: items.length, nextCursor },
  }
}
