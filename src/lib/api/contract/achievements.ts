import { z } from 'zod'

// P-030 (proposal, specs/profile-achievements): a person's trophy case, as Reddit's. The backend
// decides what is earned; with the owner's session it adds the missing ones, with their progress.

/** The catalog, in its order (AC-01): the codes the front knows how to show. */
export const ACHIEVEMENT_CODES = [
  'FIRST_THESIS',
  'FIRST_CORRECT',
  'STREAK_3',
  'STREAK_5',
  'STREAK_10',
  'RESOLVED_10',
  'ACCURACY_70',
  'FIRST_POST',
  'FIRST_COMMENT',
  'POST_100_VOTES',
  'FOLLOWERS_100',
  'GROUP_FOUNDER',
  'GROUP_MODERATOR',
  'ANNIVERSARY',
  'FOUNDING_MEMBER',
  'PROFILE_COMPLETE',
] as const

export type AchievementCode = (typeof ACHIEVEMENT_CODES)[number]

/** One achievement: earned (`earnedAt`) or, only for the owner, missing (`earnedAt: null`). */
export const achievementSchema = z.object({
  code: z.enum(ACHIEVEMENT_CODES),
  earnedAt: z.iso.datetime().nullable(),
  /** ANNIVERSARY only: the years, the last one reached. */
  level: z.number().int().positive().nullable(),
  progress: z
    .object({ current: z.number().int().nonnegative(), target: z.number().int().positive() })
    .nullable(),
})

/** The list accepts unknown items: the backend may add achievements before the front does. */
export const achievementListSchema = z.object({ items: z.array(z.unknown()) })

export type RawAchievement = z.infer<typeof achievementSchema>
