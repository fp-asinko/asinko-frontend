import type { RawFeedItem, RawUserComment } from '@/lib/api/contract'
import { COMMENTS_BY_CONTENT } from './fixtures/comments'
import { POLLS } from './fixtures/polls'
import { POSTS } from './fixtures/posts'
import { THESES } from './fixtures/theses'
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
  type Published = { community: RawFeedItem['content']['community']; publishedAt: string }
  const counts = new Map<
    string,
    { community: Published['community']; count: number; latest: string }
  >()
  // Posts, polls and theses (backend, 2026-10-20), never the personal channel: it is known.
  const published: Published[] = [
    ...items()
      .map(({ content }) => content)
      .filter((content) => content.creator?.id === userId)
      .filter((content) => !('deleted' in content && content.deleted)),
    ...THESES.filter((thesis) => thesis.creator?.id === userId),
  ]
  for (const { community, publishedAt } of published) {
    if (community.type === 'PERSONAL_CHANNEL') continue
    if (Date.parse(publishedAt) < since) continue
    const known = counts.get(community.id)
    counts.set(community.id, {
      community,
      count: (known?.count ?? 0) + 1,
      latest: known && known.latest > publishedAt ? known.latest : publishedAt,
    })
  }
  const list = [...counts.values()]
    .sort((a, b) => b.count - a.count || b.latest.localeCompare(a.latest))
    .slice(0, limit)
    .map(({ community, count }) => ({ community, postCount: count }))
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
