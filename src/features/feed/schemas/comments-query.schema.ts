import { z } from 'zod'

/** The orders of a post's comments (specs/post-detail-refresh PD-03), the first by default. */
export const COMMENT_SORTS = ['best', 'top', 'new', 'old'] as const

export type CommentSort = (typeof COMMENT_SORTS)[number]

const first = (value: unknown) => (Array.isArray(value) ? value[0] : value)

/**
 * `?sort=` and `?q=` of a post's page: user input from the URL (security.md § 5). An unknown order
 * is the default one (PD-04); a search shorter than 2 or longer than 100 characters is no search
 * (PD-06). Never throws: a bad URL still shows the comments.
 */
export const commentsQuerySchema = z.object({
  sort: z.preprocess(first, z.enum(COMMENT_SORTS)).catch('best'),
  q: z.preprocess(first, z.string().trim().min(2).max(100)).optional().catch(undefined),
})

export type CommentsQuery = z.infer<typeof commentsQuerySchema>
