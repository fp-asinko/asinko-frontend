import { z } from 'zod'

/**
 * Input of createComment (PC-15): a comment on a post, or a reply when `parentCommentId` is set.
 * The body only has to say something (the backend has no maximum). The userId never comes from
 * here: the action takes it from the session.
 */
export const createCommentSchema = z.object({
  postId: z.uuid(),
  parentCommentId: z.uuid().nullable(),
  body: z.string().trim().min(1),
})

export type CreateCommentInput = z.infer<typeof createCommentSchema>
