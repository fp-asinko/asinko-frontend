import { z } from 'zod'

/** Where a comment goes (specs/thesis-arguments § 2): a thesis needs its side. */
export const commentTargetSchema = z.discriminatedUnion('kind', [
  z.object({ kind: z.enum(['post', 'poll']), id: z.uuid() }),
  z.object({ kind: z.literal('thesis'), id: z.uuid(), side: z.enum(['PRO', 'CONTRA']) }),
])

/**
 * Input of createComment (PC-15): a comment on a post or a thesis (an argument, on its side), or a
 * reply when `parentCommentId` is set. The body only has to say something (the backend has no
 * maximum). The userId never comes from here: the action takes it from the session.
 */
export const createCommentSchema = z.object({
  target: commentTargetSchema,
  parentCommentId: z.uuid().nullable(),
  body: z.string().trim().min(1),
})

export type CreateCommentInput = z.infer<typeof createCommentSchema>

/**
 * Input of commentFromCard (specs/card-comment): a comment on a post or a poll, from its card. The
 * same body rule as above; never a userId.
 */
export const cardCommentSchema = z.object({
  kind: z.enum(['post', 'poll']),
  id: z.uuid(),
  body: z.string().trim().min(1),
})

export type CardCommentInput = z.infer<typeof cardCommentSchema>
