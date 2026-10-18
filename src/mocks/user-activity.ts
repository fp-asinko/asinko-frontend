import type { RawFeedItem, RawUserComment } from '@/lib/api/contract'
import { COMMENTS_BY_CONTENT } from './fixtures/comments'
import { POLLS } from './fixtures/polls'
import { POSTS } from './fixtures/posts'
import { PROFILES } from './fixtures/users'
import { paginate } from './paginate'
import type { MockResponse } from './types'

// A person's activity on their profile (P-012, backend 2026-10-13): what they published and what
// they commented, newest first, in any community. Deleted ones stay out, as in the backend.

const notFound: MockResponse = {
  status: 404,
  body: { error: { code: 'NOT_FOUND', message: 'mock' } },
}

const ITEMS: RawFeedItem[] = [
  ...POSTS.map((content) => ({ kind: 'POST' as const, content })),
  ...POLLS.map((content) => ({ kind: 'POLL' as const, content })),
]

/** GET /users/{userId}/content?kind=&cursor= */
export function userContent(userId: string, query: Record<string, string>): MockResponse {
  if (!PROFILES.some((profile) => profile.id === userId)) return notFound
  const kinds = (query.kind ?? '').split(',').filter(Boolean)
  const items = ITEMS.filter(
    (item) =>
      item.content.creator?.id === userId &&
      !('deleted' in item.content && item.content.deleted) &&
      (kinds.length === 0 || kinds.includes(item.kind)),
  ).sort((a, b) => b.content.publishedAt.localeCompare(a.content.publishedAt))
  return { status: 200, body: paginate(items, query.cursor) }
}

/** GET /users/{userId}/comments?cursor= */
export function userComments(userId: string, cursor: string | undefined): MockResponse {
  if (!PROFILES.some((profile) => profile.id === userId)) return notFound
  const comments: RawUserComment[] = []
  for (const item of ITEMS) {
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
