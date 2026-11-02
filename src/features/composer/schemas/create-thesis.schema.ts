import { z } from 'zod'
import { assetSymbolSchema } from '@/lib/communities/asset-symbol.schema'
import { DAY_PATTERN } from '../lib/thesis-deadline'

/** The backend's limit for a claim (POST /theses, E11; specs/thesis-create Q2). */
export const CLAIM_MAX = 280

/** Where the price has to go (Q3): EQUALS is not offered, a real price almost never lands on it. */
export const THESIS_DIRECTIONS = ['ABOVE', 'BELOW'] as const

/** From LOW to EXTREME (TC-07). */
export const CONVICTIONS = ['LOW', 'MEDIUM', 'HIGH', 'EXTREME'] as const

const error = (name: string) => ({ message: `composer.thesis.errors.${name}` })

/** A price as typed: a comma also works as the decimal point (182,40). Empty is missing. */
const priceSchema = z.preprocess(
  (value) => {
    if (typeof value !== 'string') return value
    const typed = value.trim()
    return typed ? Number(typed.replace(',', '.')) : undefined
  },
  z.number(error('targetPrice')).positive(error('targetPrice')).finite(error('targetPrice')),
)

/** What the form and the action share (specs/thesis-create § 4). Messages are translation keys. */
const thesisFields = {
  communityId: z.uuid({ message: 'composer.errors.community' }),
  assetSymbol: z
    .string()
    .refine((value) => assetSymbolSchema.safeParse(value).success, error('asset')),
  claim: z.string().trim().min(1, error('claimRequired')).max(CLAIM_MAX, error('claimTooLong')),
  direction: z.enum(THESIS_DIRECTIONS, error('direction')),
  targetPrice: priceSchema,
  conviction: z.enum(CONVICTIONS, error('conviction')),
  reasoning: z.string().trim().min(1, error('reasoningRequired')),
}

/** The editor's form: the deadline is the chosen day (YYYY-MM-DD), its range is the field's. */
export const thesisFormSchema = z.object({
  ...thesisFields,
  deadline: z.string().regex(DAY_PATTERN, error('deadline')),
})

/**
 * A new thesis, as the Server Action takes it (TC-13): the deadline already as the end of the day
 * in the writer's zone, and the disclaimer accepted in the confirmation (TC-12).
 */
export const createThesisSchema = z.object({
  ...thesisFields,
  deadline: z.iso.datetime(error('deadline')),
  disclaimerAccepted: z.literal(true, error('disclaimer')),
})

export type ThesisForm = z.input<typeof thesisFormSchema>
export type ThesisFormValues = z.output<typeof thesisFormSchema>
export type CreateThesisInput = z.output<typeof createThesisSchema>
