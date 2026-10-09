'use server'

import type { ReactNode } from 'react'
import { setRequestLocale } from 'next-intl/server'
import { z } from 'zod'
import { routing } from '@/i18n/routing'
import type { ActionResult } from '@/lib/result'
import { getViewer } from '@/lib/session'
import { FollowRow } from '../components/follow-row'
import { getFollowList } from '../lib/follow-api'

type Page = { items: ReactNode; count: number; nextCursor: string | null }

const schema = z.object({
  userId: z.uuid(),
  kind: z.enum(['followers', 'following']),
  cursor: z.string().min(1).max(512).optional(),
  locale: z.enum(routing.locales),
})

/**
 * A page of a person's followers or following (specs/follow-lists FL-03), rendered on the server:
 * the first one when the list opens, then each "Load more". Public read.
 */
export async function loadFollowList(raw: unknown): Promise<ActionResult<Page>> {
  const parsed = schema.safeParse(raw)
  if (!parsed.success) return { ok: false, error: 'api.errors.INVALID' }

  const { userId, kind, cursor, locale } = parsed.data
  setRequestLocale(locale)
  const viewer = await getViewer()
  const result = await getFollowList(userId, kind, viewer?.username ?? null, cursor)
  if (!result.ok) return { ok: false, error: result.errorKey }

  const { items, nextCursor } = result.data
  return {
    ok: true,
    data: {
      items: items.map((person) => (
        <li key={person.username}>
          <FollowRow person={person} kind={kind} />
        </li>
      )),
      count: items.length,
      nextCursor,
    },
  }
}
