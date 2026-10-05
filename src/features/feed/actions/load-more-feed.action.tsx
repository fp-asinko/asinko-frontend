'use server'

import type { ReactNode } from 'react'
import { setRequestLocale } from 'next-intl/server'
import type { ActionResult } from '@/lib/result'
import { getViewer } from '@/lib/session'
import { FeedItems } from '../components/feed-items'
import { getFeed } from '../lib/feed-api'
import { loadMoreSchema } from '../schemas/load-more.schema'

type NextPage = { items: ReactNode; count: number; nextCursor: string | null }

/**
 * The next page of the Home feed (H-16), already rendered on the server: the cards, their
 * Markdown and their client leaves (votes, comments) arrive ready to append. Public read.
 */
export async function loadMoreFeed(raw: unknown): Promise<ActionResult<NextPage>> {
  const parsed = loadMoreSchema.safeParse(raw)
  if (!parsed.success) return { ok: false, error: 'api.errors.INVALID' }

  const { cursor, locale, ...params } = parsed.data
  setRequestLocale(locale)
  const result = await getFeed(params, cursor, { signedIn: (await getViewer()) !== null })
  if (!result.ok) return { ok: false, error: result.errorKey }

  const { items, nextCursor } = result.data
  return {
    ok: true,
    data: { items: <FeedItems items={items} later />, count: items.length, nextCursor },
  }
}
