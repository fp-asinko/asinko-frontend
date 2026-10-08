'use server'

import type { ReactNode } from 'react'
import { setRequestLocale } from 'next-intl/server'
import { z } from 'zod'
import { routing } from '@/i18n/routing'
import type { ActionResult } from '@/lib/result'
import { ThesisListItems } from '../components/thesis-list-items'
import { getUserTheses } from '../lib/theses-api'

type NextPage = { items: ReactNode; count: number; nextCursor: string | null }

const loadMoreThesesSchema = z.object({
  userId: z.uuid(),
  cursor: z.string().min(1).max(512),
  locale: z.enum(routing.locales),
})

/**
 * The next page of a person's theses (specs/profile-track-record PT-05), already rendered on the
 * server, as the feed's "Load more". Public read: the profile is public (a private one is a 404).
 */
export async function loadMoreTheses(raw: unknown): Promise<ActionResult<NextPage>> {
  const parsed = loadMoreThesesSchema.safeParse(raw)
  if (!parsed.success) return { ok: false, error: 'api.errors.INVALID' }

  const { userId, cursor, locale } = parsed.data
  setRequestLocale(locale)
  const result = await getUserTheses(userId, cursor)
  if (!result.ok) return { ok: false, error: result.errorKey }

  const { items, nextCursor } = result.data
  return {
    ok: true,
    data: { items: <ThesisListItems theses={items} />, count: items.length, nextCursor },
  }
}
