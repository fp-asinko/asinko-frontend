import { z } from 'zod'

// P-015 (proposal, docs/references/api/proposals.md): house ads. Raw backend shapes.

export const adSchema = z.object({
  id: z.uuid(),
  advertiser: z.object({ name: z.string().min(1), logoUrl: z.string().nullable() }),
  /** Plain text, up to 280. */
  body: z.string().min(1).max(280),
  url: z.string(),
  imageUrl: z.string().nullable(),
})

export type RawAd = z.infer<typeof adSchema>

export const adListSchema = z.object({ items: z.array(adSchema) })
