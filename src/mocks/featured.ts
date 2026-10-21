import type { RawFeatured } from '@/lib/api/contract'
import { DEMO_USER } from './demo-user'
import { mockId } from './fixtures/ids'
import { pollById } from './fixtures/polls'
import { THESES } from './fixtures/theses'
import { PROFILES } from './fixtures/users'
import { findPost } from './posting'
import type { MockResponse } from './types'

// What each person put at the front of their profile (P-025, backend 2026-10-20): in this process's
// memory, the last featured first, up to three. Each one a feed item ({ kind, content }) with
// featuredAt; `kind` is POST, POLL or THESIS, in any case. Only the demo user writes.

export const FEATURED_MAX = 3

const KINDS = ['post', 'poll', 'thesis'] as const
type Kind = (typeof KINDS)[number]

const kindOf = (value: unknown): Kind | undefined =>
  KINDS.find((kind) => typeof value === 'string' && value.toLowerCase() === kind)
type Entry = { kind: Kind; id: string; featuredAt: string }

const maria = PROFILES.find((profile) => profile.username === 'maria')!

/** María's whales post and a thesis she got right: a profile of someone else with both. */
export const SEED_FEATURED: Entry[] = [
  { kind: 'thesis', id: mockId(9, 3), featuredAt: new Date(Date.now() - 86_400_000).toISOString() },
  {
    kind: 'post',
    id: mockId(4, 1),
    featuredAt: new Date(Date.now() - 2 * 86_400_000).toISOString(),
  },
]

const FEATURED = new Map<string, Entry[]>([[maria.id, [...SEED_FEATURED]]])

const error = (status: number, code: string): MockResponse => ({
  status,
  body: { error: { code, message: 'mock' } },
})

/** The content behind an entry as the list carries it, if it is there and not deleted. */
function featuredOf(entry: Entry): { item: RawFeatured; creatorId: string | null } | null {
  const { featuredAt } = entry
  if (entry.kind === 'post') {
    const post = findPost(entry.id)
    if (!post || post.deleted) return null
    return {
      item: { kind: 'POST', content: post, featuredAt },
      creatorId: post.creator?.id ?? null,
    }
  }
  if (entry.kind === 'poll') {
    const poll = pollById(entry.id)
    if (!poll) return null
    return {
      item: { kind: 'POLL', content: poll, featuredAt },
      creatorId: poll.creator?.id ?? null,
    }
  }
  const thesis = THESES.find((each) => each.id === entry.id)
  if (!thesis) return null
  return {
    item: { kind: 'THESIS', content: thesis, featuredAt },
    creatorId: thesis.creator?.id ?? null,
  }
}

/** GET /users/{userId}/featured */
export function listFeatured(userId: string): MockResponse {
  if (!PROFILES.some((profile) => profile.id === userId)) return error(404, 'NOT_FOUND')
  const items = (FEATURED.get(userId) ?? []).flatMap((entry) => featuredOf(entry)?.item ?? [])
  return { status: 200, body: { items } }
}

/** POST /users/{userId}/featured { userId, kind, id } */
export function addFeatured(userId: string, body: unknown): MockResponse {
  const input = (body ?? {}) as Record<string, unknown>
  if (userId !== DEMO_USER.id || input.userId !== userId) return error(403, 'USER_MISMATCH')
  const kind = kindOf(input.kind)
  if (!kind || typeof input.id !== 'string') return error(422, 'VALIDATION_ERROR')
  const entry = { kind, id: input.id }
  const found = featuredOf({ ...entry, featuredAt: '' })
  if (!found) return error(404, 'NOT_FOUND')
  if (found.creatorId !== userId) return error(403, 'NOT_OWNER')
  const list = FEATURED.get(userId) ?? []
  const already = list.some((each) => each.kind === entry.kind && each.id === entry.id)
  if (!already) {
    if (list.length >= FEATURED_MAX) return error(409, 'FEATURED_LIMIT')
    FEATURED.set(userId, [{ ...entry, featuredAt: new Date().toISOString() }, ...list])
  }
  const listed = listFeatured(userId)
  return { status: already ? 200 : 201, body: listed.body }
}

/** DELETE /users/{userId}/featured/{kind}/{id}?userId= */
export function removeFeatured(
  userId: string,
  kind: string,
  id: string,
  sessionUserId: string | undefined,
): MockResponse {
  if (userId !== DEMO_USER.id || sessionUserId !== userId) return error(403, 'USER_MISMATCH')
  const list = FEATURED.get(userId) ?? []
  FEATURED.set(
    userId,
    list.filter((each) => !(each.kind === kindOf(kind) && each.id === id)),
  )
  return { status: 204 }
}
