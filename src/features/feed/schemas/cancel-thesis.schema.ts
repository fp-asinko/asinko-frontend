import { z } from 'zod'

/** The longest reason (Q4): as a claim, so the record reads in one breath. */
export const CANCEL_REASON_MAX = 280

/**
 * Input of cancelThesis (specs/thesis-detail TD-13): which thesis and why, trimmed, from 1 to 280
 * characters. A Server Action is a public endpoint: validated here, not only in the dialog.
 */
export const cancelThesisSchema = z.object({
  thesisId: z.uuid(),
  reason: z
    .string()
    .trim()
    .min(1, 'feed.thesis.cancel.errors.reasonRequired')
    .max(CANCEL_REASON_MAX, 'feed.thesis.cancel.errors.reasonTooLong'),
})

export type CancelThesisInput = z.infer<typeof cancelThesisSchema>
