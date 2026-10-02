import { z } from 'zod'

// E02 (docs/references/api/E02-comunidades.md). Raw backend shapes.

export const communityTypeSchema = z.enum([
  'SYSTEM_ASSET',
  'SYSTEM_GEO',
  'SYSTEM_CATEGORY',
  'USER_PUBLIC',
  'PERSONAL_CHANNEL',
])

export const communitySchema = z.object({
  id: z.uuid(),
  slug: z.string(),
  slugChangedAt: z.iso.datetime().nullable(),
  name: z.string(),
  description: z.string().nullable(),
  avatarUrl: z.string().nullable(),
  bannerUrl: z.string().nullable(),
  type: communityTypeSchema,
  /** Only SYSTEM_ASSET. */
  assetId: z.uuid().nullable(),
  mainUrl: z.string().nullable(),
  rules: z.string().nullable(),
  memberCount: z.number().int(),
  /** null = system community. */
  createdByProfileId: z.uuid().nullable(),
  createdAt: z.iso.datetime(),
  viewerMembership: z.enum(['MEMBER', 'MODERATOR', 'PRINCIPAL_MODERATOR']).nullable(),
})

export type RawCommunity = z.infer<typeof communitySchema>
