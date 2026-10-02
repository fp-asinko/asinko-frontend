import { z } from 'zod'
import { userSummarySchema } from './users'

// E03, E04, E05 (docs/references/api/). Raw backend shapes.

/**
 * Resolved mentions ($ asset, @ user, # community). Today only POST /posts returns them; reading
 * endpoints including them is proposal P-001 (docs/references/api/proposals.md).
 */
export const entitySchema = z.object({
  type: z.enum(['TICKER', 'MENTION', 'COMMUNITY']),
  raw: z.string(),
  resolvedId: z.string(),
  /** [start, end) offsets in `body`. */
  position: z.tuple([z.number().int(), z.number().int()]),
})

export const postSchema = z.object({
  id: z.uuid(),
  communityId: z.uuid(),
  type: z.enum(['TEXT', 'LINK', 'IMAGE']),
  title: z.string(),
  /** Markdown. */
  body: z.string(),
  url: z.string().nullable(),
  imageUrl: z.string().nullable(),
  tag: z.string().nullable(),
  /** null when creatorType is SYSTEM. */
  creator: userSummarySchema.nullable(),
  creatorType: z.enum(['USER', 'SYSTEM']),
  score: z.number().int(),
  commentCount: z.number().int(),
  viewerVote: z.union([z.literal(1), z.literal(-1)]).nullable(),
  editedAt: z.iso.datetime().nullable(),
  deleted: z.boolean(),
  publishedAt: z.iso.datetime(),
  createdAt: z.iso.datetime(),
  entities: z.array(entitySchema).optional(),
})

export const pollSchema = z.object({
  id: z.uuid(),
  communityId: z.uuid(),
  question: z.string(),
  options: z.array(
    z.object({
      id: z.uuid(),
      label: z.string(),
      description: z.string().nullable(),
      position: z.number().int(),
      /** null while results are hidden from the viewer (resultsVisibility). */
      voteCount: z.number().int().nullable(),
    }),
  ),
  closesAt: z.iso.datetime().nullable(),
  isClosed: z.boolean(),
  allowVoteChange: z.boolean(),
  resultsVisibility: z.enum(['ALWAYS', 'ON_VOTE', 'ON_CLOSE']),
  totalVotes: z.number().int().nullable(),
  viewerOptionId: z.uuid().nullable(),
  creator: userSummarySchema.omit({ accuracyRate: true }).nullable(),
  creatorType: z.enum(['USER', 'SYSTEM']),
  publishedAt: z.iso.datetime(),
  createdAt: z.iso.datetime(),
})

export type RawComment = {
  id: string
  author: z.infer<typeof userSummarySchema>
  body: string
  parentCommentId: string | null
  side: 'PRO' | 'CONTRA' | null
  score: number
  viewerVote: 1 | -1 | null
  replyCount: number
  editedAt: string | null
  deleted: boolean
  createdAt: string
  replies: RawComment[]
}

/** Comments come with their replies nested inline (E05). */
export const commentSchema: z.ZodType<RawComment> = z.lazy(() =>
  z.object({
    id: z.uuid(),
    author: userSummarySchema,
    body: z.string(),
    parentCommentId: z.uuid().nullable(),
    side: z.enum(['PRO', 'CONTRA']).nullable(),
    score: z.number().int(),
    viewerVote: z.union([z.literal(1), z.literal(-1)]).nullable(),
    replyCount: z.number().int(),
    editedAt: z.iso.datetime().nullable(),
    deleted: z.boolean(),
    createdAt: z.iso.datetime(),
    replies: z.array(commentSchema),
  }),
)

export const commentListSchema = z.object({ items: z.array(commentSchema) })

/** Feed item: discriminated by kind (E04). THESIS arrives in phase 2. */
export const feedItemSchema = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('POST'), content: postSchema }),
  z.object({ kind: z.literal('POLL'), content: pollSchema }),
])

export type RawPost = z.infer<typeof postSchema>
export type RawPoll = z.infer<typeof pollSchema>
export type RawEntity = z.infer<typeof entitySchema>
export type RawFeedItem = z.infer<typeof feedItemSchema>
