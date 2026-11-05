import { z } from 'zod'

/** A community slug as the backend writes them: lowercase letters, digits and inner hyphens. */
// Upper case too: an asset community slug is its symbol (BTC), and the backend is case-sensitive.
export const SLUG_PATTERN = /^[A-Za-z0-9](?:[A-Za-z0-9_-]{0,62}[A-Za-z0-9])?$/

/** searchParams values can repeat (?a=1&a=2): the first one wins. */
const first = (value: unknown) => (Array.isArray(value) ? value[0] : value)

/** What a feed shows (specs/feed-type-filter FT-04): all, or one kind of content. */
export const FEED_TYPES = ['all', 'posts', 'theses', 'polls'] as const
export type FeedType = (typeof FEED_TYPES)[number]

/**
 * The Home's URL state (specs/home/design.md § 5, specs/feed-type-filter § 1). searchParams are
 * user input: anything invalid falls back to the default instead of breaking the page. `filter` is
 * the order, New for now; what it shows is `type`.
 */
export const feedParamsObject = z.object({
  feed: z.preprocess(first, z.enum(['for-you', 'following']).catch('for-you')),
  filter: z.preprocess(first, z.enum(['new']).catch('new')),
  type: z.preprocess(first, z.enum(FEED_TYPES).catch('all')),
  community: z.preprocess(first, z.string().regex(SLUG_PATTERN).optional().catch(undefined)),
})

/** The URL's: ?filter=polls, from before the type filter, shows the polls (FT-10). */
export const feedParamsSchema = z.preprocess((raw) => {
  const query = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>
  return first(query.filter) === 'polls' && query.type === undefined
    ? { ...query, type: 'polls' }
    : query
}, feedParamsObject)

/**
 * A feed's state: the URL's, plus who wrote it on a profile (P-012, specs/backend-adoption BK-02).
 * The author never comes from the URL: the page sets it.
 */
export type FeedParams = z.infer<typeof feedParamsObject> & { author?: string }

export function parseFeedParams(searchParams: unknown): FeedParams {
  return feedParamsSchema.parse(searchParams ?? {})
}
