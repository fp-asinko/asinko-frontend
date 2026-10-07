import { z } from 'zod'

/** Input of votePost. null removes the vote. A Server Action is a public endpoint: validated. */
export const votePostSchema = z.object({
  postId: z.uuid(),
  value: z.union([z.literal(1), z.literal(-1), z.null()]),
})

/** Input of votePoll. */
export const votePollSchema = z.object({
  pollId: z.uuid(),
  optionId: z.uuid(),
})

export type VotePostInput = z.infer<typeof votePostSchema>
export type VotePollInput = z.infer<typeof votePollSchema>

/** Input of voteComment (PC-16). null removes the vote. */
export const voteCommentSchema = z.object({
  commentId: z.uuid(),
  value: z.union([z.literal(1), z.literal(-1), z.null()]),
})

export type VoteCommentInput = z.infer<typeof voteCommentSchema>
