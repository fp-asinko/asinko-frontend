import type { Achievement } from '../communities.types'

/** A trophy case as getAchievements gives it: earned newest first, then the missing ones. */
export const EARNED: Achievement[] = [
  {
    code: 'STREAK_3',
    group: 'theses',
    earnedAt: '2026-10-10T12:00:00.000Z',
    level: null,
    progress: null,
  },
  {
    code: 'ANNIVERSARY',
    group: 'tenure',
    earnedAt: '2026-09-15T12:00:00.000Z',
    level: 2,
    progress: null,
  },
  {
    code: 'GROUP_MODERATOR',
    group: 'community',
    earnedAt: '2026-09-01T12:00:00.000Z',
    level: null,
    progress: null,
  },
  {
    code: 'FIRST_CORRECT',
    group: 'theses',
    earnedAt: '2026-08-20T12:00:00.000Z',
    level: null,
    progress: null,
  },
  {
    code: 'FIRST_POST',
    group: 'community',
    earnedAt: '2026-07-01T12:00:00.000Z',
    level: null,
    progress: null,
  },
]

export const MISSING: Achievement[] = [
  {
    code: 'STREAK_5',
    group: 'theses',
    earnedAt: null,
    level: null,
    progress: { current: 3, target: 5 },
  },
  {
    code: 'ACCURACY_70',
    group: 'theses',
    earnedAt: null,
    level: null,
    progress: { current: 62, target: 70 },
  },
  { code: 'FOUNDING_MEMBER', group: 'tenure', earnedAt: null, level: null, progress: null },
  {
    code: 'PROFILE_COMPLETE',
    group: 'profile',
    earnedAt: null,
    level: null,
    progress: { current: 3, target: 8 },
  },
]
