import { z } from 'zod'

/** The longest update (Q4): the front's until the backend says (P-039). */
export const THESIS_UPDATE_MAX = 2000

/**
 * Input of createThesisUpdate (specs/thesis-arguments TA-10): which thesis and what changed,
 * trimmed, from 1 to 2,000 characters. A Server Action is a public endpoint: validated here too.
 */
export const thesisUpdateSchema = z.object({
  thesisId: z.uuid(),
  body: z
    .string()
    .trim()
    .min(1, 'feed.thesis.updates.errors.required')
    .max(THESIS_UPDATE_MAX, 'feed.thesis.updates.errors.tooLong'),
})

export type ThesisUpdateInput = z.infer<typeof thesisUpdateSchema>
