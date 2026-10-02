// Cursor pagination like the backend (opaque cursor, 20 items per page). Here the cursor encodes
// an offset; consumers must treat it as opaque either way.
export const PAGE_SIZE = 20

export function paginate<T>(items: readonly T[], cursor: string | undefined, size = PAGE_SIZE) {
  const start = cursor ? Number(atob(cursor)) || 0 : 0
  const end = start + size
  return {
    items: items.slice(start, end),
    nextCursor: end < items.length ? btoa(String(end)) : null,
  }
}
