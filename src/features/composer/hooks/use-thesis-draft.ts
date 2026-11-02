'use client'

import { z } from 'zod'
import { CONVICTIONS, THESIS_DIRECTIONS } from '../schemas/create-thesis.schema'
import { useLocalDraft, writeDraft } from './use-local-draft'

export { clearDraft, discardDraft, forgetOpenedDraft } from './use-local-draft'

/** A community or an asset, as the pickers hold them. */
const optionSchema = z
  .object({
    id: z.string(),
    slug: z.string(),
    handle: z.string(),
    name: z.string(),
    own: z.boolean(),
    tags: z.array(z.string()).optional(),
  })
  .nullable()

/**
 * What a thesis draft keeps (specs/thesis-create TC-10): every field as the form holds it. Not the
 * disclaimer: it is accepted on each publication (design.md § 8).
 */
const thesisDraftSchema = z.object({
  community: optionSchema,
  asset: optionSchema,
  claim: z.string(),
  direction: z.enum(THESIS_DIRECTIONS).or(z.literal('')),
  targetPrice: z.string(),
  deadline: z.string(),
  conviction: z.enum(CONVICTIONS).or(z.literal('')),
  reasoning: z.string(),
  savedAt: z.number(),
})

export type ThesisDraft = z.output<typeof thesisDraftSchema>

/** Something worth keeping: a claim, a target or a reasoning. Choosing an asset alone is not. */
export function hasThesisText(draft: Pick<ThesisDraft, 'claim' | 'targetPrice' | 'reasoning'>) {
  return Boolean(draft.claim.trim() || draft.targetPrice.trim() || draft.reasoning.trim())
}

export function writeThesisDraft(key: string, draft: ThesisDraft) {
  writeDraft(key, draft)
}

/** The thesis draft kept for `key` when the page opens, or null. */
export function useStoredThesisDraft(key: string | null): ThesisDraft | null {
  return useLocalDraft(key, thesisDraftSchema, hasThesisText)
}
