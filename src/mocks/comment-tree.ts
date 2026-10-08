import type { RawComment } from '@/lib/api/contract'
import { MOCK_NOW } from './fixtures/ids'

/** The backend's page size, the ceiling of ?limit (asinko-app pagination). */
const MAX_LIMIT = 20

const SORTS = ['best', 'top', 'new', 'old'] as const
type Sort = (typeof SORTS)[number]

const hours = (comment: RawComment) => (MOCK_NOW - Date.parse(comment.createdAt)) / 3_600_000

/** P-014's proposal for `best` (to be reviewed by the backend): score decayed by age, as HN. */
const best = (comment: RawComment) => comment.score / (Math.max(hours(comment), 0) + 2) ** 1.5

const ORDER: Record<Sort, (a: RawComment, b: RawComment) => number> = {
  best: (a, b) => best(b) - best(a),
  top: (a, b) => b.score - a.score,
  new: (a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt),
  old: (a, b) => Date.parse(a.createdAt) - Date.parse(b.createdAt),
}

/** Each level sorted, the roots and the replies of every comment (P-014). */
function sorted(list: readonly RawComment[], sort: Sort): RawComment[] {
  return [...list]
    .sort(ORDER[sort])
    .map((comment) => ({ ...comment, replies: sorted(comment.replies, sort) }))
}

/**
 * GET /{posts|polls}/:id/comments with P-007, as the backend dev does it: `limit` caps the roots
 * (a positive integer up to 20; anything else is ignored) and only the literal "false" turns
 * `replies` off. Without replies each root keeps `replies: []` and its `replyCount`.
 *
 * And P-014 (proposal): `sort=best|top|new|old` orders every level. Without it, the order of the
 * backend today (oldest first), so a request without the parameter answers as the real one.
 */
export function commentTree(
  roots: readonly RawComment[],
  query: Partial<Record<'limit' | 'replies' | 'sort', string>>,
): RawComment[] {
  const sort = SORTS.find((each) => each === query.sort)
  const ordered = sort ? sorted(roots, sort) : roots
  const raw = Number(query.limit)
  const limit = Number.isInteger(raw) && raw > 0 ? Math.min(raw, MAX_LIMIT) : undefined
  const tree =
    query.replies === 'false' ? ordered.map((root) => ({ ...root, replies: [] })) : ordered
  return limit === undefined ? [...tree] : tree.slice(0, limit)
}

/** Lower case and without accents: "Énfasis" matches "enfasis". */
const fold = (text: string) =>
  text
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()

/**
 * P-014 (proposal): `?q=` finds the comments that contain the text, at any level, in a flat list
 * (`replies: []`), the most matches first, then the best voted. Deleted comments never match.
 */
export function searchComments(roots: readonly RawComment[], q: string): RawComment[] {
  const needle = fold(q.trim())
  const found: Array<{ comment: RawComment; hits: number }> = []
  const walk = (list: readonly RawComment[]) =>
    list.forEach((comment) => {
      const hits = comment.deleted ? 0 : fold(comment.body).split(needle).length - 1
      if (hits > 0) found.push({ comment: { ...comment, replies: [] }, hits })
      walk(comment.replies)
    })
  walk(roots)
  return found
    .sort((a, b) => b.hits - a.hits || b.comment.score - a.comment.score)
    .map(({ comment }) => comment)
}
