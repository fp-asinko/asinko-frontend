import { z } from 'zod'
import { userSummarySchema } from './users'

// E04: GET /api/v1/search?q=&type=. Raw backend shape: at most ~10 of each, not paginated.

export const searchCommunitySchema = z.object({
  id: z.uuid(),
  slug: z.string(),
  name: z.string(),
  avatarUrl: z.string().nullable(),
  memberCount: z.number().int(),
})

export const searchResultSchema = z.object({
  users: z.array(userSummarySchema),
  communities: z.array(searchCommunitySchema),
  /** Posts and theses, as feed items: not used by the front yet. */
  content: z.array(z.unknown()),
})

export type RawSearchResult = z.infer<typeof searchResultSchema>
