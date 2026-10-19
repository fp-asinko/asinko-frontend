import 'server-only'
import { cache } from 'react'
import { z } from 'zod'
import { apiRequest, keepValidItems } from '@/lib/api'
import {
  achievementListSchema,
  achievementSchema,
  type AchievementCode,
  type RawAchievement,
} from '@/lib/api/contract'
import type { Achievement, AchievementGroup } from '../communities.types'

const ENDPOINT = 'GET /api/v1/users/:userId/achievements'

/** Each code's group (AC-01); within a group, the catalog's order (ACHIEVEMENT_CODES). */
export const ACHIEVEMENT_GROUP: Record<AchievementCode, AchievementGroup> = {
  FIRST_THESIS: 'theses',
  FIRST_CORRECT: 'theses',
  STREAK_3: 'theses',
  STREAK_5: 'theses',
  STREAK_10: 'theses',
  RESOLVED_10: 'theses',
  ACCURACY_70: 'theses',
  FIRST_POST: 'community',
  FIRST_COMMENT: 'community',
  POST_100_VOTES: 'community',
  FOLLOWERS_100: 'community',
  GROUP_FOUNDER: 'community',
  GROUP_MODERATOR: 'community',
  ANNIVERSARY: 'tenure',
  FOUNDING_MEMBER: 'tenure',
  PROFILE_COMPLETE: 'profile',
}

export function toAchievement(raw: RawAchievement): Achievement {
  return { ...raw, group: ACHIEVEMENT_GROUP[raw.code] }
}

/**
 * A person's achievements (P-030), in the backend's order: earned newest first, then the missing
 * ones. Those only on your own profile (AC-07), whatever comes. `null` if it cannot be asked: a
 * secondary part of the profile. Cached per request: the page and its right column ask the same.
 */
export const getAchievements = cache(async function getAchievements(
  userId: string,
  isSelf: boolean,
): Promise<Achievement[] | null> {
  if (!z.uuid().safeParse(userId).success) return null
  const result = await apiRequest({
    method: 'GET',
    path: '/api/v1/users/:userId/achievements',
    params: { userId },
    schema: achievementListSchema,
  })
  if (!result.ok) return null
  return keepValidItems(result.data.items, achievementSchema, ENDPOINT)
    .filter((item) => isSelf || item.earnedAt)
    .map(toAchievement)
})
