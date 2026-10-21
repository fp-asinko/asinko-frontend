import { ACHIEVEMENT_CODES, type AchievementCode, type RawAchievement } from '@/lib/api/contract'
import { DEMO_USER } from './demo-user'
import { daysAgo } from './fixtures/ids'
import { PROFILES } from './fixtures/users'
import type { MockResponse } from './types'

// P-030 (proposal, specs/profile-achievements): what each person earned, and for the owner what is
// missing. With mocks the viewer is always the demo user (src/lib/session.ts): only the demo's own
// list brings the missing ones.

type Earned = { code: AchievementCode; days: number; level?: number }
type Progress = Partial<Record<AchievementCode, { current: number; target: number }>>

const EARNED: Record<string, Earned[]> = {
  [DEMO_USER.username]: [
    { code: 'FOUNDING_MEMBER', days: 118 },
    { code: 'FIRST_POST', days: 110 },
    { code: 'FIRST_COMMENT', days: 104 },
    { code: 'FIRST_THESIS', days: 90 },
    { code: 'FIRST_CORRECT', days: 61 },
    { code: 'GROUP_MODERATOR', days: 33 },
    { code: 'STREAK_3', days: 9 },
  ],
  maria: [
    { code: 'FIRST_POST', days: 400 },
    { code: 'FIRST_THESIS', days: 380 },
    { code: 'FIRST_CORRECT', days: 350 },
    { code: 'GROUP_FOUNDER', days: 340 },
    { code: 'STREAK_3', days: 300 },
    { code: 'STREAK_5', days: 260 },
    { code: 'RESOLVED_10', days: 200 },
    { code: 'ACCURACY_70', days: 120 },
    { code: 'FOLLOWERS_100', days: 80 },
    { code: 'ANNIVERSARY', days: 35, level: 1 },
    { code: 'POST_100_VOTES', days: 12 },
  ],
  federico: [
    { code: 'FIRST_POST', days: 70 },
    { code: 'FIRST_COMMENT', days: 66 },
  ],
}

/** The demo's missing ones that are measured: the rest go without progress. */
const DEMO_PROGRESS: Progress = {
  STREAK_5: { current: 3, target: 5 },
  STREAK_10: { current: 3, target: 10 },
  RESOLVED_10: { current: 6, target: 10 },
  ACCURACY_70: { current: 62, target: 70 },
  POST_100_VOTES: { current: 41, target: 100 },
  FOLLOWERS_100: { current: 12, target: 100 },
  PROFILE_COMPLETE: { current: 3, target: 8 },
}

/** GET /users/{userId}/achievements */
/**
 * A person of the real backend (API_MOCKS=missing, the DEV deploy, phase 3 of the backend): a sample
 * of earned ones, always the same for them (from their id). Without knowing who looks, no missing.
 */
const SAMPLE: AchievementCode[] = [
  'FIRST_POST',
  'FIRST_COMMENT',
  'FIRST_THESIS',
  'FOUNDING_MEMBER',
  'STREAK_3',
  'FOLLOWERS_100',
]

function sampleOf(userId: string): RawAchievement[] {
  const seed = [...userId].reduce((sum, char) => sum + char.charCodeAt(0), 0)
  return SAMPLE.filter((_, index) => index < 2 || (seed >> index) % 2 === 1).map((code, index) => ({
    code,
    earnedAt: daysAgo(10 + ((seed + index * 17) % 300)),
    level: null,
    progress: null,
  }))
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export function listAchievements(userId: string): MockResponse {
  const user = PROFILES.find((each) => each.id === userId)
  if (!user && UUID.test(userId)) {
    const items = sampleOf(userId).toSorted((a, b) =>
      (b.earnedAt ?? '').localeCompare(a.earnedAt ?? ''),
    )
    return { status: 200, body: { items } }
  }
  if (!user) return { status: 404, body: { error: { code: 'NOT_FOUND', message: 'mock' } } }
  const earned = (EARNED[user.username] ?? []).toSorted((a, b) => a.days - b.days)
  const items: RawAchievement[] = earned.map(({ code, days, level }) => ({
    code,
    earnedAt: daysAgo(days),
    level: level ?? null,
    progress: null,
  }))
  if (user.id === DEMO_USER.id) {
    const have = new Set(earned.map((each) => each.code))
    for (const code of ACHIEVEMENT_CODES) {
      if (have.has(code)) continue
      items.push({ code, earnedAt: null, level: null, progress: DEMO_PROGRESS[code] ?? null })
    }
  }
  return { status: 200, body: { items } }
}
