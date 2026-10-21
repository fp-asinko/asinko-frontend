import { z } from 'zod'

// E01 (docs/references/api/E01-identidad-y-cuenta.md). Raw backend shapes.

/** Short author/creator shape embedded in posts, comments and lists. */
export const userSummarySchema = z.object({
  id: z.uuid(),
  username: z.string(),
  avatarUrl: z.string().nullable(),
  accuracyRate: z.number().nullable().optional(),
  /** P-017 (backend 2026-10-20): in the lists of people; null without a session or for oneself. */
  isFollowedByViewer: z.boolean().nullable().optional(),
  /** In the lists of people too (2026-10-20). */
  displayName: z.string().nullable().optional(),
})

export const userSchema = z.object({
  id: z.uuid(),
  username: z.string().min(3).max(30),
  usernameChangedAt: z.iso.datetime().nullable(),
  avatarUrl: z.string().nullable(),
  bio: z.string().nullable(),
  /** Only when the viewer is the user. The backend sends null otherwise (the contract says absent). */
  email: z.string().nullable().optional(),
  countryCode: z.string().length(2).nullable(),
  countrySource: z.enum(['IP', 'MANUAL']).nullable(),
  language: z.string().nullable(),
  isPublic: z.boolean(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'BANNED', 'DELETED']),
  createdAt: z.iso.datetime(),
  /** P-019 (proposal, specs/profile-presentation): optional until the backend sends them. */
  headline: z.string().nullable().optional(),
  city: z.string().nullable().optional(),
  links: z.array(z.string()).nullable().optional(),
  /** P-026 (proposal, specs/profile-showcase): what the person is open to; unknown values dropped. */
  openTo: z.array(z.string()).nullable().optional(),
})

export const profileSchema = userSchema.extend({
  /** P-011 (backend, 2026-10-13): null when not set or equal to the username (specs/community-pages
   * CP-20). Tier and rating stay out until after the MVP. */
  displayName: z.string().nullable().optional(),
  points: z.number().int(),
  badgeStatus: z.enum(['NONE', 'IDENTITY_VERIFIED', 'INSTITUTIONAL']),
  accuracyRate: z.number().nullable(),
  currentStreak: z.number().int(),
  correctCount: z.number().int(),
  incorrectCount: z.number().int(),
  cancelledCount: z.number().int(),
  isFollowedByViewer: z.boolean().nullable(),
  followerCount: z.number().int(),
  followingCount: z.number().int(),
  /** P-020 (proposal, specs/profile-presentation): the user's own banner. */
  bannerUrl: z.string().nullable().optional(),
})

export type RawUserSummary = z.infer<typeof userSummarySchema>
export type RawProfile = z.infer<typeof profileSchema>
