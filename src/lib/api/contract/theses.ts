import { z } from 'zod'
import { communitySummarySchema } from './content'
import { userSummarySchema } from './users'

// E11 and E12 (docs/references/api/). Raw backend shapes.

export const thesisStateSchema = z.enum([
  'OPEN',
  'EXPIRED',
  'CORRECT',
  'INCORRECT',
  'DISPUTED',
  'CANCELLED',
])

/**
 * A thesis (E11), as GET /users/{userId}/theses lists it (E12). A qualitative thesis has no asset,
 * and then no target: `targetPrice` and `targetDirection` come null (the backend's serializer,
 * `asinko-app` lib/api/theses.ts, although E11 types them as required).
 */
export const thesisSchema = z.object({
  id: z.uuid(),
  communityId: z.uuid(),
  community: communitySummarySchema,
  asset: z.object({ id: z.uuid(), symbol: z.string(), name: z.string() }).nullable(),
  claim: z.string(),
  reasoning: z.string(),
  conviction: z.enum(['LOW', 'MEDIUM', 'HIGH', 'EXTREME']),
  deadline: z.iso.datetime(),
  referencePrice: z.number().nullable(),
  referencePriceAt: z.iso.datetime().nullable(),
  targetPrice: z.number().nullable(),
  targetDirection: z.enum(['ABOVE', 'BELOW', 'EQUALS']).nullable(),
  state: thesisStateSchema,
  resolvedAt: z.iso.datetime().nullable(),
  resolutionPrice: z.number().nullable(),
  resolutionSource: z.enum(['AUTOMATIC', 'COMMUNITY', 'ADMIN']).nullable(),
  cancelledAt: z.iso.datetime().nullable(),
  cancellationReason: z.string().nullable(),
  disclaimerAcceptedAt: z.iso.datetime(),
  creator: userSummarySchema.nullable(),
  creatorType: z.enum(['USER', 'SYSTEM']),
  score: z.number().int(),
  viewerVote: z.union([z.literal(1), z.literal(-1)]).nullable(),
  argumentCounts: z.object({ pro: z.number().int(), contra: z.number().int() }),
  canCancel: z.boolean(),
  publishedAt: z.iso.datetime(),
  createdAt: z.iso.datetime(),
})

export type RawThesis = z.infer<typeof thesisSchema>
