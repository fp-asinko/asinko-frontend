import { z } from 'zod'

/** A community slug as the backend writes them: lowercase letters, digits and inner hyphens. */
// Upper case too: an asset community slug is its symbol (BTC), and the backend is case-sensitive.
export const SLUG_PATTERN = /^[A-Za-z0-9](?:[A-Za-z0-9_-]{0,62}[A-Za-z0-9])?$/

/** searchParams values can repeat (?a=1&a=2): the first one wins. */
const first = (value: unknown) => (Array.isArray(value) ? value[0] : value)

/**
 * The Home's URL state (specs/home/design.md § 5). searchParams are user input: anything invalid
 * falls back to the default instead of breaking the page.
 */
export const feedParamsSchema = z.object({
  feed: z.preprocess(first, z.enum(['for-you', 'following']).catch('for-you')),
  filter: z.preprocess(first, z.enum(['new', 'polls']).catch('new')),
  community: z.preprocess(first, z.string().regex(SLUG_PATTERN).optional().catch(undefined)),
})

export type FeedParams = z.infer<typeof feedParamsSchema>

export function parseFeedParams(searchParams: unknown): FeedParams {
  return feedParamsSchema.parse(searchParams ?? {})
}
