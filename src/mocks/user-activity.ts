import type { RawFeedItem, RawUserComment } from '@/lib/api/contract'
import { COMMENTS_BY_CONTENT } from './fixtures/comments'
import { POLLS } from './fixtures/polls'
import { POSTS } from './fixtures/posts'
import { PROFILES } from './fixtures/users'
import { CREATED_POSTS } from './posting'
import { paginate } from './paginate'
import type { MockResponse } from './types'

// A person's activity on their profile (P-012, backend 2026-10-13): what they published and what
// they commented, newest first, in any community. Deleted ones stay out, as in the backend.

const notFound: MockResponse = {
  status: 404,
  body: { error: { code: 'NOT_FOUND', message: 'mock' } },
}

const invalid: MockResponse = {
  status: 422,
  body: { error: { code: 'VALIDATION_ERROR', message: 'mock' } },
}

/** Read on each request: the posts created in this process count too (specs/profile-showcase). */
const items = (): RawFeedItem[] => [
  ...CREATED_POSTS.map((content) => ({ kind: 'POST' as const, content })),
  ...POSTS.map((content) => ({ kind: 'POST' as const, content })),
  ...POLLS.map((content) => ({ kind: 'POLL' as const, content })),
]

/** GET /users/{userId}/content?kind=&cursor= */
export function userContent(userId: string, query: Record<string, string>): MockResponse {
  if (!PROFILES.some((profile) => profile.id === userId)) return notFound
  const kinds = (query.kind ?? '').split(',').filter(Boolean)
  const found = items()
    .filter(
      (item) =>
        item.content.creator?.id === userId &&
        !('deleted' in item.content && item.content.deleted) &&
        (kinds.length === 0 || kinds.includes(item.kind)),
    )
    .sort((a, b) => b.content.publishedAt.localeCompare(a.content.publishedAt))
  return { status: 200, body: paginate(found, query.cursor) }
}

const DAY = 86_400_000

/**
 * GET /users/{userId}/active-communities?days=&limit= (P-027, proposal, specs/profile-aside): where
 * the person published in the last days, the most posts first; a tie, the latest published first.
 */
export function activeCommunities(userId: string, query: Record<string, string>): MockResponse {
  if (!PROFILES.some((profile) => profile.id === userId)) return notFound
  const days = Number(query.days ?? 90)
  const limit = Number(query.limit ?? 5)
  if (!Number.isInteger(days) || days < 1 || days > 365) return invalid
  if (!Number.isInteger(limit) || limit < 1 || limit > 20) return invalid
  const since = Date.now() - days * DAY
  const counts = new Map<string, { item: RawFeedItem; count: number; latest: string }>()
  for (const item of items()) {
    const { content } = item
    if (content.creator?.id !== userId) continue
    if ('deleted' in content && content.deleted) continue
    if (Date.parse(content.publishedAt) < since) continue
    const known = counts.get(content.community.id)
    counts.set(content.community.id, {
      item: known?.item ?? item,
      count: (known?.count ?? 0) + 1,
      latest: known && known.latest > content.publishedAt ? known.latest : content.publishedAt,
    })
  }
  const list = [...counts.values()]
    .sort((a, b) => b.count - a.count || b.latest.localeCompare(a.latest))
    .slice(0, limit)
    .map(({ item, count }) => ({ community: item.content.community, postCount: count }))
  return { status: 200, body: { items: list } }
}

/** GET /users/{userId}/comments?cursor= */
export function userComments(userId: string, cursor: string | undefined): MockResponse {
  if (!PROFILES.some((profile) => profile.id === userId)) return notFound
  const comments: RawUserComment[] = []
  for (const item of items()) {
    if ('deleted' in item.content && item.content.deleted) continue
    const where = {
      kind: item.kind,
      id: item.content.id,
      title: item.kind === 'POST' ? item.content.title : item.content.question,
      community: item.content.community,
    }
    const walk = (list: (typeof COMMENTS_BY_CONTENT)[string]) => {
      for (const comment of list) {
        if (comment.author.id === userId && !comment.deleted) {
          // As the backend: the comment alone (no thread), with where it is.
          const { replies: _replies, side: _side, ...rest } = comment
          comments.push({ ...rest, content: where })
        }
        walk(comment.replies)
      }
    }
    walk(COMMENTS_BY_CONTENT[item.content.id] ?? [])
  }
  comments.sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  return { status: 200, body: paginate(comments, cursor) }
}
