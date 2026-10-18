import { z } from 'zod'

// E02 (docs/references/api/E02-comunidades.md). Raw backend shapes.

export const communityTypeSchema = z.enum([
  'SYSTEM_ASSET',
  'SYSTEM_GEO',
  'SYSTEM_CATEGORY',
  'USER_PUBLIC',
  'PERSONAL_CHANNEL',
])

export const membershipSchema = z.enum(['MEMBER', 'MODERATOR', 'PRINCIPAL_MODERATOR'])

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
  viewerMembership: membershipSchema.nullable(),
  /** null without a session (E02). */
  viewerIsFavorite: z.boolean().nullable(),
  /**
   * P-016 (backend, 2026-10-13): the main post, the most voted of the last 7 days or else the
   * newest; null for a community with no posts. Optional: an older backend does not send it.
   */
  topPost: z.object({ id: z.string(), title: z.string() }).nullable().optional(),
})

export type RawCommunity = z.infer<typeof communitySchema>

/** PUT /api/v1/communities/{slug}/members/{userId} (E02, 200): the role a join produces. */
export const joinResponseSchema = z.object({
  viewerMembership: membershipSchema,
  memberCount: z.number().int(),
})

/** PUT /api/v1/communities/{slug}/favorite (E02, 200). Needs membership (404 NOT_MEMBER). */
/**
 * GET /api/v1/communities/{slug}/members (E02): a member, newest first. `role` is read but not
 * shown (specs/community-members Q3). P-017 (proposal, extended 2026-10-10): whether the viewer
 * follows them; null without a session.
 */
export const communityMemberSchema = z.object({
  id: z.uuid(),
  username: z.string(),
  avatarUrl: z.string().nullable(),
  role: membershipSchema,
  isFollowedByViewer: z.boolean().nullable().optional(),
})

export type RawCommunityMember = z.infer<typeof communityMemberSchema>

export const favoriteResponseSchema = z.object({ viewerIsFavorite: z.literal(true) })
