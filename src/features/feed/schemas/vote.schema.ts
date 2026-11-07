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

/** Input of voteThesis (specs/thesis-detail TD-16), as a post's. null removes the vote. */
export const voteThesisSchema = z.object({
  thesisId: z.uuid(),
  value: z.union([z.literal(1), z.literal(-1), z.null()]),
})

export type VoteThesisInput = z.infer<typeof voteThesisSchema>

/** Input of answerThesis (specs/thesis-agree AG-04, AG-05): yes, no, or null to take it back. */
export const answerThesisSchema = z.object({
  thesisId: z.uuid(),
  value: z.enum(['yes', 'no']).nullable(),
})

export type AnswerThesisInput = z.infer<typeof answerThesisSchema>
