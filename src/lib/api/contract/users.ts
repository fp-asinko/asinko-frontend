import { z } from 'zod'

// E01 (docs/references/api/E01-identidad-y-cuenta.md). Raw backend shapes.

/** Short author/creator shape embedded in posts, comments and lists. */
export const userSummarySchema = z.object({
  id: z.uuid(),
  username: z.string(),
  avatarUrl: z.string().nullable(),
  accuracyRate: z.number().nullable().optional(),
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
})

export const profileSchema = userSchema.extend({
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
})

export type RawUserSummary = z.infer<typeof userSummarySchema>
export type RawProfile = z.infer<typeof profileSchema>
