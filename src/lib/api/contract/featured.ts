import { z } from 'zod'
import { postSchema } from './content'
import { thesisSchema } from './theses'

/**
 * What a person put at the front of their profile (P-025, proposal, specs/profile-showcase): up to
 * three posts or theses, the last featured first. Deleted ones do not come.
 */
export const featuredSchema = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('post'), post: postSchema, featuredAt: z.iso.datetime() }),
  z.object({ kind: z.literal('thesis'), thesis: thesisSchema, featuredAt: z.iso.datetime() }),
])

/** The list takes any item: one malformed or of an unknown kind is dropped, not the list. */
export const featuredListSchema = z.object({ items: z.array(z.unknown()) })

export type RawFeatured = z.infer<typeof featuredSchema>
