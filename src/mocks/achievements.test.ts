// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { achievementSchema, type RawAchievement } from '@/lib/api/contract'
import { listAchievements } from './achievements'
import { DEMO_USER } from './demo-user'
import { userByUsername } from './fixtures/users'

const list = (userId: string) =>
  (listAchievements(userId).body as { items: RawAchievement[] }).items

describe('listAchievements (P-030, specs/profile-achievements AC-01, AC-02)', () => {
  it("the owner's list: earned newest first, then the missing ones in the catalog's order", () => {
    const items = list(DEMO_USER.id)
    for (const item of items) expect(achievementSchema.parse(item)).toEqual(item)
    const earned = items.filter((item) => item.earnedAt)
    expect(earned.map((item) => item.earnedAt)).toEqual(
      earned
        .map((item) => item.earnedAt)
        .toSorted()
        .toReversed(),
    )
    expect(items.indexOf(earned.at(-1)!)).toBe(earned.length - 1)
    expect(items).toHaveLength(16)
    expect(items.find((item) => item.code === 'STREAK_5')).toMatchObject({
      earnedAt: null,
      progress: { current: 3, target: 5 },
    })
  })

  it("someone else's: only what they earned, the anniversary with its years", () => {
    const items = list(userByUsername('maria')!.id)
    expect(items.every((item) => item.earnedAt)).toBe(true)
    expect(items.find((item) => item.code === 'ANNIVERSARY')).toMatchObject({ level: 1 })
  })

  it('nothing earned is an empty list; an unknown person, 404', () => {
    expect(list(userByUsername('jeppe')!.id)).toEqual([])
    expect(listAchievements('nobody')).toMatchObject({ status: 404 })
  })
})
