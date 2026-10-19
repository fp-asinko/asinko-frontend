import { z } from 'zod'
import { communityTypeSchema, membershipSchema } from './communities'
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

/** P-004: the community of a piece of content, just what a card needs (always present). */
export const communitySummarySchema = z.object({
  id: z.uuid(),
  slug: z.string(),
  name: z.string(),
  type: communityTypeSchema,
  /** P-010 (in the backend since 2026-10-07): the card's avatar and the viewer's role. */
  avatarUrl: z.string().nullable(),
  viewerMembership: membershipSchema.nullable(),
})

export const postSchema = z.object({
  id: z.uuid(),
  communityId: z.uuid(),
  community: communitySummarySchema,
  type: z.enum(['TEXT', 'LINK', 'IMAGE']),
  title: z.string(),
  /** Markdown. Empty when deleted (P-008). */
  body: z.string(),
  url: z.string().nullable(),
  imageUrl: z.string().nullable(),
  /** What the image shows (P-013, 2026-10-13): optional, only IMAGE posts. */
  imageAlt: z.string().nullable().optional(),
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

/** PUT /{posts|theses|comments}/{id}/vote (E05). */
export const voteResultSchema = z.object({
  score: z.number().int(),
  viewerVote: z.union([z.literal(1), z.literal(-1)]),
})

export const pollSchema = z.object({
  id: z.uuid(),
  communityId: z.uuid(),
  community: communitySummarySchema,
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
  /** P-006: without deleted comments, as in Post. */
  commentCount: z.number().int(),
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

/**
 * Comments come with their replies nested inline (E05). With ?replies=false (P-007) only the top
 * level, each with `replies: []` (never absent) and `replyCount` still counting them.
 */
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

/**
 * GET /api/v1/users/{userId}/comments (P-012, backend 2026-10-13): a person's comments, newest
 * first, each with where it is, as a profile shows it out of its thread.
 */
export const userCommentSchema = z.object({
  id: z.uuid(),
  author: userSummarySchema,
  body: z.string(),
  parentCommentId: z.uuid().nullable(),
  score: z.number().int(),
  viewerVote: z.union([z.literal(1), z.literal(-1)]).nullable(),
  replyCount: z.number().int(),
  editedAt: z.iso.datetime().nullable(),
  deleted: z.boolean(),
  createdAt: z.iso.datetime(),
  /** The post, poll or thesis it is under: `title` is its title, question or claim. */
  content: z.object({
    kind: z.enum(['POST', 'POLL', 'THESIS']),
    id: z.uuid(),
    title: z.string(),
    community: communitySummarySchema.nullable(),
  }),
})

export type RawUserComment = z.infer<typeof userCommentSchema>

/**
 * Where a person published lately (P-027, proposal, specs/profile-aside): a community and how many
 * posts. The list takes any item: one malformed is dropped, not the list (keepValidItems).
 */
export const activeCommunitySchema = z.object({
  community: communitySummarySchema,
  postCount: z.number().int().positive(),
})

export const activeCommunitiesSchema = z.object({ items: z.array(z.unknown()) })

export type RawActiveCommunity = z.infer<typeof activeCommunitySchema>

/**
 * A post saved to finish later (P-022, proposal, specs/drafts-tags): what the editor had, in the
 * person's account. Texts are "" when empty; up to 20 per person.
 */
export const draftSchema = z.object({
  id: z.uuid(),
  type: z.enum(['TEXT', 'LINK', 'IMAGE']),
  title: z.string(),
  body: z.string(),
  url: z.string(),
  imageUrl: z.string().nullable(),
  imageAlt: z.string(),
  tag: z.string().nullable(),
  community: communitySummarySchema.nullable(),
  updatedAt: z.iso.datetime(),
})

export type RawDraft = z.infer<typeof draftSchema>
export type RawPost = z.infer<typeof postSchema>
export type RawPoll = z.infer<typeof pollSchema>
export type RawEntity = z.infer<typeof entitySchema>
export type RawCommunitySummary = z.infer<typeof communitySummarySchema>
export type RawFeedItem = z.infer<typeof feedItemSchema>
