'use server'

import type { ReactNode } from 'react'
import { setRequestLocale } from 'next-intl/server'
import { z } from 'zod'
import { routing } from '@/i18n/routing'
import { communitySlugSchema } from '@/lib/communities/community-slug.schema'
import type { ActionResult } from '@/lib/result'
import { getViewer } from '@/lib/session'
import { FollowRow } from '../components/follow-row'
import { getFollowList } from '../lib/follow-api'
import { getMembers } from '../lib/members-api'

type Page = { items: ReactNode; count: number; nextCursor: string | null }

const schema = z.object({
  source: z.discriminatedUnion('list', [
    z.object({ list: z.enum(['followers', 'following']), userId: z.uuid() }),
    z.object({ list: z.literal('members'), slug: communitySlugSchema }),
  ]),
  cursor: z.string().min(1).max(512).optional(),
  locale: z.enum(routing.locales),
})

/**
 * A page of a list of people, rendered on the server: a person's followers or following
 * (specs/follow-lists FL-03) or a community's members (specs/community-members CM-03). The first
 * one when the list opens, then each "Load more". Public read.
 */
export async function loadPeople(raw: unknown): Promise<ActionResult<Page>> {
  const parsed = schema.safeParse(raw)
  if (!parsed.success) return { ok: false, error: 'api.errors.INVALID' }

  const { source, cursor, locale } = parsed.data
  setRequestLocale(locale)
  const viewer = await getViewer()
  const viewerName = viewer?.username ?? null
  const result =
    source.list === 'members'
      ? await getMembers(source.slug, viewerName, cursor)
      : await getFollowList(source.userId, source.list, viewerName, cursor)
  if (!result.ok) return { ok: false, error: result.errorKey }

  const { items, nextCursor } = result.data
  return {
    ok: true,
    data: {
      items: items.map((person) => (
        <li key={person.username}>
          <FollowRow person={person} list={source.list} />
        </li>
      )),
      count: items.length,
      nextCursor,
    },
  }
}
