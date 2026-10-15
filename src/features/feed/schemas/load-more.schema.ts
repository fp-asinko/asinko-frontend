import { z } from 'zod'
import { routing } from '@/i18n/routing'
import { feedParamsSchema } from './feed-params.schema'

/**
 * Input of loadMoreFeed: the same feed state as the URL (invalid values fall back to the
 * defaults), the opaque cursor of the next page and the locale (next/root-params does not run in
 * Server Actions). getFeed checks the cursor's shape before any request.
 */
export const loadMoreSchema = feedParamsSchema.extend({
  cursor: z.string().min(1).max(512),
  locale: z.enum(routing.locales),
})
