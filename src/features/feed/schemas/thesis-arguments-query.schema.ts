import { z } from 'zod'
import { COMMENT_SORTS } from './comments-query.schema'

const first = (value: unknown) => (Array.isArray(value) ? value[0] : value)

/**
 * `?side=` and `?sort=` of a thesis's page (specs/thesis-arguments TA-01, TA-03): user input from
 * the URL (security.md § 5). For is the default side, an unknown one too; an unknown order is the
 * default one. Never throws: a bad URL still shows the arguments.
 */
export const thesisArgumentsQuerySchema = z.object({
  side: z.preprocess(first, z.enum(['pro', 'contra'])).catch('pro'),
  sort: z.preprocess(first, z.enum(COMMENT_SORTS)).catch('best'),
})

export type ThesisArgumentsQuery = z.infer<typeof thesisArgumentsQuerySchema>
