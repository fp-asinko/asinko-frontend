import { z } from 'zod'
import { pollSchema, postSchema } from './content'
import { thesisSchema } from './theses'

/**
 * What a person put at the front of their profile (P-025, backend 2026-10-20): up to three posts,
 * polls or theses, each as a feed item (`{ kind, content }`) with when it was featured, the last
 * featured first. Deleted ones do not come.
 */
export const featuredSchema = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('POST'), content: postSchema, featuredAt: z.iso.datetime() }),
  z.object({ kind: z.literal('POLL'), content: pollSchema, featuredAt: z.iso.datetime() }),
  z.object({ kind: z.literal('THESIS'), content: thesisSchema, featuredAt: z.iso.datetime() }),
])

/** The list takes any item: one malformed or of an unknown kind is dropped, not the list. */
export const featuredListSchema = z.object({ items: z.array(z.unknown()) })

export type RawFeatured = z.infer<typeof featuredSchema>
