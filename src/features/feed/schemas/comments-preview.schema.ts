import { z } from 'zod'
import { routing } from '@/i18n/routing'

/**
 * Input of loadCommentsPreview: a Server Action is a public endpoint, so it is validated. The
 * locale travels with it because next/root-params does not run in Server Actions.
 */
export const commentsTargetSchema = z.object({
  kind: z.enum(['post', 'poll']),
  id: z.uuid(),
  locale: z.enum(routing.locales),
})

export type CommentsTarget = z.infer<typeof commentsTargetSchema>
