import type { RawComment } from '@/lib/api/contract'

/** The backend's page size, the ceiling of ?limit (asinko-app pagination). */
const MAX_LIMIT = 20

/**
 * GET /{posts|polls}/:id/comments with P-007, as the backend dev does it: `limit` caps the roots
 * (a positive integer up to 20; anything else is ignored) and only the literal "false" turns
 * `replies` off. Without replies each root keeps `replies: []` and its `replyCount`.
 */
export function commentTree(
  roots: readonly RawComment[],
  query: Partial<Record<'limit' | 'replies', string>>,
): RawComment[] {
  const raw = Number(query.limit)
  const limit = Number.isInteger(raw) && raw > 0 ? Math.min(raw, MAX_LIMIT) : undefined
  const tree = query.replies === 'false' ? roots.map((root) => ({ ...root, replies: [] })) : roots
  return limit === undefined ? [...tree] : tree.slice(0, limit)
}
