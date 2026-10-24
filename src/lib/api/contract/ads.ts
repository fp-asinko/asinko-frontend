import { z } from 'zod'

// P-031 (proposal, docs/references/api/proposals.md, specs/ads): an ad, as it comes inside a feed
// (kind AD) or with a post's comments. From P-015's shape: its own text is optional (a piece
// already carries it) and the image comes with its size, to hold its place.

export const adSchema = z.object({
  id: z.uuid(),
  advertiser: z.object({ name: z.string().min(1), logoUrl: z.string().nullable() }),
  /** Plain text, up to 280; null when the piece says it all. */
  body: z.string().min(1).max(280).nullable(),
  url: z.string(),
  image: z
    .object({
      url: z.string(),
      width: z.number().int().positive(),
      height: z.number().int().positive(),
      /** What the piece says, for who cannot see it (the advertiser's). */
      alt: z.string(),
    })
    .nullable(),
})

export type RawAd = z.infer<typeof adSchema>

/** Where an ad goes among a post's comments: null under the post; else after that comment. */
export const commentAdSchema = z.object({
  afterCommentId: z.uuid().nullable(),
  ad: adSchema,
})

export type RawCommentAd = z.infer<typeof commentAdSchema>
